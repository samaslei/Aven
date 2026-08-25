import fs from 'fs';

const css = fs.readFileSync('css/style.css', 'utf-8');
const lines = css.split('\n');

const lineIndices = [493, 2116, 4058, 4352, 4373, 4418, 4451, 4623, 4675, 5005, 6258, 7205, 7275];

lineIndices.forEach(lineNum => {
  const start = Math.max(0, lineNum - 8);
  const end = Math.min(lines.length, lineNum + 8);
  console.log(`\n================= AROUND LINE ${lineNum} =================`);
  for (let i = start; i < end; i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
});
