import fs from 'fs';

let css = fs.readFileSync('css/style.css', 'utf-8');

// 1. Add .view-content-area container constraint
const oldPageSubtitle = `.page-subtitle {
  font-size: 13.5px;
  color: var(--text-secondary);
  font-weight: 400;
}`;

const newPageSubtitle = `.page-subtitle {
  font-size: 13.5px;
  color: var(--text-secondary);
  font-weight: 400;
}

.view-content-area {
  width: 100%;
  max-width: 1360px;
  margin: 0 auto;
  min-width: 0;
  box-sizing: border-box;
}`;

css = css.replace(oldPageSubtitle, newPageSubtitle);

// 2. Update .grades-layout to be centered with max-width and side margins
const oldGradesLayout = `.grades-layout {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 24px;
  align-items: flex-start;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}`;

const newGradesLayout = `.grades-layout {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 24px;
  align-items: flex-start;
  width: 100%;
  max-width: 1320px;
  margin: 0 auto;
  padding: 0 12px;
  min-width: 0;
  box-sizing: border-box;
}

@media (max-width: 1024px) {
  .grades-layout {
    grid-template-columns: 1fr;
    padding: 0;
  }
}`;

css = css.replace(oldGradesLayout, newGradesLayout);

fs.writeFileSync('css/style.css', css, 'utf-8');

console.log('Successfully adjusted side spacing for the whole page content below header!');
