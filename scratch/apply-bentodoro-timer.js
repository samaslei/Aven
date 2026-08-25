import fs from 'fs';

// 1. UPDATE js/tracker.js
let trackerJs = fs.readFileSync('js/tracker.js', 'utf-8');

// Update state variable at top
const oldPomoState = `// Pomodoro Timer State (Persists across view switches)
let pomoPhase = 'focus'; // 'focus' (25m) | 'break' (5m)
let pomoTimeRemaining = 25 * 60; // seconds
let pomoIsRunning = false;
let pomoInterval = null;
let pomoSubjectId = '';`;

const newPomoState = `// Pomodoro Timer State (Persists across view switches)
let pomoMode = localStorage.getItem('aven_pomo_mode') || 'classic'; // 'classic' (work->break) | 'reverse' (break->work)
let pomoPhase = pomoMode === 'reverse' ? 'break' : 'focus'; // 'focus' (25m) | 'break' (5m)
let pomoTimeRemaining = (pomoPhase === 'focus' ? 25 : 5) * 60; // seconds
let pomoIsRunning = false;
let pomoInterval = null;
let pomoSubjectId = '';`;

trackerJs = trackerJs.replace(oldPomoState, newPomoState);

// Replace renderPomodoroCard
const oldRenderPomodoroCard = `  // Render Pomodoro Timer Card (Simple 25m Focus / 5m Break)
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
            \${renderSubjectSelectOptions(activeSubjects, pomoSubjectId, true)}
          </select>
        </div>

        <!-- Large Monospace Countdown -->
        <div class="pomo-display-block">
          <div class="pomo-time-display" id="pomo-time-display">\${formatMinutesAndSeconds(pomoTimeRemaining)}</div>
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
  }`;

const newRenderPomodoroCard = `  // Render Bentodoro-Style Bento Timer Tile
  function renderPomodoroCard(activeSubjects) {
    const totalSecs = (pomoPhase === 'focus' ? 25 : 5) * 60;
    const progressPct = Math.min(100, Math.max(0, ((totalSecs - pomoTimeRemaining) / totalSecs) * 100));

    return \`
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
            <button type="button" class="pomo-mode-btn \${pomoMode === 'classic' ? 'active' : ''}" data-mode="classic">Classic</button>
            <button type="button" class="pomo-mode-btn \${pomoMode === 'reverse' ? 'active' : ''}" data-mode="reverse">Reverse</button>
          </div>
        </div>

        <!-- Sub-Header: Phase Indicator & Subject Selector -->
        <div class="pomo-meta-row">
          <div class="pomo-phase-badge \${pomoPhase === 'focus' ? 'focus-mode' : 'break-mode'}">
            <span class="pomo-phase-dot"></span>
            <span>\${pomoPhase === 'focus' ? '25M FOCUS' : '5M BREAK'}</span>
          </div>
          <div class="pomo-subject-wrap">
            <select id="pomo-subject-select" class="form-select pomo-subject-select" title="Link session to subject">
              \${renderSubjectSelectOptions(activeSubjects, pomoSubjectId, true)}
            </select>
          </div>
        </div>

        <!-- Large Bento Digits Display -->
        <div class="pomo-display-block">
          <div class="pomo-time-display" id="pomo-time-display">\${formatMinutesAndSeconds(pomoTimeRemaining)}</div>
          <div class="pomo-progress-track">
            <div class="pomo-progress-fill \${pomoPhase === 'break' ? 'break-fill' : ''}" id="pomo-progress-fill" style="width: \${progressPct}%;"></div>
          </div>
        </div>

        <!-- Timer Controls Row -->
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

          <button type="button" class="pomo-phase-toggle-btn" id="btn-pomo-switch-phase" title="Skip to next phase">
            \${pomoPhase === 'focus' ? 'Skip to Break' : 'Skip to Focus'}
          </button>
        </div>
      </div>
    \`;
  }`;

trackerJs = trackerJs.replace(oldRenderPomodoroCard, newRenderPomodoroCard);

// Replace Pomodoro event listeners & tick logic
const oldPomoListeners = `  // --- POMODORO TIMER EVENT LISTENERS ---
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
        timeDisplay.textContent = formatMinutesAndSeconds(pomoTimeRemaining);
      }
      if (progressFill) {
        const totalSecs = (pomoPhase === 'focus' ? 25 : 5) * 60;
        const pct = ((totalSecs - pomoTimeRemaining) / totalSecs) * 100;
        progressFill.style.width = \`\${pct}%\`;
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
  }`;

const newPomoListeners = `  // --- BENTODORO TIMER EVENT LISTENERS ---
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
        progressFill.style.width = \`\${pct}%\`;
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
          notes: \`Pomodoro \${pomoMode === 'reverse' ? 'Reverse' : 'Classic'} Focus Session\`
        });
        const sub = pomoSubjectId ? store.getSubjectById(pomoSubjectId) : null;

        if (pomoMode === 'classic') {
          window.avenApp?.showToast(
            \`Focus session completed! 25 mins logged\${sub ? \` for \${sub.name}\` : ''}. Starting 5 min break.\`,
            'success'
          );
          pomoPhase = 'break';
          pomoTimeRemaining = 5 * 60;
        } else {
          // Reverse mode: Finished the 25m work phase
          window.avenApp?.showToast(
            \`Earned focus session completed! 25 mins logged\${sub ? \` for \${sub.name}\` : ''}. Sequence finished.\`,
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
  }`;

trackerJs = trackerJs.replace(oldPomoListeners, newPomoListeners);
fs.writeFileSync('js/tracker.js', trackerJs, 'utf-8');

// 2. UPDATE css/style.css
let css = fs.readFileSync('css/style.css', 'utf-8');

const oldPomoCss = `/* Pomodoro Timer Card Styles */
.pomodoro-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 16px;
}

.pomodoro-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pomodoro-header-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  font-family: var(--font-sans);
  text-transform: uppercase;
}

.pomo-phase-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border-radius: var(--radius-full);
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.pomo-phase-badge.focus-mode {
  background: var(--accent-surface);
  color: var(--accent);
  border: 1px solid var(--accent-border);
}

.pomo-phase-badge.break-mode {
  background: var(--success-surface);
  color: var(--success);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.pomo-phase-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.pomo-subject-row {
  display: flex;
  flex-direction: column;
}

.pomo-subject-select {
  padding: 8px 10px;
  font-size: 13px;
  height: 36px;
}

.pomo-display-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.pomo-time-display {
  font-family: var(--font-mono);
  font-size: 38px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-primary);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.pomo-progress-track {
  width: 100%;
  height: 6px;
  background: var(--bg-input);
  border-radius: var(--radius-full);
  overflow: hidden;
  position: relative;
  border: 1px solid var(--border-subtle);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2);
}

[data-theme="light"] .pomo-progress-track {
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.06);
}

.pomo-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #505537 0%, #868a67 100%);
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
}

.pomo-progress-fill.break-fill {
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
}

.pomo-controls-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pomo-btn-start,
.pomo-btn-pause {
  flex: 1;
  height: 36px;
  font-size: 13px;
  font-weight: 600;
  gap: 6px;
}

.pomo-btn-reset {
  height: 36px;
  padding: 0 12px;
  font-size: 12.5px;
  gap: 5px;
}

.pomo-phase-toggle-btn {
  background: transparent;
  border: 1px solid var(--border-subtle);
  color: var(--text-muted);
  border-radius: var(--radius-md);
  padding: 0 10px;
  height: 36px;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  white-space: nowrap;
}`;

const newPomoCss = `/* Bentodoro-Style Bento Timer Tile */
.bento-timer-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 16px;
}

.pomodoro-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.pomodoro-header-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  font-family: var(--font-sans);
  text-transform: uppercase;
}

/* Classic / Reverse Mode Switcher */
.pomo-mode-switch {
  display: inline-flex;
  align-items: center;
  background: var(--bg-surface-hover);
  border: 1px solid var(--border-default);
  padding: 2px;
  border-radius: var(--radius-full);
  gap: 2px;
}

.pomo-mode-btn {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: var(--radius-full);
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.16s ease;
  line-height: 1.2;
}

.pomo-mode-btn:hover:not(.active) {
  color: var(--text-primary);
}

.pomo-mode-btn.active {
  background: var(--accent);
  color: var(--text-inverse);
  font-weight: 700;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
}

.pomo-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.pomo-phase-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3.5px 9px;
  border-radius: var(--radius-full);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  flex-shrink: 0;
}

.pomo-phase-badge.focus-mode {
  background: var(--accent-surface);
  color: var(--accent);
  border: 1px solid var(--accent-border);
}

.pomo-phase-badge.break-mode {
  background: rgba(16, 185, 129, 0.12);
  color: var(--success);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.pomo-phase-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.pomo-subject-wrap {
  flex: 1;
  min-width: 0;
}

.pomo-subject-wrap .form-select {
  padding: 4px 8px;
  font-size: 12px;
  height: 30px;
  border-radius: var(--radius-md);
}

.pomo-display-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 6px 0 2px;
}

.pomo-time-display {
  font-family: var(--font-numeric);
  font-size: 42px;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--text-primary);
  line-height: 1;
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1;
}

.pomo-progress-track {
  width: 100%;
  height: 6px;
  background: var(--bg-input);
  border-radius: var(--radius-full);
  overflow: hidden;
  position: relative;
  border: 1px solid var(--border-subtle);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.15);
}

[data-theme="light"] .pomo-progress-track {
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.06);
}

.pomo-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #505537 0%, #868a67 100%);
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
}

.pomo-progress-fill.break-fill {
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
}

.pomo-controls-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pomo-btn-start,
.pomo-btn-pause {
  flex: 1;
  height: 36px;
  font-size: 13px;
  font-weight: 700;
  gap: 6px;
}

.pomo-btn-reset {
  height: 36px;
  padding: 0 12px;
  font-size: 12.5px;
  gap: 5px;
}

.pomo-phase-toggle-btn {
  background: transparent;
  border: 1px solid var(--border-subtle);
  color: var(--text-muted);
  border-radius: var(--radius-md);
  padding: 0 10px;
  height: 36px;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  white-space: nowrap;
}

.pomo-phase-toggle-btn:hover {
  background: var(--bg-surface-hover);
  color: var(--text-primary);
  border-color: var(--border-default);
}`;

css = css.replace(oldPomoCss, newPomoCss);
fs.writeFileSync('css/style.css', css, 'utf-8');

console.log('Successfully replaced Pomodoro timer with Bentodoro-style bento card and Classic/Reverse mode toggle!');
