/**
 * Aven - Settings View Controller
 * Features: Appearance, Academic Defaults with customizable Grading Scale,
 * Study Tracker defaults (timer mode, sound & notifications), Account management with inline pointer,
 * Data Management with live storage indicator, and App About/Release notes.
 */

import { store, events, YEAR_LEVELS, DEFAULT_COLOR_SWATCHES } from './store.js';


export function renderSettingsView(container) {
  const currentTheme = store.getTheme();
  const settings = store.getSettings();
  const user = store.getUserProfile();
  const scale = store.getGradingScale();
  const storageUsage = store.getStorageUsage();

  container.innerHTML = `
    <div class="settings-container">
      <!-- 1. Appearance Section -->
      <div class="settings-section" id="settings-appearance">
        <div class="settings-section-header">
          <h3 class="settings-section-title">Appearance</h3>
        </div>
        <div class="settings-card">
          <div class="settings-row compact">
            <div class="setting-info">
              <strong class="setting-title">Dark Theme</strong>
            </div>
            <div class="setting-control">
              <label class="switch-toggle" title="Toggle Dark / Light Theme">
                <input type="checkbox" id="theme-switch-toggle" ${currentTheme === 'dark' ? 'checked' : ''}>
                <span class="switch-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. Academic Defaults Section -->
      <div class="settings-section" id="settings-academic">
        <div class="settings-section-header">
          <h3 class="settings-section-title">Academic Defaults</h3>
        </div>
        <div class="settings-card">
          <div class="settings-row">
            <div class="setting-info">
              <strong class="setting-title">Default Term Weight Split</strong>
              <p class="setting-desc">Midterm vs Final weighting for newly created courses</p>
            </div>
            <div class="setting-control">
              <div style="display: flex; align-items: center; gap: 4px;">
                <span style="font-size: 12px; color: var(--text-muted);">Midterm:</span>
                <input type="number" id="setting-midterm-weight" class="form-input auto-save-input" min="0" max="100" value="${settings.default_midterm_weight}" style="width: 58px; padding: 5px 8px; font-size: 13px; text-align: center;">
                <span style="font-size: 12px; color: var(--text-muted);">%</span>
              </div>
              <span style="color: var(--text-muted); font-size: 13px;">/</span>
              <div style="display: flex; align-items: center; gap: 4px;">
                <span style="font-size: 12px; color: var(--text-muted);">Final:</span>
                <input type="number" id="setting-final-weight" class="form-input auto-save-input" min="0" max="100" value="${settings.default_final_weight}" style="width: 58px; padding: 5px 8px; font-size: 13px; text-align: center;">
                <span style="font-size: 12px; color: var(--text-muted);">%</span>
              </div>
              <span class="inline-save-badge" id="weights-save-indicator">Saved ✓</span>
            </div>
          </div>

          <!-- Grading Scale Customization Table Row -->
          <div class="settings-row" style="flex-direction: column; align-items: stretch; gap: 14px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div class="setting-info">
                <strong class="setting-title">Grading Scale Cutoffs</strong>
                <p class="setting-desc">Percentage minimums for Philippine 1.00–5.00 grade conversion</p>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="inline-save-badge" id="scale-save-indicator">Saved ✓</span>
                <button class="btn btn-ghost btn-sm" id="btn-reset-scale" style="font-size: 11.5px; padding: 3px 8px;" title="Reset cutoffs to Philippine university defaults">
                  Reset to Default
                </button>
              </div>
            </div>

            <!-- Compact Scale Grid -->
            <div class="scale-edit-grid">
              ${scale.map((item) => `
                <div class="scale-edit-cell ${item.grade === '5.00' ? 'failed' : ''}">
                  <div class="scale-edit-grade">${item.grade}</div>
                  <div class="scale-edit-input-wrap">
                    <span class="scale-gte">&ge;</span>
                    <input type="number" class="form-input scale-min-input"
                           data-grade="${item.grade}"
                           value="${item.min}"
                           min="0" max="100" step="0.5"
                           ${item.grade === '5.00' ? 'disabled' : ''}>
                    <span class="scale-pct">%</span>
                  </div>
                  <div class="scale-edit-desc">${item.desc}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- 3. Study Tracker Defaults -->
      <div class="settings-section" id="settings-tracker">
        <div class="settings-section-header">
          <h3 class="settings-section-title">Study Tracker</h3>
        </div>
        <div class="settings-card">
          <div class="settings-row compact">
            <div class="setting-info">
              <strong class="setting-title">Pomodoro Mode as Default</strong>
            </div>
            <div class="setting-control">
              <label class="switch-toggle" title="Toggle Default Timer Mode">
                <input type="checkbox" id="timer-switch-toggle" ${settings.default_timer_mode === 'pomodoro' ? 'checked' : ''}>
                <span class="switch-slider"></span>
              </label>
            </div>
          </div>

          <!-- Sound & Notifications Toggle -->
          <div class="settings-row compact">
            <div class="setting-info">
              <strong class="setting-title">Sound & Notifications</strong>
              <p class="setting-desc">Play audio chime when focus or break intervals complete</p>
            </div>
            <div class="setting-control">
              <label class="switch-toggle" title="Toggle Audio Notifications">
                <input type="checkbox" id="sound-switch-toggle" ${settings.sound_notifications !== false ? 'checked' : ''}>
                <span class="switch-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. Account Settings Section -->
      <div class="settings-section" id="settings-account">
        <div class="settings-section-header">
          <h3 class="settings-section-title">Account</h3>
          <span class="inline-save-badge" id="account-save-indicator">Saved ✓</span>
        </div>
        <div class="settings-card">
          <!-- Display Name -->
          <div class="settings-row">
            <div class="setting-info">
              <strong class="setting-title">Display Name</strong>
              <p class="setting-desc">Student profile name displayed across the app</p>
            </div>
            <div class="setting-control" style="gap: 10px;">
              <div class="user-avatar" id="settings-avatar-preview" style="width: 32px; height: 32px; font-size: 12px; font-weight: 700; background-color: ${user.avatar_color || '#6366f1'}; flex-shrink: 0;" title="Initials auto-generate from your display name">
                ${user.avatar || 'AR'}
              </div>
              <input type="text" id="setting-user-name" class="form-input auto-save-input" value="${user.name || ''}" placeholder="Alex Rivera" style="width: 220px; font-size: 13px;">
            </div>
          </div>

          <!-- Email Address -->
          <div class="settings-row">
            <div class="setting-info">
              <strong class="setting-title">Email Address</strong>
              <p class="setting-desc">Student contact email</p>
            </div>
            <div class="setting-control">
              <input type="email" id="setting-user-email" class="form-input auto-save-input" value="${user.email || ''}" placeholder="alex.rivera@university.edu" style="width: 220px; font-size: 13px;">
            </div>
          </div>

          <!-- Current Year Level -->
          <div class="settings-row">
            <div class="setting-info">
              <strong class="setting-title">Current Year Level</strong>
              <p class="setting-desc">Overall academic standing (profile-level label)</p>
            </div>
            <div class="setting-control">
              <select id="setting-user-year" class="form-select auto-save-input" style="width: 220px; font-size: 13px;">
                ${YEAR_LEVELS.map(lvl => `
                  <option value="${lvl}" ${user.year_level === lvl ? 'selected' : ''}>${lvl}</option>
                `).join('')}
              </select>
            </div>
          </div>

          <!-- School / University Name -->
          <div class="settings-row">
            <div class="setting-info">
              <strong class="setting-title">School / University</strong>
              <p class="setting-desc">Institution name for academic reports and exports</p>
            </div>
            <div class="setting-control">
              <input type="text" id="setting-user-institution" class="form-input auto-save-input" value="${user.institution || ''}" placeholder="e.g. State University" style="width: 220px; font-size: 13px;">
            </div>
          </div>

          <!-- Program / Major -->
          <div class="settings-row">
            <div class="setting-info">
              <strong class="setting-title">Program / Major</strong>
              <p class="setting-desc">Degree program or academic field of study</p>
            </div>
            <div class="setting-control">
              <input type="text" id="setting-user-program" class="form-input auto-save-input" value="${user.program || ''}" placeholder="e.g. BS Computer Science" style="width: 220px; font-size: 13px;">
            </div>
          </div>

          <!-- Avatar Color Customization -->
          <div class="settings-row">
            <div class="setting-info">
              <strong class="setting-title">Avatar Color</strong>
              <p class="setting-desc">Pick a background color tint for your initials circle</p>
            </div>
            <div class="setting-control">
              <div class="color-swatches" id="account-avatar-colors" style="max-width: 240px; justify-content: flex-end;">
                ${DEFAULT_COLOR_SWATCHES.map(color => `
                  <div class="color-swatch-opt ${(user.avatar_color || '#6366f1').toLowerCase() === color.toLowerCase() ? 'active' : ''}" 
                       data-color="${color}" 
                       style="background-color: ${color};"
                       title="${color}"></div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Pointer Note to Data Management -->
          <div class="settings-row" style="background: var(--bg-surface); padding: 10px 20px;">
            <p style="font-size: 12px; color: var(--text-muted); margin: 0;">
              To permanently delete all your data, use <a href="#settings-data" id="link-goto-data" style="color: var(--accent); text-decoration: underline; cursor: pointer;">Clear all workspace data</a> below.
            </p>
          </div>
        </div>
      </div>


      <!-- 5. Data Management -->
      <div class="settings-section" id="settings-data">
        <div class="settings-section-header">
          <h3 class="settings-section-title">Data Management</h3>
          <span class="storage-usage-badge">${storageUsage} used</span>
        </div>
        <div class="settings-card">
          <div class="settings-row">
            <div class="setting-info">
              <strong class="setting-title">Export Workspace</strong>
              <p class="setting-desc">Download a complete JSON backup of your subjects, grades, and study logs</p>
            </div>
            <div class="setting-control">
              <button class="btn" id="btn-export-data">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Export JSON
              </button>
            </div>
          </div>
          <div class="settings-row">
            <div class="setting-info">
              <strong class="setting-title">Import Workspace</strong>
              <p class="setting-desc">Restore records from a previously exported backup file</p>
            </div>
            <div class="setting-control">
              <input type="file" id="import-file-input" accept=".json" style="display: none;">
              <button class="btn" id="btn-trigger-import">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                Import JSON
              </button>
            </div>
          </div>
          <div class="settings-row" style="border-bottom: none;">
            <div class="setting-info">
              <strong class="setting-title" style="color: var(--danger);">Clear All Workspace Data</strong>
              <p class="setting-desc">Permanently wipe all enrolled subjects, grades, sessions, and plans</p>
            </div>
            <div class="setting-control">
              <button class="btn btn-danger" id="btn-clear-all-data">Clear Workspace</button>
            </div>
          </div>
        </div>
      </div>

      <!-- App About & Release Notes Footer -->
      <div class="settings-about-footer">
        <span>Aven &middot; Academic Operating System <strong>v1.1</strong></span>
        <span>&middot;</span>
        <button class="about-release-btn" id="btn-release-notes">Release Notes</button>
      </div>
    </div>

    <!-- Clear Confirmation Modal -->
    <div class="modal-overlay" id="clear-confirm-modal">
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title" style="color: var(--danger);">Wipe Entire Workspace?</h3>
          <button class="btn btn-ghost btn-icon close-clear-modal-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="alert-box danger">
            <strong>Warning: This action will permanently remove all your data.</strong>
          </div>
          <p style="font-size: 13px; color: var(--text-secondary);">
            Are you sure you want to clear all subjects, sessions, grades, and study plans? You can export a backup first if you want to keep a copy.
          </p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost close-clear-modal-btn">Cancel</button>
          <button type="button" class="btn btn-danger" id="btn-confirm-wipe">Yes, Wipe All Data</button>
        </div>
      </div>
    </div>

    <!-- Release Notes Modal -->
    <div class="modal-overlay" id="release-notes-modal">
      <div class="modal-card" style="max-width: 500px;">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">Aven v1.1 Release Notes</h3>
            <span style="font-size: 11.5px; color: var(--text-muted);">Academic Operating System</span>
          </div>
          <button class="btn btn-ghost btn-icon close-release-modal-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="modal-body" style="display: flex; flex-direction: column; gap: 12px; font-size: 13px; color: var(--text-secondary);">
          <div style="padding-bottom: 8px; border-bottom: 1px solid var(--border-subtle);">
            <strong style="color: var(--text-primary); font-size: 13.5px;">What's New in v1.1</strong>
          </div>
          <ul style="padding-left: 18px; margin: 0; display: flex; flex-direction: column; gap: 8px; line-height: 1.4;">
            <li><strong>Full Jan–Dec Calendar Heatmap:</strong> Year navigation and clean month blocks with LeetCode-style activity tracking.</li>
            <li><strong>Grading Scale Customization:</strong> Editable percentage thresholds for Philippine 1.00–5.00 grading system.</li>
            <li><strong>Focus Sound & Notifications:</strong> Option to enable or mute chime completions on Pomodoro cycles.</li>
            <li><strong>Sidebar Sub-Navigation:</strong> Expandable Settings menu with scroll-synced active highlighting.</li>
            <li><strong>Local Storage Monitor:</strong> Real-time storage footprint calculation.</li>
          </ul>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-primary close-release-modal-btn">Got it</button>
        </div>
      </div>
    </div>
  `;

  attachSettingsEvents(container);
}

function showInlineSaved(badgeEl) {
  if (!badgeEl) return;
  badgeEl.classList.add('visible');
  setTimeout(() => {
    badgeEl.classList.remove('visible');
  }, 1800);
}

function attachSettingsEvents(container) {
  // 1. Account Settings Auto-save
  const nameInput = container.querySelector('#setting-user-name');
  const emailInput = container.querySelector('#setting-user-email');
  const yearSelect = container.querySelector('#setting-user-year');
  const institutionInput = container.querySelector('#setting-user-institution');
  const programInput = container.querySelector('#setting-user-program');
  const accountBadge = container.querySelector('#account-save-indicator');
  const avatarPreview = container.querySelector('#settings-avatar-preview');

  const initialProfile = store.getUserProfile();
  let currentAvatarColor = initialProfile.avatar_color || '#6366f1';

  const saveAccount = () => {
    const name = nameInput ? nameInput.value : initialProfile.name;
    const email = emailInput ? emailInput.value : initialProfile.email;
    const year_level = yearSelect ? yearSelect.value : initialProfile.year_level;
    const institution = institutionInput ? institutionInput.value : initialProfile.institution;
    const program = programInput ? programInput.value : initialProfile.program;

    const updated = store.saveUserProfile({
      name,
      email,
      year_level,
      institution,
      program,
      avatar_color: currentAvatarColor
    });

    if (avatarPreview) {
      avatarPreview.textContent = updated.avatar;
      avatarPreview.style.backgroundColor = updated.avatar_color;
    }
    showInlineSaved(accountBadge);
  };

  [nameInput, emailInput, institutionInput, programInput].forEach(inp => {
    inp?.addEventListener('blur', saveAccount);
    inp?.addEventListener('change', saveAccount);
  });
  yearSelect?.addEventListener('change', saveAccount);

  // Avatar color swatches
  container.querySelectorAll('#account-avatar-colors .color-swatch-opt').forEach(swatch => {
    swatch.addEventListener('click', () => {
      container.querySelectorAll('#account-avatar-colors .color-swatch-opt').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      currentAvatarColor = swatch.dataset.color;
      saveAccount();
    });
  });


  // 2. Theme Pill Switch Toggle
  const themeSwitch = container.querySelector('#theme-switch-toggle');
  themeSwitch?.addEventListener('change', () => {
    const targetTheme = themeSwitch.checked ? 'dark' : 'light';
    store.setTheme(targetTheme);
    window.avenApp?.showToast(`Theme switched to ${targetTheme} mode`, 'info');
    renderSettingsView(container);
  });

  // 3. Default Term Weight Split Auto-save on blur
  const mWeightInput = container.querySelector('#setting-midterm-weight');
  const fWeightInput = container.querySelector('#setting-final-weight');
  const weightsBadge = container.querySelector('#weights-save-indicator');

  const saveWeights = () => {
    const mWeight = Number(mWeightInput.value) || 50;
    const fWeight = Number(fWeightInput.value) || 50;
    store.saveSettings({
      default_midterm_weight: mWeight,
      default_final_weight: fWeight
    });
    showInlineSaved(weightsBadge);
  };

  mWeightInput?.addEventListener('blur', saveWeights);
  fWeightInput?.addEventListener('blur', saveWeights);
  mWeightInput?.addEventListener('change', saveWeights);
  fWeightInput?.addEventListener('change', saveWeights);

  // 4. Grading Scale Cutoffs Auto-Save & Reset
  const scaleInputs = container.querySelectorAll('.scale-min-input');
  const scaleBadge = container.querySelector('#scale-save-indicator');
  const resetScaleBtn = container.querySelector('#btn-reset-scale');

  const saveScale = () => {
    const currentScale = store.getGradingScale();
    scaleInputs.forEach(input => {
      const grade = input.dataset.grade;
      const val = parseFloat(input.value);
      const target = currentScale.find(s => s.grade === grade);
      if (target && !isNaN(val)) {
        target.min = val;
      }
    });
    store.saveGradingScale(currentScale);
    showInlineSaved(scaleBadge);
  };

  scaleInputs.forEach(input => {
    input.addEventListener('blur', saveScale);
    input.addEventListener('change', saveScale);
  });

  resetScaleBtn?.addEventListener('click', () => {
    store.resetGradingScale();
    window.avenApp?.showToast('Grading scale reset to university defaults', 'info');
    renderSettingsView(container);
  });

  // 5. Timer Mode Pill Switch Toggle
  const timerSwitch = container.querySelector('#timer-switch-toggle');
  timerSwitch?.addEventListener('change', () => {
    const targetMode = timerSwitch.checked ? 'pomodoro' : 'stopwatch';
    store.saveSettings({ default_timer_mode: targetMode });
    window.avenApp?.showToast(`Default timer set to ${targetMode}`, 'info');
    renderSettingsView(container);
  });

  // 6. Sound & Notifications Toggle
  const soundSwitch = container.querySelector('#sound-switch-toggle');
  soundSwitch?.addEventListener('change', () => {
    const enabled = soundSwitch.checked;
    store.saveSettings({ sound_notifications: enabled });
    window.avenApp?.showToast(`Sound notifications ${enabled ? 'enabled' : 'disabled'}`, 'info');
  });

  // 7. Pointer link from Account to Data Management
  container.querySelector('#link-goto-data')?.addEventListener('click', (e) => {
    e.preventDefault();
    const dataSection = container.querySelector('#settings-data');
    dataSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.avenApp?.setActiveSettingsSublink('settings-data');
  });

  // 8. Export Data JSON
  container.querySelector('#btn-export-data')?.addEventListener('click', () => {
    const jsonStr = store.exportAllDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aven_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    window.avenApp?.showToast('Workspace backup exported', 'success');
  });

  // 9. Import Data JSON
  const triggerImportBtn = container.querySelector('#btn-trigger-import');
  const importFileInput = container.querySelector('#import-file-input');

  if (triggerImportBtn && importFileInput) {
    triggerImportBtn.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = store.importAllDataJSON(event.target.result);
        if (result.success) {
          window.avenApp?.showToast(`Imported ${result.count} subjects successfully`, 'success');
          renderSettingsView(container);
        } else {
          window.avenApp?.showToast(`Import failed: ${result.error}`, 'danger');
        }
      };
      reader.readAsText(file);
    });
  }

  // 10. Clear All Data Modal
  const clearModal = container.querySelector('#clear-confirm-modal');
  const clearBtn = container.querySelector('#btn-clear-all-data');
  const confirmWipeBtn = container.querySelector('#btn-confirm-wipe');

  if (clearBtn && clearModal) {
    clearBtn.addEventListener('click', () => clearModal.classList.add('open'));
  }

  container.querySelectorAll('.close-clear-modal-btn').forEach(b => {
    b.addEventListener('click', () => clearModal.classList.remove('open'));
  });

  if (confirmWipeBtn) {
    confirmWipeBtn.addEventListener('click', () => {
      store.clearAllData();
      clearModal.classList.remove('open');
      window.avenApp?.showToast('Workspace cleared', 'info');
      renderSettingsView(container);
    });
  }

  // 11. Release Notes Modal
  const releaseModal = container.querySelector('#release-notes-modal');
  const releaseBtn = container.querySelector('#btn-release-notes');

  if (releaseBtn && releaseModal) {
    releaseBtn.addEventListener('click', () => releaseModal.classList.add('open'));
  }

  container.querySelectorAll('.close-release-modal-btn').forEach(b => {
    b.addEventListener('click', () => releaseModal.classList.remove('open'));
  });
}

