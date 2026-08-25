import fs from 'fs';

let css = fs.readFileSync('css/style.css', 'utf-8');

// 1. Update Base Reset & Typography
const oldBaseReset = `/* Base Reset */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  height: 100%;
}

body {
  font-family: var(--font-sans);
  background-color: var(--bg-app);
  color: var(--text-primary);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  overflow-x: hidden;
  transition: background-color 0.25s cubic-bezier(0.16, 1, 0.3, 1), color 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}`;

const newBaseReset = `/* Base Reset */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  height: 100%;
}

body {
  font-family: var(--font-sans);
  background-color: var(--bg-app);
  color: var(--text-primary);
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  overflow-x: hidden;
  transition: background-color 0.25s cubic-bezier(0.16, 1, 0.3, 1), color 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-sans);
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.25;
  color: var(--text-primary);
}

h1 { font-size: 26px; font-weight: 800; }
h2 { font-size: 20px; font-weight: 700; }
h3 { font-size: 17px; font-weight: 700; }
h4 { font-size: 14.5px; font-weight: 700; }

label, .form-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: var(--text-secondary);
  line-height: 1.4;
}`;

css = css.replace(oldBaseReset, newBaseReset);

// 2. Update Buttons to pill shape & solid black fill / white outline
const oldBtnBlock = `/* ==========================================================================
   Buttons & Form Controls
   ========================================================================== */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 7px 14px;
  font-size: 13px;
  font-weight: 600;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-default);
  background-color: var(--bg-surface);
  color: var(--text-primary);
  cursor: pointer;
  transition: var(--transition);
  white-space: nowrap;
  user-select: none;
  box-shadow: var(--shadow-sm);
}

.btn:hover {
  background-color: var(--bg-surface-hover);
  border-color: var(--border-strong);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn:active {
  transform: translateY(1px) scale(0.98);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.btn-primary {
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
}

.btn-danger {
  background-color: var(--danger-surface);
  border-color: var(--danger-border);
  color: var(--danger);
}

.btn-danger:hover {
  background-color: var(--danger);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.35);
}

.btn-ghost {
  background: transparent;
  border-color: transparent;
  color: var(--text-secondary);
  box-shadow: none;
}

.btn-ghost:hover {
  background: var(--bg-surface-hover);
  color: var(--text-primary);
  box-shadow: none;
}

.btn-sm {
  padding: 5px 11px;
  font-size: 12px;
}

.btn-icon {
  padding: 6px;
  border-radius: var(--radius-md);
  width: 32px;
  height: 32px;
}`;

const newBtnBlock = `/* ==========================================================================
   Buttons & Form Controls (Reference Fully Rounded Pill Style)
   ========================================================================== */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 600;
  border-radius: var(--radius-full);
  border: 1px solid var(--border-default);
  background-color: var(--bg-surface);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.16s cubic-bezier(0.16, 1, 0.3, 1);
  white-space: nowrap;
  user-select: none;
  box-shadow: var(--shadow-sm);
}

.btn:hover {
  background-color: var(--bg-surface-hover);
  border-color: var(--border-strong);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn:active {
  transform: translateY(1px) scale(0.98);
}

/* Solid Black Primary Button */
.btn-primary {
  background-color: var(--accent);
  border: 1px solid var(--accent);
  color: var(--text-inverse) !important;
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--accent-hover);
  border-color: var(--accent-hover);
  color: var(--text-inverse) !important;
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.btn-primary svg {
  color: var(--text-inverse) !important;
  stroke: var(--text-inverse) !important;
}

/* Outline / Secondary Button */
.btn-secondary,
.btn-outline {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-default);
  color: var(--text-primary);
  border-radius: var(--radius-full);
}

.btn-secondary:hover,
.btn-outline:hover {
  background-color: var(--bg-surface-hover);
  border-color: var(--border-strong);
  color: var(--text-primary);
}

.btn-danger {
  background-color: var(--danger-surface);
  border-color: var(--danger-border);
  color: var(--danger);
  border-radius: var(--radius-full);
}

.btn-danger:hover {
  background-color: var(--danger);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(194, 65, 54, 0.30);
}

.btn-ghost {
  background: transparent;
  border-color: transparent;
  color: var(--text-secondary);
  box-shadow: none;
  border-radius: var(--radius-full);
}

.btn-ghost:hover {
  background: var(--bg-surface-hover);
  color: var(--text-primary);
  box-shadow: none;
}

.btn-sm {
  padding: 5px 14px;
  font-size: 12px;
  border-radius: var(--radius-full);
}

.btn-icon {
  padding: 0;
  border-radius: var(--radius-full);
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}`;

css = css.replace(oldBtnBlock, newBtnBlock);

fs.writeFileSync('css/style.css', css, 'utf-8');
console.log('Successfully updated typography and pill button styling!');
