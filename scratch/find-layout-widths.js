import fs from 'fs';

const css = fs.readFileSync('css/style.css', 'utf-8');
const lines = css.split('\n');

for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  if (
    l.includes('100vw') ||
    l.includes('main-viewport') ||
    l.includes('max-width: 1400px') ||
    l.includes('max-width: 1200px') ||
    l.includes('max-width: 1600px') ||
    l.includes('scrollbar-gutter') ||
    l.includes('overflow-y: scroll') ||
    l.includes('overflow-y: auto') ||
    l.includes('scrollbar-width') ||
    l.includes('::-webkit-scrollbar') ||
    l.includes('view-content-area') ||
    l.includes('.grades-container') ||
    l.includes('.grades-view')
  ) {
    console.log((i + 1) + ': ' + l.trim());
  }
}
