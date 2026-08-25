import fs from 'fs';

let css = fs.readFileSync('css/style.css', 'utf-8');

css = css.replace(
  /\.settings-card\s*\{[\s\S]*?border:\s*var\(--border-card\);/,
  `.settings-card {\n  background: var(--bg-surface);\n  border: none !important;`
);

fs.writeFileSync('css/style.css', css, 'utf-8');
console.log('Successfully removed card borders from settings page!');
