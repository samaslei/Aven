import fs from 'fs';

const css = fs.readFileSync('css/style.css', 'utf-8');
const lines = css.split('\n');

const selectors = [
  '.subject-card',
  '.stat-card',
  '.tracker-card',
  '.heatmap-card',
  '.category-card',
  '.grade-summary-box',
  '.plans-sidebar',
  '.plan-subject-item',
  '.plan-viewer-container',
  '.settings-card',
  '.modal-card',
  '.modal-dialog',
  '.template-preset-card'
];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (const s of selectors) {
    if (line.includes(s) && line.includes('{')) {
      console.log(`Line ${i + 1}: ${line.trim()}`);
      for (let k = i; k < Math.min(lines.length, i + 20); k++) {
        console.log(`  ${lines[k].trim()}`);
        if (lines[k].includes('}')) break;
      }
      console.log('---------------------------');
      break;
    }
  }
}
