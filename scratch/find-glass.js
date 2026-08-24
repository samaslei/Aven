import fs from 'fs';

const css = fs.readFileSync('css/style.css', 'utf-8');
const lines = css.split('\n');

for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  if (l.includes('--bg-glass-') || l.includes('--glass-') || l.includes('backdrop-filter') || l.includes('saturate(')) {
    console.log((i + 1) + ': ' + l.trim());
  }
}
