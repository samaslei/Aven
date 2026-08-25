import fs from 'fs';

let css = fs.readFileSync('css/style.css', 'utf-8');

// 1. Replace Dark Theme tokens in :root
const oldRoot = `:root {
  /* Color Palette - Dark Theme (Default) */
  --bg-app: #0b0c0e;
  --bg-sidebar: #101114;
  --bg-surface: #16171b;
  --bg-surface-elevated: #1c1e24;
  --bg-surface-hover: #22252c;
  --bg-input: #121316;
  
  --border-subtle: rgba(255, 255, 255, 0.04);
  --border-default: rgba(255, 255, 255, 0.07);
  --border-strong: rgba(255, 255, 255, 0.12);
  --border-focus: #6366f1;

  --text-primary: #f3f4f6;
  --text-secondary: #9ca3af;
  --text-muted: #6b7280;
  --text-inverse: #0b0c0e;

  --accent: #5856eb;
  --accent-hover: #4f46e5;
  --accent-surface: rgba(88, 86, 235, 0.12);
  --accent-border: rgba(88, 86, 235, 0.35);

  --danger: #ef4444;
  --danger-surface: rgba(239, 68, 68, 0.12);
  --danger-border: rgba(239, 68, 68, 0.3);

  --success: #10b981;
  --success-surface: rgba(16, 185, 129, 0.12);
  --warning: #f59e0b;

  --tag-bg: var(--bg-surface-elevated);
  --tag-color: var(--text-secondary);
  --tag-border: var(--border-subtle);

  /* Glassmorphism System - Apple-Inspired Translucent Materials (Dark) */
  --bg-glass-sidebar: rgba(16, 17, 20, 0.92);
  --bg-glass-modal: rgba(22, 24, 30, 0.94);
  --bg-glass-modal-footer: rgba(16, 17, 21, 0.96);
  --bg-glass-dropdown: rgba(26, 28, 35, 0.95);
  --bg-glass-floating: rgba(20, 22, 27, 0.93);
  --glass-blur: blur(10px) saturate(130%);
  --glass-blur-modal: blur(14px) saturate(140%);
  --glass-blur-sm: blur(8px) saturate(120%);
  --glass-border: rgba(255, 255, 255, 0.05);
  --glass-border-elevated: rgba(255, 255, 255, 0.08);
  --glass-specular: inset 0 1px 0 0 rgba(255, 255, 255, 0.025);

  /* LeetCode Heatmap Palette (Dark) */
  --heat-empty: #17191d;
  --heat-level-1: #0e4429;
  --heat-level-2: #006d32;
  --heat-level-3: #26a641;
  --heat-level-4: #39d353;
  --heat-border: rgba(255, 255, 255, 0.04);

  /* Shadows & Radius */
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 18px;
  --radius-full: 9999px;

  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.22);
  --shadow-md: 0 3px 8px -1px rgba(0, 0, 0, 0.28);
  --shadow-lg: 0 8px 20px -3px rgba(0, 0, 0, 0.32);
  --shadow-modal: 0 18px 44px -8px rgba(0, 0, 0, 0.45), 0 6px 16px -2px rgba(0, 0, 0, 0.25);
  --shadow-glow: 0 0 20px rgba(99, 102, 241, 0.25);

  --sidebar-width: 240px;
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  --font-numeric: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  --font-mono: 'Geist Mono', 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  --transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  --transition-smooth: all 0.32s cubic-bezier(0.16, 1, 0.3, 1);
}`;

const newRoot = `:root {
  /* Color Palette - Dark Theme (Deep Charcoal & Warm Sage) */
  --bg-app: #141512;
  --bg-sidebar: #10110e;
  --bg-surface: #1e201b;
  --bg-surface-elevated: #262822;
  --bg-surface-hover: #2c2e27;
  --bg-input: #181915;
  
  --border-subtle: rgba(235, 230, 215, 0.05);
  --border-default: rgba(235, 230, 215, 0.09);
  --border-strong: rgba(235, 230, 215, 0.15);
  --border-focus: #a8b082;

  --text-primary: #f3f2eb;
  --text-secondary: #a7a99b;
  --text-muted: #717467;
  --text-inverse: #141512;

  /* Primary Active Pill & High Contrast */
  --accent: #ede9dc;
  --accent-hover: #ded9ca;
  --accent-surface: rgba(168, 176, 130, 0.14);
  --accent-border: rgba(168, 176, 130, 0.28);

  /* Olive / Sage Domain Colors */
  --olive-deep: #70784d;
  --olive-mid: #a8b082;
  --olive-light: #cdd4aa;

  --danger: #e05a4f;
  --danger-surface: rgba(224, 90, 79, 0.14);
  --danger-border: rgba(224, 90, 79, 0.3);

  --success: #7ea86f;
  --success-surface: rgba(126, 168, 111, 0.14);
  --warning: #d9a043;

  --tag-bg: var(--bg-surface-elevated);
  --tag-color: var(--text-secondary);
  --tag-border: var(--border-subtle);

  /* Glassmorphism System - Translucent Sage Charcoal */
  --bg-glass-sidebar: rgba(16, 17, 14, 0.94);
  --bg-glass-modal: rgba(30, 32, 27, 0.96);
  --bg-glass-modal-footer: rgba(24, 25, 21, 0.98);
  --bg-glass-dropdown: rgba(38, 40, 34, 0.96);
  --bg-glass-floating: rgba(30, 32, 27, 0.94);
  --glass-blur: blur(10px) saturate(130%);
  --glass-blur-modal: blur(14px) saturate(140%);
  --glass-blur-sm: blur(8px) saturate(120%);
  --glass-border: rgba(235, 230, 215, 0.06);
  --glass-border-elevated: rgba(235, 230, 215, 0.10);
  --glass-specular: inset 0 1px 0 0 rgba(235, 230, 215, 0.04);

  /* LeetCode Heatmap Palette (Dark Olive) */
  --heat-empty: #21231d;
  --heat-level-1: #3b4324;
  --heat-level-2: #586337;
  --heat-level-3: #7c8a4d;
  --heat-level-4: #a8b868;
  --heat-border: rgba(235, 230, 215, 0.04);

  /* Shadows & Radius */
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 18px;
  --radius-full: 9999px;

  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.28);
  --shadow-md: 0 3px 8px -1px rgba(0, 0, 0, 0.35);
  --shadow-lg: 0 8px 20px -3px rgba(0, 0, 0, 0.42);
  --shadow-modal: 0 18px 44px -8px rgba(0, 0, 0, 0.55), 0 6px 16px -2px rgba(0, 0, 0, 0.35);
  --shadow-glow: 0 0 20px rgba(168, 176, 130, 0.20);

  --sidebar-width: 240px;
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  --font-numeric: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  --font-mono: 'Geist Mono', 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  --transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  --transition-smooth: all 0.32s cubic-bezier(0.16, 1, 0.3, 1);
}`;

css = css.replace(oldRoot, newRoot);

// 2. Replace Light Theme tokens in [data-theme="light"]
const oldLight = `[data-theme="light"] {
  /* Crisp Canvas & Surfaces (Cards visually lift off canvas) */
  --bg-app: #edf0f6;
  --bg-sidebar: #e5ebf4;
  --bg-surface: #ffffff;
  --bg-surface-elevated: #ffffff;
  --bg-surface-hover: #f3f6fb;
  --bg-input: #ffffff;

  /* Sharpened High-Contrast Borders */
  --border-subtle: rgba(15, 23, 42, 0.06);
  --border-default: rgba(15, 23, 42, 0.10);
  --border-strong: rgba(15, 23, 42, 0.16);
  --border-focus: #4338ca;

  /* WCAG AAA High Contrast Typography */
  --text-primary: #090d16;
  --text-secondary: #334155;
  --text-muted: #526075;
  --text-inverse: #ffffff;

  --accent: #4338ca;
  --accent-hover: #3730a3;
  --accent-surface: rgba(67, 56, 202, 0.08);
  --accent-border: rgba(67, 56, 202, 0.24);

  --danger: #dc2626;
  --danger-surface: rgba(220, 38, 38, 0.08);
  --danger-border: rgba(220, 38, 38, 0.24);

  --success: #059669;
  --success-surface: rgba(5, 150, 105, 0.08);
  --warning: #d97706;

  --tag-bg: rgba(67, 56, 202, 0.07);
  --tag-color: #3730a3;
  --tag-border: rgba(67, 56, 202, 0.18);

  /* Glassmorphism System - Apple-Inspired Translucent Materials (Light) */
  --bg-glass-sidebar: rgba(235, 240, 248, 0.92);
  --bg-glass-modal: rgba(255, 255, 255, 0.96);
  --bg-glass-modal-footer: rgba(246, 248, 252, 0.98);
  --bg-glass-dropdown: rgba(255, 255, 255, 0.97);
  --bg-glass-floating: rgba(255, 255, 255, 0.94);
  --glass-blur: blur(10px) saturate(130%);
  --glass-blur-modal: blur(14px) saturate(140%);
  --glass-blur-sm: blur(8px) saturate(120%);
  --glass-border: rgba(15, 23, 42, 0.06);
  --glass-border-elevated: rgba(15, 23, 42, 0.09);
  --glass-specular: inset 0 1px 0 0 rgba(255, 255, 255, 0.25);

  --heat-empty: #e2e6ed;
  --heat-level-1: #9be9a8;
  --heat-level-2: #40c463;
  --heat-level-3: #30a14e;
  --heat-level-4: #216e39;
  --heat-border: rgba(15, 23, 42, 0.06);

  --shadow-sm: 0 1px 3px 0 rgba(15, 23, 42, 0.07), 0 1px 2px -1px rgba(15, 23, 42, 0.04);
  --shadow-md: 0 4px 16px -2px rgba(15, 23, 42, 0.09), 0 2px 6px -1px rgba(15, 23, 42, 0.04);
  --shadow-lg: 0 14px 34px -4px rgba(15, 23, 42, 0.12), 0 4px 12px -2px rgba(15, 23, 42, 0.05);
  --shadow-modal: 0 16px 40px -8px rgba(15, 23, 42, 0.10), 0 4px 12px -2px rgba(15, 23, 42, 0.04);
  --shadow-glow: 0 0 24px rgba(67, 56, 202, 0.15);
}`;

const newLight = `[data-theme="light"] {
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

css = css.replace(oldLight, newLight);

// 3. Update .nav-link.active to solid pill contrast
const oldNavLinkActive = `.nav-link.active {
  background: linear-gradient(135deg, #6366f1 0%, #7c3aed 100%);
  color: #ffffff;
  border-color: transparent;
  box-shadow: 0 3px 14px rgba(124, 58, 237, 0.38);
  font-weight: 600;
}

.nav-link.active .nav-icon,
.nav-link.active span,
.nav-link.active svg {
  color: #ffffff;
}`;

const newNavLinkActive = `.nav-link.active {
  background: var(--accent);
  color: var(--text-inverse) !important;
  border-color: transparent;
  box-shadow: var(--shadow-sm);
  font-weight: 600;
}

.nav-link.active .nav-icon,
.nav-link.active span,
.nav-link.active svg,
.nav-link.active .nav-chevron {
  color: var(--text-inverse) !important;
}`;

css = css.replace(oldNavLinkActive, newNavLinkActive);

// 4. Update .btn-primary to solid contrast
const oldBtnPrimary = `.btn-primary {
  background: linear-gradient(135deg, #6366f1 0%, #7c3aed 100%);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: #ffffff;
  box-shadow: 0 3px 12px rgba(124, 58, 237, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.22);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%);
  border-color: rgba(255, 255, 255, 0.28);
  box-shadow: 0 6px 18px rgba(124, 58, 237, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.32);
  transform: translateY(-1px);
}`;

const newBtnPrimary = `.btn-primary {
  background: var(--accent);
  border: 1px solid var(--accent);
  color: var(--text-inverse);
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover:not(:disabled) {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
  color: var(--text-inverse);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}`;

css = css.replace(oldBtnPrimary, newBtnPrimary);

// 5. Update user profile button in sidebar
const oldUserProfileBtn = `.sidebar-user-block .user-profile-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 60%, #4338ca 100%);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.22);
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: transform 0.16s ease, box-shadow 0.16s ease, filter 0.16s ease;
}`;

const newUserProfileBtn = `.sidebar-user-block .user-profile-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--radius-lg);
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: var(--transition);
}`;

css = css.replace(oldUserProfileBtn, newUserProfileBtn);

// 6. Update popover active item
css = css.replaceAll(
  'background: linear-gradient(135deg, #6366f1 0%, #7c3aed 100%);',
  'background: var(--accent);'
);

fs.writeFileSync('css/style.css', css, 'utf-8');
console.log('Successfully applied new sage/khaki and olive palette tokens!');
