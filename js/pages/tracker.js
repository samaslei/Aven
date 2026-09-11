/**
 * Aven - Study Tracker Controller
 * Features: LeetCode-style activity heatmap, Milestone progress journey, Pomodoro timer, Manual Hours+Minutes logger, Streaks.
 */

import { store, events } from '../core/store.js';
import { calculateMilestoneData, aggregateRecentStudyHistory, calculateWeeklyStudyHours, calculateSubjectProgress } from '../domain/tracker-calculator.js';
import { playAlarmSound, playTickSound, playDualToneChime } from '../utils/audio.js';
import { formatMinutesAndSeconds, getTodayISO } from '../utils/date-utils.js';
import { renderCustomSubjectDropdown, initCustomDropdown, renderSubjectSelectOptions } from '../ui/dropdown.js';

let selectedSubjectId = '';
let heatmapYear = new Date().getFullYear(); // Year-view navigation state

// Pomodoro Timer State (Persists across view switches)
let pomoPhase = 'focus'; // 'focus' | 'break' | 'long-break'
let pomoCurrentCycle = 1;
let pomoWorkMins = 25;
let pomoShortBreakMins = 5;
let pomoLongBreakMins = 15;
let pomoLongBreakInterval = 4;
let pomoAutoStartBreaks = false;
let pomoAutoStartPomodoros = false;
let pomoAlarmSound = 'bell'; // 'bell' | 'digital'
let pomoAlarmVolume = 50; // 0-100
let pomoAlarmMuted = false;
let pomoTickVolume = 30; // 0-100
let pomoTickMuted = true; // muted by default
let pomoIsInitialized = false;
let pomoTimeRemaining = 25 * 60; // seconds for countdown
let pomoIsRunning = false;
let pomoInterval = null;
let pomoSubjectId = '';
let isPomoSettingsOpen = false;
let pipWindow = null;
const isPipSupported = typeof window !== 'undefined' && 'documentPictureInPicture' in window;
const DEFAULT_APP_TITLE = 'Aven — Academic Operating System';

function updateDocumentTitle() {
  if (pomoIsRunning) {
    const timeStr = formatMinutesAndSeconds(pomoTimeRemaining);
    const phaseLabel = pomoPhase === 'focus' ? 'Time to focus!' : (pomoPhase === 'long-break' ? 'Time for a break!' : 'Break time!');
    document.title = `${timeStr} - ${phaseLabel}`;
  } else {
    document.title = DEFAULT_APP_TITLE;
  }
}

// Render Pomodoro Card Body Content (Pomofocus 3-Phase Model)
function renderPomodoroBodyHtml(activeSubjects = store.getSubjects(false)) {
  const totalSecs = (pomoPhase === 'focus' ? pomoWorkMins : (pomoPhase === 'long-break' ? pomoLongBreakMins : pomoShortBreakMins)) * 60;
  const progressPct = Math.min(100, Math.max(0, ((totalSecs - pomoTimeRemaining) / totalSecs) * 100));
  const elapsedSecs = totalSecs - pomoTimeRemaining;
  const hasElapsedToLog = (pomoPhase === 'focus' && elapsedSecs >= 30) || (pomoPhase !== 'focus' && elapsedSecs >= 300);

  // Calculate completed dots in current round
  const cycleInRound = ((pomoCurrentCycle - 1) % pomoLongBreakInterval);
  const completedDots = pomoPhase === 'focus' ? cycleInRound : cycleInRound + 1;
  const dotsHtml = Array.from({ length: pomoLongBreakInterval }, (_, i) => {
    const isFilled = i < completedDots;
    return `<span class="pomo-round-dot ${isFilled ? 'filled' : ''}" title="Session ${i + 1}"></span>`;
  }).join('');

  const statusText = pomoPhase === 'focus'
    ? 'Time to focus!'
    : (pomoPhase === 'long-break' ? 'Time for a longer break!' : 'Time for a break!');

  return `
    <!-- Phase Switcher: 3 Tabs (Focus, Short, Long) -->
    <div class="pomo-tabs" id="pomo-tabs" role="tablist" aria-label="Timer phase selector">
      <button type="button" class="pomo-tab-btn ${pomoPhase === 'focus' ? 'active' : ''}" data-phase="focus" role="tab" aria-selected="${pomoPhase === 'focus'}">Focus</button>
      <button type="button" class="pomo-tab-btn ${pomoPhase === 'break' ? 'active' : ''}" data-phase="break" role="tab" aria-selected="${pomoPhase === 'break'}">Short</button>
      <button type="button" class="pomo-tab-btn ${pomoPhase === 'long-break' ? 'active' : ''}" data-phase="long-break" role="tab" aria-selected="${pomoPhase === 'long-break'}">Long</button>
    </div>

    <!-- Sub-row: Subject Selector & Settings Gear Button -->
    <div class="pomo-meta-row">
      <div class="pomo-meta-controls" style="width: 100%; justify-content: space-between;">
        <div class="pomo-subject-wrap" style="max-width: none; flex: 1;">
          ${renderCustomSubjectDropdown({
            id: 'pomo-subject-select',
            selectedId: pomoSubjectId,
            subjects: activeSubjects,
            includeGeneral: true,
            generalLabel: 'General Study',
            searchPlaceholder: 'Search subject...',
            customClass: 'pomo-subject-dd'
          })}
        </div>

        <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
          <button type="button" class="pomo-manual-log-btn" id="btn-open-manual-log" title="Log study session manually" aria-label="Manual Study Log">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <polyline points="11 7 11 11 14 13"></polyline>
              <line x1="19" y1="16" x2="19" y2="22"></line>
              <line x1="16" y1="19" x2="22" y2="19"></line>
            </svg>
          </button>

          <button type="button" class="pomo-settings-gear-btn" id="btn-pomo-settings" title="${pomoIsRunning ? 'Timer settings (editable while idle)' : 'Timer settings'}" aria-label="Open Timer Settings" ${pomoIsRunning ? 'disabled' : ''}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
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

    <!-- Round Tracker: Session # and Dots + Status Text -->
    <div class="pomo-round-tracker">
      <div class="pomo-round-header">
        <span class="pomo-round-count">#${pomoCurrentCycle}</span>
        <div class="pomo-round-dots" title="Round cycle progress (${completedDots}/${pomoLongBreakInterval})">
          ${dotsHtml}
        </div>
      </div>
      <span class="pomo-phase-status-text">${statusText}</span>
    </div>

    <!-- Timer Controls Row -->
    <div class="pomo-controls-row">
      <button type="button" class="btn ${pomoIsRunning ? 'btn-secondary pomo-btn-pause' : 'btn-primary pomo-btn-start'}" id="btn-pomo-toggle" aria-label="${pomoIsRunning ? 'Pause' : (elapsedSecs > 0 ? 'Resume' : 'Start')}">
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
          <span class="pomo-btn-text">${elapsedSecs > 0 ? 'Resume' : 'Start'}</span>
        `}
      </button>

      <button type="button" class="btn btn-secondary pomo-btn-reset" id="btn-pomo-reset" title="Reset current phase" aria-label="Reset">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
          <path d="M3 3v5h5"></path>
        </svg>
        <span class="pomo-btn-text">Reset</span>
      </button>

      <button type="button" class="btn btn-secondary pomo-btn-skip" id="btn-pomo-skip" title="${pomoPhase === 'focus' ? (pomoCurrentCycle % pomoLongBreakInterval === 0 ? 'Skip to Long Break' : 'Skip to Break') : 'Skip to Focus'}" aria-label="Skip">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="5 4 15 12 5 20 5 4"></polygon>
          <line x1="19" y1="5" x2="19" y2="19"></line>
        </svg>
        <span class="pomo-btn-text">Skip</span>
      </button>

      ${hasElapsedToLog ? `
        <button type="button" class="btn btn-secondary pomo-btn-stop-log" id="btn-pomo-stop-log" title="Stop & Log Session" style="color: var(--danger); font-weight: 600;" aria-label="Stop & Log">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="6" y="6" width="12" height="12" rx="2"></rect>
          </svg>
          <span class="pomo-btn-text">Stop & Log</span>
        </button>
      ` : ''}
    </div>
  `;
}

export function renderTrackerView(container) {
  const activeSubjects = store.getSubjects(false);
  const streakStats = store.getStreakStats();
  const sessions = store.getSessions().sort((a, b) => new Date(b.date + ' ' + (b.created_at || '')) - new Date(a.date + ' ' + (a.created_at || '')));
  const displaySessions = aggregateRecentStudyHistory(sessions);
  const calendarData = store.getYearCalendarMatrix(heatmapYear);
  const weeklyData = calculateWeeklyStudyHours(sessions);
  const subjectProgress = calculateSubjectProgress(sessions, activeSubjects);


  // Set default subject if not set
  if (!selectedSubjectId && activeSubjects.length > 0) {
    selectedSubjectId = activeSubjects[0].id;
  }

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Build heatmap grid HTML: one block per month, month label inside
  function renderMonthBlock(month) {
    const weeksHtml = month.weeks.map(week => {
      const cellsHtml = week.map(day => {
        if (day === null) {
          return `<div class="cal-day-cell cal-day-empty"></div>`;
        }
        const futureClass = day.isFuture ? ' future' : '';
        const isToday = day.date === todayStr;
        const todayClass = isToday ? ' is-today' : '';
        return `<div class="cal-day-cell lvl-${day.level}${futureClass}${todayClass}"
          data-date="${day.date}"
          ${isToday ? 'data-is-today="true"' : ''}
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

    return `
      <div class="tool-card pomodoro-card bento-timer-card">
        <!-- Top Row: Title & Popout PiP Action -->
        <div class="pomodoro-header">
          <div class="pomodoro-header-label">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>POMODORO</span>
          </div>

          <div class="pomo-header-actions">
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

        <div id="pomo-card-body" class="pomo-card-body">
          ${renderPomodoroBodyHtml(activeSubjects)}
        </div>
      </div>
    `;
  }

  // Render Subject Progress Card (Sidebar Component matching reference mockup)
  function renderSubjectProgressCard(subjectProgress) {
    return `
      <div class="tool-card subject-progress-card">
        <div class="card-header-label" style="margin-bottom: 12px;">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
          <span>SUBJECT PROGRESS</span>
        </div>

        <div class="subject-progress-list">
          ${subjectProgress.length === 0 ? `
            <div style="font-size: 11.5px; color: var(--text-muted); text-align: center; padding: 12px 0;">
              No subjects or study sessions yet.
            </div>
          ` : subjectProgress.slice(0, 5).map(s => `
            <div class="subject-progress-row">
              <span class="subject-progress-code" title="${s.name}">${s.code}</span>
              <div class="subject-progress-track">
                <div class="subject-progress-fill" style="width: ${s.progressPct}%;"></div>
              </div>
              <span class="subject-progress-hours">${s.hoursFormatted}</span>
            </div>
          `).join('')}
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
            <span class="milestone-stat-label">Longest</span>
          </div>
        </div>
      </div>
    `;
  }

  // Render Manual Study Log Modal Dialog
  function renderManualLogModal(activeSubjects, selectedSubjectId, todayStr) {
    return `
      <div class="modal-overlay" id="manual-log-modal">
        <div class="modal-card modal-overflow-visible" style="max-width: 460px;">
          <div class="modal-header">
            <div style="display: flex; align-items: center; gap: 8px;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--accent);">
                <circle cx="11" cy="11" r="8"></circle>
                <polyline points="11 7 11 11 14 13"></polyline>
                <line x1="19" y1="16" x2="19" y2="22"></line>
                <line x1="16" y1="19" x2="22" y2="19"></line>
              </svg>
              <h3 class="modal-title">Manual Study Log</h3>
            </div>
            <button type="button" class="btn btn-ghost btn-icon close-manual-log-btn" aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div class="modal-body modal-overflow-visible" style="padding: 20px 24px;">
            <form id="manual-session-form" style="display: flex; flex-direction: column; gap: 16px;">
              <div class="form-row-paired form-row-subject-date" style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                <div class="form-group" style="display: flex; flex-direction: column; gap: 6px;">
                  <label class="form-label" for="manual-subject-select-trigger">Subject</label>
                  ${renderCustomSubjectDropdown({
                    id: 'manual-subject-select',
                    selectedId: selectedSubjectId,
                    subjects: activeSubjects,
                    includeGeneral: true,
                    generalLabel: 'General Study',
                    searchPlaceholder: 'Search subject...'
                  })}
                </div>

                <div class="form-group" style="display: flex; flex-direction: column; gap: 6px;">
                  <label class="form-label" for="manual-date">Date *</label>
                  <input type="date" id="manual-date" class="form-input" value="${todayStr}" max="${todayStr}" required>
                </div>
              </div>

              <div class="form-row-paired form-row-hours-mins" style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                <div class="form-group" style="display: flex; flex-direction: column; gap: 6px;">
                  <label class="form-label" for="manual-hours">Hours</label>
                  <input type="number" id="manual-hours" class="form-input" min="0" max="24" value="1" placeholder="0">
                </div>
                <div class="form-group" style="display: flex; flex-direction: column; gap: 6px;">
                  <label class="form-label" for="manual-minutes">Minutes</label>
                  <input type="number" id="manual-minutes" class="form-input" min="0" max="59" value="30" placeholder="0">
                </div>
              </div>

              <button type="submit" class="btn btn-primary" id="btn-submit-manual-log" style="width: 100%; margin-top: 4px;">
                Log Study Session
              </button>
            </form>
          </div>
        </div>
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
  function renderRecentHistoryCard(sessions, displaySessions) {
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
                const currentTheme = store.getTheme();
                const defaultFallbackColor = currentTheme === 'cool-light' ? '#4A6C8C' : (currentTheme === 'cool-dark' ? '#6E93B5' : (currentTheme === 'pure-black' ? '#ffffff' : (currentTheme === 'pure-white' ? '#0f172a' : '#8A9A5B')));
                const subColor = (sub && sub.color) || defaultFallbackColor;
                const subjectName = sub ? (sub.name || sub.code || 'General Study') : 'General Study';
                const hrs = Math.floor(s.duration / 60);
                const mins = s.duration % 60;
                const durText = hrs > 0 ? `${hrs}h ${mins > 0 ? `${mins}m` : ''}` : `${mins}m`;

                return `
                  <tr>
                    <td class="history-td-subject">
                      <span class="history-subject-name" title="${subjectName}">
                        ${subjectName}
                      </span>
                    </td>
                    <td class="history-td-duration" style="font-family: var(--font-numeric); font-variant-numeric: tabular-nums; font-weight: 600; color: var(--text-primary);">
                      ${durText}
                    </td>
                    <td class="history-td-date" style="color: var(--text-secondary); font-size: 12px;">
                      ${s.date}
                    </td>
                    <td class="history-td-notes" title="${s.notes || ''}" style="color: var(--text-muted); font-size: 12px;">
                      ${s.notes || '—'}
                    </td>
                    <td class="history-td-action" style="text-align: right;">
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

  // Render Weekly Study Hours Bar Chart Card (Main Column Component)
  function renderWeeklyStudyHoursCard(weeklyData) {
    return `
      <div class="tool-card weekly-hours-card">
        <div class="weekly-hours-header">
          <div class="card-header-label" style="margin-bottom: 0;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>WEEKLY STUDY HOURS</span>
          </div>
          <span class="weekly-hours-total-badge">${weeklyData.totalWeeklyHours}h total &middot; this week</span>
        </div>

        <div class="weekly-chart-area">
          <div class="weekly-chart-bars">
            ${weeklyData.days.map(d => `
              <div class="weekly-bar-col ${d.isMax ? 'is-peak' : ''} ${d.isToday ? 'is-today' : ''}" title="${d.dayName}: ${d.hoursFormatted}">
                <div class="weekly-bar-top-val">${d.hours > 0 ? d.hoursFormatted : ''}</div>
                <div class="weekly-bar-track">
                  <div class="weekly-bar-fill" style="height: ${d.heightPct}%;"></div>
                </div>
                <div class="weekly-bar-label">${d.dayName}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  const settings = store.getSettings();
  if (!pomoIsInitialized) {
    pomoWorkMins = settings.pomodoro_work_mins || 25;
    pomoShortBreakMins = settings.pomodoro_break_mins || 5;
    pomoLongBreakMins = settings.pomodoro_long_break_mins || 15;
    pomoLongBreakInterval = settings.pomodoro_long_break_interval || 4;
    pomoAutoStartBreaks = settings.pomodoro_auto_start_breaks === true;
    pomoAutoStartPomodoros = settings.pomodoro_auto_start_pomodoros === true;
    pomoAlarmSound = settings.pomodoro_alarm_sound || 'bell';
    pomoAlarmVolume = settings.pomodoro_alarm_volume !== undefined ? settings.pomodoro_alarm_volume : 50;
    pomoAlarmMuted = settings.pomodoro_alarm_muted === true;
    pomoTickVolume = settings.pomodoro_tick_volume !== undefined ? settings.pomodoro_tick_volume : 30;
    pomoTickMuted = settings.pomodoro_tick_muted !== undefined ? settings.pomodoro_tick_muted === true : true;
    pomoTimeRemaining = (pomoPhase === 'focus' ? pomoWorkMins : (pomoPhase === 'long-break' ? pomoLongBreakMins : pomoShortBreakMins)) * 60;
    pomoIsInitialized = true;
  }

  container.innerHTML = `
    <div class="tracker-dashboard-layout-v2">
      <!-- Left Sidebar Column (~400px) -->
      <div class="tracker-sidebar-col">
        ${renderPomodoroCard(activeSubjects)}
        ${renderSubjectProgressCard(subjectProgress)}
      </div>

      <!-- Right Main Column (1fr) -->
      <div class="tracker-main-col">
        ${renderWeeklyStudyHoursCard(weeklyData)}

        <!-- Middle Analytics Row: Milestone & Heatmap Side by Side -->
        <div class="tracker-analytics-row">
          ${renderMilestoneCard(sessions)}
          ${renderHeatmapCard(heatmapYear, sessions, calendarData)}
        </div>

        ${renderRecentHistoryCard(sessions, displaySessions)}
      </div>
    </div>

    ${renderManualLogModal(activeSubjects, selectedSubjectId, todayStr)}

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

            <!-- Section 4: Sound & Audio -->
            <div class="pomo-settings-section">
              <label class="pomo-settings-section-label">Sound & Audio</label>

              <!-- Alarm Sound Group -->
              <div class="pomo-sound-setting-group">
                <div class="pomo-sound-header-row">
                  <div class="pomo-toggle-info">
                    <span class="pomo-toggle-label">Alarm sound</span>
                    <span class="pomo-toggle-desc">Chime signal when countdown finishes</span>
                  </div>
                  <label class="pomo-switch" title="Toggle Alarm Sound">
                    <input type="checkbox" id="pomo-setting-alarm-enabled" ${!pomoAlarmMuted ? 'checked' : ''}>
                    <span class="pomo-slider"></span>
                  </label>
                </div>
                <div class="pomo-sound-controls-row">
                  <select id="pomo-setting-alarm-sound" class="form-input pomo-sound-select" aria-label="Alarm Sound Type">
                    <option value="bell" ${pomoAlarmSound === 'bell' ? 'selected' : ''}>Bell Chime</option>
                    <option value="digital" ${pomoAlarmSound === 'digital' ? 'selected' : ''}>Digital Pulse</option>
                  </select>
                  <div class="pomo-volume-slider-wrap">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity: 0.7; flex-shrink: 0;">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                    </svg>
                    <input type="range" id="pomo-setting-alarm-volume" class="pomo-range-slider" min="0" max="100" value="${pomoAlarmVolume}" aria-label="Alarm Volume">
                    <span class="pomo-volume-val" id="pomo-alarm-vol-display">${pomoAlarmVolume}%</span>
                  </div>
                  <button type="button" class="btn btn-secondary btn-sm pomo-sound-test-btn" id="btn-test-alarm-sound" title="Preview Alarm Sound">Test</button>
                </div>
              </div>

              <!-- Ticking Sound Group -->
              <div class="pomo-sound-setting-group" style="margin-top: 10px;">
                <div class="pomo-sound-header-row">
                  <div class="pomo-toggle-info">
                    <span class="pomo-toggle-label">Ticking sound</span>
                    <span class="pomo-toggle-desc">Subtle clock tick while timer is running</span>
                  </div>
                  <label class="pomo-switch" title="Toggle Ticking Sound">
                    <input type="checkbox" id="pomo-setting-tick-enabled" ${!pomoTickMuted ? 'checked' : ''}>
                    <span class="pomo-slider"></span>
                  </label>
                </div>
                <div class="pomo-sound-controls-row">
                  <div class="pomo-volume-slider-wrap" style="flex: 1;">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity: 0.7; flex-shrink: 0;">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <input type="range" id="pomo-setting-tick-volume" class="pomo-range-slider" min="0" max="100" value="${pomoTickVolume}" aria-label="Ticking Volume">
                    <span class="pomo-volume-val" id="pomo-tick-vol-display">${pomoTickVolume}%</span>
                  </div>
                  <button type="button" class="btn btn-secondary btn-sm pomo-sound-test-btn" id="btn-test-tick-sound" title="Preview Ticking Sound">Test</button>
                </div>
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

  // Default heatmap scroll position to center on today's date cell
  function scrollHeatmapToToday() {
    const heatmapScroll = container.querySelector('.heatmap-scroll-container');
    if (!heatmapScroll) return;
    const currentYear = new Date().getFullYear();
    if (heatmapYear !== currentYear) return;

    const todayCell = heatmapScroll.querySelector('.cal-day-cell.is-today, .cal-day-cell[data-is-today="true"]');
    if (todayCell) {
      requestAnimationFrame(() => {
        const containerRect = heatmapScroll.getBoundingClientRect();
        const cellRect = todayCell.getBoundingClientRect();
        if (containerRect.width > 0) {
          const currentScroll = heatmapScroll.scrollLeft;
          const targetScroll = currentScroll + (cellRect.left - containerRect.left) - (containerRect.width / 2) + (cellRect.width / 2);
          heatmapScroll.scrollLeft = Math.max(0, targetScroll);
        }
      });
    }
  }

  scrollHeatmapToToday();

  // --- BENTODORO TIMER EVENT LISTENERS ---
  const pomoSubjectSelect = container.querySelector('#pomo-subject-select');
  if (pomoSubjectSelect) {
    pomoSubjectSelect.addEventListener('change', (e) => {
      pomoSubjectId = e.target.value;
    });
  }


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
    const timeStr = formatMinutesAndSeconds(pomoTimeRemaining);
    const totalSecs = (pomoPhase === 'focus' ? pomoWorkMins : (pomoPhase === 'long-break' ? pomoLongBreakMins : pomoShortBreakMins)) * 60;
    const elapsedSecs = totalSecs - pomoTimeRemaining;
    const hasElapsedToLog = (pomoPhase === 'focus' && elapsedSecs >= 30) || (pomoPhase !== 'focus' && elapsedSecs >= 300);

    const phaseLabel = pomoPhase === 'focus' ? 'Pomodoro' : (pomoPhase === 'long-break' ? 'Long Break' : 'Short Break');
    const phaseClass = pomoPhase === 'focus' ? 'focus-mode' : (pomoPhase === 'long-break' ? 'long-break-mode' : 'break-mode');

    pipWindow.document.body.innerHTML = `
      <div class="pip-timer-container">
        <div class="pip-header">
          <div class="pomo-phase-badge ${phaseClass}">
            <span class="pomo-phase-dot"></span>
            <span>${phaseLabel} &middot; #${pomoCurrentCycle}</span>
          </div>
          <span style="font-size: 10px; font-weight: 700; color: var(--text-muted); letter-spacing: 0.05em;">AVEN</span>
        </div>

        <div class="pip-time-display" id="pip-time-display">${timeStr}</div>

        <div class="pip-controls">
          <button type="button" class="btn ${pomoIsRunning ? 'btn-secondary' : 'btn-primary'}" id="btn-pip-toggle" style="flex: 1.2;">
            ${pomoIsRunning ? 'Pause' : (elapsedSecs > 0 ? 'Resume' : 'Start')}
          </button>
          <button type="button" class="btn btn-secondary" id="btn-pip-reset" style="flex: 0.9;">
            Reset
          </button>
          <button type="button" class="btn btn-secondary" id="btn-pip-skip" style="flex: 0.9;">
            Skip
          </button>
          ${hasElapsedToLog ? `
            <button type="button" class="btn btn-secondary" id="btn-pip-stop-log" style="flex: 1.1; color: var(--danger); font-weight: 600;">
              Stop & Log
            </button>
          ` : ''}
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
        if (pipWindow && !pipWindow.closed) {
          renderPipContent();
        }
        updateDocumentTitle();
        updatePomodoroUI();
      });
    }

    const pipReset = pipWindow.document.querySelector('#btn-pip-reset');
    if (pipReset) {
      pipReset.addEventListener('click', () => {
        pomoIsRunning = false;
        if (pomoInterval) {
          clearInterval(pomoInterval);
          pomoInterval = null;
        }
        pomoTimeRemaining = (pomoPhase === 'focus' ? pomoWorkMins : (pomoPhase === 'long-break' ? pomoLongBreakMins : pomoShortBreakMins)) * 60;
        if (pipWindow && !pipWindow.closed) {
          renderPipContent();
        }
        updateDocumentTitle();
        updatePomodoroUI();
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
          const isLongBreak = (pomoCurrentCycle % pomoLongBreakInterval === 0);
          pomoPhase = isLongBreak ? 'long-break' : 'break';
          pomoTimeRemaining = (isLongBreak ? pomoLongBreakMins : pomoShortBreakMins) * 60;
        } else {
          pomoCurrentCycle++;
          pomoPhase = 'focus';
          pomoTimeRemaining = pomoWorkMins * 60;
        }
        if (pipWindow && !pipWindow.closed) {
          renderPipContent();
        }
        updateDocumentTitle();
        updatePomodoroUI();
      });
    }

    const pipStopLog = pipWindow.document.querySelector('#btn-pip-stop-log');
    if (pipStopLog) {
      pipStopLog.addEventListener('click', () => {
        executePomoStopAndLog();
        updateDocumentTitle();
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
          silent: true // Prevents OS chime from conflicting with in-app synthesized alarm
        });
      } catch (err) {
        // Fallback for environments where Notification constructor errors
      }
    }
  }

  function tickPomodoro() {
    if (pomoTimeRemaining > 0) {
      pomoTimeRemaining--;
      updateDocumentTitle();

      // Subtle ticking sound during active countdown (stops before 00:00)
      if (pomoTimeRemaining > 0 && !pomoTickMuted && pomoTickVolume > 0) {
        playTickSound(pomoTickVolume / 100);
      }

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
      // Phase completed at 00:00!
      // Ticking was stopped cleanly on the last second, so alarm plays without overlapping audio
      if (!pomoAlarmMuted && pomoAlarmVolume > 0) {
        playAlarmSound(pomoAlarmVolume / 100, pomoAlarmSound);
      }

      if (pomoPhase === 'focus') {
        const todayStr = new Date().toISOString().split('T')[0];
        store.saveSession({
          subject_id: pomoSubjectId || null,
          duration: pomoWorkMins,
          date: todayStr,
          notes: `Pomodoro Focus (#${pomoCurrentCycle})`
        });
        const sub = pomoSubjectId ? store.getSubjectById(pomoSubjectId) : null;

        const isLongBreakDue = (pomoCurrentCycle % pomoLongBreakInterval === 0);
        if (isLongBreakDue) {
          pomoPhase = 'long-break';
          pomoTimeRemaining = pomoLongBreakMins * 60;
          notifyPhaseTransition('Long Break time!', `Focus #${pomoCurrentCycle} completed — starting your ${pomoLongBreakMins}-minute long break.`);
          window.avenApp?.showToast(
            `Focus #${pomoCurrentCycle} completed! ${pomoWorkMins} mins logged${sub ? ` for ${sub.name}` : ''}. Starting ${pomoLongBreakMins} min long break!`,
            'success'
          );
        } else {
          pomoPhase = 'break';
          pomoTimeRemaining = pomoShortBreakMins * 60;
          notifyPhaseTransition('Break time!', `Focus #${pomoCurrentCycle} completed — take a ${pomoShortBreakMins}-minute break.`);
          window.avenApp?.showToast(
            `Focus #${pomoCurrentCycle} completed! ${pomoWorkMins} mins logged${sub ? ` for ${sub.name}` : ''}. Starting ${pomoShortBreakMins} min break.`,
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
        notifyPhaseTransition('Back to focus', `Break finished. Ready for Focus #${pomoCurrentCycle}.`);
        window.avenApp?.showToast(`Break finished! Ready for Focus #${pomoCurrentCycle}.`, 'info');

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
        notifyPhaseTransition('Long break complete', `Long break finished. Ready for Focus #${pomoCurrentCycle}.`);
        window.avenApp?.showToast(`Long break finished! Starting Focus #${pomoCurrentCycle}.`, 'success');

        if (!pomoAutoStartPomodoros) {
          pomoIsRunning = false;
          if (pomoInterval) {
            clearInterval(pomoInterval);
            pomoInterval = null;
          }
        }
      }
      updateDocumentTitle();
      if (pipWindow && !pipWindow.closed) {
        renderPipContent();
      }
      renderTrackerView(container);
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

  function updatePomodoroUI() {
    if (pipWindow && !pipWindow.closed) {
      renderPipContent();
      return;
    }
    const pomoBody = container.querySelector('#pomo-card-body');
    if (pomoBody) {
      pomoBody.innerHTML = renderPomodoroBodyHtml(store.getSubjects(false));
      bindPomoBodyEvents();
    }
  }

  function bindPomoBodyEvents() {
    // Phase tabs switching (updates timer only, does not refresh heatmap or entire page)
    const tabBtns = container.querySelectorAll('.pomo-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetPhase = e.currentTarget.dataset.phase;
        if (targetPhase === pomoPhase) return;

        pomoIsRunning = false;
        if (pomoInterval) {
          clearInterval(pomoInterval);
          pomoInterval = null;
        }

        pomoPhase = targetPhase;
        if (pomoPhase === 'focus') {
          pomoTimeRemaining = pomoWorkMins * 60;
        } else if (pomoPhase === 'break') {
          pomoTimeRemaining = pomoShortBreakMins * 60;
        } else if (pomoPhase === 'long-break') {
          pomoTimeRemaining = pomoLongBreakMins * 60;
        }

        if (pipWindow && !pipWindow.closed) {
          renderPipContent();
        }
        updateDocumentTitle();
        updatePomodoroUI();
      });
    });

    // Start / Pause toggle
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
        if (pipWindow && !pipWindow.closed) {
          renderPipContent();
        }
        updateDocumentTitle();
        updatePomodoroUI();
      });
    }

    // Reset button (resets current tab countdown back to full duration without modal)
    const pomoResetBtn = container.querySelector('#btn-pomo-reset');
    if (pomoResetBtn) {
      pomoResetBtn.addEventListener('click', () => {
        pomoIsRunning = false;
        if (pomoInterval) {
          clearInterval(pomoInterval);
          pomoInterval = null;
        }
        pomoTimeRemaining = (pomoPhase === 'focus' ? pomoWorkMins : (pomoPhase === 'long-break' ? pomoLongBreakMins : pomoShortBreakMins)) * 60;
        window.avenApp?.showToast('Timer reset', 'info');
        if (pipWindow && !pipWindow.closed) {
          renderPipContent();
        }
        updateDocumentTitle();
        updatePomodoroUI();
      });
    }

    // Skip button (advances directly to next phase without modal)
    const pomoSkipBtn = container.querySelector('#btn-pomo-skip');
    if (pomoSkipBtn) {
      pomoSkipBtn.addEventListener('click', () => {
        pomoIsRunning = false;
        if (pomoInterval) {
          clearInterval(pomoInterval);
          pomoInterval = null;
        }
        if (pomoPhase === 'focus') {
          const isLongBreak = (pomoCurrentCycle % pomoLongBreakInterval === 0);
          pomoPhase = isLongBreak ? 'long-break' : 'break';
          pomoTimeRemaining = (isLongBreak ? pomoLongBreakMins : pomoShortBreakMins) * 60;
        } else {
          pomoCurrentCycle++;
          pomoPhase = 'focus';
          pomoTimeRemaining = pomoWorkMins * 60;
        }
        window.avenApp?.showToast(`Advanced to ${pomoPhase === 'focus' ? 'Pomodoro' : (pomoPhase === 'long-break' ? 'Long Break' : 'Short Break')}`, 'info');
        if (pipWindow && !pipWindow.closed) {
          renderPipContent();
        }
        updateDocumentTitle();
        updatePomodoroUI();
      });
    }

    // Stop & Log button
    const pomoStopLogBtn = container.querySelector('#btn-pomo-stop-log');
    if (pomoStopLogBtn) {
      pomoStopLogBtn.addEventListener('click', executePomoStopAndLog);
    }

    // Settings button
    const pomoSettingsBtn = container.querySelector('#btn-pomo-settings');
    if (pomoSettingsBtn) {
      pomoSettingsBtn.addEventListener('click', openSettingsPopover);
    }

    // Manual Log Modal open button
    const manualLogBtn = container.querySelector('#btn-open-manual-log');
    if (manualLogBtn) {
      manualLogBtn.addEventListener('click', () => {
        const manualModal = container.querySelector('#manual-log-modal');
        if (manualModal) {
          manualModal.classList.add('open');
          const body = manualModal.querySelector('.modal-body');
          if (body) body.scrollTop = 0;
        }
      });
    }

    // Subject dropdown
    const pomoDd = container.querySelector('#pomo-subject-select-wrap');
    if (pomoDd) {
      initCustomDropdown(pomoDd, (val) => {
        pomoSubjectId = val;
      });
    }
  }

  // Pomodoro Settings Popover Handlers
  const pomoSettingsPopover = container.querySelector('#pomo-settings-popover');
  const closePomoSettingsBtn = container.querySelector('#btn-close-pomo-settings');
  const cancelPomoSettingsBtn = container.querySelector('#btn-cancel-pomo-settings');
  const pomoSettingsForm = container.querySelector('#pomo-settings-form');

  // Real-time volume displays and test audio triggers
  const alarmVolInput = container.querySelector('#pomo-setting-alarm-volume');
  const alarmVolDisp = container.querySelector('#pomo-alarm-vol-display');
  if (alarmVolInput && alarmVolDisp) {
    alarmVolInput.addEventListener('input', () => {
      alarmVolDisp.textContent = `${alarmVolInput.value}%`;
    });
  }

  const tickVolInput = container.querySelector('#pomo-setting-tick-volume');
  const tickVolDisp = container.querySelector('#pomo-tick-vol-display');
  if (tickVolInput && tickVolDisp) {
    tickVolInput.addEventListener('input', () => {
      tickVolDisp.textContent = `${tickVolInput.value}%`;
    });
  }

  const testAlarmBtn = container.querySelector('#btn-test-alarm-sound');
  if (testAlarmBtn) {
    testAlarmBtn.addEventListener('click', () => {
      const vol = parseInt(alarmVolInput?.value, 10) || 50;
      const sndType = container.querySelector('#pomo-setting-alarm-sound')?.value || 'bell';
      playAlarmSound(vol / 100, sndType);
    });
  }

  const testTickBtn = container.querySelector('#btn-test-tick-sound');
  if (testTickBtn) {
    testTickBtn.addEventListener('click', () => {
      const vol = parseInt(tickVolInput?.value, 10) || 30;
      playTickSound(vol / 100);
    });
  }

  function openSettingsPopover() {
    if (pomoIsRunning) return;
    isPomoSettingsOpen = true;
    if (pomoSettingsPopover) {
      pomoSettingsPopover.classList.remove('hidden');
      pomoSettingsPopover.style.display = 'flex';
    }
  }

  function closeSettingsPopover() {
    isPomoSettingsOpen = false;
    if (pomoSettingsPopover) {
      pomoSettingsPopover.classList.add('hidden');
      pomoSettingsPopover.style.display = 'none';
    }
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

      const alarmSoundVal = container.querySelector('#pomo-setting-alarm-sound')?.value || 'bell';
      const alarmVolVal = parseInt(container.querySelector('#pomo-setting-alarm-volume')?.value, 10) || 50;
      const alarmEnabled = container.querySelector('#pomo-setting-alarm-enabled')?.checked === true;
      const tickVolVal = parseInt(container.querySelector('#pomo-setting-tick-volume')?.value, 10) || 30;
      const tickEnabled = container.querySelector('#pomo-setting-tick-enabled')?.checked === true;

      pomoWorkMins = workVal;
      pomoShortBreakMins = breakVal;
      pomoLongBreakMins = longBreakVal;
      pomoLongBreakInterval = intervalVal;
      pomoAutoStartBreaks = autoBreaks;
      pomoAutoStartPomodoros = autoPomodoros;

      pomoAlarmSound = alarmSoundVal;
      pomoAlarmVolume = alarmVolVal;
      pomoAlarmMuted = !alarmEnabled;
      pomoTickVolume = tickVolVal;
      pomoTickMuted = !tickEnabled;

      if (!pomoIsRunning) {
        pomoTimeRemaining = (pomoPhase === 'focus' ? pomoWorkMins : (pomoPhase === 'long-break' ? pomoLongBreakMins : pomoShortBreakMins)) * 60;
      }

      store.saveSettings({
        pomodoro_work_mins: workVal,
        pomodoro_break_mins: breakVal,
        pomodoro_long_break_mins: longBreakVal,
        pomodoro_long_break_interval: intervalVal,
        pomodoro_auto_start_breaks: autoBreaks,
        pomodoro_auto_start_pomodoros: autoPomodoros,
        pomodoro_alarm_sound: alarmSoundVal,
        pomodoro_alarm_volume: alarmVolVal,
        pomodoro_alarm_muted: !alarmEnabled,
        pomodoro_tick_volume: tickVolVal,
        pomodoro_tick_muted: !tickEnabled
      });

      closeSettingsPopover();
      window.avenApp?.showToast('Timer settings saved', 'success');
      renderTrackerView(container);
    });
  }

  // Helper for Pomodoro Stop & Log action
  function executePomoStopAndLog() {
    pomoIsRunning = false;
    if (pomoInterval) {
      clearInterval(pomoInterval);
      pomoInterval = null;
    }

    const currentPhaseTotalSecs = (pomoPhase === 'focus' ? pomoWorkMins : (pomoPhase === 'long-break' ? pomoLongBreakMins : pomoShortBreakMins)) * 60;
    const elapsedSecs = currentPhaseTotalSecs - pomoTimeRemaining;

    if (pomoPhase === 'focus') {
      if (elapsedSecs >= 30) {
        const mins = Math.max(1, Math.round(elapsedSecs / 60));
        const todayStr = new Date().toISOString().split('T')[0];
        store.saveSession({
          subject_id: pomoSubjectId || null,
          duration: mins,
          date: todayStr,
          notes: `Pomodoro Focus (#${pomoCurrentCycle} partial)`
        });
        const sub = pomoSubjectId ? store.getSubjectById(pomoSubjectId) : null;
        window.avenApp?.showToast(`Logged ${mins} min focus session${sub ? ` for ${sub.name}` : ''}!`, 'success');
      } else {
        window.avenApp?.showToast('Session ended (under 30s focus not logged)', 'info');
      }
    } else {
      if (elapsedSecs >= 300) {
        const breakMins = Math.max(5, Math.round(elapsedSecs / 60));
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
        window.avenApp?.showToast('Break ended (under 5m not logged).', 'info');
      }
    }

    // Reset current phase to full duration
    pomoTimeRemaining = (pomoPhase === 'focus' ? pomoWorkMins : (pomoPhase === 'long-break' ? pomoLongBreakMins : pomoShortBreakMins)) * 60;

    if (pipWindow && !pipWindow.closed) {
      renderPipContent();
    }
    updateDocumentTitle();
    renderTrackerView(container);
  };

  bindPomoBodyEvents();

  // Manual Log Modal Dialog Handlers
  const manualLogModal = container.querySelector('#manual-log-modal');
  container.querySelectorAll('.close-manual-log-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      manualLogModal?.classList.remove('open');
      const body = manualLogModal?.querySelector('.modal-body');
      if (body) body.scrollTop = 0;
    });
  });

  if (manualLogModal) {
    manualLogModal.addEventListener('click', (e) => {
      if (e.target === manualLogModal) {
        manualLogModal.classList.remove('open');
        const body = manualLogModal.querySelector('.modal-body');
        if (body) body.scrollTop = 0;
      }
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

      manualLogModal?.classList.remove('open');
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


  // Initialize Custom Dropdowns (Prompt 61)
  const manualDd = container.querySelector('#manual-subject-select-wrap');
  if (manualDd) {
    initCustomDropdown(manualDd, (val) => {
      selectedSubjectId = val;
    });
  }
}
