import fs from 'fs';

let css = fs.readFileSync('css/style.css', 'utf-8');

// 1. Update Glass Tokens in :root (dark mode)
const oldDarkGlassTokens = `  /* Glassmorphism System - Translucent Sage Charcoal */
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
  --glass-specular: inset 0 1px 0 0 rgba(235, 230, 215, 0.04);`;

const newDarkGlassTokens = `  /* Opaque Solid Surface System (Glassmorphism Removed) */
  --bg-glass-sidebar: var(--bg-sidebar);
  --bg-glass-modal: var(--bg-surface);
  --bg-glass-modal-footer: var(--bg-surface);
  --bg-glass-dropdown: var(--bg-surface-elevated);
  --bg-glass-floating: var(--bg-surface);
  --glass-blur: none;
  --glass-blur-modal: none;
  --glass-blur-sm: none;
  --glass-border: var(--border-subtle);
  --glass-border-elevated: var(--border-default);
  --glass-specular: none;`;

css = css.replace(oldDarkGlassTokens, newDarkGlassTokens);

// 2. Update Glass Tokens in [data-theme="light"]
const oldLightGlassTokens = `  /* Glassmorphism System - Translucent Warm Sage Materials */
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
  --glass-specular: none;`;

const newLightGlassTokens = `  /* Opaque Solid Surface System (Glassmorphism Removed) */
  --bg-glass-sidebar: #e9e4d4;
  --bg-glass-modal: #ffffff;
  --bg-glass-modal-footer: #ffffff;
  --bg-glass-dropdown: #ffffff;
  --bg-glass-floating: #ffffff;
  --glass-blur: none;
  --glass-blur-modal: none;
  --glass-blur-sm: none;
  --glass-border: rgba(45, 50, 35, 0.08);
  --glass-border-elevated: rgba(45, 50, 35, 0.12);
  --glass-specular: none;`;

css = css.replace(oldLightGlassTokens, newLightGlassTokens);

// 3. Clean up .user-popover
css = css.replace(
  `.user-popover {
  position: absolute;
  background: var(--bg-glass-dropdown);
  backdrop-filter: var(--glass-blur-sm);
  -webkit-backdrop-filter: var(--glass-blur-sm);
  border: 1px solid var(--glass-border-elevated);
  border-radius: var(--radius-lg);
  padding: 8px;
  box-shadow: var(--shadow-lg), var(--glass-specular);
  display: none;
  flex-direction: column;
  gap: 4px;
  z-index: 500;
  min-width: 180px;
}`,
  `.user-popover {
  position: absolute;
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: 8px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  display: none;
  flex-direction: column;
  gap: 4px;
  z-index: 500;
  min-width: 180px;
}`
);

// 4. Clean up .heatmap-tooltip
css = css.replace(
  `.heatmap-tooltip {
  position: fixed;
  background: var(--bg-glass-dropdown);
  backdrop-filter: var(--glass-blur-sm);
  -webkit-backdrop-filter: var(--glass-blur-sm);
  border: 1px solid var(--glass-border-elevated);
  padding: 8px 12px;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg), var(--glass-specular);
  font-size: 12px;
  pointer-events: none;
  z-index: 999;
  display: none;
  flex-direction: column;
  gap: 3px;
  white-space: nowrap;
}`,
  `.heatmap-tooltip {
  position: fixed;
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-default);
  padding: 8px 12px;
  border-radius: var(--radius-md);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  font-size: 12px;
  pointer-events: none;
  z-index: 999;
  display: none;
  flex-direction: column;
  gap: 3px;
  white-space: nowrap;
}`
);

// 5. Clean up .modal-card, .modal-footer, .modal-overlay
css = css.replace(
  `  background: rgba(0, 0, 0, 0.64);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);`,
  `  background: rgba(0, 0, 0, 0.45);`
);

css = css.replace(
  `.modal-card {
  background: var(--bg-glass-modal);
  backdrop-filter: var(--glass-blur-modal);
  -webkit-backdrop-filter: var(--glass-blur-modal);
  border: none;
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 520px;
  box-shadow: 0 18px 44px -8px rgba(0, 0, 0, 0.45), 0 6px 16px -2px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-height: 90vh;
  animation: modalScaleIn 0.26s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}`,
  `.modal-card {
  background: var(--bg-surface);
  border: none;
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 520px;
  box-shadow: 0 16px 44px rgba(0, 0, 0, 0.16);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-height: 90vh;
  animation: modalScaleIn 0.26s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}`
);

css = css.replace(
  `.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid var(--glass-border);
  background: var(--bg-glass-modal-footer);
}`,
  `.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-surface);
}`
);

// 6. Clean up .toast
css = css.replace(
  `.toast {
  background: var(--bg-glass-dropdown);
  backdrop-filter: var(--glass-blur-sm);
  -webkit-backdrop-filter: var(--glass-blur-sm);
  border: 1px solid var(--glass-border-elevated);
  border-radius: var(--radius-md);
  padding: 10px 16px;
  box-shadow: var(--shadow-lg), var(--glass-specular);
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 10px;
  pointer-events: auto;
  animation: toastSlideIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  max-width: 380px;
}`,
  `.toast {
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: 10px 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.14);
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 10px;
  pointer-events: auto;
  animation: toastSlideIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  max-width: 380px;
}`
);

// 7. Clean up Mobile top bar & backdrop
css = css.replace(
  `  background-color: var(--bg-glass-sidebar);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-bottom: 1px solid var(--glass-border);
  box-shadow: var(--glass-specular);`,
  `  background-color: var(--bg-sidebar);
  border-bottom: 1px solid var(--border-default);`
);

css = css.replace(
  `  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);`,
  `  background: rgba(0, 0, 0, 0.45);`
);

// 8. Clean up Study Tracker cards: .heatmap-container-card, .distribution-container-card, .journey-milestone-card, .manual-log-card, .pomodoro-card
css = css.replace(
  `.heatmap-container-card {
  background: var(--bg-surface);
  border: none;
  border-radius: var(--radius-lg);
  padding: 20px 24px 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: var(--shadow-sm); border: 1px solid var(--border-subtle); border-radius: var(--radius-xl);
}

[data-theme="light"] .heatmap-container-card {
  box-shadow: 0 2px 8px -1px rgba(15, 23, 42, 0.05), 0 1px 3px 0 rgba(15, 23, 42, 0.02), inset 0 1px 0 rgba(255, 255, 255, 0.40);
}`,
  `.heatmap-container-card {
  background: var(--bg-surface);
  border: none;
  border-radius: var(--radius-xl);
  padding: 20px 24px 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
}`
);

css = css.replace(
  `.distribution-container-card {
  background: var(--bg-surface);
  border: none;
  border-radius: var(--radius-lg);
  padding: 22px 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  box-shadow: var(--shadow-sm); border: 1px solid var(--border-subtle); border-radius: var(--radius-xl);
}

[data-theme="light"] .distribution-container-card {
  box-shadow: 0 2px 8px -1px rgba(15, 23, 42, 0.05), 0 1px 3px 0 rgba(15, 23, 42, 0.02), inset 0 1px 0 rgba(255, 255, 255, 0.40);
}`,
  `.distribution-container-card {
  background: var(--bg-surface);
  border: none;
  border-radius: var(--radius-xl);
  padding: 22px 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
}`
);

css = css.replace(
  `.journey-milestone-card {
  background-color: var(--bg-surface);
  background-image: radial-gradient(var(--border-subtle) 1px, transparent 1px);
  background-size: 16px 16px;
  background-position: center center;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 16px;
}`,
  `.journey-milestone-card {
  background: var(--bg-surface);
  border: none;
  border-radius: var(--radius-xl);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 16px;
  box-sizing: border-box;
}`
);

// 9. Clean up Study Plans page: .plans-sidebar, .plan-viewer-container, .plan-viewer-header
css = css.replace(
  `.plans-sidebar {
  background: var(--bg-surface);
  border: none;
  border-radius: var(--radius-lg);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  box-shadow: var(--shadow-sm); border: 1px solid var(--border-subtle); border-radius: var(--radius-xl);
}

[data-theme="light"] .plans-sidebar {
  box-shadow: 0 2px 8px -1px rgba(15, 23, 42, 0.05), 0 1px 3px 0 rgba(15, 23, 42, 0.02), inset 0 1px 0 rgba(255, 255, 255, 0.40);
}`,
  `.plans-sidebar {
  background: var(--bg-surface);
  border: none;
  border-radius: var(--radius-xl);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
}`
);

css = css.replace(
  `.plan-viewer-container {
  background: var(--bg-surface);
  border: none;
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 2px 12px -1px rgba(0, 0, 0, 0.26), 0 1px 3px 0 rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.035);
  transition: all 0.24s cubic-bezier(0.16, 1, 0.3, 1);
}

[data-theme="light"] .plan-viewer-container {
  box-shadow: 0 2px 8px -1px rgba(15, 23, 42, 0.05), 0 1px 3px 0 rgba(15, 23, 42, 0.02), inset 0 1px 0 rgba(255, 255, 255, 0.40);
}`,
  `.plan-viewer-container {
  background: var(--bg-surface);
  border: none;
  border-radius: var(--radius-xl);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
  transition: all 0.24s cubic-bezier(0.16, 1, 0.3, 1);
}`
);

css = css.replace(
  `.plan-viewer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.14) 0%, rgba(124, 58, 237, 0.05) 50%, var(--bg-surface-elevated) 100%);
  flex-shrink: 0;
  gap: 12px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

[data-theme="light"] .plan-viewer-header {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(124, 58, 237, 0.02) 50%, #ffffff 100%);
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.40);
}`,
  `.plan-viewer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-surface);
  flex-shrink: 0;
  gap: 12px;
}`
);

// 10. Clean up Settings page: .settings-profile-hero, .settings-profile-avatar, .settings-card
css = css.replace(
  `.settings-profile-hero {
  padding: 22px 24px;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 55%, #4338ca 100%);
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 18px rgba(79, 70, 229, 0.30), inset 0 1px 0 rgba(255, 255, 255, 0.25);
  color: #ffffff;
}

.settings-profile-avatar {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(4px);
  border: 2px solid rgba(255, 255, 255, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 16px;
  color: #ffffff;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.settings-profile-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.settings-profile-name {
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.01em;
}

.settings-profile-email {
  font-size: 12.5px;
  color: rgba(255, 255, 255, 0.85);
}

.settings-profile-badge {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  background: rgba(255, 255, 255, 0.18);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  margin-top: 4px;
  width: fit-content;
}`,
  `.settings-profile-hero {
  padding: 22px 24px;
  background: var(--bg-surface);
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  color: var(--text-primary);
}

.settings-profile-avatar {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  background: rgba(80, 85, 55, 0.08);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 16px;
  color: var(--olive-deep);
  flex-shrink: 0;
}

.settings-profile-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.settings-profile-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.settings-profile-email {
  font-size: 12.5px;
  color: var(--text-muted);
}

.settings-profile-badge {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
  color: var(--accent);
  background: var(--accent-surface);
  border: 1px solid var(--accent-border);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  margin-top: 4px;
  width: fit-content;
}`
);

css = css.replace(
  `.settings-card {
  background: var(--bg-surface-elevated);
  border: none;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm); border: 1px solid var(--border-subtle); border-radius: var(--radius-xl);
  transition: var(--transition);
}

[data-theme="light"] .settings-card {
  background: var(--bg-surface);
  box-shadow: 0 2px 8px -1px rgba(15, 23, 42, 0.05), 0 1px 3px 0 rgba(15, 23, 42, 0.02), inset 0 1px 0 rgba(255, 255, 255, 0.40);
}`,
  `.settings-card {
  background: var(--bg-surface);
  border: none;
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
  transition: var(--transition);
}`
);

// 11. Clean up Grades details and other popovers
css = css.replace(
  `details.grade-scale-details {
  background: var(--bg-surface-elevated);
  border: none;
  border-radius: var(--radius-md);
  padding: 14px 18px;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08);
}`,
  `details.grade-scale-details {
  background: var(--bg-surface);
  border: none;
  border-radius: var(--radius-xl);
  padding: 16px 20px;
  cursor: pointer;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}`
);

fs.writeFileSync('css/style.css', css, 'utf-8');
console.log('Successfully removed all glassmorphism from Study Tracker, Grades, Study Plans, Settings, modals, and sidebars!');
