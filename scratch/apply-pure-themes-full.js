import fs from 'fs';

// 1. UPDATE js/settings.js
let settingsJs = fs.readFileSync('js/settings.js', 'utf-8');

const themeSectionHtml = `      <!-- 1. Appearance & Theme Section -->
      <div class="settings-section" id="settings-appearance">
        <div class="settings-section-header">
          <h3 class="settings-section-title">Appearance & Theme</h3>
        </div>
        <div class="settings-card">
          <div class="theme-options-grid">
            <div class="theme-option-card \${(store.getTheme() || 'dark') === 'dark' ? 'active' : ''}" data-theme-id="dark">
              <div class="theme-card-preview" style="background: #141512;">
                <div class="theme-card-preview-sidebar" style="background: #10110e; border-right: 1px solid rgba(255,255,255,0.06);"></div>
                <div class="theme-card-preview-main">
                  <div class="theme-card-preview-block" style="background: #1e201b; border: 1px solid rgba(255,255,255,0.08);"></div>
                  <div class="theme-card-preview-block" style="width: 50%; background: #a8b082;"></div>
                </div>
              </div>
              <div class="theme-option-info">
                <div>
                  <div class="theme-option-title">Deep Sage Dark</div>
                  <div class="theme-option-desc">Earthy charcoal & sage olive</div>
                </div>
                <span class="theme-check-badge">✓</span>
              </div>
            </div>

            <div class="theme-option-card \${store.getTheme() === 'pure-black' ? 'active' : ''}" data-theme-id="pure-black">
              <div class="theme-card-preview" style="background: #000000;">
                <div class="theme-card-preview-sidebar" style="background: #050505; border-right: 1px solid rgba(255,255,255,0.1);"></div>
                <div class="theme-card-preview-main">
                  <div class="theme-card-preview-block" style="background: #0d0d0d; border: 1px solid rgba(255,255,255,0.12);"></div>
                  <div class="theme-card-preview-block" style="width: 50%; background: #ffffff;"></div>
                </div>
              </div>
              <div class="theme-option-info">
                <div>
                  <div class="theme-option-title">Pure Black</div>
                  <div class="theme-option-desc">Pitch black OLED & monochrome</div>
                </div>
                <span class="theme-check-badge">✓</span>
              </div>
            </div>

            <div class="theme-option-card \${store.getTheme() === 'light' ? 'active' : ''}" data-theme-id="light">
              <div class="theme-card-preview" style="background: #c5bfa8;">
                <div class="theme-card-preview-sidebar" style="background: #e9e4d4; border-right: 1px solid rgba(0,0,0,0.06);"></div>
                <div class="theme-card-preview-main">
                  <div class="theme-card-preview-block" style="background: #f5f3ec; border: 1px solid #ffffff;"></div>
                  <div class="theme-card-preview-block" style="width: 50%; background: #505537;"></div>
                </div>
              </div>
              <div class="theme-option-info">
                <div>
                  <div class="theme-option-title">Warm Sage Light</div>
                  <div class="theme-option-desc">Tactile earthy khaki & soft linen</div>
                </div>
                <span class="theme-check-badge">✓</span>
              </div>
            </div>

            <div class="theme-option-card \${store.getTheme() === 'pure-white' ? 'active' : ''}" data-theme-id="pure-white">
              <div class="theme-card-preview" style="background: #f8fafc;">
                <div class="theme-card-preview-sidebar" style="background: #ffffff; border-right: 1px solid #e2e8f0;"></div>
                <div class="theme-card-preview-main">
                  <div class="theme-card-preview-block" style="background: #ffffff; border: 1px solid #e2e8f0;"></div>
                  <div class="theme-card-preview-block" style="width: 50%; background: #0f172a;"></div>
                </div>
              </div>
              <div class="theme-option-info">
                <div>
                  <div class="theme-option-title">Pure White</div>
                  <div class="theme-option-desc">Ultra-clean minimalist slate light</div>
                </div>
                <span class="theme-check-badge">✓</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. Academic Defaults Section -->`;

settingsJs = settingsJs.replace('<!-- 1. Academic Defaults Section -->', themeSectionHtml);

// Add event listener for theme cards in attachSettingsEvents
const themeListenerCode = `  // Theme selector card clicks
  container.querySelectorAll('.theme-option-card').forEach(card => {
    card.addEventListener('click', () => {
      const themeId = card.dataset.themeId;
      store.setTheme(themeId);
      renderSettingsView(container);
    });
  });

  // 1. Term Weight Auto-Save`;

settingsJs = settingsJs.replace('// 1. Term Weight Auto-Save', themeListenerCode);

fs.writeFileSync('js/settings.js', settingsJs, 'utf-8');

// 2. UPDATE js/app.js quick toggle buttons
let appJs = fs.readFileSync('js/app.js', 'utf-8');

const oldToggle1 = `    document.getElementById('mobile-theme-btn')?.addEventListener('click', () => {
      const current = store.getTheme();
      const next = current === 'dark' ? 'light' : 'dark';
      store.setTheme(next);
    });`;

const newToggle1 = `    document.getElementById('mobile-theme-btn')?.addEventListener('click', () => {
      const current = store.getTheme();
      let next = 'light';
      if (current === 'pure-black') next = 'pure-white';
      else if (current === 'pure-white') next = 'pure-black';
      else if (current === 'light') next = 'dark';
      else next = 'light';
      store.setTheme(next);
    });`;

appJs = appJs.replace(oldToggle1, newToggle1);

const oldToggle2 = `    document.getElementById('app-theme-btn')?.addEventListener('click', () => {
      const current = store.getTheme();
      const next = current === 'dark' ? 'light' : 'dark';
      store.setTheme(next);
      this.showToast(\`Theme switched to \${next} mode\`, 'info');
    });`;

const newToggle2 = `    document.getElementById('app-theme-btn')?.addEventListener('click', () => {
      const current = store.getTheme();
      let next = 'light';
      if (current === 'pure-black') next = 'pure-white';
      else if (current === 'pure-white') next = 'pure-black';
      else if (current === 'light') next = 'dark';
      else next = 'light';
      store.setTheme(next);
      this.showToast(\`Theme switched to \${next} mode\`, 'info');
    });`;

appJs = appJs.replace(oldToggle2, newToggle2);

fs.writeFileSync('js/app.js', appJs, 'utf-8');

console.log('Successfully updated settings and app.js with Pure White and Pure Black themes!');
