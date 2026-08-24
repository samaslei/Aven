import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DIST = path.resolve(ROOT, 'dist');

if (fs.existsSync(DIST)) {
  fs.rmSync(DIST, { recursive: true, force: true });
}
fs.mkdirSync(DIST, { recursive: true });

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src)) {
      copyRecursive(path.join(src, item), path.join(dest, item));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

const itemsToCopy = ['index.html', 'favicon.svg', 'css', 'js'];
for (const item of itemsToCopy) {
  const src = path.join(ROOT, item);
  const dest = path.join(DIST, item);
  if (fs.existsSync(src)) {
    copyRecursive(src, dest);
    console.log(`Copied ${item} -> dist/${item}`);
  }
}

console.log('Production static build created successfully in dist/.');
