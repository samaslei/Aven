import fs from 'fs';

let code = fs.readFileSync('js/tracker.js', 'utf-8');

// 1. Add Pomodoro State at the top
const stateHeader = `let selectedSubjectId = '';
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
  return \`\${String(m).padStart(2, '0')}:\${String(s).padStart(2, '0')}\`;
}`;

code = code.replace(
  `let selectedSubjectId = '';
let heatmapYear = new Date().getFullYear(); // Year-view navigation state
let distributionScope = 'all'; // 'all' | 'week'`,
  stateHeader
);

// 2. Add renderPomodoroCard helper
const pomoCardFunc = `  // Render Pomodoro Timer Card (Simple 25m Focus / 5m Break)
  function renderPomodoroCard(activeSubjects) {
    const totalSecs = (pomoPhase === 'focus' ? 25 : 5) * 60;
    const progressPct = Math.min(100, Math.max(0, ((totalSecs - pomoTimeRemaining) / totalSecs) * 100));

    return \`
      <div class="tool-card pomodoro-card">
        <div class="pomodoro-header">
          <div class="pomodoro-header-label">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>POMODORO TIMER</span>
          </div>

          <div class="pomo-phase-badge \${pomoPhase === 'focus' ? 'focus-mode' : 'break-mode'}">
            <span class="pomo-phase-dot"></span>
            <span>\${pomoPhase === 'focus' ? 'FOCUS' : 'BREAK'}</span>
          </div>
        </div>

        <!-- Subject Association Dropdown -->
        <div class="pomo-subject-row">
          <label class="form-label" for="pomo-subject-select" style="font-size: 11px; margin-bottom: 4px; color: var(--text-muted);">Subject</label>
          <select id="pomo-subject-select" class="form-select pomo-subject-select">
            <option value="">🌐 General Study</option>
            \${activeSubjects.map(s => \`
              <option value="\${s.id}" \${s.id === pomoSubjectId ? 'selected' : ''}>
                \${s.code ? \`[\${s.code}] \` : ''}\${s.name}
              </option>
            \`).join('')}
          </select>
        </div>

        <!-- Large Monospace Countdown -->
        <div class="pomo-display-block">
          <div class="pomo-time-display" id="pomo-time-display">\${formatPomoTime(pomoTimeRemaining)}</div>
          <div class="pomo-progress-track">
            <div class="pomo-progress-fill \${pomoPhase === 'break' ? 'break-fill' : ''}" id="pomo-progress-fill" style="width: \${progressPct}%;"></div>
          </div>
        </div>

        <!-- Timer Controls -->
        <div class="pomo-controls-row">
          <button type="button" class="btn \${pomoIsRunning ? 'btn-secondary pomo-btn-pause' : 'btn-primary pomo-btn-start'}" id="btn-pomo-toggle">
            \${pomoIsRunning ? \`
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1"></rect>
                <rect x="14" y="4" width="4" height="16" rx="1"></rect>
              </svg>
              <span>Pause</span>
            \` : \`
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
              <span>Start</span>
            \`}
          </button>

          <button type="button" class="btn btn-secondary pomo-btn-reset" id="btn-pomo-reset" title="Reset Timer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
              <path d="M3 3v5h5"></path>
            </svg>
            <span>Reset</span>
          </button>

          <button type="button" class="pomo-phase-toggle-btn" id="btn-pomo-switch-phase" title="Switch to \${pomoPhase === 'focus' ? 'Break (5m)' : 'Focus (25m)'}">
            \${pomoPhase === 'focus' ? '5m Break' : '25m Focus'}
          </button>
        </div>
      </div>
    \`;
  }
`;

code = code.replace(
  '  // Render Journey to Next Milestone Card',
  pomoCardFunc + '\n  // Render Journey to Next Milestone Card'
);

// 3. Update the tools grid HTML to 3-column
code = code.replace(
  '<!-- Tracker Action Row: Milestone Progress + Manual Study Log (Side-by-Side) -->\n      <div class="tracker-tools-grid">\n        <!-- Journey to Next Milestone Card -->',
  '<!-- Tracker Action Row: Pomodoro Timer + Milestone Progress + Manual Study Log (3-Column Grid) -->\n      <div class="tracker-tools-grid">\n        <!-- Simple Pomodoro Timer Card (Left) -->\n        ${renderPomodoroCard(activeSubjects)}\n\n        <!-- Journey to Next Milestone Card (Middle) -->'
);

// 4. Add Pomodoro Event Listeners & Timer Tick Engine
const pomoListeners = `
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
        progressFill.style.width = \`\${pct}%\`;
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
          \`Focus session completed! 25 mins logged\${sub ? \` for \${sub.name}\` : ''}. Starting 5 min break.\`,
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
`;

code = code.replace(
  '  // Manual Log Submission',
  pomoListeners + '\n  // Manual Log Submission'
);

fs.writeFileSync('js/tracker.js', code, 'utf-8');
console.log('Successfully updated js/tracker.js with Pomodoro Timer!');
