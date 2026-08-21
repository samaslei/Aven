/**
 * Aven - Study Tracker Controller
 * Features: LeetCode-style activity heatmap, Stopwatch & Pomodoro focus timer modes, Manual Hours+Minutes logger, Streaks.
 */

import { store, events } from './store.js';

// Timer State
let timerMode = null; // 'stopwatch' | 'pomodoro'
let selectedSubjectId = '';
let heatmapYear = new Date().getFullYear(); // Year-view navigation state
let pomoTargetCycles = 4; // Target Pomodoro cycles per session block (1-12)

// Stopwatch State
let stopwatchInterval = null;
let stopwatchSeconds = 0;
let stopwatchRunning = false;

// Pomodoro State
let pomoInterval = null;
let pomoPhase = 'work'; // 'work' | 'break'
let pomoSecondsLeft = 25 * 60;
let pomoRunning = false;
let pomoSessionsCompleted = 0;

// Distribution Scope State
let distributionScope = 'all'; // 'all' | 'week'

export function renderTrackerView(container) {
  const activeSubjects = store.getSubjects(false);
  const streakStats = store.getStreakStats();
  const sessions = store.getSessions().sort((a, b) => new Date(b.date + ' ' + (b.created_at || '')) - new Date(a.date + ' ' + (a.created_at || '')));
  const calendarData = store.getYearCalendarMatrix(heatmapYear);
  const settings = store.getSettings();

  // Initialize timer mode from settings if not set
  if (!timerMode) {
    timerMode = settings.default_timer_mode || 'stopwatch';
  }

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

      <!-- Tracker Tools: Stopwatch/Pomodoro Timer + Manual Log Entry -->
      <div class="tracker-tools-grid">
        <!-- Focus Timer Card -->
        <div class="tool-card focus-timer-card">
          <div class="tool-card-title">
            <div style="display: flex; align-items: center; gap: 8px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>Focus Timer</span>
            </div>

            <div style="display: flex; align-items: center; gap: 8px;">
              <!-- Stopwatch vs Pomodoro Mode Toggle -->
              <div class="segmented-control" id="timer-mode-switcher">
                <button class="seg-btn ${timerMode === 'stopwatch' ? 'active' : ''}" data-mode="stopwatch">Stopwatch</button>
                <button class="seg-btn ${timerMode === 'pomodoro' ? 'active' : ''}" data-mode="pomodoro">Pomodoro</button>
              </div>

              <!-- Pomodoro Settings Dropdown Trigger -->
              <div class="pomo-settings-wrapper" id="pomo-settings-wrapper" style="${timerMode === 'pomodoro' ? '' : 'display: none;'}">
                <button type="button" class="pomo-settings-btn" id="btn-pomo-settings-toggle" title="Pomodoro Intervals" aria-label="Pomodoro Intervals">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                </button>
                <div class="pomo-settings-popover" id="pomo-settings-popover">
                  <div class="pomo-settings-popover-title">Pomodoro Intervals</div>
                  <div class="form-group" style="margin-bottom: 8px;">
                    <label class="form-label" for="pomo-work-input" style="font-size: 11px;">Work Duration (Mins)</label>
                    <input type="number" id="pomo-work-input" class="form-input" min="1" max="120" value="${settings.pomodoro_work_mins || 25}" ${pomoRunning ? 'disabled' : ''}>
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="pomo-break-input" style="font-size: 11px;">Break Duration (Mins)</label>
                    <input type="number" id="pomo-break-input" class="form-input" min="1" max="60" value="${settings.pomodoro_break_mins || 5}" ${pomoRunning ? 'disabled' : ''}>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="timer-subject-select">Target Subject</label>
            <select id="timer-subject-select" class="form-select" ${(stopwatchRunning || pomoRunning) ? 'disabled' : ''}>
              <option value="" ${!selectedSubjectId ? 'selected' : ''}>🌐 General / No Subject</option>
              ${activeSubjects.map(s => `
                <option value="${s.id}" ${s.id === selectedSubjectId ? 'selected' : ''}>
                  ${s.code ? `[${s.code}] ` : ''}${s.name}
                </option>
              `).join('')}
            </select>
          </div>

          <!-- Animated Timer Mode Container -->
          <div class="timer-mode-body" key="${timerMode}">
            ${timerMode === 'stopwatch' ? `
              <!-- STOPWATCH MODE UI -->
              <div class="stopwatch-display-box ${stopwatchRunning ? 'is-running' : ''}">
                <div class="stopwatch-digits" id="stopwatch-timer-display">
                  ${formatTime(stopwatchSeconds)}
                </div>
                <span class="stopwatch-status-tag ${stopwatchRunning ? 'running' : (stopwatchSeconds > 0 ? 'paused' : 'idle')}" id="stopwatch-badge">
                  ${stopwatchRunning ? '● Live Recording' : (stopwatchSeconds > 0 ? 'Paused' : 'Ready')}
                </span>
              </div>

              <div class="stopwatch-controls">
                ${!stopwatchRunning ? `
                  <button class="btn btn-primary" id="btn-start-stopwatch">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                    <span>${stopwatchSeconds > 0 ? 'Resume' : 'Start Focus'}</span>
                  </button>
                ` : `
                  <button class="btn" id="btn-pause-stopwatch">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16"></rect>
                      <rect x="14" y="4" width="4" height="16"></rect>
                    </svg>
                    <span>Pause</span>
                  </button>
                `}

                <button class="btn" id="btn-reset-stopwatch" ${stopwatchSeconds === 0 ? 'disabled' : ''}>Reset</button>

                <button class="btn btn-primary" id="btn-save-stopwatch" ${stopwatchSeconds < 60 ? 'disabled title="Requires at least 1 minute to log"' : ''}>
                  Save Session
                </button>
              </div>
            ` : `
              <!-- POMODORO MODE UI -->
              <div class="stopwatch-display-box ${pomoRunning ? 'is-running' : ''} ${pomoPhase === 'break' ? 'is-break' : ''}">
                <div class="stopwatch-digits" id="pomo-timer-display">
                  ${formatMinutesSeconds(pomoSecondsLeft)}
                </div>
                <span class="stopwatch-status-tag ${pomoRunning ? 'running' : 'idle'} ${pomoPhase === 'break' ? 'is-break-tag' : ''}" id="pomo-badge">
                  ${pomoRunning ? (pomoPhase === 'work' ? '● Work Interval' : '☕ Break Interval') : (pomoPhase === 'work' ? 'Work Ready' : 'Break Ready')}
                </span>
                <div class="pomo-status-meta-row">
                  <!-- Visual Pomodoro Cycle Dots Group with +/- adjustments -->
                  <div class="pomo-cycle-group" title="Cycle ${pomoSessionsCompleted % pomoTargetCycles}/${pomoTargetCycles} (${pomoTargetCycles} total)">
                    <button type="button" class="pomo-cycle-adj-btn" id="btn-cycle-dec" title="Decrease target cycles" ${pomoTargetCycles <= 1 || pomoRunning ? 'disabled' : ''}>−</button>
                    <div class="pomo-cycle-dots">
                      ${Array.from({ length: pomoTargetCycles }).map((_, idx) => {
                        const cyclePos = pomoSessionsCompleted % pomoTargetCycles;
                        const isCompleted = pomoSessionsCompleted > 0 && (idx < cyclePos || (cyclePos === 0 && pomoSessionsCompleted >= pomoTargetCycles));
                        const isCurrent = idx === cyclePos && pomoRunning && pomoPhase === 'work';
                        return `<span class="pomo-dot ${isCompleted ? 'completed' : ''} ${isCurrent ? 'active' : ''}" title="Interval ${idx + 1}"></span>`;
                      }).join('')}
                    </div>
                    <button type="button" class="pomo-cycle-adj-btn" id="btn-cycle-inc" title="Increase target cycles" ${pomoTargetCycles >= 12 || pomoRunning ? 'disabled' : ''}>+</button>
                    <span class="pomo-cycle-count">${pomoSessionsCompleted} done</span>
                  </div>
                </div>
              </div>

              <div class="stopwatch-controls">
                ${!pomoRunning ? `
                  <button class="btn btn-primary" id="btn-start-pomo">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                    <span>Start ${pomoPhase === 'work' ? 'Work' : 'Break'}</span>
                  </button>
                ` : `
                  <button class="btn" id="btn-pause-pomo">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16"></rect>
                      <rect x="14" y="4" width="4" height="16"></rect>
                    </svg>
                    <span>Pause</span>
                  </button>
                `}

                <button class="btn" id="btn-skip-pomo">Skip to ${pomoPhase === 'work' ? 'Break' : 'Work'}</button>
                <button class="btn" id="btn-reset-pomo">Reset</button>
              </div>
            `}
          </div>
        </div>

        <!-- Right Column: Milestone Progress + Manual Study Log -->
        <div class="tracker-tools-right-col">
          <!-- Journey to Next Milestone Card -->
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
              <div class="form-row-paired" style="margin-bottom: 14px;">
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
              <div class="form-row-paired" style="margin-bottom: 20px;">
                <div class="form-group">
                  <label class="form-label" for="manual-hours">Hours</label>
                  <input type="number" id="manual-hours" class="form-input" min="0" max="24" value="1" placeholder="0">
                </div>
                <div class="form-group">
                  <label class="form-label" for="manual-minutes">Minutes</label>
                  <input type="number" id="manual-minutes" class="form-input" min="0" max="59" value="30" placeholder="0">
                </div>
              </div>

              <button type="submit" class="btn btn-primary" style="width: 100%;">
                Log Study Session
              </button>
            </form>
          </div>
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
                    No study sessions recorded yet. Use the timer or manual log above!
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

function formatTime(totalSecs) {
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatMinutesSeconds(totalSecs) {
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Gentle Web Audio API Chime
function playChime() {
  try {
    if (store.getSettings().sound_notifications === false) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.8);
  } catch (e) {
    // Web audio unavailable or muted
  }
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

  // Switcher between Stopwatch and Pomodoro
  container.querySelectorAll('#timer-mode-switcher .seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      timerMode = btn.dataset.mode;
      renderTrackerView(container);
    });
  });

  // Pomodoro Settings Popover Toggle
  const pomoSettingsBtn = container.querySelector('#btn-pomo-settings-toggle');
  const pomoSettingsPopover = container.querySelector('#pomo-settings-popover');
  if (pomoSettingsBtn && pomoSettingsPopover) {
    pomoSettingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      pomoSettingsPopover.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (pomoSettingsPopover && !pomoSettingsPopover.contains(e.target) && !pomoSettingsBtn.contains(e.target)) {
        pomoSettingsPopover.classList.remove('open');
      }
    });

    // Update settings live when inputs change in popover
    container.querySelector('#pomo-work-input')?.addEventListener('change', (e) => {
      const val = Math.max(1, Math.min(120, parseInt(e.target.value, 10) || 25));
      store.saveSettings({ pomodoro_work_mins: val });
      if (!pomoRunning && pomoPhase === 'work') {
        pomoSecondsLeft = val * 60;
        const display = container.querySelector('#pomo-timer-display');
        if (display) display.textContent = formatMinutesSeconds(pomoSecondsLeft);
      }
    });

    container.querySelector('#pomo-break-input')?.addEventListener('change', (e) => {
      const val = Math.max(1, Math.min(60, parseInt(e.target.value, 10) || 5));
      store.saveSettings({ pomodoro_break_mins: val });
      if (!pomoRunning && pomoPhase === 'break') {
        pomoSecondsLeft = val * 60;
        const display = container.querySelector('#pomo-timer-display');
        if (display) display.textContent = formatMinutesSeconds(pomoSecondsLeft);
      }
    });
  }

  // Cycle +/- adjust buttons
  const decCycleBtn = container.querySelector('#btn-cycle-dec');
  const incCycleBtn = container.querySelector('#btn-cycle-inc');
  if (decCycleBtn) {
    decCycleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (pomoTargetCycles > 1) {
        pomoTargetCycles--;
        renderTrackerView(container);
      }
    });
  }
  if (incCycleBtn) {
    incCycleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (pomoTargetCycles < 12) {
        pomoTargetCycles++;
        renderTrackerView(container);
      }
    });
  }

  // Target Subject select
  const timerSelect = container.querySelector('#timer-subject-select');
  if (timerSelect) {
    timerSelect.addEventListener('change', (e) => {
      selectedSubjectId = e.target.value;
    });
  }

  // --- STOPWATCH LOGIC ---
  const startStopwatchBtn = container.querySelector('#btn-start-stopwatch');
  const pauseStopwatchBtn = container.querySelector('#btn-pause-stopwatch');
  const resetStopwatchBtn = container.querySelector('#btn-reset-stopwatch');
  const saveStopwatchBtn = container.querySelector('#btn-save-stopwatch');

  if (startStopwatchBtn) {
    startStopwatchBtn.addEventListener('click', () => {
      stopwatchRunning = true;
      clearInterval(stopwatchInterval);
      stopwatchInterval = setInterval(() => {
        stopwatchSeconds++;
        const display = container.querySelector('#stopwatch-timer-display');
        if (display) display.textContent = formatTime(stopwatchSeconds);
      }, 1000);
      renderTrackerView(container);
    });
  }

  if (pauseStopwatchBtn) {
    pauseStopwatchBtn.addEventListener('click', () => {
      stopwatchRunning = false;
      clearInterval(stopwatchInterval);
      renderTrackerView(container);
    });
  }

  if (resetStopwatchBtn) {
    resetStopwatchBtn.addEventListener('click', () => {
      stopwatchRunning = false;
      clearInterval(stopwatchInterval);
      stopwatchSeconds = 0;
      renderTrackerView(container);
    });
  }

  if (saveStopwatchBtn) {
    saveStopwatchBtn.addEventListener('click', () => {
      const minutes = Math.round(stopwatchSeconds / 60);
      if (minutes < 1) {
        window.avenApp?.showToast('Session is less than 1 minute', 'info');
        return;
      }

      store.saveSession({
        subject_id: selectedSubjectId || null,
        duration: minutes,
        date: new Date().toISOString().split('T')[0]
      });

      stopwatchRunning = false;
      clearInterval(stopwatchInterval);
      stopwatchSeconds = 0;

      const sub = selectedSubjectId ? store.getSubjectById(selectedSubjectId) : null;
      window.avenApp?.showToast(`Logged ${minutes} min session${sub ? ` for ${sub.name}` : ' (General Study)'}!`, 'success');
      renderTrackerView(container);
    });
  }

  // --- POMODORO LOGIC ---
  const startPomoBtn = container.querySelector('#btn-start-pomo');
  const pausePomoBtn = container.querySelector('#btn-pause-pomo');
  const skipPomoBtn = container.querySelector('#btn-skip-pomo');
  const resetPomoBtn = container.querySelector('#btn-reset-pomo');

  if (startPomoBtn) {
    startPomoBtn.addEventListener('click', () => {
      const workMins = Number(container.querySelector('#pomo-work-input')?.value) || (store.getSettings().pomodoro_work_mins || 25);
      const breakMins = Number(container.querySelector('#pomo-break-input')?.value) || (store.getSettings().pomodoro_break_mins || 5);

      // Set initial seconds if starting from reset
      if (pomoSecondsLeft === 25 * 60 || pomoSecondsLeft === 0) {
        pomoSecondsLeft = pomoPhase === 'work' ? workMins * 60 : breakMins * 60;
      }

      pomoRunning = true;
      clearInterval(pomoInterval);

      pomoInterval = setInterval(() => {
        if (pomoSecondsLeft > 0) {
          pomoSecondsLeft--;
          const display = container.querySelector('#pomo-timer-display');
          if (display) display.textContent = formatMinutesSeconds(pomoSecondsLeft);
        } else {
          // Interval completed!
          clearInterval(pomoInterval);
          pomoRunning = false;
          playChime();

          if (pomoPhase === 'work') {
            pomoSessionsCompleted++;
            // Auto log study session (supports null subject_id)
            store.saveSession({
              subject_id: selectedSubjectId || null,
              duration: workMins,
              date: new Date().toISOString().split('T')[0]
            });

            const sub = selectedSubjectId ? store.getSubjectById(selectedSubjectId) : null;
            window.avenApp?.showToast(`🎉 Focus block complete! Logged ${workMins}m${sub ? ` (${sub.name})` : ''}. Time for a ${breakMins}m break.`, 'success');
            pomoPhase = 'break';
            pomoSecondsLeft = breakMins * 60;
          } else {
            window.avenApp?.showToast(`☕ Break complete! Ready for your next focus session.`, 'info');
            pomoPhase = 'work';
            pomoSecondsLeft = workMins * 60;
          }
          renderTrackerView(container);
        }
      }, 1000);

      renderTrackerView(container);
    });
  }

  if (pausePomoBtn) {
    pausePomoBtn.addEventListener('click', () => {
      pomoRunning = false;
      clearInterval(pomoInterval);
      renderTrackerView(container);
    });
  }

  if (skipPomoBtn) {
    skipPomoBtn.addEventListener('click', () => {
      pomoRunning = false;
      clearInterval(pomoInterval);
      const workMins = Number(container.querySelector('#pomo-work-input')?.value) || (store.getSettings().pomodoro_work_mins || 25);
      const breakMins = Number(container.querySelector('#pomo-break-input')?.value) || (store.getSettings().pomodoro_break_mins || 5);

      if (pomoPhase === 'work') {
        pomoPhase = 'break';
        pomoSecondsLeft = breakMins * 60;
      } else {
        pomoPhase = 'work';
        pomoSecondsLeft = workMins * 60;
      }
      renderTrackerView(container);
    });
  }

  if (resetPomoBtn) {
    resetPomoBtn.addEventListener('click', () => {
      pomoRunning = false;
      clearInterval(pomoInterval);
      const workMins = Number(container.querySelector('#pomo-work-input')?.value) || (store.getSettings().pomodoro_work_mins || 25);
      pomoPhase = 'work';
      pomoSecondsLeft = workMins * 60;
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
