/**
 * Aven - Study Tracker Controller
 * Features: LeetCode-style activity heatmap, Milestone progress journey, Study time distribution, Manual Hours+Minutes logger, Streaks.
 */

import { store, events } from './store.js';

let selectedSubjectId = '';
let heatmapYear = new Date().getFullYear(); // Year-view navigation state
let distributionScope = 'all'; // 'all' | 'week'

// Pomodoro Timer State (Persists across view switches)
let pomoPhase = 'focus'; // 'focus' (25m) | 'break' (5m)
let pomoTimeRemaining = 25 * 60; // seconds
let pomoIsRunning = false;
let pomoInterval = null;
let pomoSubjectId = '';

function playPomoChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Note 1: 587.33Hz (D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Note 2: 880Hz (A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.16);
    gain2.gain.setValueAtTime(0.22, now + 0.16);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.16);
    osc2.stop(now + 0.7);
  } catch (e) {}
}

function formatPomoTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function renderTrackerView(container) {
  const activeSubjects = store.getSubjects(false);
  const streakStats = store.getStreakStats();
  const sessions = store.getSessions().sort((a, b) => new Date(b.date + ' ' + (b.created_at || '')) - new Date(a.date + ' ' + (a.created_at || '')));
  const calendarData = store.getYearCalendarMatrix(heatmapYear);

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

  // Calculate distribution data based on scope ('all' or 'week')
  function getDistributionData(sessions, scope = 'all') {
    let filtered = sessions;
    if (scope === 'week') {
      const now = new Date();
      const startOfWeek = new Date(now);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday start
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);
      filtered = sessions.filter(s => new Date(s.date) >= startOfWeek);
    }

    const subjectMap = {};
    let totalMinutes = 0;

    filtered.forEach(s => {
      const subId = s.subject_id || 'general';
      if (!subjectMap[subId]) {
        if (subId === 'general') {
          subjectMap[subId] = {
            id: 'general',
            name: 'General Study',
            code: '',
            color: '#94a3b8',
            minutes: 0
          };
        } else {
          const sub = store.getSubjectById(subId);
          subjectMap[subId] = {
            id: subId,
            name: sub ? sub.name : 'Unknown Subject',
            code: sub ? sub.code : '',
            color: sub && sub.color ? sub.color : '#6366f1',
            minutes: 0
          };
        }
      }
      subjectMap[subId].minutes += s.duration;
      totalMinutes += s.duration;
    });

    const slices = Object.values(subjectMap)
      .filter(s => s.minutes > 0)
      .sort((a, b) => b.minutes - a.minutes)
      .map(s => ({
        ...s,
        percentage: totalMinutes > 0 ? (s.minutes / totalMinutes) * 100 : 0,
        hours: (s.minutes / 60).toFixed(1)
      }));

    return {
      totalMinutes,
      totalHours: (totalMinutes / 60).toFixed(1),
      slices
    };
  }

  // Render SVG Donut Chart and Legend Card
  function renderDistributionCard(sessions) {
    const dist = getDistributionData(sessions, distributionScope);
    const totalHours = dist.totalHours;
    const slices = dist.slices;

    if (dist.totalMinutes === 0 || slices.length === 0) {
      return `
        <div class="distribution-container-card">
          <div class="distribution-header">
            <div style="display: flex; align-items: center; gap: 8px;">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
                <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
              </svg>
              <h3 style="font-size: 15px; font-weight: 600;">Study Time Distribution</h3>
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
      return `
        <div class="dist-legend-item" data-id="${slice.id}">
          <div class="dist-legend-top">
            <div class="dist-legend-subject">
              <span class="dist-color-dot" style="background-color: ${slice.color};"></span>
              ${slice.code ? `<span class="subject-list-code" style="font-size: 10px; padding: 1px 5px;">${slice.code}</span>` : (!slice.code && slice.id === 'general' ? `<span class="tag-status-archived" style="font-size: 10px; padding: 1px 6px;">General</span>` : '')}
              <span class="dist-subject-name" title="${slice.name}">${slice.name}</span>
            </div>
            <div class="dist-legend-metric">
              <span class="dist-metric-hours">${slice.hours}h</span>
              <span class="dist-metric-pct">${slice.percentage.toFixed(1)}%</span>
            </div>
          </div>
          <div class="dist-progress-track">
            <div class="dist-progress-fill" style="width: ${slice.percentage}%; background-color: ${slice.color};"></div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="distribution-container-card">
        <div class="distribution-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
              <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
            </svg>
            <h3 style="font-size: 15px; font-weight: 600;">Study Time Distribution</h3>
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

  // Render Pomodoro Timer Card (Simple 25m Focus / 5m Break)
  function renderPomodoroCard(activeSubjects) {
    const totalSecs = (pomoPhase === 'focus' ? 25 : 5) * 60;
    const progressPct = Math.min(100, Math.max(0, ((totalSecs - pomoTimeRemaining) / totalSecs) * 100));

    return `
      <div class="tool-card pomodoro-card">
        <div class="pomodoro-header">
          <div class="pomodoro-header-label">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>POMODORO TIMER</span>
          </div>

          <div class="pomo-phase-badge ${pomoPhase === 'focus' ? 'focus-mode' : 'break-mode'}">
            <span class="pomo-phase-dot"></span>
            <span>${pomoPhase === 'focus' ? 'FOCUS' : 'BREAK'}</span>
          </div>
        </div>

        <!-- Subject Association Dropdown -->
        <div class="pomo-subject-row">
          <label class="form-label" for="pomo-subject-select" style="font-size: 11px; margin-bottom: 4px; color: var(--text-muted);">Subject</label>
          <select id="pomo-subject-select" class="form-select pomo-subject-select">
            <option value="">🌐 General Study</option>
            ${activeSubjects.map(s => `
              <option value="${s.id}" ${s.id === pomoSubjectId ? 'selected' : ''}>
                ${s.code ? `[${s.code}] ` : ''}${s.name}
              </option>
            `).join('')}
          </select>
        </div>

        <!-- Large Monospace Countdown -->
        <div class="pomo-display-block">
          <div class="pomo-time-display" id="pomo-time-display">${formatPomoTime(pomoTimeRemaining)}</div>
          <div class="pomo-progress-track">
            <div class="pomo-progress-fill ${pomoPhase === 'break' ? 'break-fill' : ''}" id="pomo-progress-fill" style="width: ${progressPct}%;"></div>
          </div>
        </div>

        <!-- Timer Controls -->
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

          <button type="button" class="pomo-phase-toggle-btn" id="btn-pomo-switch-phase" title="Switch to ${pomoPhase === 'focus' ? 'Break (5m)' : 'Focus (25m)'}">
            ${pomoPhase === 'focus' ? '5m Break' : '25m Focus'}
          </button>
        </div>
      </div>
    `;
  }

  // Render Journey to Next Milestone Card
  function renderMilestoneCard(sessions) {
    const data = getMilestoneData(sessions);

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
      <!-- 2-Column Analytics Top Row: Full-Year Activity Heatmap (Left) + Study Time Distribution (Right) -->
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

      <!-- Tracker Action Row: Pomodoro Timer + Milestone Progress + Manual Study Log (3-Column Grid) -->
      <div class="tracker-tools-grid">
        <!-- Simple Pomodoro Timer Card (Left) -->
        ${renderPomodoroCard(activeSubjects)}

        <!-- Journey to Next Milestone Card (Middle) -->
        ${renderMilestoneCard(sessions)}

        <!-- Manual Log Entry (Hours + Minutes Side-by-Side) -->
        <div class="tool-card manual-log-card">
          <div class="tool-card-title">
            <div style="display: flex; align-items: center; gap: 8px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              <span>Manual Study Log</span>
            </div>
          </div>

          <form id="manual-session-form">
            <!-- Paired Inputs: Subject & Date Side-by-Side -->
            <div class="form-row-paired">
              <div class="form-group">
                <label class="form-label" for="manual-subject-select">Subject</label>
                <select id="manual-subject-select" class="form-select">
                  <option value="">🌐 General / No Subject</option>
                  ${activeSubjects.map(s => `
                    <option value="${s.id}" ${s.id === selectedSubjectId ? 'selected' : ''}>
                      ${s.code ? `[${s.code}] ` : ''}${s.name}
                    </option>
                  `).join('')}
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

      <!-- Recent Sessions Log -->
      <div class="sessions-history-card">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <h3 style="font-size: 15px; font-weight: 600;">Recent Study History</h3>
          <span style="font-size: 12px; color: var(--text-muted);">${sessions.length} logged sessions</span>
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
                const subName = sub ? sub.name : 'General Study';
                const subColor = sub ? sub.color : '#94a3b8';
                const hrs = Math.floor(s.duration / 60);
                const mins = s.duration % 60;
                const durText = hrs > 0 ? `${hrs}h ${mins > 0 ? `${mins}m` : ''}` : `${mins}m`;

                return `
                  <tr>
                    <td>
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="width: 7px; height: 7px; border-radius: 50%; background-color: ${subColor}; flex-shrink: 0;"></span>
                        ${sub && sub.code ? `<span class="subject-list-code" style="font-size: 10px; padding: 1px 5px;">${sub.code}</span>` : (!sub ? `<span class="tag-status-archived" style="font-size: 10px; padding: 1px 6px;">General</span>` : '')}
                        <strong style="color: var(--text-primary); font-size: 13px;">${subName}</strong>
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
  // LeetCode Tooltip
  const tooltip = container.querySelector('#heatmap-tooltip');
  container.querySelectorAll('.cal-day-cell').forEach(cell => {
    cell.addEventListener('mouseenter', () => {
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

      const rect = cell.getBoundingClientRect();
      tooltip.style.left = `${rect.left + window.scrollX - 40}px`;
      tooltip.style.top = `${rect.top + window.scrollY - tooltip.offsetHeight - 8}px`;
      tooltip.style.display = 'flex';
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


  // --- POMODORO TIMER EVENT LISTENERS ---
  const pomoSubjectSelect = container.querySelector('#pomo-subject-select');
  if (pomoSubjectSelect) {
    pomoSubjectSelect.addEventListener('change', (e) => {
      pomoSubjectId = e.target.value;
    });
  }

  function tickPomodoro() {
    if (pomoTimeRemaining > 0) {
      pomoTimeRemaining--;
      const timeDisplay = container.querySelector('#pomo-time-display');
      const progressFill = container.querySelector('#pomo-progress-fill');
      if (timeDisplay) {
        timeDisplay.textContent = formatPomoTime(pomoTimeRemaining);
      }
      if (progressFill) {
        const totalSecs = (pomoPhase === 'focus' ? 25 : 5) * 60;
        const pct = ((totalSecs - pomoTimeRemaining) / totalSecs) * 100;
        progressFill.style.width = `${pct}%`;
      }
    } else {
      // Phase completed!
      playPomoChime();
      if (pomoPhase === 'focus') {
        const todayStr = new Date().toISOString().split('T')[0];
        store.saveSession({
          subject_id: pomoSubjectId || null,
          duration: 25,
          date: todayStr,
          notes: 'Pomodoro Focus Session'
        });
        const sub = pomoSubjectId ? store.getSubjectById(pomoSubjectId) : null;
        window.avenApp?.showToast(
          `Focus session completed! 25 mins logged${sub ? ` for ${sub.name}` : ''}. Starting 5 min break.`,
          'success'
        );
        pomoPhase = 'break';
        pomoTimeRemaining = 5 * 60;
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
    slice.addEventListener('mouseenter', () => {
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

      const rect = slice.getBoundingClientRect();
      tooltip.style.left = `${rect.left + window.scrollX - 20}px`;
      tooltip.style.top = `${rect.top + window.scrollY - tooltip.offsetHeight - 10}px`;
      tooltip.style.display = 'flex';
    });

    slice.addEventListener('mouseleave', () => {
      tooltip.style.display = 'none';
    });
  });
}
