import fs from 'fs';

const css = fs.readFileSync('css/style.css', 'utf-8');
const lines = css.split('\n');

for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  if (l.includes('.grades-layout') || l.includes('.grades-main') || l.includes('.grades-subject-list') || l.includes('.grades-container') || l.includes('.grades-view') || l.includes('.grades-content')) {
    console.log((i + 1) + ': ' + l.trim());
    for (let k = i; k < Math.min(lines.length, i + 15); k++) {
      console.log('  ' + lines[k].trim());
      if (lines[k].includes('}')) break;
    }
    console.log('---');
  }
}
