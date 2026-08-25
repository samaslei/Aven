import fs from 'fs';
import path from 'path';

function scanDir(dir, results = []) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    if (f === 'node_modules' || f === '.git' || f === 'dist' || f === 'scratch' || f === '.tempmediaStorage' || f === '.user_uploaded') continue;
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      scanDir(full, results);
    } else {
      const content = fs.readFileSync(full, 'utf-8');
      const lines = content.split('\n').length;
      results.push({ path: full, lines, sizeKB: (stat.size / 1024).toFixed(1) });
    }
  }
  return results;
}

const res = scanDir('.');
res.sort((a, b) => b.lines - a.lines);
console.log('=== CODEBASE INVENTORY (Sorted by Line Count) ===');
res.forEach(r => console.log(`${r.path.padEnd(45)} | ${String(r.lines).padStart(5)} lines | ${r.sizeKB.padStart(6)} KB`));
