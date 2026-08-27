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
let calendarDate = new Date(); // Monthly calendar state (Prompt 56)
let distributionScope = 'all'; // 'all' | 'week'
let todoFilterMode = 'both'; // 'both' | 'todo' | 'deadline' (Prompt 57)
let isCompletedSectionOpen = false; // Collapsible completed section state (Prompt 60)

// Pomodoro Timer State (Persists across view switches)
let pomoMode = 'classic'; // 'classic' (pomodoro) | 'stopwatch' (count-up)
let pomoPhase = 'focus'; // 'focus' | 'break' | 'long-break'
let pomoCurrentCycle = 1;
let pomoWorkMins = 25;
let pomoShortBreakMins = 5;
let pomoLongBreakMins = 15;
let pomoLongBreakInterval = 4;
let pomoAutoStartBreaks = false;
let pomoAutoStartPomodoros = false;
let pomoTimeRemaining = 25 * 60; // seconds for countdown
let stopwatchElapsed = 0; // seconds for count-up stopwatch
let pomoIsRunning = false;
let pomoIsPausedAfterSkip = false; // State: paused after skipping a phase
let pomoInterval = null;
let pomoSubjectId = '';
let isPomoSettingsOpen = false;
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



  // Render SVG Donut Chart Card (Prompt 56 & 57: Enlarge donut, legend removed, hover tooltip only)
  function renderDistributionCard(sessions) {
    const dist = calculateDistributionStats(sessions, distributionScope, id => store.getSubjectById(id));
    const totalHours = dist.totalHours;
    const slices = dist.slices;

    if (dist.totalMinutes === 0 || slices.length === 0) {
      return `
        <div class="tool-card distribution-container-card">
          <div class="distribution-header">
            <div class="card-header-label distribution-header-label">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
                <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
              </svg>
              <span>DISTRIBUTION</span>
            </div>
            <div class="segmented-control" id="dist-scope-switcher">
              <button class="seg-btn ${distributionScope === 'all' ? 'active' : ''}" data-scope="all">All</button>
              <button class="seg-btn ${distributionScope === 'week' ? 'active' : ''}" data-scope="week">Week</button>
            </div>
          </div>
          <div class="distribution-empty-state" style="padding: 16px 8px; flex: 1;">
            <p style="font-size: 11.5px; font-weight: 500; color: var(--text-secondary); margin: 0;">No study activity</p>
          </div>
        </div>
      `;
    }

    // Calculate SVG donut paths (Enlarged for Prompt 57)
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
                stroke-width="23"
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

    return `
      <div class="tool-card distribution-container-card">
        <div class="distribution-header">
          <div class="card-header-label distribution-header-label">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
              <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
            </svg>
            <span>DISTRIBUTION</span>
          </div>
          <div class="segmented-control" id="dist-scope-switcher">
            <button class="seg-btn ${distributionScope === 'all' ? 'active' : ''}" data-scope="all">All</button>
            <button class="seg-btn ${distributionScope === 'week' ? 'active' : ''}" data-scope="week">Week</button>
          </div>
        </div>

        <div class="distribution-donut-only-wrap">
          <div class="donut-svg-box">
            <svg class="donut-svg" viewBox="0 0 200 200" width="144" height="144">
              <!-- Background Track Ring -->
              <circle cx="100" cy="100" r="${radius}" fill="transparent" stroke="var(--border-subtle)" stroke-width="23" opacity="0.35" />
              <!-- Colored Slices -->
              ${circlesHtml}
            </svg>
            <div class="donut-center-label">
              <span class="donut-center-num">${totalHours}h</span>
              <span class="donut-center-sub">${distributionScope === 'week' ? 'Week' : 'Total'}</span>
            </div>
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

          <!-- 2-Way Mode Toggle + Popout PiP Action -->
          <div class="pomo-header-actions">
            <div class="pomo-mode-switch" id="pomo-mode-switch" title="Toggle Timer Mode">
              <button type="button" class="pomo-mode-btn ${pomoMode === 'classic' ? 'active' : ''}" data-mode="classic">Pomodoro</button>
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
            <button type="button" class="btn ${pomoIsRunning ? 'btn-secondary pomo-btn-pause' : 'btn-primary pomo-btn-start'}" id="btn-pomo-toggle" aria-label="${pomoIsRunning ? 'Pause' : (stopwatchElapsed > 0 ? 'Resume' : 'Start')}">
              ${pomoIsRunning ? `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1"></rect>
                  <rect x="14" y="4" width="4" height="16" rx="1"></rect>
                </svg>
                <span class="pomo-btn-text">Pause</span>
              ` : `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                <span class="pomo-btn-text">${stopwatchElapsed > 0 ? 'Resume' : 'Start'}</span>
              `}
            </button>

            <button type="button" class="btn btn-secondary pomo-btn-reset" id="btn-pomo-reset" title="${pomoIsRunning || stopwatchElapsed > 0 ? 'Stop & Log Session' : 'Reset'}" style="${stopwatchElapsed > 0 ? 'color: var(--danger); font-weight: 600;' : ''}" aria-label="${pomoIsRunning || stopwatchElapsed > 0 ? 'Stop & Save' : 'Reset'}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="6" y="6" width="12" height="12" rx="2"></rect>
              </svg>
              <span class="pomo-btn-text">${pomoIsRunning || stopwatchElapsed > 0 ? 'Stop & Save' : 'Reset'}</span>
            </button>
          </div>
        ` : `
          <!-- Pomodoro Sub-Header: Phase Indicator (Left) & Subject Selector + Settings Gear (Right) -->
          <div class="pomo-meta-row">
            <div class="pomo-phase-badge ${pomoPhase === 'focus' ? 'focus-mode' : (pomoPhase === 'long-break' ? 'long-break-mode' : 'break-mode')}">
              <span class="pomo-phase-dot"></span>
              <span>${pomoPhase === 'focus' ? 'Focus' : (pomoPhase === 'long-break' ? 'Long Break' : 'Break')} &middot; Cycle ${pomoCurrentCycle}</span>
            </div>

            <div class="pomo-meta-controls">
              <div class="pomo-subject-wrap">
                <select id="pomo-subject-select" class="form-select pomo-subject-select" title="Link session to subject">
                  ${renderSubjectSelectOptions(activeSubjects, pomoSubjectId, true)}
                </select>
              </div>

              <button type="button" class="pomo-settings-gear-btn" id="btn-pomo-settings" title="${pomoIsRunning ? 'Timer settings (editable while idle)' : 'Timer settings'}" aria-label="Open Timer Settings" ${pomoIsRunning ? 'disabled' : ''}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
              </button>
            </div>
          </div>

          <!-- Large Bento Digits Display -->
          <div class="pomo-display-block">
            <div class="pomo-time-display" id="pomo-time-display">${formatMinutesAndSeconds(pomoTimeRemaining)}</div>
            <div class="pomo-progress-track">
              <div class="pomo-progress-fill ${pomoPhase === 'break' ? 'break-fill' : (pomoPhase === 'long-break' ? 'long-break-fill' : '')}" id="pomo-progress-fill" style="width: ${progressPct}%;"></div>
            </div>
          </div>

          <!-- Timer Controls Row: State-dependent (Idle: Start only; Running: Reset + Stop & Log + Skip; Paused-after-skip: Start + Reset Cycle + Stop & Log) -->
          ${pomoIsRunning ? `
            <div class="pomo-controls-row pomo-controls-running">
              <button type="button" class="btn btn-secondary pomo-btn-reset-cycle" id="btn-pomo-reset-cycle" title="Reset Cycle Progress" aria-label="Reset">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                  <path d="M3 3v5h5"></path>
                </svg>
                <span class="pomo-btn-text">Reset</span>
              </button>

              <button type="button" class="btn btn-secondary pomo-btn-stop-log" id="btn-pomo-stop-log" title="Stop & Log Session" style="color: var(--danger); font-weight: 600;" aria-label="Stop & Log">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="6" y="6" width="12" height="12" rx="2"></rect>
                </svg>
                <span class="pomo-btn-text">Stop & Log</span>
              </button>

              <button type="button" class="btn btn-secondary pomo-btn-skip" id="btn-pomo-switch-phase" title="${pomoPhase === 'focus' ? (pomoCurrentCycle % pomoLongBreakInterval === 0 ? 'Skip to Long Break' : 'Skip to Break') : 'Skip to Focus'}" aria-label="Skip">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="5 4 15 12 5 20 5 4"></polygon>
                  <line x1="19" y1="5" x2="19" y2="19"></line>
                </svg>
                <span class="pomo-btn-text">Skip</span>
              </button>
            </div>
          ` : (pomoIsPausedAfterSkip ? `
            <div class="pomo-controls-row pomo-controls-paused-skip">
              <button type="button" class="btn btn-primary pomo-btn-start" id="btn-pomo-toggle" aria-label="Start">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                <span class="pomo-btn-text">Start</span>
              </button>

              <button type="button" class="btn btn-secondary pomo-btn-reset-cycle" id="btn-pomo-reset-cycle" title="Reset Cycle Progress" aria-label="Reset Cycle">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                  <path d="M3 3v5h5"></path>
                </svg>
                <span class="pomo-btn-text">Reset Cycle</span>
              </button>

              <button type="button" class="btn btn-secondary pomo-btn-stop-log" id="btn-pomo-stop-log" title="Stop & Log Session" style="color: var(--danger); font-weight: 600;" aria-label="Stop & Log">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="6" y="6" width="12" height="12" rx="2"></rect>
                </svg>
                <span class="pomo-btn-text">Stop & Log</span>
              </button>
            </div>
          ` : `
            <div class="pomo-controls-row pomo-controls-idle">
              <button type="button" class="btn btn-primary pomo-btn-start pomo-btn-start-full" id="btn-pomo-toggle" aria-label="Start">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                <span class="pomo-btn-text">Start</span>
              </button>
            </div>
          `)}
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

  // Render Manual Log Entry Card
  function renderManualLogCard(activeSubjects, selectedSubjectId, todayStr) {
    return `
      <div class="tool-card manual-log-card">
        <div class="card-header-label manual-log-header-label" style="margin-bottom: 0;">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
          <span>MANUAL STUDY LOG</span>
        </div>

        <form id="manual-session-form">
          <div class="form-row-paired form-row-subject-date">
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

          <div class="form-row-paired form-row-hours-mins">
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
    `;
  }

  // Render Yearly Heatmap Card
  function renderHeatmapCard(heatmapYear, sessions, calendarData) {
    return `
      <div class="tool-card heatmap-container-card">
        <div class="heatmap-header">
          <div class="heatmap-header-label">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity:0.5;">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>HEATMAP</span>
          </div>

          <div class="heatmap-year-nav">
            <button class="year-nav-btn" id="btn-year-prev" title="Previous Year" aria-label="Previous Year">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <span class="year-nav-label" id="heatmap-year-display" style="font-size: 11px; font-weight: 700; font-family: var(--font-numeric);">${heatmapYear}</span>
            <button class="year-nav-btn" id="btn-year-next" title="Next Year" aria-label="Next Year" ${heatmapYear >= new Date().getFullYear() ? 'disabled' : ''}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>

          <div class="heatmap-legend" style="font-size: 9px;">
            <span>-</span>
            <div class="legend-cell" style="background-color: var(--heat-empty); border: 1px solid var(--heat-border);"></div>
            <div class="legend-cell" style="background-color: var(--heat-level-1);"></div>
            <div class="legend-cell" style="background-color: var(--heat-level-2);"></div>
            <div class="legend-cell" style="background-color: var(--heat-level-3);"></div>
            <div class="legend-cell" style="background-color: var(--heat-level-4);"></div>
            <span>+</span>
          </div>
        </div>

        <p class="heatmap-stats-line" style="font-size: 10px; margin: 0;">
          ${calendarData.totalSessions} ses &middot; ${calendarData.totalHours}h in ${heatmapYear}
        </p>

        <div class="heatmap-scroll-container">
          <div class="heatmap-body-row">
            <div class="day-labels-col">
              <div class="day-label-item"></div>
              <div class="day-label-item">M</div>
              <div class="day-label-item"></div>
              <div class="day-label-item">W</div>
              <div class="day-label-item"></div>
              <div class="day-label-item">F</div>
              <div class="day-label-item"></div>
            </div>
            <div class="months-area">
              ${calendarData.months.map(m => renderMonthBlock(m)).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Render Recent Study History Card
  function renderRecentHistoryCard(sessions, displaySessions, distColorMap) {
    return `
      <div class="sessions-history-card">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;">
          <div class="card-header-label history-header-label" style="margin-bottom: 0;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="12 8 12 12 14 14"></polyline>
              <path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5"></path>
            </svg>
            <span>RECENT STUDY HISTORY</span>
          </div>
          <span style="font-size: 11px; color: var(--text-muted); font-weight: 500;">${Math.min(25, displaySessions.length)} sessions</span>
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
                  <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 24px;">
                    No study sessions recorded yet. Use the manual study log above!
                  </td>
                </tr>
              ` : displaySessions.slice(0, 25).map(s => {
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
                    <td style="color: var(--text-secondary); font-size: 12px;">
                      ${s.date}
                    </td>
                    <td style="color: var(--text-muted); font-size: 12px; max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                      ${s.notes || '—'}
                    </td>
                    <td style="text-align: right;">
                      <button class="btn btn-ghost btn-sm btn-del-session" data-ids="${(s.ids || [s.id]).join(',')}" data-id="${s.id}" style="color: var(--danger); padding: 2px 6px; font-size: 11px;">
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
    `;
  }

  // Render Monthly Calendar Card (Prompt 56)
  function renderMonthlyCalendarCard(sessions) {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const monthName = calendarDate.toLocaleString('default', { month: 'long' });

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const activityDates = new Set(sessions.map(s => s.date));
    const todayISO = new Date().toISOString().split('T')[0];

    const dayCells = [];

    // Previous month trailing days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      dayCells.push(`<div class="monthly-cal-day-cell other-month">${d}</div>`);
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateISO = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = dateISO === todayISO;
      const hasActivity = activityDates.has(dateISO);

      dayCells.push(`
        <div class="monthly-cal-day-cell ${isToday ? 'today' : ''} ${hasActivity ? 'has-activity' : ''}" data-date="${dateISO}">
          ${d}
        </div>
      `);
    }

    // Next month leading days
    const totalCells = dayCells.length;
    const remaining = totalCells <= 35 ? 35 - totalCells : 42 - totalCells;
    for (let d = 1; d <= remaining; d++) {
      dayCells.push(`<div class="monthly-cal-day-cell other-month">${d}</div>`);
    }

    return `
      <div class="tool-card monthly-calendar-card">
        <div class="monthly-cal-header">
          <div class="card-header-label" style="margin-bottom: 0;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span class="monthly-cal-title">${monthName} ${year}</span>
          </div>
          <div class="monthly-cal-nav">
            <button type="button" class="monthly-cal-nav-btn" id="btn-month-prev" title="Previous Month" aria-label="Previous Month">&lsaquo;</button>
            <button type="button" class="monthly-cal-nav-btn" id="btn-month-next" title="Next Month" aria-label="Next Month">&rsaquo;</button>
          </div>
        </div>

        <div class="monthly-cal-grid">
          <span class="monthly-cal-day-label">S</span>
          <span class="monthly-cal-day-label">M</span>
          <span class="monthly-cal-day-label">T</span>
          <span class="monthly-cal-day-label">W</span>
          <span class="monthly-cal-day-label">T</span>
          <span class="monthly-cal-day-label">F</span>
          <span class="monthly-cal-day-label">S</span>
          ${dayCells.join('')}
        </div>
      </div>
    `;
  }

  // Format due date in readable "Aug 27" style (or "Aug 27, 2027" if different year) (Prompt 60)
  function formatReadableDueDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = months[monthIdx] || '';
    const currentYear = new Date().getFullYear();

    if (year !== currentYear) {
      return `${monthName} ${day}, ${year}`;
    }
    return `${monthName} ${day}`;
  }

  // Render a single Todo / Deadline item row (Prompt 60)
  function renderTodoRow(t, todayStr) {
    const sub = t.subject_id ? store.getSubjectById(t.subject_id) : null;
    const isOverdue = t.due_date && !t.completed && t.due_date < todayStr;
    const subColor = sub ? (sub.color || '#8A9A5B') : null;
    const formattedDate = formatReadableDueDate(t.due_date);

    return `
      <div class="todo-item-row ${t.completed ? 'completed' : ''}" data-id="${t.id}">
        <div class="todo-item-left">
          <input type="checkbox" class="todo-checkbox btn-toggle-todo" data-id="${t.id}" ${t.completed ? 'checked' : ''} aria-label="Toggle completed">
          <span class="todo-text">${t.text}</span>
        </div>
        <div class="todo-meta-tags">
          ${sub ? `
            <span class="dist-code-pill" style="background-color: ${subColor}1a; color: ${subColor}; border: 1px solid ${subColor}45; font-size: 9.5px; padding: 1px 5px;">
              ${sub.code || sub.name}
            </span>
          ` : ''}
          ${t.due_date ? `
            <span class="todo-due-tag ${isOverdue ? 'overdue' : ''}">
              ${formattedDate}
            </span>
          ` : ''}
          <button type="button" class="todo-del-btn btn-del-todo" data-id="${t.id}" title="Delete task" aria-label="Delete">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  // Render Todo / Deadlines Card (Prompt 56 - 60: Categorized Both view, readable dates, Google Tasks-style completed section)
  function renderTodoListCard(activeSubjects, todayStr) {
    const todos = store.getTodos();
    let filteredTodos = todos;
    if (todoFilterMode === 'todo') {
      filteredTodos = todos.filter(t => !t.due_date);
    } else if (todoFilterMode === 'deadline') {
      filteredTodos = todos.filter(t => Boolean(t.due_date));
    }

    const activeItems = filteredTodos.filter(t => !t.completed);
    const completedItems = filteredTodos.filter(t => t.completed);
    const pendingCount = activeItems.length;

    let itemsHtml = '';

    if (activeItems.length === 0 && completedItems.length === 0) {
      itemsHtml = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; min-height: 100px; text-align: center; color: var(--text-muted); font-size: 12px; gap: 4px;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="opacity: 0.4;">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 14 14"></polyline>
          </svg>
          <span>No ${todoFilterMode === 'todo' ? 'todos' : (todoFilterMode === 'deadline' ? 'deadlines' : 'tasks')} recorded</span>
          <span style="font-size: 11px; opacity: 0.7;">${todoFilterMode === 'deadline' ? 'Add a deadline with due date above' : 'Use the form above to add'}</span>
        </div>
      `;
    } else if (todoFilterMode === 'both') {
      const todoGroup = activeItems.filter(t => !t.due_date);
      const deadlinesGroup = activeItems.filter(t => Boolean(t.due_date));

      itemsHtml = `
        <div class="todo-category-section">
          <div class="todo-category-header">
            <span>Todo (${todoGroup.length})</span>
          </div>
          ${todoGroup.length === 0 ? `
            <div class="todo-category-empty">No active todos</div>
          ` : todoGroup.map(t => renderTodoRow(t, todayStr)).join('')}
        </div>

        <div class="todo-category-section">
          <div class="todo-category-header">
            <span>Deadlines (${deadlinesGroup.length})</span>
          </div>
          ${deadlinesGroup.length === 0 ? `
            <div class="todo-category-empty">No active deadlines</div>
          ` : deadlinesGroup.map(t => renderTodoRow(t, todayStr)).join('')}
        </div>
      `;
    } else {
      itemsHtml = activeItems.length === 0 ? `
        <div class="todo-category-empty" style="text-align: center; padding: 12px 0;">No active ${todoFilterMode === 'todo' ? 'todos' : 'deadlines'}</div>
      ` : activeItems.map(t => renderTodoRow(t, todayStr)).join('');
    }

    // Collapsible Completed Section (Prompt 60)
    let completedHtml = '';
    if (completedItems.length > 0) {
      completedHtml = `
        <div class="todo-completed-section">
          <div class="todo-completed-header" id="btn-toggle-completed-tasks">
            <div class="todo-completed-header-left">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="todo-completed-chevron ${isCompletedSectionOpen ? 'open' : ''}">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
              <span class="todo-completed-title">Completed (${completedItems.length})</span>
            </div>
            ${isCompletedSectionOpen ? `
              <button type="button" class="btn-clear-completed-todos" id="btn-clear-completed-todos" title="Clear all completed tasks">
                Clear completed
              </button>
            ` : ''}
          </div>

          ${isCompletedSectionOpen ? `
            <div class="todo-completed-list">
              ${completedItems.map(t => renderTodoRow(t, todayStr)).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }

    return `
      <div class="tool-card todo-deadlines-card">
        <div class="todo-deadlines-header">
          <div class="card-header-label" style="margin-bottom: 0;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 11 12 14 22 4"></polyline>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
            </svg>
            <span>TODO & DEADLINES</span>
          </div>

          <div class="todo-mode-switch" id="todo-mode-switch" title="Filter Tasks">
            <button type="button" class="todo-mode-btn ${todoFilterMode === 'todo' ? 'active' : ''}" data-mode="todo">Todo</button>
            <button type="button" class="todo-mode-btn ${todoFilterMode === 'deadline' ? 'active' : ''}" data-mode="deadline">Deadline</button>
            <button type="button" class="todo-mode-btn ${todoFilterMode === 'both' ? 'active' : ''}" data-mode="both">Both</button>
          </div>
        </div>

        <form id="todo-add-form" class="todo-add-form">
          <div class="todo-input-row">
            <input type="text" id="todo-input-text" class="form-input" placeholder="${todoFilterMode === 'deadline' ? 'Add a new deadline...' : (todoFilterMode === 'todo' ? 'Add a new todo...' : 'Add a task or deadline...')}" required style="flex: 1;">
            <button type="submit" class="btn btn-primary btn-sm" style="padding: 4px 10px; height: 30px;" aria-label="Add Task">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>
          <div class="todo-sub-row">
            <select id="todo-subject-select" class="form-select" style="flex: 1.2;">
              <option value="">General</option>
              ${activeSubjects.map(s => `<option value="${s.id}">${s.code || s.name}</option>`).join('')}
            </select>
            ${todoFilterMode === 'todo' ? '' : `
              <input type="date" id="todo-due-date" class="form-input" style="flex: 1;" ${todoFilterMode === 'deadline' ? 'required' : ''} title="${todoFilterMode === 'deadline' ? 'Due date (required for deadlines)' : 'Due date (optional)'}">
            `}
          </div>
        </form>

        <div class="todo-list-scroll-wrap">
          ${itemsHtml}
          ${completedHtml}
        </div>
      </div>
    `;
  }

  const settings = store.getSettings();
  pomoWorkMins = settings.pomodoro_work_mins || 25;
  pomoShortBreakMins = settings.pomodoro_break_mins || 5;
  pomoLongBreakMins = settings.pomodoro_long_break_mins || 15;
  pomoLongBreakInterval = settings.pomodoro_long_break_interval || 4;
  pomoAutoStartBreaks = settings.pomodoro_auto_start_breaks === true;
  pomoAutoStartPomodoros = settings.pomodoro_auto_start_pomodoros === true;

  container.innerHTML = `
    <div class="tracker-dashboard-layout">
      <!-- Left Zone (~68% width on desktop) -->
      <div class="tracker-left-zone">
        <!-- Row 1: Pomodoro Timer + Manual Study Log -->
        <div class="tracker-left-row-1">
          ${renderPomodoroCard(activeSubjects)}
          ${renderManualLogCard(activeSubjects, selectedSubjectId, todayStr)}
        </div>

        <!-- Row 2: Distribution Donut + Milestone Progress + Yearly Heatmap (Swapped order per Prompt 57) -->
        <div class="tracker-left-row-2">
          ${renderDistributionCard(sessions)}
          ${renderMilestoneCard(sessions)}
          ${renderHeatmapCard(heatmapYear, sessions, calendarData)}
        </div>

        <!-- Row 3: Recent Study History (fills remaining vertical space, scrolls internally) -->
        <div class="tracker-left-row-3">
          ${renderRecentHistoryCard(sessions, displaySessions, distColorMap)}
        </div>
      </div>

      <!-- Right Zone (~32% width on desktop) -->
      <div class="tracker-right-zone">
        <!-- Top: Monthly Calendar Card (same height as Row 1) -->
        ${renderMonthlyCalendarCard(sessions)}

        <!-- Bottom: Todo / Deadlines Card (scrolls internally) -->
        ${renderTodoListCard(activeSubjects, todayStr)}
      </div>
    </div>

    <!-- Pomodoro Settings Popover Modal -->
    <div class="pomo-settings-popover-overlay ${isPomoSettingsOpen ? '' : 'hidden'}" id="pomo-settings-popover" style="${isPomoSettingsOpen ? '' : 'display: none;'}">
      <div class="pomo-settings-popover-card">
        <div class="pomo-popover-header">
          <span class="pomo-popover-title">Timer Settings</span>
          <button type="button" class="modal-close" id="btn-close-pomo-settings" aria-label="Close Settings">&times;</button>
        </div>

        <form id="pomo-settings-form">
          <div class="pomo-settings-popover-body">
            <!-- Section 1: Time (minutes) -->
            <div class="pomo-settings-section">
              <label class="pomo-settings-section-label">Time (minutes)</label>
              <div class="pomo-time-inputs-row">
                <div class="pomo-time-input-col">
                  <span class="pomo-input-sublabel">Pomodoro</span>
                  <input type="number" id="pomo-setting-work" class="form-input" min="1" max="120" value="${pomoWorkMins}" required>
                </div>
                <div class="pomo-time-input-col">
                  <span class="pomo-input-sublabel">Short break</span>
                  <input type="number" id="pomo-setting-break" class="form-input" min="1" max="60" value="${pomoShortBreakMins}" required>
                </div>
                <div class="pomo-time-input-col">
                  <span class="pomo-input-sublabel">Long break</span>
                  <input type="number" id="pomo-setting-long-break" class="form-input" min="1" max="60" value="${pomoLongBreakMins}" required>
                </div>
              </div>
            </div>

            <!-- Section 2: Auto-Start Toggles -->
            <div class="pomo-settings-section">
              <div class="pomo-toggle-row">
                <div class="pomo-toggle-info">
                  <span class="pomo-toggle-label">Auto start breaks</span>
                  <span class="pomo-toggle-desc">Automatically start break phase when focus ends</span>
                </div>
                <label class="pomo-switch">
                  <input type="checkbox" id="pomo-setting-auto-breaks" ${pomoAutoStartBreaks ? 'checked' : ''}>
                  <span class="pomo-slider"></span>
                </label>
              </div>

              <div class="pomo-toggle-row">
                <div class="pomo-toggle-info">
                  <span class="pomo-toggle-label">Auto start pomodoros</span>
                  <span class="pomo-toggle-desc">Automatically start next focus phase when break ends</span>
                </div>
                <label class="pomo-switch">
                  <input type="checkbox" id="pomo-setting-auto-pomodoros" ${pomoAutoStartPomodoros ? 'checked' : ''}>
                  <span class="pomo-slider"></span>
                </label>
              </div>
            </div>

            <!-- Section 3: Long Break Interval -->
            <div class="pomo-settings-section">
              <div class="pomo-interval-row">
                <div class="pomo-interval-info">
                  <span class="pomo-settings-section-label" style="margin-bottom: 2px;">Long break interval</span>
                  <span class="pomo-toggle-desc">Number of focus sessions before inserting a long break</span>
                </div>
                <input type="number" id="pomo-setting-interval" class="form-input pomo-interval-input" min="1" max="24" value="${pomoLongBreakInterval}" required>
              </div>
            </div>
          </div>

          <div class="pomo-popover-footer">
            <button type="button" class="btn btn-secondary btn-sm" id="btn-cancel-pomo-settings">Cancel</button>
            <button type="submit" class="btn btn-primary btn-sm" id="btn-apply-pomo-settings">Apply</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Skip Phase Confirmation Modal -->
    <div class="modal-overlay" id="pomo-skip-modal">
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title" id="pomo-skip-title">Skip Phase?</h3>
          <button type="button" class="modal-close close-skip-modal-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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

    <!-- Reset Cycle Confirmation Modal (Prompt 54) -->
    <div class="modal-overlay" id="pomo-reset-cycle-modal">
      <div class="modal-card" style="max-width: 480px;">
        <div class="modal-header">
          <h3 class="modal-title">Reset Cycle Progress</h3>
          <button type="button" class="btn-icon close-reset-cycle-modal-btn" aria-label="Close modal">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <p style="margin: 0 0 10px 0; color: var(--text-primary); font-size: 13.5px; line-height: 1.5;">
            Choose how you would like to reset your Pomodoro session:
          </p>
          <p style="margin: 0; color: var(--text-muted); font-size: 12.5px; line-height: 1.4;">
            You can discard all session progress or log completed focus time to Study History before returning to idle state.
          </p>
        </div>
        <div class="modal-footer" style="gap: 8px; flex-wrap: wrap; justify-content: flex-end;">
          <button type="button" class="btn btn-ghost close-reset-cycle-modal-btn">Cancel</button>
          <button type="button" class="btn btn-secondary" id="btn-discard-cycle-progress" style="color: var(--danger); font-weight: 600;">
            Discard progress
          </button>
          <button type="button" class="btn btn-primary" id="btn-log-cycle-progress">
            Stop & Log
          </button>
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

  // Pomodoro / Stopwatch 2-Way Mode Toggle Buttons
  container.querySelectorAll('.pomo-mode-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const mode = e.currentTarget.dataset.mode;
      if (mode === pomoMode) return;
      pomoMode = mode;
      pomoIsRunning = false;
      pomoIsPausedAfterSkip = false;
      if (pomoInterval) {
        clearInterval(pomoInterval);
        pomoInterval = null;
      }
      if (pomoMode === 'stopwatch') {
        stopwatchElapsed = 0;
      } else {
        pomoPhase = 'focus';
        pomoTimeRemaining = pomoWorkMins * 60;
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
              <span>${pomoPhase === 'focus' ? 'Focus' : (pomoPhase === 'long-break' ? 'Long Break' : 'Break')} &middot; Cycle ${pomoCurrentCycle}</span>
            </div>
          `}
          <span style="font-size: 10px; font-weight: 700; color: var(--text-muted); letter-spacing: 0.05em;">AVEN</span>
        </div>

        <div class="pip-time-display" id="pip-time-display">${timeStr}</div>

        <div class="pip-controls">
          ${isStopwatch ? `
            <button type="button" class="btn ${pomoIsRunning ? 'btn-secondary' : 'btn-primary'}" id="btn-pip-toggle">
              ${pomoIsRunning ? 'Pause' : (stopwatchElapsed > 0 ? 'Resume' : 'Start')}
            </button>
            <button type="button" class="btn btn-secondary" id="btn-pip-stop" style="${stopwatchElapsed > 0 ? 'color: var(--danger);' : ''}">
              ${pomoIsRunning || stopwatchElapsed > 0 ? 'Stop & Log' : 'Reset'}
            </button>
          ` : `
            ${!pomoIsRunning ? `
              <button type="button" class="btn btn-primary" id="btn-pip-toggle" style="flex: 1;">
                Start
              </button>
            ` : `
              <button type="button" class="btn btn-secondary" id="btn-pip-stop-log" style="flex: 1.15; color: var(--danger); font-weight: 600;">
                Stop & Log
              </button>
              <button type="button" class="btn btn-secondary" id="btn-pip-skip" style="flex: 0.95;">
                Skip
              </button>
            `}
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
        pomoIsRunning = false;
        if (pomoInterval) {
          clearInterval(pomoInterval);
          pomoInterval = null;
        }

        if (pomoPhase === 'focus') {
          if (pomoCurrentCycle % pomoLongBreakInterval === 0) {
            pomoPhase = 'long-break';
            pomoTimeRemaining = pomoLongBreakMins * 60;
          } else {
            pomoPhase = 'break';
            pomoTimeRemaining = pomoShortBreakMins * 60;
          }
        } else {
          pomoCurrentCycle++;
          pomoPhase = 'focus';
          pomoTimeRemaining = pomoWorkMins * 60;
        }
        pomoIsPausedAfterSkip = true;
        renderPipContent();
        renderTrackerView(container);
      });
    }

    const pipStopLog = pipWindow.document.querySelector('#btn-pip-stop-log');
    if (pipStopLog) {
      pipStopLog.addEventListener('click', () => {
        pomoIsRunning = false;
        if (pomoInterval) {
          clearInterval(pomoInterval);
          pomoInterval = null;
        }
        pomoIsPausedAfterSkip = false;

        if (pomoPhase === 'focus') {
          const elapsedSecs = (pomoWorkMins * 60) - pomoTimeRemaining;
          if (elapsedSecs >= 30) {
            const mins = Math.max(1, Math.round(elapsedSecs / 60));
            const todayStr = new Date().toISOString().split('T')[0];
            store.saveSession({
              subject_id: pomoSubjectId || null,
              duration: mins,
              date: todayStr,
              notes: `Pomodoro Focus (Cycle ${pomoCurrentCycle} partial)`
            });
            const sub = pomoSubjectId ? store.getSubjectById(pomoSubjectId) : null;
            window.avenApp?.showToast(`Logged ${mins} min focus session${sub ? ` for ${sub.name}` : ''}!`, 'success');
          }
        } else {
          // Break or Long Break phase: log if elapsed break time is >= 5 minutes (300s)
          const totalBreakSecs = (pomoPhase === 'long-break' ? pomoLongBreakMins : pomoShortBreakMins) * 60;
          const elapsedBreakSecs = totalBreakSecs - pomoTimeRemaining;
          if (elapsedBreakSecs >= 300) {
            const breakMins = Math.max(5, Math.round(elapsedBreakSecs / 60));
            const todayStr = new Date().toISOString().split('T')[0];
            store.saveSession({
              subject_id: pomoSubjectId || null,
              duration: breakMins,
              date: todayStr,
              notes: pomoPhase === 'long-break' ? 'Pomodoro Long Break' : 'Pomodoro Break'
            });
            const sub = pomoSubjectId ? store.getSubjectById(pomoSubjectId) : null;
            window.avenApp?.showToast(`Logged ${breakMins} min break session${sub ? ` for ${sub.name}` : ''}!`, 'success');
          } else {
            window.avenApp?.showToast('Pomodoro session ended (break under 5m not logged).', 'info');
          }
        }

        pomoCurrentCycle = 1;
        pomoPhase = 'focus';
        pomoTimeRemaining = pomoWorkMins * 60;

        renderPipContent();
        renderTrackerView(container);
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

        if (pomoPhase === 'focus') {
          const todayStr = new Date().toISOString().split('T')[0];
          store.saveSession({
            subject_id: pomoSubjectId || null,
            duration: pomoWorkMins,
            date: todayStr,
            notes: `Pomodoro Focus (Cycle ${pomoCurrentCycle})`
          });
          const sub = pomoSubjectId ? store.getSubjectById(pomoSubjectId) : null;

          const isLongBreakDue = (pomoCurrentCycle % pomoLongBreakInterval === 0);
          if (isLongBreakDue) {
            pomoPhase = 'long-break';
            pomoTimeRemaining = pomoLongBreakMins * 60;
            notifyPhaseTransition('Long Break time!', `Focus cycle ${pomoCurrentCycle} completed — starting your ${pomoLongBreakMins}-minute long break.`);
            window.avenApp?.showToast(
              `Focus cycle ${pomoCurrentCycle} completed! ${pomoWorkMins} mins logged${sub ? ` for ${sub.name}` : ''}. Starting ${pomoLongBreakMins} min long break!`,
              'success'
            );
          } else {
            pomoPhase = 'break';
            pomoTimeRemaining = pomoShortBreakMins * 60;
            notifyPhaseTransition('Break time!', `Focus cycle ${pomoCurrentCycle} completed — take a ${pomoShortBreakMins}-minute break.`);
            window.avenApp?.showToast(
              `Focus cycle ${pomoCurrentCycle} completed! ${pomoWorkMins} mins logged${sub ? ` for ${sub.name}` : ''}. Starting ${pomoShortBreakMins} min break.`,
              'success'
            );
          }

          if (!pomoAutoStartBreaks) {
            pomoIsRunning = false;
            if (pomoInterval) {
              clearInterval(pomoInterval);
              pomoInterval = null;
            }
          }
        } else if (pomoPhase === 'break') {
          // Short break completed -> Advance to next focus cycle
          pomoCurrentCycle++;
          pomoPhase = 'focus';
          pomoTimeRemaining = pomoWorkMins * 60;
          notifyPhaseTransition('Back to focus', `Break finished. Ready for Focus cycle ${pomoCurrentCycle}.`);
          window.avenApp?.showToast(`Break finished! Ready for Focus cycle ${pomoCurrentCycle}.`, 'info');

          if (!pomoAutoStartPomodoros) {
            pomoIsRunning = false;
            if (pomoInterval) {
              clearInterval(pomoInterval);
              pomoInterval = null;
            }
          }
        } else if (pomoPhase === 'long-break') {
          // Long break completed -> Advance to next focus cycle
          pomoCurrentCycle++;
          pomoPhase = 'focus';
          pomoTimeRemaining = pomoWorkMins * 60;
          notifyPhaseTransition('Long break complete', `Long break finished. Ready for Focus cycle ${pomoCurrentCycle}.`);
          window.avenApp?.showToast(`Long break finished! Starting Focus cycle ${pomoCurrentCycle}.`, 'success');

          if (!pomoAutoStartPomodoros) {
            pomoIsRunning = false;
            if (pomoInterval) {
              clearInterval(pomoInterval);
              pomoInterval = null;
            }
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
        pomoIsPausedAfterSkip = false;
        pomoIsRunning = true;
        if (pomoInterval) clearInterval(pomoInterval);
        pomoInterval = setInterval(tickPomodoro, 1000);
      }
      renderTrackerView(container);
    });
  }

  // Pomodoro Settings Popover Handlers
  const pomoSettingsBtn = container.querySelector('#btn-pomo-settings');
  const pomoSettingsPopover = container.querySelector('#pomo-settings-popover');
  const closePomoSettingsBtn = container.querySelector('#btn-close-pomo-settings');
  const cancelPomoSettingsBtn = container.querySelector('#btn-cancel-pomo-settings');
  const pomoSettingsForm = container.querySelector('#pomo-settings-form');

  const openSettingsPopover = () => {
    if (pomoIsRunning) return;
    isPomoSettingsOpen = true;
    if (pomoSettingsPopover) {
      pomoSettingsPopover.classList.remove('hidden');
      pomoSettingsPopover.style.display = 'flex';
    }
  };

  const closeSettingsPopover = () => {
    isPomoSettingsOpen = false;
    if (pomoSettingsPopover) {
      pomoSettingsPopover.classList.add('hidden');
      pomoSettingsPopover.style.display = 'none';
    }
  };

  if (pomoSettingsBtn) {
    pomoSettingsBtn.addEventListener('click', openSettingsPopover);
  }
  if (closePomoSettingsBtn) {
    closePomoSettingsBtn.addEventListener('click', closeSettingsPopover);
  }
  if (cancelPomoSettingsBtn) {
    cancelPomoSettingsBtn.addEventListener('click', closeSettingsPopover);
  }
  if (pomoSettingsPopover) {
    pomoSettingsPopover.addEventListener('click', (e) => {
      if (e.target === pomoSettingsPopover) closeSettingsPopover();
    });
  }

  if (pomoSettingsForm) {
    pomoSettingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const workVal = Math.max(1, Math.min(120, parseInt(container.querySelector('#pomo-setting-work')?.value, 10) || 25));
      const breakVal = Math.max(1, Math.min(60, parseInt(container.querySelector('#pomo-setting-break')?.value, 10) || 5));
      const longBreakVal = Math.max(1, Math.min(60, parseInt(container.querySelector('#pomo-setting-long-break')?.value, 10) || 15));
      const intervalVal = Math.max(1, Math.min(24, parseInt(container.querySelector('#pomo-setting-interval')?.value, 10) || 4));
      const autoBreaks = container.querySelector('#pomo-setting-auto-breaks')?.checked === true;
      const autoPomodoros = container.querySelector('#pomo-setting-auto-pomodoros')?.checked === true;

      pomoWorkMins = workVal;
      pomoShortBreakMins = breakVal;
      pomoLongBreakMins = longBreakVal;
      pomoLongBreakInterval = intervalVal;
      pomoAutoStartBreaks = autoBreaks;
      pomoAutoStartPomodoros = autoPomodoros;

      if (!pomoIsRunning) {
        pomoTimeRemaining = (pomoPhase === 'focus' ? pomoWorkMins : (pomoPhase === 'long-break' ? pomoLongBreakMins : pomoShortBreakMins)) * 60;
      }

      store.saveSettings({
        pomodoro_work_mins: workVal,
        pomodoro_break_mins: breakVal,
        pomodoro_long_break_mins: longBreakVal,
        pomodoro_long_break_interval: intervalVal,
        pomodoro_auto_start_breaks: autoBreaks,
        pomodoro_auto_start_pomodoros: autoPomodoros
      });

      closeSettingsPopover();
      window.avenApp?.showToast('Timer settings saved', 'success');
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
      }
      renderTrackerView(container);
    });
  }

  // Helper for Pomodoro Stop & Log action across buttons & modal choices
  const executePomoStopAndLog = () => {
    pomoIsRunning = false;
    if (pomoInterval) {
      clearInterval(pomoInterval);
      pomoInterval = null;
    }
    pomoIsPausedAfterSkip = false;

    if (pomoPhase === 'focus') {
      const elapsedSecs = (pomoWorkMins * 60) - pomoTimeRemaining;
      if (elapsedSecs >= 30) {
        const mins = Math.max(1, Math.round(elapsedSecs / 60));
        const todayStr = new Date().toISOString().split('T')[0];
        store.saveSession({
          subject_id: pomoSubjectId || null,
          duration: mins,
          date: todayStr,
          notes: `Pomodoro Focus (Cycle ${pomoCurrentCycle} partial)`
        });
        const sub = pomoSubjectId ? store.getSubjectById(pomoSubjectId) : null;
        window.avenApp?.showToast(`Logged ${mins} min focus session${sub ? ` for ${sub.name}` : ''}!`, 'success');
      } else {
        window.avenApp?.showToast('Session ended (under 30s focus not logged)', 'info');
      }
    } else {
      // Break or Long Break: log if elapsed break time is >= 5 minutes (300s)
      const totalBreakSecs = (pomoPhase === 'long-break' ? pomoLongBreakMins : pomoShortBreakMins) * 60;
      const elapsedBreakSecs = totalBreakSecs - pomoTimeRemaining;
      if (elapsedBreakSecs >= 300) {
        const breakMins = Math.max(5, Math.round(elapsedBreakSecs / 60));
        const todayStr = new Date().toISOString().split('T')[0];
        store.saveSession({
          subject_id: pomoSubjectId || null,
          duration: breakMins,
          date: todayStr,
          notes: pomoPhase === 'long-break' ? 'Pomodoro Long Break' : 'Pomodoro Break'
        });
        const sub = pomoSubjectId ? store.getSubjectById(pomoSubjectId) : null;
        window.avenApp?.showToast(`Logged ${breakMins} min break session${sub ? ` for ${sub.name}` : ''}!`, 'success');
      } else {
        window.avenApp?.showToast('Pomodoro session ended (break under 5m not logged).', 'info');
      }
    }

    // Reset to idle state
    pomoCurrentCycle = 1;
    pomoPhase = 'focus';
    pomoTimeRemaining = pomoWorkMins * 60;

    if (pipWindow && !pipWindow.closed) {
      renderPipContent();
    }
    renderTrackerView(container);
  };

  // Pomodoro "Stop & Log" Button Handler
  const pomoStopLogBtn = container.querySelector('#btn-pomo-stop-log');
  if (pomoStopLogBtn) {
    pomoStopLogBtn.addEventListener('click', executePomoStopAndLog);
  }

  // Pomodoro "Reset Cycle" Modal Handlers (Prompts 54 & follow-up)
  const resetCycleModal = container.querySelector('#pomo-reset-cycle-modal');
  const pomoResetCycleBtns = container.querySelectorAll('.pomo-btn-reset-cycle, #btn-pomo-reset-cycle');
  const discardCycleBtn = container.querySelector('#btn-discard-cycle-progress');
  const logCycleBtn = container.querySelector('#btn-log-cycle-progress');

  pomoResetCycleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      resetCycleModal?.classList.add('open');
    });
  });

  container.querySelectorAll('.close-reset-cycle-modal-btn').forEach(b => {
    b.addEventListener('click', () => {
      resetCycleModal?.classList.remove('open');
    });
  });

  if (discardCycleBtn) {
    discardCycleBtn.addEventListener('click', () => {
      pomoIsRunning = false;
      if (pomoInterval) {
        clearInterval(pomoInterval);
        pomoInterval = null;
      }
      pomoIsPausedAfterSkip = false;
      pomoCurrentCycle = 1;
      pomoPhase = 'focus';
      pomoTimeRemaining = pomoWorkMins * 60;
      resetCycleModal?.classList.remove('open');
      window.avenApp?.showToast('Cycle progress discarded. Timer reset.', 'info');
      if (pipWindow && !pipWindow.closed) {
        renderPipContent();
      }
      renderTrackerView(container);
    });
  }

  if (logCycleBtn) {
    logCycleBtn.addEventListener('click', () => {
      resetCycleModal?.classList.remove('open');
      executePomoStopAndLog();
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
      if (pomoPhase === 'focus') {
        const isLongBreakDue = (pomoCurrentCycle % pomoLongBreakInterval === 0);
        if (skipTitle) skipTitle.textContent = isLongBreakDue ? 'Skip to Long Break?' : 'Skip to Break?';
        if (skipMessage) skipMessage.textContent = "Skip to break? Your current focus time won't be counted.";
        if (confirmSkipBtn) confirmSkipBtn.textContent = isLongBreakDue ? 'Skip to Long Break' : 'Skip to Break';
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

      if (pomoPhase === 'focus') {
        if (pomoCurrentCycle % pomoLongBreakInterval === 0) {
          pomoPhase = 'long-break';
          pomoTimeRemaining = pomoLongBreakMins * 60;
        } else {
          pomoPhase = 'break';
          pomoTimeRemaining = pomoShortBreakMins * 60;
        }
      } else {
        pomoCurrentCycle++;
        pomoPhase = 'focus';
        pomoTimeRemaining = pomoWorkMins * 60;
      }
      pomoIsPausedAfterSkip = true;
      skipModal?.classList.remove('open');
      if (pipWindow && !pipWindow.closed) {
        renderPipContent();
      }
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

  // Monthly Calendar Navigation Handlers (Prompt 56)
  const prevMonthBtn = container.querySelector('#btn-month-prev');
  const nextMonthBtn = container.querySelector('#btn-month-next');
  if (prevMonthBtn) {
    prevMonthBtn.addEventListener('click', () => {
      calendarDate.setMonth(calendarDate.getMonth() - 1);
      renderTrackerView(container);
    });
  }
  if (nextMonthBtn) {
    nextMonthBtn.addEventListener('click', () => {
      calendarDate.setMonth(calendarDate.getMonth() + 1);
      renderTrackerView(container);
    });
  }

  // Todo / Deadlines Mode Switch & Form Actions (Prompt 56 & 57)
  container.querySelectorAll('.todo-mode-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const mode = e.currentTarget.dataset.mode;
      if (mode === todoFilterMode) return;
      todoFilterMode = mode;
      renderTrackerView(container);
    });
  });

  const todoForm = container.querySelector('#todo-add-form');
  if (todoForm) {
    todoForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = container.querySelector('#todo-input-text')?.value?.trim();
      const subject_id = container.querySelector('#todo-subject-select')?.value || null;
      const dueDateInput = container.querySelector('#todo-due-date');
      const due_date = (dueDateInput && dueDateInput.value) ? dueDateInput.value : null;

      if (!text) return;
      if (todoFilterMode === 'deadline' && !due_date) {
        window.avenApp?.showToast('Please select a due date for the deadline', 'danger');
        return;
      }

      store.saveTodo({
        text,
        subject_id,
        due_date: todoFilterMode === 'todo' ? null : due_date
      });
      window.avenApp?.showToast(due_date ? 'Deadline added!' : 'Task added!', 'success');
      renderTrackerView(container);
    });
  }

  container.querySelectorAll('.btn-toggle-todo').forEach(cb => {
    cb.addEventListener('change', () => {
      store.toggleTodo(cb.dataset.id);
      renderTrackerView(container);
    });
  });

  container.querySelectorAll('.btn-del-todo').forEach(btn => {
    btn.addEventListener('click', () => {
      store.deleteTodo(btn.dataset.id);
      window.avenApp?.showToast('Task deleted', 'info');
      renderTrackerView(container);
    });
  });

  // Toggle Completed Section Handler (Prompt 60)
  const toggleCompletedBtn = container.querySelector('#btn-toggle-completed-tasks');
  if (toggleCompletedBtn) {
    toggleCompletedBtn.addEventListener('click', (e) => {
      if (e.target.closest('#btn-clear-completed-todos')) return;
      isCompletedSectionOpen = !isCompletedSectionOpen;
      renderTrackerView(container);
    });
  }

  // Clear completed tasks (Prompt 60)
  const clearCompletedBtn = container.querySelector('#btn-clear-completed-todos');
  if (clearCompletedBtn) {
    clearCompletedBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.confirm('Delete all completed tasks? This cannot be undone.')) {
        store.clearCompletedTodos();
        window.avenApp?.showToast('Completed tasks cleared', 'info');
        renderTrackerView(container);
      }
    });
  }
}
