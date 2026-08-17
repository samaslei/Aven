/**
 * Aven - Study Tracker Controller
 * Features: LeetCode-style activity heatmap, Stopwatch & Pomodoro focus timer modes, Manual Hours+Minutes logger, Streaks.
 */

import { store, events } from './store.js';

// Timer State
let timerMode = null; // 'stopwatch' | 'pomodoro'
let selectedSubjectId = '';
let heatmapYear = new Date().getFullYear(); // Year-view navigation state

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

  container.innerHTML = `
    <div class="tracker-layout">
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

      <!-- Tracker Tools: Stopwatch/Pomodoro Timer + Manual Log Entry -->
      <div class="tracker-tools-grid">
        <!-- Focus Timer Card -->
        <div class="tool-card">
          <div class="tool-card-title">
            <div style="display: flex; align-items: center; gap: 8px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              Focus Timer
            </div>

            <!-- Stopwatch vs Pomodoro Mode Toggle -->
            <div class="segmented-control" id="timer-mode-switcher">
              <button class="seg-btn ${timerMode === 'stopwatch' ? 'active' : ''}" data-mode="stopwatch">Stopwatch</button>
              <button class="seg-btn ${timerMode === 'pomodoro' ? 'active' : ''}" data-mode="pomodoro">Pomodoro</button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="timer-subject-select">Target Subject *</label>
            <select id="timer-subject-select" class="form-select" ${(stopwatchRunning || pomoRunning) ? 'disabled' : ''}>
              ${activeSubjects.length === 0 ? '<option value="">No Active Subjects (Create one first)</option>' : ''}
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
              <div class="stopwatch-display-box">
                <div class="stopwatch-digits" id="stopwatch-timer-display">
                  ${formatTime(stopwatchSeconds)}
                </div>
                <span class="stopwatch-status-tag ${stopwatchRunning ? 'running' : ''}" id="stopwatch-badge">
                  ${stopwatchRunning ? '● Live Recording' : (stopwatchSeconds > 0 ? 'Paused' : 'Ready')}
                </span>
              </div>

              <div class="form-group">
                <label class="form-label" for="timer-session-notes">Session Notes (Optional)</label>
                <input type="text" id="timer-session-notes" class="form-input" placeholder="e.g. Practiced Dijkstra and AVL Rotations">
              </div>

              <div class="stopwatch-controls">
                ${!stopwatchRunning ? `
                  <button class="btn btn-primary" id="btn-start-stopwatch" ${activeSubjects.length === 0 ? 'disabled' : ''}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                    ${stopwatchSeconds > 0 ? 'Resume' : 'Start Focus'}
                  </button>
                ` : `
                  <button class="btn" id="btn-pause-stopwatch">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16"></rect>
                      <rect x="14" y="4" width="4" height="16"></rect>
                    </svg>
                    Pause
                  </button>
                `}

                <button class="btn" id="btn-reset-stopwatch" ${stopwatchSeconds === 0 ? 'disabled' : ''}>Reset</button>

                <button class="btn btn-primary" id="btn-save-stopwatch" ${stopwatchSeconds < 60 ? 'disabled title="Requires at least 1 minute to log"' : ''}>
                  Save Session
                </button>
              </div>
            ` : `
              <!-- POMODORO MODE UI -->
              <div class="stopwatch-display-box" style="${pomoPhase === 'break' ? 'border-color: var(--success);' : ''}">
                <div class="stopwatch-digits" id="pomo-timer-display" style="color: ${pomoPhase === 'break' ? 'var(--success)' : 'var(--text-primary)'};">
                  ${formatMinutesSeconds(pomoSecondsLeft)}
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; max-width: 280px;">
                  <span class="stopwatch-status-tag ${pomoRunning ? 'running' : ''}" style="${pomoPhase === 'break' ? 'background: var(--success-surface); color: var(--success);' : ''}">
                    ${pomoPhase === 'work' ? (pomoRunning ? '● Focus Interval' : 'Work Ready') : (pomoRunning ? '● Rest Interval' : 'Break Ready')}
                  </span>
                  
                  <!-- Visual Pomodoro Cycle Dots -->
                  <div class="pomo-cycle-dots">
                    ${[0, 1, 2, 3].map(idx => {
                      const cyclePos = pomoSessionsCompleted % 4;
                      const isCompleted = pomoSessionsCompleted > 0 && (idx < cyclePos || (cyclePos === 0 && pomoSessionsCompleted >= 4));
                      const isCurrent = idx === cyclePos && pomoRunning && pomoPhase === 'work';
                      return `<span class="pomo-dot ${isCompleted ? 'completed' : ''} ${isCurrent ? 'active' : ''}" title="Interval ${idx + 1}"></span>`;
                    }).join('')}
                  </div>

                  <span style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">${pomoSessionsCompleted} done</span>
                </div>
              </div>

              <!-- Interval duration config inputs -->
              <div class="form-row-paired">
                <div class="form-group">
                  <label class="form-label" for="pomo-work-input">Work Interval (Mins)</label>
                  <input type="number" id="pomo-work-input" class="form-input" min="1" max="120" value="${settings.pomodoro_work_mins || 25}" ${pomoRunning ? 'disabled' : ''}>
                </div>
                <div class="form-group">
                  <label class="form-label" for="pomo-break-input">Break Interval (Mins)</label>
                  <input type="number" id="pomo-break-input" class="form-input" min="1" max="60" value="${settings.pomodoro_break_mins || 5}" ${pomoRunning ? 'disabled' : ''}>
                </div>
              </div>

              <div class="stopwatch-controls">
                ${!pomoRunning ? `
                  <button class="btn btn-primary" id="btn-start-pomo" ${activeSubjects.length === 0 ? 'disabled' : ''}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                    ${pomoSecondsLeft < (settings.pomodoro_work_mins * 60) ? 'Resume' : `Start ${pomoPhase === 'work' ? 'Work' : 'Break'}`}
                  </button>
                ` : `
                  <button class="btn" id="btn-pause-pomo">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16"></rect>
                      <rect x="14" y="4" width="4" height="16"></rect>
                    </svg>
                    Pause
                  </button>
                `}

                <button class="btn" id="btn-skip-pomo">Skip to ${pomoPhase === 'work' ? 'Break' : 'Work'}</button>
                <button class="btn" id="btn-reset-pomo">Reset</button>
              </div>
            `}
          </div>
        </div>

        <!-- Manual Log Entry (Hours + Minutes Side-by-Side) -->
        <div class="tool-card">
          <div class="tool-card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Manual Study Log
          </div>

          <form id="manual-session-form">
            <div class="form-group" style="margin-bottom: 14px;">
              <label class="form-label" for="manual-subject-select">Subject *</label>
              <select id="manual-subject-select" class="form-select" required>
                ${activeSubjects.length === 0 ? '<option value="">No Active Subjects</option>' : ''}
                ${activeSubjects.map(s => `
                  <option value="${s.id}" ${s.id === selectedSubjectId ? 'selected' : ''}>
                    ${s.code ? `[${s.code}] ` : ''}${s.name}
                  </option>
                `).join('')}
              </select>
            </div>

            <!-- Paired Inputs: Hours & Minutes Side-by-Side -->
            <div class="form-row-paired" style="margin-bottom: 14px;">
              <div class="form-group">
                <label class="form-label" for="manual-hours">Hours</label>
                <input type="number" id="manual-hours" class="form-input" min="0" max="24" value="1" placeholder="0">
              </div>
              <div class="form-group">
                <label class="form-label" for="manual-minutes">Minutes</label>
                <input type="number" id="manual-minutes" class="form-input" min="0" max="59" value="30" placeholder="0">
              </div>
            </div>

            <div class="form-group" style="margin-bottom: 14px;">
              <label class="form-label" for="manual-date">Date *</label>
              <input type="date" id="manual-date" class="form-input" value="${todayStr}" max="${todayStr}" required>
            </div>

            <div class="form-group" style="margin-bottom: 18px;">
              <label class="form-label" for="manual-notes">Notes / Topics Covered</label>
              <input type="text" id="manual-notes" class="form-input" placeholder="e.g. Chapter 4 Practice Problems">
            </div>

            <button type="submit" class="btn btn-primary" style="width: 100%;" ${activeSubjects.length === 0 ? 'disabled' : ''}>
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
                    No study sessions recorded yet. Use the timer or manual log above!
                  </td>
                </tr>
              ` : sessions.slice(0, 15).map(s => {
                const sub = store.getSubjectById(s.subject_id);
                const hrs = Math.floor(s.duration / 60);
                const mins = s.duration % 60;
                const durText = hrs > 0 ? `${hrs}h ${mins > 0 ? `${mins}m` : ''}` : `${mins}m`;

                return `
                  <tr>
                    <td>
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="width: 8px; height: 8px; border-radius: 50%; background-color: ${sub ? sub.color : '#6366f1'};"></span>
                        <strong style="color: var(--text-primary); font-size: 13px;">${sub ? sub.name : 'Unknown'}</strong>
                        ${sub && sub.code ? `<span class="tag" style="font-size: 10px;">${sub.code}</span>` : ''}
                      </div>
                    </td>
                    <td style="font-family: var(--font-mono); font-weight: 600; color: var(--text-primary);">
                      ${durText}
                    </td>
                    <td style="color: var(--text-secondary); font-size: 12.5px;">
                      ${s.date}
                    </td>
                    <td style="color: var(--text-muted); font-size: 12.5px; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                      ${s.notes || '—'}
                    </td>
                    <td style="text-align: right;">
                      <button class="btn btn-ghost btn-sm btn-del-session" data-id="${s.id}" style="color: var(--danger); padding: 2px 6px;">
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
      if (!selectedSubjectId) {
        window.avenApp?.showToast('Please select a subject first', 'danger');
        return;
      }
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

      const notes = container.querySelector('#timer-session-notes')?.value || '';
      store.saveSession({
        subject_id: selectedSubjectId,
        duration: minutes,
        date: new Date().toISOString().split('T')[0],
        notes
      });

      stopwatchRunning = false;
      clearInterval(stopwatchInterval);
      stopwatchSeconds = 0;

      window.avenApp?.showToast(`Logged ${minutes} min session!`, 'success');
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
      if (!selectedSubjectId) {
        window.avenApp?.showToast('Please select a subject first', 'danger');
        return;
      }

      const workMins = Number(container.querySelector('#pomo-work-input')?.value) || 25;
      const breakMins = Number(container.querySelector('#pomo-break-input')?.value) || 5;

      // Set initial seconds if starting from reset
      if (pomoSecondsLeft === 25 * 60) {
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
            // Auto log study session to subject
            store.saveSession({
              subject_id: selectedSubjectId,
              duration: workMins,
              date: new Date().toISOString().split('T')[0],
              notes: `Pomodoro Focus Block #${pomoSessionsCompleted}`
            });

            window.avenApp?.showToast(`🎉 Focus block complete! Logged ${workMins}m. Time for a ${breakMins}m break.`, 'success');
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
      const workMins = Number(container.querySelector('#pomo-work-input')?.value) || 25;
      const breakMins = Number(container.querySelector('#pomo-break-input')?.value) || 5;

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
      const workMins = Number(container.querySelector('#pomo-work-input')?.value) || 25;
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
      const subject_id = container.querySelector('#manual-subject-select').value;
      const hours = Number(container.querySelector('#manual-hours').value) || 0;
      const mins = Number(container.querySelector('#manual-minutes').value) || 0;
      const date = container.querySelector('#manual-date').value;
      const notes = container.querySelector('#manual-notes').value;

      const totalMins = (hours * 60) + mins;
      if (totalMins <= 0) {
        window.avenApp?.showToast('Please enter a duration greater than 0', 'danger');
        return;
      }

      store.saveSession({
        subject_id,
        duration: totalMins,
        date,
        notes
      });

      window.avenApp?.showToast(`Logged ${totalMins} min session for ${date}`, 'success');
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
}
