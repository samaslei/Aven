import fs from 'fs';

// 1. Update css/style.css with precise reference colors and card structures
let css = fs.readFileSync('css/style.css', 'utf-8');

// Ensure Light Mode tokens match the reference image exactly
const oldLightTokens = `[data-theme="light"] {
  /* Warm Sage/Khaki Canvas & Crisp Off-White Surfaces (FeedBacker Reference) */
  --bg-app: #cbc5af;
  --bg-sidebar: #e8e4d3;
  --bg-surface: #faf8f2;
  --bg-surface-elevated: #ffffff;
  --bg-surface-hover: #f1ede1;
  --bg-input: #ffffff;

  /* Subtle Warm Organic Borders */
  --border-subtle: rgba(45, 50, 35, 0.08);
  --border-default: rgba(45, 50, 35, 0.14);
  --border-strong: rgba(45, 50, 35, 0.22);
  --border-focus: #141512;

  /* High-Contrast Deep Charcoal Typography */
  --text-primary: #1b1c18;
  --text-secondary: #56594d;
  --text-muted: #808375;
  --text-inverse: #faf8f2;

  /* Primary Active Pill: Solid Black */
  --accent: #141512;
  --accent-hover: #262822;
  --accent-surface: rgba(80, 85, 55, 0.10);
  --accent-border: rgba(80, 85, 55, 0.25);

  /* Olive / Khaki Domain Colors */
  --olive-deep: #505537;
  --olive-mid: #868a67;
  --olive-light: #c2c7a4;

  --danger: #c24136;
  --danger-surface: rgba(194, 65, 54, 0.10);
  --danger-border: rgba(194, 65, 54, 0.24);

  --success: #47683b;
  --success-surface: rgba(71, 104, 59, 0.12);
  --warning: #b88628;

  --tag-bg: rgba(80, 85, 55, 0.08);
  --tag-color: #505537;
  --tag-border: rgba(80, 85, 55, 0.18);

  /* Glassmorphism System - Translucent Warm Sage Materials */
  --bg-glass-sidebar: rgba(232, 228, 211, 0.94);
  --bg-glass-modal: rgba(250, 248, 242, 0.97);
  --bg-glass-modal-footer: rgba(244, 240, 230, 0.98);
  --bg-glass-dropdown: rgba(255, 255, 255, 0.97);
  --bg-glass-floating: rgba(250, 248, 242, 0.95);
  --glass-blur: blur(10px) saturate(130%);
  --glass-blur-modal: blur(14px) saturate(140%);
  --glass-blur-sm: blur(8px) saturate(120%);
  --glass-border: rgba(45, 50, 35, 0.08);
  --glass-border-elevated: rgba(45, 50, 35, 0.12);
  --glass-specular: inset 0 1px 0 0 rgba(255, 255, 255, 0.40);

  --heat-empty: rgba(45, 50, 35, 0.09);
  --heat-level-1: #c2c7a4;
  --heat-level-2: #92986e;
  --heat-level-3: #656b43;
  --heat-level-4: #3e4424;
  --heat-border: rgba(45, 50, 35, 0.08);

  --shadow-sm: 0 1px 3px 0 rgba(45, 50, 35, 0.08), 0 1px 2px -1px rgba(45, 50, 35, 0.04);
  --shadow-md: 0 4px 14px -2px rgba(45, 50, 35, 0.10), 0 2px 6px -1px rgba(45, 50, 35, 0.04);
  --shadow-lg: 0 12px 28px -4px rgba(45, 50, 35, 0.14), 0 4px 12px -2px rgba(45, 50, 35, 0.05);
  --shadow-modal: 0 16px 40px -8px rgba(45, 50, 35, 0.16), 0 4px 12px -2px rgba(45, 50, 35, 0.06);
  --shadow-glow: 0 0 20px rgba(80, 85, 55, 0.18);
}`;

const newLightTokens = `[data-theme="light"] {
  /* Warm Sage/Khaki Canvas & Crisp Off-White Surfaces (FeedBacker Exact Match) */
  --bg-app: #c5bfa8;                     /* Deep, warm earthy sage canvas */
  --bg-sidebar: #e9e4d4;                 /* Soft distinct cream-sage navigation rail */
  --bg-surface: #fbfaf5;                 /* Crisp light cream/off-white cards */
  --bg-surface-elevated: #ffffff;        /* Pure white elevated overlays */
  --bg-surface-hover: #f1ede0;           /* Soft warm hover surface */
  --bg-input: #ffffff;                   /* Form inputs */

  /* Subtle Warm Organic Borders */
  --border-subtle: rgba(45, 50, 35, 0.07);
  --border-default: rgba(45, 50, 35, 0.12);
  --border-strong: rgba(45, 50, 35, 0.20);
  --border-focus: #141512;

  /* High-Contrast Deep Charcoal Typography */
  --text-primary: #191a15;
  --text-secondary: #56594d;
  --text-muted: #7c7f72;
  --text-inverse: #faf8f2;

  /* Primary Active Pill: Solid Black */
  --accent: #141512;
  --accent-hover: #262822;
  --accent-surface: rgba(80, 85, 55, 0.10);
  --accent-border: rgba(80, 85, 55, 0.25);

  /* Olive / Khaki Domain Colors */
  --olive-deep: #505537;
  --olive-mid: #868a67;
  --olive-light: #c2c7a4;

  --danger: #c24136;
  --danger-surface: rgba(194, 65, 54, 0.10);
  --danger-border: rgba(194, 65, 54, 0.24);

  --success: #47683b;
  --success-surface: rgba(71, 104, 59, 0.12);
  --warning: #b88628;

  --tag-bg: rgba(80, 85, 55, 0.08);
  --tag-color: #505537;
  --tag-border: rgba(80, 85, 55, 0.18);

  /* Glassmorphism System - Translucent Warm Sage Materials */
  --bg-glass-sidebar: #e9e4d4;
  --bg-glass-modal: rgba(251, 250, 245, 0.98);
  --bg-glass-modal-footer: rgba(245, 242, 233, 0.98);
  --bg-glass-dropdown: rgba(255, 255, 255, 0.98);
  --bg-glass-floating: rgba(251, 250, 245, 0.96);
  --glass-blur: none;
  --glass-blur-modal: blur(10px);
  --glass-blur-sm: blur(6px);
  --glass-border: rgba(45, 50, 35, 0.08);
  --glass-border-elevated: rgba(45, 50, 35, 0.12);
  --glass-specular: none;

  --heat-empty: rgba(45, 50, 35, 0.10);
  --heat-level-1: #c2c7a4;
  --heat-level-2: #92986e;
  --heat-level-3: #656b43;
  --heat-level-4: #3e4424;
  --heat-border: rgba(45, 50, 35, 0.08);

  --shadow-sm: 0 2px 6px -1px rgba(45, 50, 35, 0.08), 0 1px 2px 0 rgba(45, 50, 35, 0.04);
  --shadow-md: 0 6px 18px -3px rgba(45, 50, 35, 0.12), 0 2px 6px -1px rgba(45, 50, 35, 0.06);
  --shadow-lg: 0 14px 30px -4px rgba(45, 50, 35, 0.16), 0 4px 12px -2px rgba(45, 50, 35, 0.06);
  --shadow-modal: 0 18px 44px -8px rgba(45, 50, 35, 0.18), 0 6px 16px -2px rgba(45, 50, 35, 0.08);
  --shadow-glow: 0 0 20px rgba(80, 85, 55, 0.18);
}`;

css = css.replace(oldLightTokens, newLightTokens);

// 2. Restyle stat-card with prominent circular icon container
const oldStatCardRule = `.stat-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: 22px 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 130px;
  gap: 10px;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  box-shadow: var(--shadow-sm);
  box-sizing: border-box;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.stat-card-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

/* Circular Icon Badges next to stats (Reference Style) */
.stat-card-icon {
  width: 34px;
  height: 34px;
  padding: 7px;
  border-radius: var(--radius-full);
  background: var(--bg-surface-hover);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-sizing: border-box;
  transition: var(--transition);
}

.stat-card:hover .stat-card-icon {
  background: var(--accent-surface);
  color: var(--accent);
}

.stat-card-value {
  font-family: var(--font-numeric);
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-primary);
  line-height: 1.1;
}

.stat-card-subtitle {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 400;
}`;

const newStatCardRule = `.stat-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: 20px 22px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: var(--shadow-sm);
  box-sizing: border-box;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* Prominent Circular Icon Badge (Left Side, Reference Style) */
.stat-icon-circle {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-full);
  background: var(--bg-surface-hover);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  transition: var(--transition);
}

.stat-card:hover .stat-icon-circle {
  background: var(--accent-surface);
  color: var(--accent);
}

.stat-card-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.stat-card-title {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-secondary);
  letter-spacing: -0.01em;
}

.stat-card-value {
  font-family: var(--font-numeric);
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1;
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-primary);
  line-height: 1.15;
}

.stat-card-subtitle {
  font-size: 11.5px;
  color: var(--text-muted);
  font-weight: 400;
  line-height: 1.3;
  margin-top: 2px;
}`;

css = css.replace(oldStatCardRule, newStatCardRule);

// 3. Restyle filter chips to match reference black-pill active, white-outline inactive
const oldFilterChips = `.filter-chip {
  padding: 6px 14px;
  border-radius: var(--radius-full);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  font-size: 12.5px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

[data-theme="light"] .filter-chip {
  background: #ffffff;
  border-color: var(--border-subtle);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
}

.filter-chip:hover:not(.active) {
  border-color: var(--border-default);
  background: var(--bg-surface-hover);
  color: var(--text-primary);
  transform: translateY(-1px);
}

.filter-chip.active {
  background: var(--accent);
  border-color: transparent;
  color: #ffffff;
  font-weight: 600;
  box-shadow: 0 3px 12px rgba(124, 58, 237, 0.35);
}`;

const newFilterChips = `.filter-chip {
  padding: 7px 16px;
  border-radius: var(--radius-full);
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.16s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: var(--shadow-sm);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.filter-chip:hover:not(.active) {
  background: var(--bg-surface-hover);
  border-color: var(--border-strong);
  transform: translateY(-1px);
}

.filter-chip.active {
  background: var(--accent) !important;
  border-color: var(--accent) !important;
  color: var(--text-inverse) !important;
  font-weight: 700;
  box-shadow: var(--shadow-sm);
}`;

css = css.replace(oldFilterChips, newFilterChips);

// 4. Restyle Subject Cards to match Reference Card Layout
const oldSubjectCardStyles = `.subject-card {
  --sub-color: #505537;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: 22px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-sizing: border-box;
}

.subject-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--border-default);
}`;

const newSubjectCardStyles = `.subject-card {
  --sub-color: #505537;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: 22px 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  position: relative;
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-sizing: border-box;
}

.subject-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--border-default);
}

.subject-card-header-row {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.subject-icon-badge {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: var(--bg-surface-hover);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.subject-title-area {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
  min-width: 0;
}

.subject-code-tag {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.subject-card-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.3;
  margin: 0;
}

.subject-card-instructor {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.subject-meta-pills {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.subject-pill-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: var(--radius-full);
  background: var(--bg-surface-hover);
  color: var(--text-secondary);
}

.subject-metrics-strip {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 12px 14px;
  background: var(--bg-surface-hover);
  border-radius: var(--radius-lg);
}

.subject-metric-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.subject-metric-lbl {
  font-size: 10.5px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.subject-metric-val {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  font-family: var(--font-numeric);
}

.subject-card-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-top: -4px;
}`;

css = css.replace(oldSubjectCardStyles, newSubjectCardStyles);

fs.writeFileSync('css/style.css', css, 'utf-8');

// 5. Update js/subjects.js for new stat-card and subject-card HTML markup
let subjectsJs = fs.readFileSync('js/subjects.js', 'utf-8');

const oldStatsBanner = `    <div class="stats-banner">
      <div class="stat-card stat-card-blue">
        <div class="stat-card-header">
          <span class="stat-card-title">Enrolled Subjects</span>
          <svg class="stat-card-icon stat-icon-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
        </div>
        <div class="stat-card-value">\${activeSubjects.length} Active</div>
        <div class="stat-card-subtitle">
          <span>\${allSubjects.length} total enrolled courses</span>
        </div>
      </div>

      <div class="stat-card stat-card-teal">
        <div class="stat-card-header">
          <span class="stat-card-title">Study Time (Week)</span>
          <svg class="stat-card-icon stat-icon-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <div class="stat-card-value">\${weeklyHours}h</div>
        <div class="stat-card-subtitle">
          <span>\${streakStats.totalHours}h all-time · \${streakStats.totalSessions} sessions</span>
        </div>
      </div>

      <div class="stat-card stat-card-indigo">
        <div class="stat-card-header">
          <span class="stat-card-title">Cumulative GPA</span>
          <svg class="stat-card-icon stat-icon-indigo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
            <polyline points="16 7 22 7 22 13"></polyline>
          </svg>
        </div>
        <div class="stat-card-value" style="color: \${getStandingColor(academicStanding.rawAvgPct)};">\${academicStanding.gpa !== '—' ? academicStanding.gpa : '—'}</div>
        <div class="stat-card-subtitle">
          <span>Avg \${academicStanding.avgPct} · \${academicStanding.gradedSubjects}/\${activeSubjects.length} graded</span>
        </div>
      </div>

      <div class="stat-card stat-card-purple">
        <div class="stat-card-header">
          <span class="stat-card-title">Study Streak</span>
          <svg class="stat-card-icon stat-icon-amber" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
          </svg>
        </div>
        <div class="stat-card-value">\${streakStats.currentStreak} \${streakStats.currentStreak === 1 ? 'day' : 'days'}</div>
        <div class="stat-card-subtitle">
          <span>Personal best: \${streakStats.longestStreak} days streak</span>
        </div>
      </div>
    </div>`;

const newStatsBanner = `    <div class="stats-banner">
      <div class="stat-card">
        <div class="stat-icon-circle">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
        </div>
        <div class="stat-card-body">
          <span class="stat-card-title">Enrolled Subjects</span>
          <div class="stat-card-value">\${activeSubjects.length} Active</div>
          <span class="stat-card-subtitle">\${allSubjects.length} total enrolled courses</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-circle">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <div class="stat-card-body">
          <span class="stat-card-title">Study Time (Week)</span>
          <div class="stat-card-value">\${weeklyHours}h</div>
          <span class="stat-card-subtitle">\${streakStats.totalHours}h all-time · \${streakStats.totalSessions} sessions</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-circle">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
            <polyline points="16 7 22 7 22 13"></polyline>
          </svg>
        </div>
        <div class="stat-card-body">
          <span class="stat-card-title">Cumulative GPA</span>
          <div class="stat-card-value" style="color: \${getStandingColor(academicStanding.rawAvgPct)};">\${academicStanding.gpa !== '—' ? academicStanding.gpa : '—'}</div>
          <span class="stat-card-subtitle">Avg \${academicStanding.avgPct} · \${academicStanding.gradedSubjects}/\${activeSubjects.length} graded</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-circle">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
          </svg>
        </div>
        <div class="stat-card-body">
          <span class="stat-card-title">Study Streak</span>
          <div class="stat-card-value">\${streakStats.currentStreak} \${streakStats.currentStreak === 1 ? 'day' : 'days'}</div>
          <span class="stat-card-subtitle">Personal best: \${streakStats.longestStreak} days streak</span>
        </div>
      </div>
    </div>`;

subjectsJs = subjectsJs.replace(oldStatsBanner, newStatsBanner);

// Redesign renderSubjectCard in js/subjects.js
const oldRenderSubjectCard = `function renderSubjectCard(sub) {
  const totalMins = store.getSubjectTotalStudyMinutes(sub.id);
  const hoursFormatted = (totalMins / 60).toFixed(1) + 'h';
  const gradeStats = store.calculateSubjectGrade(sub.id);
  const plan = store.getStudyPlanBySubject(sub.id);
  const standingClass = getStandingClass(gradeStats.overallPercentage);

  const semAbbr = (sub.semester || '')
    .replace('1st Semester', '1st Sem')
    .replace('2nd Semester', '2nd Sem');

  return \`
    <div class="subject-card \${sub.archived ? 'archived' : ''}" data-id="\${sub.id}" style="--sub-color: \${sub.color || '#6366f1'};">
      <div class="subject-card-top">
        <div class="subject-header-left">
          <div class="subject-color-bar" style="background-color: \${sub.color || '#6366f1'};"></div>
          <div class="subject-list-title-block">
            <div class="subject-list-header-line">
              \${sub.code ? \`<span class="subject-list-code">\${sub.code}</span>\` : ''}
              <h4 class="subject-name">\${sub.name}</h4>
            </div>
            \${sub.instructor ? \`
              <span class="subject-list-instructor">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                \${sub.instructor}
              </span>
            \` : ''}
          </div>
        </div>
      </div>

      <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
        <span class="subject-term-badge">
          <span>\${sub.year_level}</span>
          <span class="term-dot">·</span>
          <span>\${semAbbr}</span>
        </span>
        \${getArchiveReasonBadge(sub)}
      </div>

      <div class="subject-metrics-row">
        <div class="subject-metric">
          <span class="metric-label">Study Time</span>
          <span class="metric-value">\${hoursFormatted}</span>
        </div>
        <div class="subject-metric">
          <span class="metric-label">Standing</span>
          <div class="subject-standing-pill \${standingClass}" style="margin-top: 2px; font-size: 12px;">
            <span class="standing-dot" style="background: currentColor;"></span>
            <span>\${gradeStats.summaryLine}</span>
          </div>
        </div>
        <div class="subject-metric">
          <span class="metric-label">Study Plan</span>
          <span class="subject-plan-pill \${plan ? 'ready' : ''}" style="margin-top: 4px;">
            \${plan ? '● Ready' : '—'}
          </span>
        </div>
      </div>

      <div class="subject-card-actions">
        \${!sub.archived ? \`<button class="btn btn-ghost btn-sm btn-edit-sub" data-id="\${sub.id}">Edit</button>\` : ''}
        <button class="btn btn-ghost btn-sm btn-archive-sub" data-id="\${sub.id}">
          \${sub.archived ? 'Unarchive' : 'Archive'}
        </button>
        <button class="btn btn-ghost btn-sm btn-delete-sub" data-id="\${sub.id}" style="color: var(--danger);">Delete</button>
      </div>
    </div>
  \`;
}`;

const newRenderSubjectCard = `function renderSubjectCard(sub) {
  const totalMins = store.getSubjectTotalStudyMinutes(sub.id);
  const hoursFormatted = (totalMins / 60).toFixed(1) + 'h';
  const gradeStats = store.calculateSubjectGrade(sub.id);
  const plan = store.getStudyPlanBySubject(sub.id);
  const standingClass = getStandingClass(gradeStats.overallPercentage);

  const semAbbr = (sub.semester || '')
    .replace('1st Semester', '1st Sem')
    .replace('2nd Semester', '2nd Sem');

  // Extract 2 initials for the circular subject badge
  const initials = (sub.code || sub.name || 'CS').substring(0, 2).toUpperCase();

  return \`
    <div class="subject-card \${sub.archived ? 'archived' : ''}" data-id="\${sub.id}">
      <div class="subject-card-header-row">
        <!-- Circular Icon Badge (Reference Style) -->
        <div class="subject-icon-badge" style="background: rgba(80, 85, 55, 0.09); color: var(--olive-deep);">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
        </div>

        <div class="subject-title-area">
          \${sub.code ? \`<span class="subject-code-tag">\${sub.code}</span>\` : ''}
          <h4 class="subject-card-name">\${sub.name}</h4>
          \${sub.instructor ? \`
            <span class="subject-card-instructor">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              \${sub.instructor}
            </span>
          \` : ''}
        </div>
      </div>

      <div class="subject-meta-pills">
        <span class="subject-pill-tag">\${sub.year_level} · \${semAbbr}</span>
        \${getArchiveReasonBadge(sub)}
      </div>

      <!-- Clean Minimalist Metrics Strip -->
      <div class="subject-metrics-strip">
        <div class="subject-metric-col">
          <span class="subject-metric-lbl">Study Time</span>
          <span class="subject-metric-val">\${hoursFormatted}</span>
        </div>
        <div class="subject-metric-col">
          <span class="subject-metric-lbl">Standing</span>
          <span class="subject-metric-val" style="color: \${getStandingColor(gradeStats.overallPercentage)};">\${gradeStats.summaryLine}</span>
        </div>
        <div class="subject-metric-col">
          <span class="subject-metric-lbl">Plan</span>
          <span class="subject-metric-val">\${plan ? 'Ready' : '—'}</span>
        </div>
      </div>

      <!-- Pill Action Buttons -->
      <div class="subject-card-actions">
        \${!sub.archived ? \`<button class="btn btn-secondary btn-sm btn-edit-sub" data-id="\${sub.id}">Edit</button>\` : ''}
        <button class="btn btn-secondary btn-sm btn-archive-sub" data-id="\${sub.id}">
          \${sub.archived ? 'Unarchive' : 'Archive'}
        </button>
        <button class="btn btn-danger btn-sm btn-delete-sub" data-id="\${sub.id}">Delete</button>
      </div>
    </div>
  \`;
}`;

subjectsJs = subjectsJs.replace(oldRenderSubjectCard, newRenderSubjectCard);
fs.writeFileSync('js/subjects.js', subjectsJs, 'utf-8');

console.log('Successfully applied deep reference redesign pass!');
