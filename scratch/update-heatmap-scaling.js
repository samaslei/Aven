import fs from 'fs';

let css = fs.readFileSync('css/style.css', 'utf-8');

const oldHeatmapCss = `/* Heatmap body — day labels + months side by side */
.heatmap-body-row {
  display: flex;
  gap: 6px;
  align-items: flex-start;
  overflow-x: auto;
  padding-bottom: 4px;
}

/* Day labels column */
.day-labels-col {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding-top: 18px; /* aligns with cells, below month label */
  flex-shrink: 0;
}

.day-label-item {
  height: 11px;
  line-height: 11px;
  font-size: 9.5px;
  font-family: var(--font-sans);
  color: var(--text-muted);
  width: 14px;
  text-align: right;
}

/* Month blocks row */
.months-area {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

/* Individual month block */
.month-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.month-block-label {
  font-size: 9.5px;
  font-family: var(--font-sans);
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.04em;
  height: 14px;
  line-height: 14px;
  white-space: nowrap;
}

/* Weeks inside a month block */
.month-block-weeks {
  display: flex;
  gap: 3px;
}

/* Week column (7 cells tall) */
.week-column {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

/* Individual day cells */
.cal-day-cell {
  width: 11px;
  height: 11px;
  border-radius: 2px;
  border: 1px solid var(--heat-border);
  background-color: var(--heat-empty);
  cursor: pointer;
  transition: box-shadow 0.18s cubic-bezier(0.16, 1, 0.3, 1), transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.18s ease;
  position: relative;
}`;

const newHeatmapCss = `/* Heatmap body — day labels + months side by side (Edge-to-Edge Fluid Fill) */
.heatmap-body-row {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  overflow-x: auto;
  padding-bottom: 6px;
  width: 100%;
  box-sizing: border-box;
}

/* Day labels column */
.day-labels-col {
  display: flex;
  flex-direction: column;
  gap: 3.5px;
  padding-top: 19px; /* aligns with cell rows, below month label */
  flex-shrink: 0;
  width: 14px;
}

.day-label-item {
  height: 12.5px;
  line-height: 12.5px;
  font-size: 9.5px;
  font-family: var(--font-sans);
  font-weight: 600;
  color: var(--text-muted);
  width: 14px;
  text-align: right;
}

/* Month blocks row (Expands proportionally across full container width) */
.months-area {
  display: flex;
  gap: 8px;
  flex: 1;
  width: 100%;
  justify-content: space-between;
  min-width: 640px;
}

/* Individual month block */
.month-block {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1;
  min-width: 0;
}

.month-block-label {
  font-size: 10px;
  font-family: var(--font-sans);
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.03em;
  height: 14px;
  line-height: 14px;
  white-space: nowrap;
}

/* Weeks inside a month block */
.month-block-weeks {
  display: flex;
  gap: 3.5px;
  justify-content: space-between;
  width: 100%;
}

/* Week column (7 cells tall) */
.week-column {
  display: flex;
  flex-direction: column;
  gap: 3.5px;
  flex: 1;
  min-width: 0;
  align-items: center;
}

/* Individual day cells (Proportionally scaled up, rounded squares) */
.cal-day-cell {
  width: 100%;
  max-width: 14px;
  min-width: 11px;
  aspect-ratio: 1 / 1;
  height: auto;
  border-radius: 2.5px;
  border: 1px solid var(--heat-border);
  background-color: var(--heat-empty);
  cursor: pointer;
  transition: box-shadow 0.18s cubic-bezier(0.16, 1, 0.3, 1), transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.18s ease;
  position: relative;
  box-sizing: border-box;
}`;

css = css.replace(oldHeatmapCss, newHeatmapCss);
fs.writeFileSync('css/style.css', css, 'utf-8');

console.log('Successfully updated yearly heatmap grid to stretch full width with proportionally scaled cells!');
