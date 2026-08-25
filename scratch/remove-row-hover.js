import fs from 'fs';

let css = fs.readFileSync('css/style.css', 'utf-8');

// 1. Remove .cat-table tr:hover td rule
css = css.replace(
  `.cat-table tr:hover td {\n  background: var(--bg-surface-hover);\n}`,
  `/* Entry rows have no row-level hover background change */\n.cat-table tr:hover td {\n  background: transparent;\n}`
);

// 2. Remove .grade-entries-table tr.cat-totals-row:hover td rule
css = css.replace(
  `.grade-entries-table tr.cat-totals-row:hover td {\n  background: var(--bg-surface-hover) !important;\n}`,
  `/* Totals rows have no row-level hover background change */\n.grade-entries-table tr.cat-totals-row:hover td {\n  background: transparent !important;\n}`
);

// 3. Add explicit rule to ensure all rows in grade-entries-table remain static on hover
const staticRowHoverCss = `
/* Disable row-level hover background on Grades assessment tables */
.grade-entries-table tr:hover td,
.grade-entries-table tr.grade-entry-row:hover td,
.grade-entries-table tr.cat-totals-row:hover td,
.grade-entries-table tbody tr:hover td,
.grade-entries-table tfoot tr:hover td {
  background: transparent !important;
}
`;

css += staticRowHoverCss;
fs.writeFileSync('css/style.css', css, 'utf-8');

console.log('Successfully removed hover background highlight from entry rows and totals rows in Grades category tables!');
