import fs from 'fs';

// 1. UPDATE js/tracker.js
let trackerJs = fs.readFileSync('js/tracker.js', 'utf-8');

// Update Distribution empty state header
trackerJs = trackerJs.replace(
  `<div style="display: flex; align-items: center; gap: 8px;">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
                <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
              </svg>
              <h3 style="font-size: 15px; font-weight: 600;">Study Time Distribution</h3>
            </div>`,
  `<div class="card-header-label distribution-header-label">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
                <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
              </svg>
              <span>STUDY TIME DISTRIBUTION</span>
            </div>`
);

// Update Distribution populated state header
trackerJs = trackerJs.replace(
  `<div style="display: flex; align-items: center; gap: 8px;">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
              <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
            </svg>
            <h3 style="font-size: 15px; font-weight: 600;">Study Time Distribution</h3>
          </div>`,
  `<div class="card-header-label distribution-header-label">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
              <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
            </svg>
            <span>STUDY TIME DISTRIBUTION</span>
          </div>`
);

// Update Manual Study Log header
trackerJs = trackerJs.replace(
  `<div class="tool-card-title">
            <div style="display: flex; align-items: center; gap: 8px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              <span>Manual Study Log</span>
            </div>
          </div>`,
  `<div class="card-header-label manual-log-header-label">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            <span>MANUAL STUDY LOG</span>
          </div>`
);

// Update Recent Study History header
trackerJs = trackerJs.replace(
  `<div style="display: flex; align-items: center; justify-content: space-between;">
          <h3 style="font-size: 15px; font-weight: 600;">Recent Study History</h3>
          <span style="font-size: 12px; color: var(--text-muted);">\${sessions.length} logged sessions</span>
        </div>`,
  `<div style="display: flex; align-items: center; justify-content: space-between;">
          <div class="card-header-label history-header-label">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="12 8 12 12 14 14"></polyline>
              <path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5"></path>
            </svg>
            <span>RECENT STUDY HISTORY</span>
          </div>
          <span style="font-size: 11px; color: var(--text-muted); font-weight: 500;">\${sessions.length} logged sessions</span>
        </div>`
);

fs.writeFileSync('js/tracker.js', trackerJs, 'utf-8');

// 2. UPDATE css/style.css
let css = fs.readFileSync('css/style.css', 'utf-8');

const universalHeaderCss = `
/* Universal Standardized Card Eyebrow Header Labels (Site-Wide Uniformity) */
.card-header-label,
.heatmap-header-label,
.distribution-header-label,
.pomodoro-header-label,
.milestone-header-label,
.manual-log-header-label,
.history-header-label,
.tool-card-title,
.stat-card-title,
.settings-section-title {
  display: inline-flex !important;
  align-items: center !important;
  gap: 6px !important;
  font-size: 10.5px !important;
  font-weight: 700 !important;
  letter-spacing: 0.08em !important;
  color: var(--text-muted) !important;
  font-family: var(--font-sans) !important;
  text-transform: uppercase !important;
  line-height: 1.2 !important;
  margin: 0 !important;
}

.card-header-label svg,
.heatmap-header-label svg,
.distribution-header-label svg,
.pomodoro-header-label svg,
.milestone-header-label svg,
.manual-log-header-label svg,
.history-header-label svg {
  color: var(--text-muted);
  flex-shrink: 0;
}
`;

css += universalHeaderCss;
fs.writeFileSync('css/style.css', css, 'utf-8');

console.log('Successfully standardized all card header titles site-wide!');
