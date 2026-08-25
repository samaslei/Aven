import fs from 'fs';

// =========================================================================
// 1. UPDATE index.html (Default to light theme)
// =========================================================================
let html = fs.readFileSync('index.html', 'utf-8');

html = html.replace(
  `<html lang="en" data-theme="dark">`,
  `<html lang="en" data-theme="light">`
);

html = html.replace(
  `var storedTheme = localStorage.getItem('aven_theme') || 'dark';`,
  `var storedTheme = localStorage.getItem('aven_theme') || 'light';`
);

fs.writeFileSync('index.html', html, 'utf-8');

// =========================================================================
// 2. UPDATE js/landing.js
// - Update copy (remove 'dark-first' and 'custom color accents')
// - Update hero mockup content to match light mode app (no color bars, no dots in standing)
// =========================================================================
let landingJs = fs.readFileSync('js/landing.js', 'utf-8');

// Update subheadline
landingJs = landingJs.replace(
  `Replace messy spreadsheets, disconnected study apps, and lost PDF syllabi with a cohesive, dark-first workspace engineered for high-achieving university students.`,
  `Replace messy spreadsheets, disconnected study apps, and lost PDF syllabi with a cohesive, integrated academic workspace engineered for high-achieving university students.`
);

// Update step 1 copy
landingJs = landingJs.replace(
  `Create courses with codes, instructor names, semester tags, and custom color accents. Upload your syllabi and grade category breakdown weights.`,
  `Create courses with codes, instructor names, semester tags, and customizable category breakdown weights. Upload your syllabi and target grade solvers.`
);

// Update Mockup Stat Cards to match real app's stat banner
const oldMockupStatCards = `                <!-- Top 4 Metric Stat Cards -->
                <div class="mockup-stats-banner">
                  <div class="mockup-stat-card stat-blue">
                    <div class="mockup-stat-head">
                      <span>Enrolled Subjects</span>
                      <span class="mockup-stat-icon">📚</span>
                    </div>
                    <div class="mockup-stat-val">5 Active</div>
                    <div class="mockup-stat-sub">5 total courses enrolled</div>
                  </div>

                  <div class="mockup-stat-card stat-teal">
                    <div class="mockup-stat-head">
                      <span>Study Time (Week)</span>
                      <span class="mockup-stat-icon">⏱️</span>
                    </div>
                    <div class="mockup-stat-val">18.4h</div>
                    <div class="mockup-stat-sub">52.8h all-time · 34 sessions</div>
                  </div>

                  <div class="mockup-stat-card stat-indigo">
                    <div class="mockup-stat-head">
                      <span>Cumulative GPA</span>
                      <span class="mockup-stat-icon">📈</span>
                    </div>
                    <div class="mockup-stat-val" style="color: #10b981;">1.22</div>
                    <div class="mockup-stat-sub">Avg 94.2% · 5/5 graded</div>
                  </div>

                  <div class="mockup-stat-card stat-purple">
                    <div class="mockup-stat-head">
                      <span>Study Streak</span>
                      <span class="mockup-stat-icon">🔥</span>
                    </div>
                    <div class="mockup-stat-val">8 days</div>
                    <div class="mockup-stat-sub">Best: 14 days</div>
                  </div>
                </div>`;

const newMockupStatCards = `                <!-- Top 4 Metric Stat Cards (Matching Real App) -->
                <div class="mockup-stats-banner">
                  <div class="mockup-stat-card">
                    <div class="mockup-stat-inner">
                      <div class="mockup-stat-icon-circle">📚</div>
                      <div class="mockup-stat-body">
                        <div class="mockup-stat-head">Enrolled Subjects</div>
                        <div class="mockup-stat-val">5 Active</div>
                        <div class="mockup-stat-sub">5 total courses</div>
                      </div>
                    </div>
                  </div>

                  <div class="mockup-stat-card">
                    <div class="mockup-stat-inner">
                      <div class="mockup-stat-icon-circle">⏱️</div>
                      <div class="mockup-stat-body">
                        <div class="mockup-stat-head">Study Time</div>
                        <div class="mockup-stat-val">18.4h</div>
                        <div class="mockup-stat-sub">34 sessions</div>
                      </div>
                    </div>
                  </div>

                  <div class="mockup-stat-card">
                    <div class="mockup-stat-inner">
                      <div class="mockup-stat-icon-circle">🎯</div>
                      <div class="mockup-stat-body">
                        <div class="mockup-stat-head">Cumulative GPA</div>
                        <div class="mockup-stat-val">1.22</div>
                        <div class="mockup-stat-sub">Avg 94.2% · Excellent</div>
                      </div>
                    </div>
                  </div>

                  <div class="mockup-stat-card">
                    <div class="mockup-stat-inner">
                      <div class="mockup-stat-icon-circle">🔥</div>
                      <div class="mockup-stat-body">
                        <div class="mockup-stat-head">Study Streak</div>
                        <div class="mockup-stat-val">8 days</div>
                        <div class="mockup-stat-sub">Best: 14 days</div>
                      </div>
                    </div>
                  </div>
                </div>`;

landingJs = landingJs.replace(oldMockupStatCards, newMockupStatCards);

// Update Mockup Cards Grid (remove color bars, remove dots in standing)
const oldMockupCardsGrid = `                <!-- Mockup Subject Cards Grid -->
                <div class="mockup-cards-grid">
                  <!-- Subject 1: CS 102 -->
                  <div class="mockup-subject-card" style="--card-accent: #6366f1;">
                    <div class="mockup-card-top">
                      <div class="mockup-color-bar" style="background: #6366f1;"></div>
                      <div class="mockup-card-title-group">
                        <div class="mockup-card-code">CS 102</div>
                        <div class="mockup-card-name">Data Structures & Algorithms</div>
                        <div class="mockup-card-prof">Dr. Elena Santos</div>
                      </div>
                    </div>
                    <div class="mockup-term-tag">2nd Year · 1st Sem</div>
                    <div class="mockup-metrics-grid">
                      <div class="mockup-m-item">
                        <span class="m-label">Study Time</span>
                        <span class="m-val">12.5h</span>
                      </div>
                      <div class="mockup-m-item">
                        <span class="m-label">Standing</span>
                        <span class="mockup-standing-pill excellent">● 1.00 (96.4%)</span>
                      </div>
                      <div class="mockup-m-item">
                        <span class="m-label">Plan</span>
                        <span class="mockup-plan-badge">✓ Attached</span>
                      </div>
                    </div>
                  </div>

                  <!-- Subject 2: MATH 21 -->
                  <div class="mockup-subject-card" style="--card-accent: #8b5cf6;">
                    <div class="mockup-card-top">
                      <div class="mockup-color-bar" style="background: #8b5cf6;"></div>
                      <div class="mockup-card-title-group">
                        <div class="mockup-card-code">MATH 21</div>
                        <div class="mockup-card-name">Discrete Mathematics</div>
                        <div class="mockup-card-prof">Prof. Marcus Vance</div>
                      </div>
                    </div>
                    <div class="mockup-term-tag">2nd Year · 1st Sem</div>
                    <div class="mockup-metrics-grid">
                      <div class="mockup-m-item">
                        <span class="m-label">Study Time</span>
                        <span class="m-val">8.2h</span>
                      </div>
                      <div class="mockup-m-item">
                        <span class="m-label">Standing</span>
                        <span class="mockup-standing-pill superior">● 1.25 (93.1%)</span>
                      </div>
                      <div class="mockup-m-item">
                        <span class="m-label">Plan</span>
                        <span class="mockup-plan-badge">✓ Attached</span>
                      </div>
                    </div>
                  </div>

                  <!-- Subject 3: PHYS 11 -->
                  <div class="mockup-subject-card" style="--card-accent: #06b6d4;">
                    <div class="mockup-card-top">
                      <div class="mockup-color-bar" style="background: #06b6d4;"></div>
                      <div class="mockup-card-title-group">
                        <div class="mockup-card-code">PHYS 11</div>
                        <div class="mockup-card-name">General Physics II (Electromagnetism)</div>
                        <div class="mockup-card-prof">Dr. Aris Chen</div>
                      </div>
                    </div>
                    <div class="mockup-term-tag">2nd Year · 1st Sem</div>
                    <div class="mockup-metrics-grid">
                      <div class="mockup-m-item">
                        <span class="m-label">Study Time</span>
                        <span class="m-val">6.8h</span>
                      </div>
                      <div class="mockup-m-item">
                        <span class="m-label">Standing</span>
                        <span class="mockup-standing-pill verygood">● 1.50 (90.8%)</span>
                      </div>
                      <div class="mockup-m-item">
                        <span class="m-label">Plan</span>
                        <span class="mockup-plan-badge">✓ Attached</span>
                      </div>
                    </div>
                  </div>
                </div>`;

const newMockupCardsGrid = `                <!-- Mockup Subject Cards Grid (Matching Real App) -->
                <div class="mockup-cards-grid">
                  <!-- Subject 1: CS 102 -->
                  <div class="mockup-subject-card">
                    <div class="mockup-card-top">
                      <div class="mockup-card-icon-badge">CS</div>
                      <div class="mockup-card-title-group">
                        <div class="mockup-card-code">CS 102</div>
                        <div class="mockup-card-name">Data Structures & Algorithms</div>
                        <div class="mockup-card-prof">Dr. Elena Santos</div>
                      </div>
                    </div>
                    <div class="mockup-term-tag">2nd Year · 1st Sem</div>
                    <div class="mockup-metrics-grid">
                      <div class="mockup-m-item">
                        <span class="m-label">Study Time</span>
                        <span class="m-val">12.5h</span>
                      </div>
                      <div class="mockup-m-item">
                        <span class="m-label">Standing</span>
                        <span class="mockup-standing-pill excellent">1.00 (96.4%)</span>
                      </div>
                      <div class="mockup-m-item">
                        <span class="m-label">Plan</span>
                        <span class="mockup-plan-badge">✓ Attached</span>
                      </div>
                    </div>
                  </div>

                  <!-- Subject 2: MATH 21 -->
                  <div class="mockup-subject-card">
                    <div class="mockup-card-top">
                      <div class="mockup-card-icon-badge">MA</div>
                      <div class="mockup-card-title-group">
                        <div class="mockup-card-code">MATH 21</div>
                        <div class="mockup-card-name">Discrete Mathematics</div>
                        <div class="mockup-card-prof">Prof. Marcus Vance</div>
                      </div>
                    </div>
                    <div class="mockup-term-tag">2nd Year · 1st Sem</div>
                    <div class="mockup-metrics-grid">
                      <div class="mockup-m-item">
                        <span class="m-label">Study Time</span>
                        <span class="m-val">8.2h</span>
                      </div>
                      <div class="mockup-m-item">
                        <span class="m-label">Standing</span>
                        <span class="mockup-standing-pill superior">1.25 (93.1%)</span>
                      </div>
                      <div class="mockup-m-item">
                        <span class="m-label">Plan</span>
                        <span class="mockup-plan-badge">✓ Attached</span>
                      </div>
                    </div>
                  </div>

                  <!-- Subject 3: PHYS 11 -->
                  <div class="mockup-subject-card">
                    <div class="mockup-card-top">
                      <div class="mockup-card-icon-badge">PH</div>
                      <div class="mockup-card-title-group">
                        <div class="mockup-card-code">PHYS 11</div>
                        <div class="mockup-card-name">General Physics II</div>
                        <div class="mockup-card-prof">Dr. Aris Chen</div>
                      </div>
                    </div>
                    <div class="mockup-term-tag">2nd Year · 1st Sem</div>
                    <div class="mockup-metrics-grid">
                      <div class="mockup-m-item">
                        <span class="m-label">Study Time</span>
                        <span class="m-val">6.8h</span>
                      </div>
                      <div class="mockup-m-item">
                        <span class="m-label">Standing</span>
                        <span class="mockup-standing-pill verygood">1.50 (90.8%)</span>
                      </div>
                      <div class="mockup-m-item">
                        <span class="m-label">Plan</span>
                        <span class="mockup-plan-badge">✓ Attached</span>
                      </div>
                    </div>
                  </div>
                </div>`;

landingJs = landingJs.replace(oldMockupCardsGrid, newMockupCardsGrid);
fs.writeFileSync('js/landing.js', landingJs, 'utf-8');

// =========================================================================
// 3. UPDATE css/style.css for landing page & mockup styling in light mode
// =========================================================================
let css = fs.readFileSync('css/style.css', 'utf-8');

const oldMockupCss = `.mockup-stat-card {
  background: var(--bg-surface);
  border: none;
  border-radius: var(--radius-lg);
  padding: 14px 16px;
  box-shadow: 0 4px 16px -2px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

[data-theme="light"] .mockup-stat-card {
  box-shadow: 0 4px 16px -2px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.40);
}

.mockup-stat-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-bottom: 6px;
}

.mockup-stat-val {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
  letter-spacing: -0.02em;
}

.mockup-stat-sub {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Mockup Toolbar */
.mockup-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
  gap: 12px;
}

.mockup-toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mockup-segmented {
  display: flex;
  align-items: center;
  background: var(--bg-surface);
  padding: 3px;
  border-radius: var(--radius-full);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.3);
}

.mockup-seg {
  font-size: 11.5px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: var(--radius-full);
  color: var(--text-muted);
}

.mockup-seg.active {
  background: var(--bg-surface-elevated);
  color: var(--text-primary);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.mockup-pill-filter {
  font-size: 11.5px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  background: var(--bg-surface);
  color: var(--text-secondary);
  border: 1px solid var(--border-subtle);
}

.mockup-action-btn {
  font-size: 11.5px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: var(--radius-sm);
  background: var(--accent);
  color: #ffffff;
}

/* Mockup Subject Cards Grid */
.mockup-cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.mockup-subject-card {
  background: var(--bg-surface);
  border: none;
  border-radius: var(--radius-lg);
  padding: 16px;
  box-shadow: 0 2px 10px -1px rgba(0, 0, 0, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.035);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

[data-theme="light"] .mockup-subject-card {
  box-shadow: 0 2px 8px -1px rgba(15, 23, 42, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.40);
}

.mockup-card-top {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.mockup-color-bar {
  width: 4px;
  height: 38px;
  border-radius: 2px;
  flex-shrink: 0;
}

.mockup-card-title-group {
  flex: 1;
  min-width: 0;
}

.mockup-card-code {
  font-size: 10.5px;
  font-weight: 700;
  color: var(--accent);
  letter-spacing: 0.03em;
}

.mockup-card-name {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 1px;
}

.mockup-card-prof {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}

.mockup-term-tag {
  font-size: 10.5px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  background: var(--bg-surface-elevated);
  color: var(--text-muted);
  width: fit-content;
}

.mockup-metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding-top: 10px;
  border-top: 1px solid var(--border-subtle);
}

.mockup-m-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.m-label {
  font-size: 9.5px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-muted);
}

.m-val {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-primary);
  font-family: var(--font-numeric);
}

.mockup-standing-pill {
  font-size: 10.5px;
  font-weight: 600;
  padding: 0;
  background: transparent !important;
  border: none !important;
  white-space: nowrap;
  width: fit-content;
}

.mockup-standing-pill.excellent {
  color: #10b981;
}

.mockup-standing-pill.superior {
  color: #3b82f6;
}

.mockup-standing-pill.verygood {
  color: #8b5cf6;
}`;

const newMockupCss = `.mockup-stat-card {
  background: var(--bg-surface);
  border: var(--border-card);
  border-radius: var(--radius-lg);
  padding: 14px 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  box-sizing: border-box;
}

.mockup-stat-inner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.mockup-stat-icon-circle {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  background: rgba(80, 85, 55, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}

.mockup-stat-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.mockup-stat-head {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.mockup-stat-val {
  font-size: 18px;
  font-weight: 800;
  color: var(--text-primary);
  font-family: var(--font-numeric);
  letter-spacing: -0.02em;
}

.mockup-stat-sub {
  font-size: 10.5px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Mockup Toolbar */
.mockup-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
  gap: 12px;
}

.mockup-toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mockup-segmented {
  display: flex;
  align-items: center;
  gap: 4px;
}

.mockup-seg {
  font-size: 11.5px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: var(--radius-full);
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  color: var(--text-primary);
}

.mockup-seg.active {
  background: var(--accent) !important;
  border-color: var(--accent) !important;
  color: var(--text-inverse) !important;
  font-weight: 700;
}

.mockup-pill-filter {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  background: var(--bg-surface);
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
}

.mockup-action-btn {
  font-size: 11.5px;
  font-weight: 700;
  padding: 5px 14px;
  border-radius: var(--radius-full);
  background: var(--accent);
  color: var(--text-inverse);
}

/* Mockup Subject Cards Grid */
.mockup-cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.mockup-subject-card {
  background: var(--bg-surface);
  border: var(--border-card);
  border-radius: var(--radius-xl);
  padding: 16px 18px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-sizing: border-box;
}

.mockup-card-top {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.mockup-card-icon-badge {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  background: rgba(80, 85, 55, 0.08);
  color: var(--olive-deep);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
  flex-shrink: 0;
}

.mockup-card-title-group {
  flex: 1;
  min-width: 0;
}

.mockup-card-code {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.mockup-card-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.25;
}

.mockup-card-prof {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}

.mockup-term-tag {
  font-size: 10.5px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  background: var(--bg-surface-hover);
  color: var(--text-secondary);
  width: fit-content;
}

.mockup-metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  padding: 8px 10px;
  background: var(--bg-surface-hover);
  border-radius: var(--radius-md);
}

.mockup-m-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.m-label {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-muted);
}

.m-val {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--text-primary);
  font-family: var(--font-numeric);
}

.mockup-standing-pill {
  font-size: 11px;
  font-weight: 700;
  padding: 0;
  background: transparent !important;
  border: none !important;
  white-space: nowrap;
}

.mockup-standing-pill.excellent {
  color: var(--success);
}

.mockup-standing-pill.superior {
  color: var(--olive-deep);
}

.mockup-standing-pill.verygood {
  color: var(--olive-mid);
}

.mockup-plan-badge {
  font-size: 11px;
  font-weight: 600;
  color: var(--success);
}`;

css = css.replace(oldMockupCss, newMockupCss);
fs.writeFileSync('css/style.css', css, 'utf-8');

console.log('Successfully switched landing page to light-first and updated hero mockup preview!');
