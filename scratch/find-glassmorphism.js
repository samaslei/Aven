import fs from 'fs';

const css = fs.readFileSync('css/style.css', 'utf-8');
const lines = css.split('\n');

console.log('--- Lines with backdrop-filter or blur ---');
lines.forEach((line, idx) => {
  if (/backdrop-filter|blur|--bg-glass/i.test(line)) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
