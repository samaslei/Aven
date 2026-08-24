import fs from 'fs';

const css = fs.readFileSync('css/style.css', 'utf-8');
const lines = css.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('box-shadow:') && (line.includes('inset 0 1px') || line.includes('rgba(0, 0, 0, 0.') || line.includes('--glass-specular') || line.includes('--shadow-'))) {
    // print selector context
    let sel = '';
    for (let j = Math.max(0, i - 10); j <= i; j++) {
      if (lines[j].includes('{')) sel = lines[j].trim();
    }
    console.log(`Line ${i + 1} (${sel}):\n  ${line.trim()}\n`);
  }
}
