import fs from 'fs';

// 1. UPDATE css/style.css to include [data-theme="pure-black"] and [data-theme="pure-white"]
let css = fs.readFileSync('css/style.css', 'utf-8');

const pureThemesCss = `
/* ==========================================================================
   Pure Black OLED Dark Theme
   ========================================================================== */
[data-theme="pure-black"] {
  --bg-app: #000000;
  --bg-sidebar: #050505;
  --bg-surface: #0a0a0a;
  --bg-surface-elevated: #141414;
  --bg-surface-hover: #1c1c1c;
  --bg-input: #0d0d0d;

  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-default: rgba(255, 255, 255, 0.14);
  --border-strong: rgba(255, 255, 255, 0.24);
  --border-focus: #ffffff;

  --text-primary: #ffffff;
  --text-secondary: #a1a1aa;
  --text-muted: #71717a;
  --text-inverse: #000000;

  --accent: #ffffff;
  --accent-hover: #e4e4e7;
  --accent-surface: rgba(255, 255, 255, 0.10);
  --accent-border: rgba(255, 255, 255, 0.25);

  --olive-deep: #27272a;
  --olive-mid: #52525b;
  --olive-light: #a1a1aa;

  --danger: #ef4444;
  --danger-surface: rgba(239, 68, 68, 0.14);
  --danger-border: rgba(239, 68, 68, 0.3);

  --success: #22c55e;
  --success-surface: rgba(34, 197, 94, 0.14);
  --warning: #f59e0b;

  --tag-bg: #18181b;
  --tag-color: #d4d4d8;
  --tag-border: rgba(255, 255, 255, 0.12);

  --bg-glass-sidebar: #050505;
  --bg-glass-modal: #0a0a0a;
  --bg-glass-modal-footer: #0a0a0a;
  --bg-glass-dropdown: #141414;
  --bg-glass-floating: #0a0a0a;
  --glass-blur: none;
  --glass-blur-modal: none;
  --glass-blur-sm: none;
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-border-elevated: rgba(255, 255, 255, 0.14);
  --glass-specular: none;

  --heat-empty: #121212;
  --heat-level-1: #27272a;
  --heat-level-2: #3f3f46;
  --heat-level-3: #52525b;
  --heat-level-4: #a1a1aa;
  --heat-border: rgba(255, 255, 255, 0.06);

  --border-card: 1px solid rgba(255, 255, 255, 0.12);

  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.5);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.7);
  --shadow-lg: 0 10px 30px rgba(0, 0, 0, 0.85);
  --shadow-modal: 0 20px 50px rgba(0, 0, 0, 0.95);
  --shadow-glow: 0 0 20px rgba(255, 255, 255, 0.15);
}

/* ==========================================================================
   Pure White Minimalist Light Theme
   ========================================================================== */
[data-theme="pure-white"] {
  --bg-app: #f8fafc;
  --bg-sidebar: #ffffff;
  --bg-surface: #ffffff;
  --bg-surface-elevated: #ffffff;
  --bg-surface-hover: #f1f5f9;
  --bg-input: #ffffff;

  --border-subtle: #e2e8f0;
  --border-default: #cbd5e1;
  --border-strong: #94a3b8;
  --border-focus: #0f172a;

  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #64748b;
  --text-inverse: #ffffff;

  --accent: #0f172a;
  --accent-hover: #1e293b;
  --accent-surface: rgba(15, 23, 42, 0.06);
  --accent-border: rgba(15, 23, 42, 0.18);

  --olive-deep: #0f172a;
  --olive-mid: #475569;
  --olive-light: #94a3b8;

  --danger: #dc2626;
  --danger-surface: rgba(220, 38, 38, 0.08);
  --danger-border: rgba(220, 38, 38, 0.2);

  --success: #16a34a;
  --success-surface: rgba(22, 163, 74, 0.08);
  --warning: #d97706;

  --tag-bg: #f1f5f9;
  --tag-color: #334155;
  --tag-border: #e2e8f0;

  --bg-glass-sidebar: #ffffff;
  --bg-glass-modal: #ffffff;
  --bg-glass-modal-footer: #ffffff;
  --bg-glass-dropdown: #ffffff;
  --bg-glass-floating: #ffffff;
  --glass-blur: none;
  --glass-blur-modal: none;
  --glass-blur-sm: none;
  --glass-border: #e2e8f0;
  --glass-border-elevated: #cbd5e1;
  --glass-specular: none;

  --heat-empty: #f1f5f9;
  --heat-level-1: #cbd5e1;
  --heat-level-2: #94a3b8;
  --heat-level-3: #64748b;
  --heat-level-4: #334155;
  --heat-border: #e2e8f0;

  --border-card: 1px solid #e2e8f0;

  --shadow-sm: 0 1px 3px rgba(15, 23, 42, 0.05);
  --shadow-md: 0 4px 14px rgba(15, 23, 42, 0.06);
  --shadow-lg: 0 10px 28px rgba(15, 23, 42, 0.08);
  --shadow-modal: 0 20px 48px rgba(15, 23, 42, 0.12);
  --shadow-glow: 0 0 20px rgba(15, 23, 42, 0.10);
}

/* Card Styling for Pure White Light Theme */
[data-theme="pure-white"] .stat-card,
[data-theme="pure-white"] .subject-card,
[data-theme="pure-white"] .tool-card,
[data-theme="pure-white"] .browser-panel-content,
[data-theme="pure-white"] .category-breakdown-section,
[data-theme="pure-white"] .grade-summary-box,
[data-theme="pure-white"] .grades-subject-list,
[data-theme="pure-white"] .heatmap-block,
[data-theme="pure-white"] .heatmap-container,
[data-theme="pure-white"] .distribution-card,
[data-theme="pure-white"] .history-table-container,
[data-theme="pure-white"] .plans-layout-sidebar,
[data-theme="pure-white"] .plans-main-content,
[data-theme="pure-white"] .modal-card,
[data-theme="pure-white"] .auth-card {
  border: 1px solid #e2e8f0 !important;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04) !important;
}

[data-theme="pure-white"] .settings-card,
[data-theme="pure-white"] .settings-section {
  border: none !important;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.03) !important;
}

/* Theme Toggle Icons for Pure White Light */
[data-theme="pure-white"] .app-theme-toggle .icon-theme-sun,
[data-theme="pure-white"] .landing-theme-toggle .icon-theme-sun {
  display: none;
}

[data-theme="pure-white"] .app-theme-toggle .icon-theme-moon,
[data-theme="pure-white"] .landing-theme-toggle .icon-theme-moon {
  display: block;
}

/* Theme Selector Grid on Settings Page */
.theme-options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
  padding: 16px 20px;
}

.theme-option-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border-radius: var(--radius-lg);
  border: 1.5px solid var(--border-default);
  background: var(--bg-surface-elevated);
  cursor: pointer;
  user-select: none;
  transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}

.theme-option-card:hover {
  border-color: var(--accent);
  transform: translateY(-2px);
}

.theme-option-card.active {
  border-color: var(--accent);
  box-shadow: 0 0 0 1.5px var(--accent), var(--shadow-sm);
}

.theme-card-preview {
  height: 52px;
  border-radius: var(--radius-md);
  display: flex;
  overflow: hidden;
  border: 1px solid rgba(128, 128, 128, 0.2);
}

.theme-card-preview-sidebar {
  width: 28%;
  height: 100%;
}

.theme-card-preview-main {
  flex: 1;
  height: 100%;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.theme-card-preview-block {
  height: 8px;
  border-radius: 3px;
}

.theme-option-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.theme-option-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
}

.theme-option-desc {
  font-size: 11.5px;
  color: var(--text-muted);
}

.theme-check-badge {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--accent);
  color: var(--text-inverse);
  display: none;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
}

.theme-option-card.active .theme-check-badge {
  display: flex;
}
`;

css += pureThemesCss;
fs.writeFileSync('css/style.css', css, 'utf-8');

console.log('Successfully added Pure Black and Pure White theme definitions to style.css!');
