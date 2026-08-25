import fs from 'fs';

let css = fs.readFileSync('css/style.css', 'utf-8');

const oldLegendCss = `.dist-legend-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 250px;
  overflow-y: auto;
  padding-right: 4px;
}

/* Reference Single-Line Legend Row */
.dist-legend-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 7px 10px;
  border-radius: var(--radius-md);
  transition: background-color 0.14s ease, transform 0.14s ease;
  cursor: default;
}

.dist-legend-row:hover {
  background: var(--bg-surface-hover);
  transform: translateX(2px);
}

.dist-legend-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

/* Color-Coded Course Pill in Donut Legend (Matching Slice Color) */
.dist-code-pill {
  font-family: var(--font-numeric);
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1;
  font-size: 11px;
  font-weight: 700;
  padding: 2.5px 8px;
  border-radius: var(--radius-full);
  line-height: 1.2;
  white-space: nowrap;
  letter-spacing: 0.02em;
  flex-shrink: 0;
  transition: transform 0.16s ease;
}

.dist-subject-name {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dist-legend-right {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-family: var(--font-numeric);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
  text-align: right;
}

.dist-hours-val {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
}

.dist-pct-val {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 500;
}`;

const newLegendCss = `/* 2-Column Responsive Legend Grid */
.dist-legend-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px 14px;
  width: 100%;
  box-sizing: border-box;
}

@media (max-width: 680px) {
  .dist-legend-list {
    grid-template-columns: 1fr;
  }
}

/* Reference Single-Line Legend Row */
.dist-legend-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 8px;
  border-radius: var(--radius-md);
  transition: background-color 0.14s ease, transform 0.14s ease;
  cursor: default;
  min-width: 0;
  box-sizing: border-box;
}

.dist-legend-row:hover {
  background: var(--bg-surface-hover);
  transform: translateX(2px);
}

.dist-legend-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
  overflow: hidden;
}

/* Color-Coded Course Pill in Donut Legend (Matching Slice Color) */
.dist-code-pill {
  font-family: var(--font-numeric);
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1;
  font-size: 10.5px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: var(--radius-full);
  line-height: 1.2;
  white-space: nowrap;
  letter-spacing: 0.02em;
  flex-shrink: 0;
  transition: transform 0.16s ease;
}

.dist-subject-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dist-legend-right {
  display: flex;
  align-items: baseline;
  gap: 4px;
  font-family: var(--font-numeric);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
  text-align: right;
}

.dist-hours-val {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--text-primary);
}

.dist-pct-val {
  font-size: 10.5px;
  color: var(--text-muted);
  font-weight: 500;
}`;

css = css.replace(oldLegendCss, newLegendCss);
fs.writeFileSync('css/style.css', css, 'utf-8');

console.log('Successfully switched Study Time Distribution legend to 2-column grid layout!');
