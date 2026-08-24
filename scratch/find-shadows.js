import fs from 'fs';

const css = fs.readFileSync('css/style.css', 'utf-8');
const lines = css.split('\n');
console.log('Total lines:', lines.length);

const keywords = ['box-shadow', 'inset 0', '--glass-specular', 'category-card', 'stat-card', 'standing', 'subject-card', 'settings-card', 'modal-content', 'modal-dialog'];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (const kw of keywords) {
    if (line.includes(kw)) {
      console.log((i + 1) + ': ' + line.trim());
      break;
    }
  }
}
