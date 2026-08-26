/**
 * Aven - Study Tracker Controller
 * Features: LeetCode-style activity heatmap, Milestone progress journey, Study time distribution, Manual Hours+Minutes logger, Streaks.
 */

import { store, events } from '../core/store.js';
import { calculateDistributionStats, calculateMilestoneData, aggregateRecentStudyHistory } from '../domain/tracker-calculator.js';
import { playDualToneChime } from '../utils/audio.js';
import { formatMinutesAndSeconds, getTodayISO } from '../utils/date-utils.js';
import { renderSubjectSelectOptions } from '../ui/dropdown.js';

let selectedSubjectId = '';
let heatmapYear = new Date().getFullYear(); // Year-view navigation state
let distributionScope = 'all'; // 'all' | 'week'

// Pomodoro Timer State (Persists across view switches)
let pomoMode = 'classic'; // 'classic' (work->break) | 'reverse' (break->work) | 'stopwatch' (count-up)
let pomoPhase = 'focus'; // 'focus' | 'break' | 'long-break'
let pomoCurrentCycle = 1;
let pomoWorkMins = 25;
let pomoShortBreakMins = 5;
let pomoLongBreakMins = 15;
let pomoTimeRemaining = 25 * 60; // seconds for countdown
let stopwatchElapsed = 0; // seconds for count-up stopwatch
let pomoIsRunning = false;
let pomoInterval = null;
let pomoSubjectId = '';
let pipWindow = null;
const isPipSupported = typeof window !== 'undefined' && 'documentPictureInPicture' in window;

export function renderTrackerView(container) {
  const activeSubjects = store.getSubjects(false);
  const streakStats = store.getStreakStats();
  const sessions = store.getSessions().sort((a, b) => new Date(b.date + ' ' + (b.created_at || '')) - new Date(a.date + ' ' + (a.created_at || '')));
  const displaySessions = aggregateRecentStudyHistory(sessions);
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
  function renderPomodoroCard(activeSubjects, pomoTargetCycles) {
    if (pipWindow && !pipWindow.closed) {
      return `
        <div class="tool-card pomodoro-card bento-timer-card pomo-pip-active-card">
          <div class="pomodoro-header">
            <div class="pomodoro-header-label">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>POMODORO</span>
            </div>
          </div>
          <div class="pomo-pip-placeholder-body">
            <div class="pomo-pip-icon-wrap">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="2"></rect>
                <rect x="12" y="12" width="8" height="8" rx="1"></rect>
                <path d="m14 10 4-4"></path>
                <path d="M14 6h4v4"></path>
              </svg>
            </div>
            <div class="pomo-pip-msg">Timer in Picture-in-Picture</div>
            <div class="pomo-pip-submsg">Floating above all windows</div>
            <button type="button" class="btn btn-secondary btn-sm" id="btn-return-from-pip" style="margin-top: 8px;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 14 4 9 9 4"></polyline>
                <path d="M20 20v-7a4 4 0 0 0-4-4H4"></path>
              </svg>
              <span>Return Timer</span>
            </button>
          </div>
        </div>
      `;
    }

    const isStopwatch = pomoMode === 'stopwatch';
    const totalSecs = (pomoPhase === 'focus' ? pomoWorkMins : (pomoPhase === 'long-break' ? pomoLongBreakMins : pomoShortBreakMins)) * 60;
    const progressPct = isStopwatch ? (pomoIsRunning ? 100 : (stopwatchElapsed > 0 ? 50 : 0)) : Math.min(100, Math.max(0, ((totalSecs - pomoTimeRemaining) / totalSecs) * 100));

    return `
      <div class="tool-card pomodoro-card bento-timer-card">
        <!-- Top Row: Title & 3-Way Mode Switch + Popout PiP -->
        <div class="pomodoro-header">
          <div class="pomodoro-header-label">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>POMODORO</span>
          </div>

          <!-- 3-Way Mode Toggle + Popout PiP Action -->
          <div class="pomo-header-actions">
            <div class="pomo-mode-switch" id="pomo-mode-switch" title="Toggle Timer Mode">
              <button type="button" class="pomo-mode-btn ${pomoMode === 'classic' ? 'active' : ''}" data-mode="classic">Classic</button>
              <button type="button" class="pomo-mode-btn ${pomoMode === 'reverse' ? 'active' : ''}" data-mode="reverse">Reverse</button>
              <button type="button" class="pomo-mode-btn ${pomoMode === 'stopwatch' ? 'active' : ''}" data-mode="stopwatch">Stopwatch</button>
            </div>
            ${isPipSupported ? `
              <button type="button" class="pomo-pip-btn" id="btn-pomo-pip" title="Pop out floating timer (Picture-in-Picture)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="2"></rect>
                  <rect x="12" y="12" width="8" height="8" rx="1"></rect>
                  <path d="m14 10 4-4"></path>
                  <path d="M14 6h4v4"></path>
                </svg>
              </button>
            ` : ''}
          </div>
        </div>

        ${isStopwatch ? `
          <!-- Stopwatch Sub-Header: Mode Badge & Subject Selector -->
          <div class="pomo-meta-row">
            <div class="pomo-phase-badge focus-mode">
              <span class="pomo-phase-dot"></span>
              <span>STOPWATCH</span>
            </div>

            <div class="pomo-meta-controls">
              <div class="pomo-subject-wrap" style="max-width: 170px;">
                <select id="pomo-subject-select" class="form-select pomo-subject-select" title="Link session to subject">
                  ${renderSubjectSelectOptions(activeSubjects, pomoSubjectId, true)}
                </select>
              </div>
            </div>
          </div>

          <!-- Stopwatch Count-Up Display -->
          <div class="pomo-display-block">
            <div class="pomo-time-display" id="pomo-time-display">${formatMinutesAndSeconds(stopwatchElapsed)}</div>
            <div class="pomo-progress-track">
              <div class="pomo-progress-fill" id="pomo-progress-fill" style="width: ${progressPct}%;"></div>
            </div>
          </div>

          <!-- Stopwatch Controls: Start/Pause + Stop & Save -->
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
                <span>${stopwatchElapsed > 0 ? 'Resume' : 'Start'}</span>
              `}
            </button>

            <button type="button" class="btn btn-secondary pomo-btn-reset" id="btn-pomo-reset" title="${pomoIsRunning || stopwatchElapsed > 0 ? 'Stop & Log Session' : 'Reset'}" style="${stopwatchElapsed > 0 ? 'color: var(--danger); font-weight: 600;' : ''}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="6" y="6" width="12" height="12" rx="2"></rect>
              </svg>
              <span>${pomoIsRunning || stopwatchElapsed > 0 ? 'Stop & Save' : 'Reset'}</span>
            </button>
          </div>
        ` : `
          <!-- Pomodoro Sub-Header: Phase Indicator & Subject Selector & Cycles Input -->
          <div class="pomo-meta-row">
            <div class="pomo-phase-badge ${pomoPhase === 'focus' ? 'focus-mode' : (pomoPhase === 'long-break' ? 'long-break-mode' : 'break-mode')}">
              <span class="pomo-phase-dot"></span>
              <span>${pomoPhase === 'focus' ? 'Focus' : (pomoPhase === 'long-break' ? 'Long Break' : 'Break')} &middot; Cycle ${pomoCurrentCycle} of ${pomoTargetCycles}</span>
            </div>

            <div class="pomo-meta-controls">
              <div class="pomo-subject-wrap">
                <select id="pomo-subject-select" class="form-select pomo-subject-select" title="Link session to subject">
                  ${renderSubjectSelectOptions(activeSubjects, pomoSubjectId, true)}
                </select>
              </div>

              <div class="pomo-cycles-control" title="Set number of cycles (editable when timer is idle)">
                <label for="pomo-cycles-input" class="pomo-cycles-label">Cycles</label>
                <input type="number" id="pomo-cycles-input" class="form-input pomo-cycles-input" min="1" max="12" value="${pomoTargetCycles}" ${pomoIsRunning ? 'disabled' : ''}>
              </div>
            </div>
          </div>

          <!-- Large Bento Digits Display -->
          <div class="pomo-display-block">
            <div class="pomo-time-display" id="pomo-time-display">${formatMinutesAndSeconds(pomoTimeRemaining)}</div>
            <div class="pomo-progress-track">
              <div class="pomo-progress-fill ${pomoPhase === 'break' ? 'break-fill' : (pomoPhase === 'long-break' ? 'long-break-fill' : '')}" id="pomo-progress-fill" style="width: ${progressPct}%;"></div>
            </div>
          </div>

          <!-- Timer Controls Row (Single Horizontal Row) -->
          <div class="pomo-controls-row">
            <button type="button" class="btn ${pomoIsRunning ? 'btn-secondary pomo-btn-pause' : 'btn-primary pomo-btn-start'}" id="btn-pomo-toggle">
              ${pomoIsRunning ? `
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1"></rect>
                  <rect x="14" y="4" width="4" height="16" rx="1"></rect>
                </svg>
                <span>Pause</span>
              ` : `
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                <span>Start</span>
              `}
            </button>

            <button type="button" class="btn btn-secondary pomo-btn-reset" id="btn-pomo-reset" title="Reset Timer">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                <path d="M3 3v5h5"></path>
              </svg>
              <span>Reset</span>
            </button>

            <button type="button" class="btn btn-secondary pomo-btn-skip" id="btn-pomo-switch-phase" title="${pomoPhase === 'focus' ? (pomoCurrentCycle >= pomoTargetCycles ? 'Skip to Long Break' : 'Skip to Break') : 'Skip to Focus'}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="5 4 15 12 5 20 5 4"></polygon>
                <line x1="19" y1="5" x2="19" y2="19"></line>
              </svg>
              <span>Skip</span>
            </button>
          </div>
        `}
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
            <span class="milestone-stat-label">Longest</span>
          </div>
        </div>
      </div>
    `;
  }

  const settings = store.getSettings();
  const pomoTargetCycles = settings.pomodoro_cycles || 4;

  container.innerHTML = `
    <div class="tracker-layout">
      <!-- Tracker Action Top Row: Pomodoro Timer + Milestone Progress + Manual Study Log (3-Column Grid) -->
      <div class="tracker-tools-grid">
        <!-- Pomodoro Timer Card (Left) -->
        ${renderPomodoroCard(activeSubjects, pomoTargetCycles)}

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

          <!-- Heatmap body: day labels + 12 month blocks inside scrollable container -->
          <div class="heatmap-scroll-container">
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
              ${displaySessions.length === 0 ? `
                <tr>
                  <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 32px;">
                    No study sessions recorded yet. Use the manual study log above!
                  </td>
                </tr>
              ` : displaySessions.slice(0, 15).map(s => {
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
                      <button class="btn btn-ghost btn-sm btn-del-session" data-ids="${(s.ids || [s.id]).join(',')}" data-id="${s.id}" style="color: var(--danger); padding: 3px 6px;">
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

    <!-- Confirm Skip Pomodoro Phase Modal -->
    <div class="modal-overlay" id="pomo-skip-modal">
      <div class="modal-card" style="max-width: 440px;">
        <div class="modal-header">
          <h3 class="modal-title" id="pomo-skip-title">Skip Phase?</h3>
          <button type="button" class="btn btn-ghost btn-icon close-skip-modal-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <p style="margin: 0 0 10px 0; color: var(--text-primary); font-size: 13.5px; line-height: 1.5;" id="pomo-skip-message">
            Skip to break? Your current focus time won't be counted.
          </p>
          <p style="margin: 0; color: var(--text-muted); font-size: 12.5px; line-height: 1.4;">
            You can resume or restart your timer sequence at any time.
          </p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost close-skip-modal-btn">Cancel</button>
          <button type="button" class="btn btn-primary" id="btn-confirm-skip-phase">Confirm Skip</button>
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

  // Classic / Reverse / Stopwatch 3-Way Mode Toggle Buttons
  container.querySelectorAll('.pomo-mode-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const mode = e.currentTarget.dataset.mode;
      if (mode === pomoMode) return;
      pomoMode = mode;
      pomoIsRunning = false;
      if (pomoInterval) {
        clearInterval(pomoInterval);
        pomoInterval = null;
      }
      if (pomoMode === 'stopwatch') {
        stopwatchElapsed = 0;
      } else {
        pomoPhase = pomoMode === 'reverse' ? 'break' : 'focus';
        pomoTimeRemaining = (pomoPhase === 'focus' ? pomoWorkMins : pomoShortBreakMins) * 60;
        pomoCurrentCycle = 1;
      }
      renderTrackerView(container);
    });
  });

  async function openPipTimer() {
    if (!isPipSupported) return;
    try {
      pipWindow = await window.documentPictureInPicture.requestWindow({
        width: 320,
        height: 200
      });

      const theme = document.documentElement.getAttribute('data-theme') || 'pure-black';
      pipWindow.document.documentElement.setAttribute('data-theme', theme);
      pipWindow.document.title = 'Aven Floating Timer';

      [...document.styleSheets].forEach((styleSheet) => {
        try {
          const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
          const style = pipWindow.document.createElement('style');
          style.textContent = cssRules;
          pipWindow.document.head.appendChild(style);
        } catch (e) {
          const link = pipWindow.document.createElement('link');
          link.rel = 'stylesheet';
          link.type = styleSheet.type;
          link.media = styleSheet.media;
          link.href = styleSheet.href;
          pipWindow.document.head.appendChild(link);
        }
      });

      const pipCustomStyle = pipWindow.document.createElement('style');
      pipCustomStyle.textContent = `
        body {
          margin: 0;
          padding: 12px 14px;
          background: var(--bg-surface, #000);
          color: var(--text-primary, #fff);
          font-family: var(--font-sans, system-ui, sans-serif);
          box-sizing: border-box;
          overflow: hidden;
          user-select: none;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 100vh;
        }
        .pip-timer-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
          height: 100%;
          justify-content: space-between;
        }
        .pip-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .pip-time-display {
          font-family: var(--font-numeric);
          font-size: 40px;
          font-weight: 800;
          text-align: center;
          line-height: 1;
          letter-spacing: -0.03em;
          font-variant-numeric: tabular-nums;
        }
        .pip-controls {
          display: flex;
          gap: 6px;
        }
        .pip-controls .btn {
          flex: 1;
          height: 32px;
          font-size: 12px;
          font-weight: 700;
          padding: 0 8px;
        }
      `;
      pipWindow.document.head.appendChild(pipCustomStyle);

      renderPipContent();

      pipWindow.addEventListener('pagehide', () => {
        pipWindow = null;
        renderTrackerView(container);
      });

      renderTrackerView(container);
    } catch (err) {
      console.error('Failed to open PiP window:', err);
      window.avenApp?.showToast('Unable to open Picture-in-Picture window.', 'error');
    }
  }

  function renderPipContent() {
    if (!pipWindow || pipWindow.closed) return;
    const isStopwatch = pomoMode === 'stopwatch';
    const settings = store.getSettings();
    const targetCycles = settings.pomodoro_cycles || 4;
    const timeStr = formatMinutesAndSeconds(isStopwatch ? stopwatchElapsed : pomoTimeRemaining);

    pipWindow.document.body.innerHTML = `
      <div class="pip-timer-container">
        <div class="pip-header">
          ${isStopwatch ? `
            <div class="pomo-phase-badge focus-mode">
              <span class="pomo-phase-dot"></span>
              <span>STOPWATCH</span>
            </div>
          ` : `
            <div class="pomo-phase-badge ${pomoPhase === 'focus' ? 'focus-mode' : (pomoPhase === 'long-break' ? 'long-break-mode' : 'break-mode')}">
              <span class="pomo-phase-dot"></span>
              <span>${pomoPhase === 'focus' ? 'Focus' : (pomoPhase === 'long-break' ? 'Long Break' : 'Break')} &middot; ${pomoCurrentCycle}/${targetCycles}</span>
            </div>
          `}
          <span style="font-size: 10px; font-weight: 700; color: var(--text-muted); letter-spacing: 0.05em;">AVEN</span>
        </div>

        <div class="pip-time-display" id="pip-time-display">${timeStr}</div>

        <div class="pip-controls">
          <button type="button" class="btn ${pomoIsRunning ? 'btn-secondary' : 'btn-primary'}" id="btn-pip-toggle">
            ${pomoIsRunning ? 'Pause' : (isStopwatch && stopwatchElapsed > 0 ? 'Resume' : 'Start')}
          </button>
          ${!isStopwatch ? `
            <button type="button" class="btn btn-secondary" id="btn-pip-skip">
              Skip
            </button>
          ` : `
            <button type="button" class="btn btn-secondary" id="btn-pip-stop" style="${stopwatchElapsed > 0 ? 'color: var(--danger);' : ''}">
              ${pomoIsRunning || stopwatchElapsed > 0 ? 'Stop & Log' : 'Reset'}
            </button>
          `}
        </div>
      </div>
    `;

    const pipToggle = pipWindow.document.querySelector('#btn-pip-toggle');
    if (pipToggle) {
      pipToggle.addEventListener('click', () => {
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
        renderPipContent();
      });
    }

    const pipSkip = pipWindow.document.querySelector('#btn-pip-skip');
    if (pipSkip) {
      pipSkip.addEventListener('click', () => {
        const s = store.getSettings();
        const tc = s.pomodoro_cycles || 4;
        if (pomoPhase === 'focus') {
          if (pomoCurrentCycle >= tc) {
            pomoPhase = 'long-break';
            pomoTimeRemaining = pomoLongBreakMins * 60;
          } else {
            pomoPhase = 'break';
            pomoTimeRemaining = pomoShortBreakMins * 60;
          }
        } else if (pomoPhase === 'break') {
          pomoCurrentCycle++;
          pomoPhase = 'focus';
          pomoTimeRemaining = pomoWorkMins * 60;
        } else {
          pomoCurrentCycle = 1;
          pomoPhase = 'focus';
          pomoTimeRemaining = pomoWorkMins * 60;
        }
        renderPipContent();
      });
    }

    const pipStop = pipWindow.document.querySelector('#btn-pip-stop');
    if (pipStop) {
      pipStop.addEventListener('click', () => {
        pomoIsRunning = false;
        if (pomoInterval) {
          clearInterval(pomoInterval);
          pomoInterval = null;
        }
        if (stopwatchElapsed >= 30) {
          const mins = Math.max(1, Math.round(stopwatchElapsed / 60));
          const todayStr = new Date().toISOString().split('T')[0];
          store.saveSession({
            subject_id: pomoSubjectId || null,
            duration: mins,
            date: todayStr,
            notes: 'Stopwatch Session'
          });
          const sub = pomoSubjectId ? store.getSubjectById(pomoSubjectId) : null;
          window.avenApp?.showToast(`Logged ${mins} min stopwatch session${sub ? ` for ${sub.name}` : ''}!`, 'success');
        }
        stopwatchElapsed = 0;
        renderPipContent();
      });
    }
  }

  function notifyPhaseTransition(title, body) {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          silent: false
        });
      } catch (err) {
        // Fallback for environments where Notification constructor errors
      }
    }
  }

  function tickPomodoro() {
    if (pomoMode === 'stopwatch') {
      stopwatchElapsed++;
      const timeDisplay = container.querySelector('#pomo-time-display');
      if (timeDisplay) {
        timeDisplay.textContent = formatMinutesAndSeconds(stopwatchElapsed);
      }
      if (pipWindow && !pipWindow.closed) {
        const pipTime = pipWindow.document.querySelector('#pip-time-display');
        if (pipTime) pipTime.textContent = formatMinutesAndSeconds(stopwatchElapsed);
      }
    } else {
      if (pomoTimeRemaining > 0) {
        pomoTimeRemaining--;
        const timeDisplay = container.querySelector('#pomo-time-display');
        const progressFill = container.querySelector('#pomo-progress-fill');
        if (timeDisplay) {
          timeDisplay.textContent = formatMinutesAndSeconds(pomoTimeRemaining);
        }
        if (pipWindow && !pipWindow.closed) {
          const pipTime = pipWindow.document.querySelector('#pip-time-display');
          if (pipTime) pipTime.textContent = formatMinutesAndSeconds(pomoTimeRemaining);
        }
        if (progressFill) {
          const totalSecs = (pomoPhase === 'focus' ? pomoWorkMins : (pomoPhase === 'long-break' ? pomoLongBreakMins : pomoShortBreakMins)) * 60;
          const pct = ((totalSecs - pomoTimeRemaining) / totalSecs) * 100;
          progressFill.style.width = `${pct}%`;
        }
      } else {
        // Phase completed!
        playDualToneChime();
        const settings = store.getSettings();
        const targetCycles = settings.pomodoro_cycles || 4;

        if (pomoPhase === 'focus') {
          const todayStr = new Date().toISOString().split('T')[0];
          store.saveSession({
            subject_id: pomoSubjectId || null,
            duration: pomoWorkMins,
            date: todayStr,
            notes: `Pomodoro Focus (Cycle ${pomoCurrentCycle}/${targetCycles})`
          });
          const sub = pomoSubjectId ? store.getSubjectById(pomoSubjectId) : null;

          if (pomoCurrentCycle >= targetCycles) {
            // Final cycle completed -> Transition to Long Break (15 min)
            notifyPhaseTransition('Break time!', `All ${targetCycles} focus cycles completed — starting your 15-minute long break.`);
            window.avenApp?.showToast(
              `Final focus cycle (${pomoCurrentCycle}/${targetCycles}) completed! ${pomoWorkMins} mins logged${sub ? ` for ${sub.name}` : ''}. Starting 15 min long break!`,
              'success'
            );
            pomoPhase = 'long-break';
            pomoTimeRemaining = pomoLongBreakMins * 60;
          } else {
            // Standard cycle -> Transition to Short Break (5 min)
            notifyPhaseTransition('Break time!', `Focus cycle ${pomoCurrentCycle}/${targetCycles} completed — take a 5-minute break.`);
            window.avenApp?.showToast(
              `Focus cycle ${pomoCurrentCycle}/${targetCycles} completed! ${pomoWorkMins} mins logged${sub ? ` for ${sub.name}` : ''}. Starting 5 min break.`,
              'success'
            );
            pomoPhase = 'break';
            pomoTimeRemaining = pomoShortBreakMins * 60;
          }
        } else if (pomoPhase === 'break') {
          // Short break completed -> Advance to next focus cycle
          pomoCurrentCycle++;
          pomoPhase = 'focus';
          pomoTimeRemaining = pomoWorkMins * 60;
          notifyPhaseTransition('Back to focus', `Break finished. Ready for Focus cycle ${pomoCurrentCycle} of ${targetCycles}.`);
          window.avenApp?.showToast(`Break finished! Starting Focus cycle ${pomoCurrentCycle} of ${targetCycles}.`, 'info');
        } else if (pomoPhase === 'long-break') {
          // Long break completed -> Full Pomodoro sequence completed!
          notifyPhaseTransition('Session complete — nice work!', `All ${targetCycles} Pomodoro cycles completed.`);
          window.avenApp?.showToast(`Long break finished! All ${targetCycles} Pomodoro cycles completed. Great job!`, 'success');
          pomoPhase = 'focus';
          pomoCurrentCycle = 1;
          pomoTimeRemaining = pomoWorkMins * 60;
          pomoIsRunning = false;
          if (pomoInterval) {
            clearInterval(pomoInterval);
            pomoInterval = null;
          }
        }
        if (pipWindow && !pipWindow.closed) {
          renderPipContent();
        }
        renderTrackerView(container);
      }
    }
  }

  const pomoPipBtn = container.querySelector('#btn-pomo-pip');
  if (pomoPipBtn) {
    pomoPipBtn.addEventListener('click', openPipTimer);
  }

  const returnPipBtn = container.querySelector('#btn-return-from-pip');
  if (returnPipBtn) {
    returnPipBtn.addEventListener('click', () => {
      if (pipWindow && !pipWindow.closed) {
        pipWindow.close();
      }
      pipWindow = null;
      renderTrackerView(container);
    });
  }

  const pomoToggleBtn = container.querySelector('#btn-pomo-toggle');
  if (pomoToggleBtn) {
    pomoToggleBtn.addEventListener('click', async () => {
      if (pomoIsRunning) {
        pomoIsRunning = false;
        if (pomoInterval) {
          clearInterval(pomoInterval);
          pomoInterval = null;
        }
      } else {
        // Request notification permission on first user start interaction
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
          try {
            await Notification.requestPermission();
          } catch (err) {}
        }
        pomoIsRunning = true;
        if (pomoInterval) clearInterval(pomoInterval);
        pomoInterval = setInterval(tickPomodoro, 1000);
      }
      renderTrackerView(container);
    });
  }

  const pomoCyclesInput = container.querySelector('#pomo-cycles-input');
  if (pomoCyclesInput) {
    pomoCyclesInput.addEventListener('change', (e) => {
      let val = parseInt(e.target.value, 10);
      if (isNaN(val) || val < 1) val = 1;
      if (val > 12) val = 12;
      store.saveSettings({ pomodoro_cycles: val });
      if (pomoCurrentCycle > val) {
        pomoCurrentCycle = 1;
      }
      renderTrackerView(container);
    });
  }

  const pomoResetBtn = container.querySelector('#btn-pomo-reset');
  if (pomoResetBtn) {
    pomoResetBtn.addEventListener('click', () => {
      if (pomoMode === 'stopwatch') {
        pomoIsRunning = false;
        if (pomoInterval) {
          clearInterval(pomoInterval);
          pomoInterval = null;
        }
        if (stopwatchElapsed >= 30) {
          const mins = Math.max(1, Math.round(stopwatchElapsed / 60));
          const todayStr = new Date().toISOString().split('T')[0];
          store.saveSession({
            subject_id: pomoSubjectId || null,
            duration: mins,
            date: todayStr,
            notes: 'Stopwatch Session'
          });
          const sub = pomoSubjectId ? store.getSubjectById(pomoSubjectId) : null;
          window.avenApp?.showToast(`Logged ${mins} min stopwatch session${sub ? ` for ${sub.name}` : ''}!`, 'success');
        } else if (stopwatchElapsed > 0) {
          window.avenApp?.showToast('Stopwatch reset (under 30s session not logged)', 'info');
        }
        stopwatchElapsed = 0;
      } else {
        pomoIsRunning = false;
        if (pomoInterval) {
          clearInterval(pomoInterval);
          pomoInterval = null;
        }
        pomoCurrentCycle = 1;
        pomoPhase = 'focus';
        pomoTimeRemaining = pomoWorkMins * 60;
      }
      renderTrackerView(container);
    });
  }

  // Skip Phase Confirmation Modal Handling
  const skipModal = container.querySelector('#pomo-skip-modal');
  const skipTitle = container.querySelector('#pomo-skip-title');
  const skipMessage = container.querySelector('#pomo-skip-message');
  const confirmSkipBtn = container.querySelector('#btn-confirm-skip-phase');

  const pomoSwitchPhaseBtn = container.querySelector('#btn-pomo-switch-phase');
  if (pomoSwitchPhaseBtn) {
    pomoSwitchPhaseBtn.addEventListener('click', () => {
      const settings = store.getSettings();
      const targetCycles = settings.pomodoro_cycles || 4;

      if (pomoPhase === 'focus') {
        const isLastCycle = pomoCurrentCycle >= targetCycles;
        if (skipTitle) skipTitle.textContent = isLastCycle ? 'Skip to Long Break?' : 'Skip to Break?';
        if (skipMessage) skipMessage.textContent = "Skip to break? Your current focus time won't be counted.";
        if (confirmSkipBtn) confirmSkipBtn.textContent = isLastCycle ? 'Skip to Long Break' : 'Skip to Break';
      } else {
        if (skipTitle) skipTitle.textContent = 'Skip to Focus?';
        if (skipMessage) skipMessage.textContent = 'Skip to focus? This break will end early.';
        if (confirmSkipBtn) confirmSkipBtn.textContent = 'Skip to Focus';
      }
      skipModal?.classList.add('open');
    });
  }

  container.querySelectorAll('.close-skip-modal-btn').forEach(b => {
    b.addEventListener('click', () => {
      skipModal?.classList.remove('open');
    });
  });

  if (confirmSkipBtn) {
    confirmSkipBtn.addEventListener('click', () => {
      pomoIsRunning = false;
      if (pomoInterval) {
        clearInterval(pomoInterval);
        pomoInterval = null;
      }
      const settings = store.getSettings();
      const targetCycles = settings.pomodoro_cycles || 4;

      if (pomoPhase === 'focus') {
        if (pomoCurrentCycle >= targetCycles) {
          pomoPhase = 'long-break';
          pomoTimeRemaining = pomoLongBreakMins * 60;
        } else {
          pomoPhase = 'break';
          pomoTimeRemaining = pomoShortBreakMins * 60;
        }
      } else if (pomoPhase === 'break') {
        pomoCurrentCycle++;
        pomoPhase = 'focus';
        pomoTimeRemaining = pomoWorkMins * 60;
      } else {
        pomoCurrentCycle = 1;
        pomoPhase = 'focus';
        pomoTimeRemaining = pomoWorkMins * 60;
      }
      skipModal?.classList.remove('open');
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
        date,
        notes: 'Manually logged'
      });

      const sub = subject_id ? store.getSubjectById(subject_id) : null;
      window.avenApp?.showToast(`Logged ${totalMins} min session${sub ? ` for ${sub.name}` : ' (General Study)'}!`, 'success');
      renderTrackerView(container);
    });
  }

  // Delete Session (Supports single or merged sub-hour session entries)
  container.querySelectorAll('.btn-del-session').forEach(btn => {
    btn.addEventListener('click', () => {
      const ids = btn.dataset.ids ? btn.dataset.ids.split(',') : [btn.dataset.id];
      ids.forEach(id => store.deleteSession(id));
      window.avenApp?.showToast(ids.length > 1 ? `${ids.length} study sessions deleted` : 'Session deleted', 'info');
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
