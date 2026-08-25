/**
 * Aven - Study Tracker Controller
 * Features: LeetCode-style activity heatmap, Milestone progress journey, Study time distribution, Manual Hours+Minutes logger, Streaks.
 */

import { store, events } from './store.js';
import { calculateDistributionStats, calculateMilestoneData } from './domain/tracker-calculator.js';
import { playDualToneChime } from './utils/audio.js';
import { formatMinutesAndSeconds, getTodayISO } from './utils/date-utils.js';
import { renderSubjectSelectOptions } from './ui/dropdown.js';

let selectedSubjectId = '';
let heatmapYear = new Date().getFullYear(); // Year-view navigation state
let distributionScope = 'all'; // 'all' | 'week'

// Pomodoro Timer State (Persists across view switches)
let pomoMode = localStorage.getItem('aven_pomo_mode') || 'classic'; // 'classic' (work->break) | 'reverse' (break->work)
let pomoPhase = pomoMode === 'reverse' ? 'break' : 'focus'; // 'focus' (25m) | 'break' (5m)
let pomoTimeRemaining = (pomoPhase === 'focus' ? 25 : 5) * 60; // seconds
let pomoIsRunning = false;
let pomoInterval = null;
let pomoSubjectId = '';

export function renderTrackerView(container) {
  const activeSubjects = store.getSubjects(false);
  const streakStats = store.getStreakStats();
  const sessions = store.getSessions().sort((a, b) => new Date(b.date + ' ' + (b.created_at || '')) - new Date(a.date + ' ' + (a.created_at || '')));
  const calendarData = store.getYearCalendarMatrix(heatmapYear);

  // Compute color mapping consistent with Donut Chart slices
  const allDist = calculateDistributionStats(sessions, 'all', id => store.getSubjectById(id));
  const distColorMap = {};
  allDist.slices.forEach(slice => {
    distColorMap[slice.id] = slice.color;
  });

  // Set default subject if not set
  if (!selectedSubjectId && activeSubjects.length > 0) {
    selectedSubjectId = activeSubjects[0].id;
  }

  const todayStr = new Date().toISOString().split('T')[0];

  // Build heatmap grid HTML: one block per month, month label inside
  function renderMonthBlock(month) {
    const weeksHtml = month.weeks.map(week => {
      const cellsHtml = week.map(day => {
        if (day === null) {
          return `<div class="cal-day-cell cal-day-empty"></div>`;
        }
        const futureClass = day.isFuture ? ' future' : '';
        return `<div class="cal-day-cell lvl-${day.level}${futureClass}"
          data-date="${day.date}"
          data-minutes="${day.minutes}"
          data-subjects='${JSON.stringify(day.subjects).replace(/'/g, "&apos;")}'>
        </div>`;
      }).join('');
      return `<div class="week-column">${cellsHtml}</div>`;
    }).join('');

    return `
      <div class="month-block">
        <div class="month-block-label">${month.name}</div>
        <div class="month-block-weeks">${weeksHtml}</div>
      </div>
    `;
  }



  // Render SVG Donut Chart and Legend Card
  function renderDistributionCard(sessions) {
    const dist = calculateDistributionStats(sessions, distributionScope, id => store.getSubjectById(id));
    const totalHours = dist.totalHours;
    const slices = dist.slices;

    if (dist.totalMinutes === 0 || slices.length === 0) {
      return `
        <div class="distribution-container-card">
          <div class="distribution-header">
            <div class="card-header-label distribution-header-label">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
                <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
              </svg>
              <span>STUDY TIME DISTRIBUTION</span>
            </div>
            <div class="segmented-control" id="dist-scope-switcher">
              <button class="seg-btn ${distributionScope === 'all' ? 'active' : ''}" data-scope="all">All Time</button>
              <button class="seg-btn ${distributionScope === 'week' ? 'active' : ''}" data-scope="week">This Week</button>
            </div>
          </div>
          <div class="distribution-empty-state">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" style="color: var(--text-muted); opacity: 0.5;">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <p style="font-size: 13.5px; font-weight: 500; color: var(--text-secondary); margin-top: 4px;">No study activity recorded ${distributionScope === 'week' ? 'this week' : 'yet'}</p>
            <p style="font-size: 12px; color: var(--text-muted);">Log a study session to see your time breakdown across subjects.</p>
          </div>
        </div>
      `;
    }

    // Calculate SVG donut paths
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    let accumulatedOffset = 0;

    const circlesHtml = slices.map((slice) => {
      const dashLength = (slice.percentage / 100) * circumference;
      const gapLength = circumference - dashLength;
      const offset = -accumulatedOffset;
      accumulatedOffset += dashLength;

      return `
        <circle class="donut-slice"
                cx="100" cy="100" r="${radius}"
                fill="transparent"
                stroke="${slice.color}"
                stroke-width="22"
                stroke-dasharray="${dashLength.toFixed(2)} ${gapLength.toFixed(2)}"
                stroke-dashoffset="${offset.toFixed(2)}"
                data-name="${slice.name}"
                data-code="${slice.code}"
                data-hours="${slice.hours}"
                data-pct="${slice.percentage.toFixed(1)}"
                data-color="${slice.color}"
                transform="rotate(-90 100 100)" />
      `;
    }).join('');

    const legendHtml = slices.map(slice => {
      const isOther = slice.id === 'other';
      const isGeneral = slice.id === 'general';
      const pillText = slice.code ? slice.code : (isOther ? 'Other' : (isGeneral ? 'General' : slice.name));
      const displayName = slice.code ? slice.name : (isOther ? 'Other Subjects' : (isGeneral ? 'General Study' : ''));

      return `
        <div class="dist-legend-row" data-id="${slice.id}">
          <div class="dist-legend-left">
            <span class="dist-code-pill" style="background-color: ${slice.color}1a; color: ${slice.color}; border: 1.2px solid ${slice.color}45;">
              ${pillText}
            </span>
            ${displayName ? `<span class="dist-subject-name" title="${slice.name}">${displayName}</span>` : ''}
          </div>
          <div class="dist-legend-right">
            <strong class="dist-hours-val">${slice.hours}h</strong>
            <span class="dist-pct-val">${slice.percentage.toFixed(1)}%</span>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="distribution-container-card">
        <div class="distribution-header">
          <div class="card-header-label distribution-header-label">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
              <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
            </svg>
            <span>STUDY TIME DISTRIBUTION</span>
          </div>
          <div class="segmented-control" id="dist-scope-switcher">
            <button class="seg-btn ${distributionScope === 'all' ? 'active' : ''}" data-scope="all">All Time</button>
            <button class="seg-btn ${distributionScope === 'week' ? 'active' : ''}" data-scope="week">This Week</button>
          </div>
        </div>

        <div class="distribution-content-grid">
          <!-- SVG Donut Chart with Center Total -->
          <div class="donut-chart-wrapper">
            <div class="donut-svg-box">
              <svg class="donut-svg" viewBox="0 0 200 200" width="190" height="190">
                <!-- Background Track Ring -->
                <circle cx="100" cy="100" r="${radius}" fill="transparent" stroke="var(--border-subtle)" stroke-width="22" opacity="0.35" />
                <!-- Colored Slices -->
                ${circlesHtml}
              </svg>
              <div class="donut-center-label">
                <span class="donut-center-num">${totalHours}h</span>
                <span class="donut-center-sub">${distributionScope === 'week' ? 'This Week' : 'Total Studied'}</span>
              </div>
            </div>
          </div>

          <!-- Detailed Breakdown Legend -->
          <div class="dist-legend-list">
            ${legendHtml}
          </div>
        </div>
      </div>
    `;
  }

  // Calculate Milestone Journey metrics
  function getMilestoneData(sessions) {
    const totalMinutes = sessions.reduce((acc, s) => acc + (s.duration || 0), 0);
    const totalHoursNum = totalMinutes / 60;
    const totalHours = totalHoursNum.toFixed(1);

    // Dynamic milestone progression: 100h -> 200h -> 300h -> 500h -> 750h -> 1000h...
    const milestones = [100, 200, 300, 500, 750, 1000, 1500, 2000, 3000, 5000, 10000];
    let target = milestones.find(m => m > totalHoursNum);
    if (!target) {
      target = Math.ceil((totalHoursNum + 1) / 1000) * 1000;
    }

    const progressPct = Math.min(100, Math.max(0, (totalHoursNum / target) * 100));
    const hoursRemaining = Math.max(0, target - totalHoursNum).toFixed(1);

    // 5 scale markers: 0h, 25h, 50h, 75h, 100h (scaled to target)
    const scaleMarkers = [0, 0.25, 0.5, 0.75, 1].map(fraction => {
      const val = Math.round(target * fraction);
      return `${val}h`;
    });

    // Best Day calculation (date with highest cumulative minutes)
    const dayMap = {};
    sessions.forEach(s => {
      dayMap[s.date] = (dayMap[s.date] || 0) + (s.duration || 0);
    });
    const maxDayMinutes = Math.max(0, ...Object.values(dayMap));
    const bestDayHours = (maxDayMinutes / 60).toFixed(1);

    // Longest single session calculation
    const maxSessionMinutes = Math.max(0, ...sessions.map(s => s.duration || 0));
    const longestSessionHours = (maxSessionMinutes / 60).toFixed(1);

    return {
      totalHours,
      target,
      progressPct: progressPct.toFixed(1),
      hoursRemaining,
      scaleMarkers,
      bestDayHours,
      allTimeHours: totalHours,
      longestSessionHours
    };
  }

  // Render Bentodoro-Style Bento Timer Tile
  function renderPomodoroCard(activeSubjects) {
    const totalSecs = (pomoPhase === 'focus' ? 25 : 5) * 60;
    const progressPct = Math.min(100, Math.max(0, ((totalSecs - pomoTimeRemaining) / totalSecs) * 100));

    return `
      <div class="tool-card pomodoro-card bento-timer-card">
        <!-- Top Row: Title & Classic / Reverse Mode Switch -->
        <div class="pomodoro-header">
          <div class="pomodoro-header-label">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>BENTODORO</span>
          </div>

          <!-- Mode Toggle: Classic (25m->5m) vs Reverse (5m->25m) -->
          <div class="pomo-mode-switch" id="pomo-mode-switch" title="Toggle Pomodoro Sequence Mode">
            <button type="button" class="pomo-mode-btn ${pomoMode === 'classic' ? 'active' : ''}" data-mode="classic">Classic</button>
            <button type="button" class="pomo-mode-btn ${pomoMode === 'reverse' ? 'active' : ''}" data-mode="reverse">Reverse</button>
          </div>
        </div>

        <!-- Sub-Header: Phase Indicator & Subject Selector -->
        <div class="pomo-meta-row">
          <div class="pomo-phase-badge ${pomoPhase === 'focus' ? 'focus-mode' : 'break-mode'}">
            <span class="pomo-phase-dot"></span>
            <span>${pomoPhase === 'focus' ? '25M FOCUS' : '5M BREAK'}</span>
          </div>
          <div class="pomo-subject-wrap">
            <select id="pomo-subject-select" class="form-select pomo-subject-select" title="Link session to subject">
              ${renderSubjectSelectOptions(activeSubjects, pomoSubjectId, true)}
            </select>
          </div>
        </div>

        <!-- Large Bento Digits Display -->
        <div class="pomo-display-block">
          <div class="pomo-time-display" id="pomo-time-display">${formatMinutesAndSeconds(pomoTimeRemaining)}</div>
          <div class="pomo-progress-track">
            <div class="pomo-progress-fill ${pomoPhase === 'break' ? 'break-fill' : ''}" id="pomo-progress-fill" style="width: ${progressPct}%;"></div>
          </div>
        </div>

        <!-- Timer Controls Row -->
        <div class="pomo-controls-row">
          <button type="button" class="btn ${pomoIsRunning ? 'btn-secondary pomo-btn-pause' : 'btn-primary pomo-btn-start'}" id="btn-pomo-toggle">
            ${pomoIsRunning ? `
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1"></rect>
                <rect x="14" y="4" width="4" height="16" rx="1"></rect>
              </svg>
              <span>Pause</span>
            ` : `
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
              <span>Start</span>
            `}
          </button>

          <button type="button" class="btn btn-secondary pomo-btn-reset" id="btn-pomo-reset" title="Reset Timer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
              <path d="M3 3v5h5"></path>
            </svg>
            <span>Reset</span>
          </button>

          <button type="button" class="pomo-phase-toggle-btn" id="btn-pomo-switch-phase" title="Skip to next phase">
            ${pomoPhase === 'focus' ? 'Skip to Break' : 'Skip to Focus'}
          </button>
        </div>
      </div>
    `;
  }

  // Render Journey to Next Milestone Card
  function renderMilestoneCard(sessions) {
    const data = calculateMilestoneData(sessions);

    return `
      <div class="tool-card journey-milestone-card">
        <div class="milestone-header">
          <div class="milestone-header-label">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
              <line x1="4" y1="22" x2="4" y2="15"></line>
            </svg>
            <span>JOURNEY TO NEXT MILESTONE</span>
          </div>
        </div>

        <div class="milestone-progress-block">
          <div class="milestone-track">
            <div class="milestone-fill" style="width: ${data.progressPct}%;"></div>
          </div>
          <div class="milestone-scale-markers">
            ${data.scaleMarkers.map(m => `<span class="milestone-scale-marker">${m}</span>`).join('')}
          </div>
        </div>

        <div class="milestone-progress-line">
          <strong>${data.totalHours}h</strong> of <strong>${data.target}h milestone</strong> <span class="milestone-dot">&middot;</span> <span class="milestone-remaining-text">${data.hoursRemaining}h to go</span>
        </div>

        <div class="milestone-stats-row">
          <div class="milestone-stat-col">
            <span class="milestone-stat-value">${data.bestDayHours}h</span>
            <span class="milestone-stat-label">Best Day</span>
          </div>
          <div class="milestone-stat-divider"></div>
          <div class="milestone-stat-col">
            <span class="milestone-stat-value">${data.allTimeHours}h</span>
            <span class="milestone-stat-label">All Time</span>
          </div>
          <div class="milestone-stat-divider"></div>
          <div class="milestone-stat-col">
            <span class="milestone-stat-value">${data.longestSessionHours}h</span>
            <span class="milestone-stat-label">Longest Session</span>
          </div>
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="tracker-layout">
      <!-- Tracker Action Top Row: Bentodoro Timer + Milestone Progress + Manual Study Log (3-Column Grid) -->
      <div class="tracker-tools-grid">
        <!-- Bentodoro Timer Card (Left) -->
        ${renderPomodoroCard(activeSubjects)}

        <!-- Journey to Next Milestone Card (Middle) -->
        ${renderMilestoneCard(sessions)}

        <!-- Manual Log Entry (Hours + Minutes Side-by-Side) -->
        <div class="tool-card manual-log-card">
          <div class="card-header-label manual-log-header-label">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            <span>MANUAL STUDY LOG</span>
          </div>

          <form id="manual-session-form">
            <!-- Paired Inputs: Subject & Date Side-by-Side -->
            <div class="form-row-paired">
              <div class="form-group">
                <label class="form-label" for="manual-subject-select">Subject</label>
                <select id="manual-subject-select" class="form-select">
                  ${renderSubjectSelectOptions(activeSubjects, selectedSubjectId, true)}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="manual-date">Date *</label>
                <input type="date" id="manual-date" class="form-input" value="${todayStr}" max="${todayStr}" required>
              </div>
            </div>

            <!-- Paired Inputs: Hours & Minutes Side-by-Side -->
            <div class="form-row-paired">
              <div class="form-group">
                <label class="form-label" for="manual-hours">Hours</label>
                <input type="number" id="manual-hours" class="form-input" min="0" max="24" value="1" placeholder="0">
              </div>
              <div class="form-group">
                <label class="form-label" for="manual-minutes">Minutes</label>
                <input type="number" id="manual-minutes" class="form-input" min="0" max="59" value="30" placeholder="0">
              </div>
            </div>

            <button type="submit" class="btn btn-primary" id="btn-submit-manual-log">
              Log Study Session
            </button>
          </form>
        </div>
      </div>

      <!-- 2-Column Analytics Bottom Row: Full-Year Activity Heatmap (Left) + Study Time Distribution (Right) -->
      <div class="tracker-analytics-row">
        <!-- Full-Year Activity Heatmap Card -->
        <div class="heatmap-container-card">
          <!-- Card Header: label left, year nav center, legend right -->
          <div class="heatmap-header">
            <div class="heatmap-header-label">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity:0.5;">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span>YEARLY HEATMAP</span>
            </div>

            <div class="heatmap-year-nav">
              <button class="year-nav-btn" id="btn-year-prev" title="Previous Year">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
              <span class="year-nav-label" id="heatmap-year-display">${heatmapYear}</span>
              <button class="year-nav-btn" id="btn-year-next" title="Next Year" ${heatmapYear >= new Date().getFullYear() ? 'disabled' : ''}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>

            <div class="heatmap-legend">
              <span>Less</span>
              <div class="legend-cell" style="background-color: var(--heat-empty); border: 1px solid var(--heat-border);"></div>
              <div class="legend-cell" style="background-color: var(--heat-level-1);"></div>
              <div class="legend-cell" style="background-color: var(--heat-level-2);"></div>
              <div class="legend-cell" style="background-color: var(--heat-level-3);"></div>
              <div class="legend-cell" style="background-color: var(--heat-level-4);"></div>
              <span>More</span>
            </div>
          </div>

          <!-- Stats subtitle -->
          <p class="heatmap-stats-line">
            ${calendarData.totalSessions} sessions &middot; ${calendarData.totalHours}h studied in ${heatmapYear}
          </p>

          <!-- Heatmap body: day labels + 12 month blocks -->
          <div class="heatmap-body-row">
            <!-- Day labels (alternating: blank, M, blank, W, blank, F, blank) -->
            <div class="day-labels-col">
              <div class="day-label-item"></div>
              <div class="day-label-item">M</div>
              <div class="day-label-item"></div>
              <div class="day-label-item">W</div>
              <div class="day-label-item"></div>
              <div class="day-label-item">F</div>
              <div class="day-label-item"></div>
            </div>
            <!-- Month blocks -->
            <div class="months-area">
              ${calendarData.months.map(m => renderMonthBlock(m)).join('')}
            </div>
          </div>

          <!-- Dynamic Hover Tooltip -->
          <div class="heatmap-tooltip" id="heatmap-tooltip"></div>
        </div>

        <!-- Study Time Distribution Pie/Donut Chart Card -->
        ${renderDistributionCard(sessions)}
      </div>

      <!-- Recent Sessions Log -->
      <div class="sessions-history-card">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div class="card-header-label history-header-label">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="12 8 12 12 14 14"></polyline>
              <path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5"></path>
            </svg>
            <span>RECENT STUDY HISTORY</span>
          </div>
          <span style="font-size: 11px; color: var(--text-muted); font-weight: 500;">${sessions.length} logged sessions</span>
        </div>

        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Duration</th>
                <th>Date</th>
                <th>Notes</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${sessions.length === 0 ? `
                <tr>
                  <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 32px;">
                    No study sessions recorded yet. Use the manual study log above!
                  </td>
                </tr>
              ` : sessions.slice(0, 15).map(s => {
                const sub = s.subject_id ? store.getSubjectById(s.subject_id) : null;
                const subId = s.subject_id || 'general';
                const subColor = distColorMap[subId] || (sub && sub.color) || '#8A9A5B';
                const pillText = sub ? (sub.code || sub.name) : 'General';
                const subjectName = sub && sub.code ? sub.name : '';
                const hrs = Math.floor(s.duration / 60);
                const mins = s.duration % 60;
                const durText = hrs > 0 ? `${hrs}h ${mins > 0 ? `${mins}m` : ''}` : `${mins}m`;

                return `
                  <tr>
                    <td>
                      <div class="dist-legend-left" style="display: flex; align-items: center; gap: 8px;">
                        <span class="dist-code-pill" style="background-color: ${subColor}1a; color: ${subColor}; border: 1.2px solid ${subColor}45;">
                          ${pillText}
                        </span>
                        ${subjectName ? `<span class="dist-subject-name" title="${sub.name}">${subjectName}</span>` : ''}
                      </div>
                    </td>
                    <td style="font-family: var(--font-numeric); font-variant-numeric: tabular-nums; font-weight: 600; color: var(--text-primary);">
                      ${durText}
                    </td>
                    <td style="color: var(--text-secondary); font-size: 12.5px;">
                      ${s.date}
                    </td>
                    <td style="color: var(--text-muted); font-size: 12.5px; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                      ${s.notes || '—'}
                    </td>
                    <td style="text-align: right;">
                      <button class="btn btn-ghost btn-sm btn-del-session" data-id="${s.id}" style="color: var(--danger); padding: 3px 6px;">
                        Delete
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  attachTrackerEvents(container);
}

function attachTrackerEvents(container) {
  // LeetCode & Chart Tooltip
  const tooltip = container.querySelector('#heatmap-tooltip');

  const updateTooltipPosition = (e) => {
    if (!tooltip) return;
    const offset = 14;
    const tooltipWidth = tooltip.offsetWidth || 180;
    const tooltipHeight = tooltip.offsetHeight || 60;

    let left = e.clientX + offset;
    let top = e.clientY - tooltipHeight - 10;

    // If overflowing right edge of viewport, flip to left of cursor
    if (left + tooltipWidth > window.innerWidth - 12) {
      left = e.clientX - tooltipWidth - offset;
    }

    // If overflowing top edge of viewport, place below cursor
    if (top < 10) {
      top = e.clientY + offset + 6;
    }

    tooltip.style.left = `${Math.max(10, left)}px`;
    tooltip.style.top = `${Math.max(10, top)}px`;
  };

  container.querySelectorAll('.cal-day-cell').forEach(cell => {
    cell.addEventListener('mouseenter', (e) => {
      const date = cell.dataset.date;
      if (!date) return; // skip empty padding cells
      const mins = Number(cell.dataset.minutes) || 0;
      let subjects = [];
      try {
        subjects = JSON.parse(cell.dataset.subjects || '[]');
      } catch (err) {}

      let subListHtml = '';
      if (subjects.length > 0) {
        subListHtml = `
          <div style="margin-top: 4px; border-top: 1px solid var(--border-subtle); padding-top: 4px;">
            ${subjects.map(s => `
              <div style="display: flex; align-items: center; gap: 6px; font-size: 11px; margin-top: 2px;">
                <span style="width: 6px; height: 6px; border-radius: 50%; background: ${s.color};"></span>
                <span>${s.subjectCode || s.subjectName}: <strong>${s.duration}m</strong></span>
              </div>
            `).join('')}
          </div>
        `;
      }

      tooltip.innerHTML = `
        <div style="font-weight: 600; color: var(--text-primary);">${date}</div>
        <div style="color: var(--text-secondary);">${mins > 0 ? `${mins} minutes studied` : 'No study activity'}</div>
        ${subListHtml}
      `;

      tooltip.style.display = 'flex';
      updateTooltipPosition(e);
    });

    cell.addEventListener('mousemove', (e) => {
      if (!cell.dataset.date) return;
      updateTooltipPosition(e);
    });

    cell.addEventListener('mouseleave', () => {
      tooltip.style.display = 'none';
    });
  });

  // Year navigation
  const prevYearBtn = container.querySelector('#btn-year-prev');
  const nextYearBtn = container.querySelector('#btn-year-next');
  if (prevYearBtn) {
    prevYearBtn.addEventListener('click', () => {
      heatmapYear--;
      renderTrackerView(container);
    });
  }
  if (nextYearBtn) {
    nextYearBtn.addEventListener('click', () => {
      if (heatmapYear < new Date().getFullYear()) {
        heatmapYear++;
        renderTrackerView(container);
      }
    });
  }


  // --- BENTODORO TIMER EVENT LISTENERS ---
  const pomoSubjectSelect = container.querySelector('#pomo-subject-select');
  if (pomoSubjectSelect) {
    pomoSubjectSelect.addEventListener('change', (e) => {
      pomoSubjectId = e.target.value;
    });
  }

  // Classic / Reverse Mode Toggle Buttons
  container.querySelectorAll('.pomo-mode-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const mode = e.currentTarget.dataset.mode;
      if (mode === pomoMode) return;
      pomoMode = mode;
      localStorage.setItem('aven_pomo_mode', pomoMode);
      pomoIsRunning = false;
      if (pomoInterval) {
        clearInterval(pomoInterval);
        pomoInterval = null;
      }
      pomoPhase = pomoMode === 'reverse' ? 'break' : 'focus';
      pomoTimeRemaining = (pomoPhase === 'focus' ? 25 : 5) * 60;
      renderTrackerView(container);
    });
  });

  function tickPomodoro() {
    if (pomoTimeRemaining > 0) {
      pomoTimeRemaining--;
      const timeDisplay = container.querySelector('#pomo-time-display');
      const progressFill = container.querySelector('#pomo-progress-fill');
      if (timeDisplay) {
        timeDisplay.textContent = formatMinutesAndSeconds(pomoTimeRemaining);
      }
      if (progressFill) {
        const totalSecs = (pomoPhase === 'focus' ? 25 : 5) * 60;
        const pct = ((totalSecs - pomoTimeRemaining) / totalSecs) * 100;
        progressFill.style.width = `${pct}%`;
      }
    } else {
      // Phase completed!
      playDualToneChime();
      if (pomoPhase === 'focus') {
        const todayStr = new Date().toISOString().split('T')[0];
        store.saveSession({
          subject_id: pomoSubjectId || null,
          duration: 25,
          date: todayStr,
          notes: `Pomodoro ${pomoMode === 'reverse' ? 'Reverse' : 'Classic'} Focus Session`
        });
        const sub = pomoSubjectId ? store.getSubjectById(pomoSubjectId) : null;

        if (pomoMode === 'classic') {
          window.avenApp?.showToast(
            `Focus session completed! 25 mins logged${sub ? ` for ${sub.name}` : ''}. Starting 5 min break.`,
            'success'
          );
          pomoPhase = 'break';
          pomoTimeRemaining = 5 * 60;
        } else {
          // Reverse mode: Finished the 25m work phase
          window.avenApp?.showToast(
            `Earned focus session completed! 25 mins logged${sub ? ` for ${sub.name}` : ''}. Sequence finished.`,
            'success'
          );
          pomoPhase = 'break';
          pomoTimeRemaining = 5 * 60;
          pomoIsRunning = false;
          if (pomoInterval) {
            clearInterval(pomoInterval);
            pomoInterval = null;
          }
        }
      } else {
        // Break phase finished
        if (pomoMode === 'reverse') {
          window.avenApp?.showToast('5 min break finished! Ready to begin your earned 25m focus session.', 'info');
          pomoPhase = 'focus';
          pomoTimeRemaining = 25 * 60;
        } else {
          window.avenApp?.showToast('Break finished! Ready for your next focus session.', 'info');
          pomoPhase = 'focus';
          pomoTimeRemaining = 25 * 60;
          pomoIsRunning = false;
          if (pomoInterval) {
            clearInterval(pomoInterval);
            pomoInterval = null;
          }
        }
      }
      renderTrackerView(container);
    }
  }

  const pomoToggleBtn = container.querySelector('#btn-pomo-toggle');
  if (pomoToggleBtn) {
    pomoToggleBtn.addEventListener('click', () => {
      if (pomoIsRunning) {
        pomoIsRunning = false;
        if (pomoInterval) {
          clearInterval(pomoInterval);
          pomoInterval = null;
        }
      } else {
        pomoIsRunning = true;
        if (pomoInterval) clearInterval(pomoInterval);
        pomoInterval = setInterval(tickPomodoro, 1000);
      }
      renderTrackerView(container);
    });
  }

  const pomoResetBtn = container.querySelector('#btn-pomo-reset');
  if (pomoResetBtn) {
    pomoResetBtn.addEventListener('click', () => {
      pomoIsRunning = false;
      if (pomoInterval) {
        clearInterval(pomoInterval);
        pomoInterval = null;
      }
      pomoTimeRemaining = (pomoPhase === 'focus' ? 25 : 5) * 60;
      renderTrackerView(container);
    });
  }

  const pomoSwitchPhaseBtn = container.querySelector('#btn-pomo-switch-phase');
  if (pomoSwitchPhaseBtn) {
    pomoSwitchPhaseBtn.addEventListener('click', () => {
      pomoIsRunning = false;
      if (pomoInterval) {
        clearInterval(pomoInterval);
        pomoInterval = null;
      }
      pomoPhase = pomoPhase === 'focus' ? 'break' : 'focus';
      pomoTimeRemaining = (pomoPhase === 'focus' ? 25 : 5) * 60;
      renderTrackerView(container);
    });
  }

  // Manual Log Submission
  const manualForm = container.querySelector('#manual-session-form');
  if (manualForm) {
    manualForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const subject_id = container.querySelector('#manual-subject-select').value || null;
      const hours = Number(container.querySelector('#manual-hours').value) || 0;
      const mins = Number(container.querySelector('#manual-minutes').value) || 0;
      const date = container.querySelector('#manual-date').value;

      const totalMins = (hours * 60) + mins;
      if (totalMins <= 0) {
        window.avenApp?.showToast('Please enter a duration greater than 0', 'danger');
        return;
      }

      store.saveSession({
        subject_id,
        duration: totalMins,
        date
      });

      const sub = subject_id ? store.getSubjectById(subject_id) : null;
      window.avenApp?.showToast(`Logged ${totalMins} min session${sub ? ` for ${sub.name}` : ' (General Study)'}!`, 'success');
      renderTrackerView(container);
    });
  }

  // Delete Session
  container.querySelectorAll('.btn-del-session').forEach(btn => {
    btn.addEventListener('click', () => {
      store.deleteSession(btn.dataset.id);
      window.avenApp?.showToast('Session deleted', 'info');
      renderTrackerView(container);
    });
  });

  // Distribution Scope Switcher (All Time vs This Week)
  const distSwitcher = container.querySelector('#dist-scope-switcher');
  if (distSwitcher) {
    distSwitcher.querySelectorAll('.seg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        distributionScope = btn.dataset.scope || 'all';
        renderTrackerView(container);
      });
    });
  }

  // Interactive Donut Slices Tooltip
  container.querySelectorAll('.donut-slice').forEach(slice => {
    slice.addEventListener('mouseenter', (e) => {
      const name = slice.dataset.name;
      const code = slice.dataset.code;
      const hours = slice.dataset.hours;
      const pct = slice.dataset.pct;
      const color = slice.dataset.color;

      tooltip.innerHTML = `
        <div style="display: flex; align-items: center; gap: 6px; font-weight: 600; color: var(--text-primary);">
          <span style="width: 7px; height: 7px; border-radius: 50%; background: ${color};"></span>
          <span>${code ? `[${code}] ` : ''}${name}</span>
        </div>
        <div style="color: var(--text-secondary); margin-top: 2px;">
          <strong>${hours}h</strong> studied (${pct}% of total)
        </div>
      `;

      tooltip.style.display = 'flex';
      updateTooltipPosition(e);
    });

    slice.addEventListener('mousemove', (e) => {
      updateTooltipPosition(e);
    });

    slice.addEventListener('mouseleave', () => {
      tooltip.style.display = 'none';
    });
  });
}
