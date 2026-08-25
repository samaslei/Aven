import fs from 'fs';

let css = fs.readFileSync('css/style.css', 'utf-8');

// 1. Update .grades-layout
const oldGradesLayout = `.grades-layout {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 24px;
  align-items: flex-start;
  width: 100%;
  max-width: 1320px;
  margin: 0 auto;
  padding: 0 12px;
  min-width: 0;
  box-sizing: border-box;
}

@media (max-width: 1024px) {
  .grades-layout {
    grid-template-columns: 1fr;
    padding: 0;
  }
}`;

const newGradesLayout = `.grades-layout {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 24px;
  align-items: flex-start;
  width: 100%;
  max-width: 1140px;
  margin: 0 auto;
  min-width: 0;
  box-sizing: border-box;
}

@media (max-width: 1024px) {
  .grades-layout {
    grid-template-columns: 1fr;
  }
}`;

css = css.replace(oldGradesLayout, newGradesLayout);

// 2. Update .browser-panel-content
const oldPanelContent = `.browser-panel-content {
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

const newPanelContent = `.browser-panel-content {
  background: var(--bg-surface);
  border: var(--border-card);
  border-radius: 0 var(--radius-lg) var(--radius-lg) var(--radius-lg);
  padding: 28px 36px;
  display: flex;
  flex-direction: column;
  gap: 22px;
  box-shadow: 0 2px 12px -1px rgba(0, 0, 0, 0.26), 0 1px 3px 0 rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.035);
  position: relative;
  z-index: 1;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

@media (max-width: 1024px) {
  .browser-panel-content {
    padding: 24px 24px;
  }
}

@media (max-width: 768px) {
  .browser-panel-content {
    padding: 18px 14px;
  }
}`;

css = css.replace(oldPanelContent, newPanelContent);

// 3. Update .term-breakdown-container and .overall-breakdown-container
const oldBreakdownContainer = `.term-breakdown-container,
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

const newBreakdownContainer = `.term-breakdown-container,
.overall-breakdown-container {
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;
  max-width: 820px;
  margin: 0 auto;
  min-width: 0;
  box-sizing: border-box;
}`;

css = css.replace(oldBreakdownContainer, newBreakdownContainer);

// 4. Update .view-content-area
const oldViewContentArea = `.view-content-area {
  width: 100%;
  max-width: 1360px;
  margin: 0 auto;
  min-width: 0;
  box-sizing: border-box;
}`;

const newViewContentArea = `.view-content-area {
  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
  min-width: 0;
  box-sizing: border-box;
}`;

css = css.replace(oldViewContentArea, newViewContentArea);

// 5. Update .grade-entries-table column widths for tighter cohesion
css = css.replace(
  `/* Minimal Assessment Entries Table */
.grade-entries-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}`,
  `/* Minimal Assessment Entries Table */
.grade-entries-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  table-layout: auto;
}`
);

fs.writeFileSync('css/style.css', css, 'utf-8');

console.log('Successfully tightened Grades layout to eliminate excessive middle whitespace!');
