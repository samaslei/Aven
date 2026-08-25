import fs from 'fs';

let css = fs.readFileSync('css/style.css', 'utf-8');

const oldPanelContent = `.browser-panel-content {
  background: var(--bg-surface);
  border: var(--border-card);
  border-radius: 0 var(--radius-lg) var(--radius-lg) var(--radius-lg);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  box-shadow: 0 2px 12px -1px rgba(0, 0, 0, 0.26), 0 1px 3px 0 rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.035);
  position: relative;
  z-index: 1;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}`;

const newPanelContent = `.browser-panel-content {
  background: var(--bg-surface);
  border: var(--border-card);
  border-radius: 0 var(--radius-lg) var(--radius-lg) var(--radius-lg);
  padding: 32px 56px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  box-shadow: 0 2px 12px -1px rgba(0, 0, 0, 0.26), 0 1px 3px 0 rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.035);
  position: relative;
  z-index: 1;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

@media (max-width: 1024px) {
  .browser-panel-content {
    padding: 28px 36px;
  }
}

@media (max-width: 768px) {
  .browser-panel-content {
    padding: 20px 16px;
  }
}`;

css = css.replace(oldPanelContent, newPanelContent);

const oldBreakdownContainer = `.term-breakdown-container,
.overall-breakdown-container {
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;
  min-width: 0;
}`;

const newBreakdownContainer = `.term-breakdown-container,
.overall-breakdown-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  max-width: 1060px;
  margin: 0 auto;
  min-width: 0;
  box-sizing: border-box;
}`;

css = css.replace(oldBreakdownContainer, newBreakdownContainer);

fs.writeFileSync('css/style.css', css, 'utf-8');

console.log('Successfully adjusted Grades page side spacing to shift content inward and reduce empty space in the middle!');
