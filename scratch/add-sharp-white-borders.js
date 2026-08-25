import fs from 'fs';

let css = fs.readFileSync('css/style.css', 'utf-8');

// 1. Add --border-card to :root (Dark mode)
const oldRootShadows = `  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.28);
  --shadow-md: 0 3px 8px -1px rgba(0, 0, 0, 0.35);
  --shadow-lg: 0 8px 20px -3px rgba(0, 0, 0, 0.42);
  --shadow-modal: 0 18px 44px -8px rgba(0, 0, 0, 0.55), 0 6px 16px -2px rgba(0, 0, 0, 0.35);
  --shadow-glow: 0 0 20px rgba(168, 176, 130, 0.20);`;

const newRootShadows = `  --border-card: 1px solid rgba(255, 255, 255, 0.08);

  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.28);
  --shadow-md: 0 3px 8px -1px rgba(0, 0, 0, 0.35);
  --shadow-lg: 0 8px 20px -3px rgba(0, 0, 0, 0.42);
  --shadow-modal: 0 18px 44px -8px rgba(0, 0, 0, 0.55), 0 6px 16px -2px rgba(0, 0, 0, 0.35);
  --shadow-glow: 0 0 20px rgba(168, 176, 130, 0.20);`;

css = css.replace(oldRootShadows, newRootShadows);

// 2. Add --border-card to [data-theme="light"] (Light mode: Crisp 1px White Border)
const oldLightShadows = `  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4px 24px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 12px 36px rgba(0, 0, 0, 0.10);
  --shadow-modal: 0 20px 50px rgba(0, 0, 0, 0.14);`;

const newLightShadows = `  --border-card: 1px solid rgba(255, 255, 255, 0.90);

  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4px 24px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 12px 36px rgba(0, 0, 0, 0.10);
  --shadow-modal: 0 20px 50px rgba(0, 0, 0, 0.14);`;

css = css.replace(oldLightShadows, newLightShadows);

// 3. Update .stat-card
css = css.replace(
  `.stat-card {
  background: var(--bg-surface);
  border: none;
  border-radius: var(--radius-xl);
  padding: 20px 22px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
}`,
  `.stat-card {
  background: var(--bg-surface);
  border: var(--border-card);
  border-radius: var(--radius-xl);
  padding: 20px 22px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
}`
);

// 4. Update .subject-card
css = css.replace(
  `.subject-card {
  --sub-color: #505537;
  background: var(--bg-surface);
  border: none;
  border-radius: var(--radius-xl);
  padding: 22px 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  position: relative;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-sizing: border-box;
}`,
  `.subject-card {
  --sub-color: #505537;
  background: var(--bg-surface);
  border: var(--border-card);
  border-radius: var(--radius-xl);
  padding: 22px 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  position: relative;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-sizing: border-box;
}`
);

// 5. Update .subjects-list-card
css = css.replace(
  `.subjects-list-card {
  background: var(--bg-surface);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-subtle);
}`,
  `.subjects-list-card {
  background: var(--bg-surface);
  border: var(--border-card);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}`
);

// 6. Update Study Tracker cards (.heatmap-container-card, .distribution-container-card, .journey-milestone-card, .tool-card)
css = css.replace(
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
}`,
  `.heatmap-container-card {
  background: var(--bg-surface);
  border: var(--border-card);
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
  border-radius: var(--radius-xl);
  padding: 22px 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
}`,
  `.distribution-container-card {
  background: var(--bg-surface);
  border: var(--border-card);
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
}`,
  `.journey-milestone-card {
  background: var(--bg-surface);
  border: var(--border-card);
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

// Also handle .pomodoro-card and .manual-log-card (via .tool-card)
if (!css.includes('.tool-card {')) {
  css += `\n.tool-card {
  background: var(--bg-surface);
  border: var(--border-card);
  border-radius: var(--radius-xl);
  padding: 22px 24px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
}\n`;
}

// 7. Update Grades page cards (.grade-summary-box, details.grade-scale-details, .category-card-wrap)
css = css.replace(
  `.grade-summary-box {
  background: var(--bg-surface);
  border: none;
  border-radius: var(--radius-xl);
  padding: 22px 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 14px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
}`,
  `.grade-summary-box {
  background: var(--bg-surface);
  border: var(--border-card);
  border-radius: var(--radius-xl);
  padding: 22px 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 14px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
}`
);

css = css.replace(
  `details.grade-scale-details {
  background: var(--bg-surface);
  border: none;
  border-radius: var(--radius-xl);
  padding: 16px 20px;
  cursor: pointer;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}`,
  `details.grade-scale-details {
  background: var(--bg-surface);
  border: var(--border-card);
  border-radius: var(--radius-xl);
  padding: 16px 20px;
  cursor: pointer;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}`
);

// 8. Update Study Plans page cards (.plans-sidebar, .plan-viewer-container)
css = css.replace(
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
}`,
  `.plans-sidebar {
  background: var(--bg-surface);
  border: var(--border-card);
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
  border-radius: var(--radius-xl);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
  transition: all 0.24s cubic-bezier(0.16, 1, 0.3, 1);
}`,
  `.plan-viewer-container {
  background: var(--bg-surface);
  border: var(--border-card);
  border-radius: var(--radius-xl);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
  transition: all 0.24s cubic-bezier(0.16, 1, 0.3, 1);
}`
);

// 9. Update Settings page cards (.settings-profile-hero, .settings-card)
css = css.replace(
  `.settings-profile-hero {
  padding: 22px 24px;
  background: var(--bg-surface);
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  color: var(--text-primary);
}`,
  `.settings-profile-hero {
  padding: 22px 24px;
  background: var(--bg-surface);
  border: var(--border-card);
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  color: var(--text-primary);
}`
);

css = css.replace(
  `.settings-card {
  background: var(--bg-surface);
  border: none;
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
  transition: var(--transition);
}`,
  `.settings-card {
  background: var(--bg-surface);
  border: var(--border-card);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
  transition: var(--transition);
}`
);

// 10. Update Modal card
css = css.replace(
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
}`,
  `.modal-card {
  background: var(--bg-surface);
  border: var(--border-card);
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

fs.writeFileSync('css/style.css', css, 'utf-8');
console.log('Successfully applied sharp white 1px border additively across all cards site-wide!');
