import fs from 'fs';

const css = fs.readFileSync('css/style.css', 'utf-8');

const searchTerms = [
  '.plans-sidebar',
  '.plan-viewer-container',
  '.plan-viewer-header',
  '.settings-profile-hero',
  '.settings-section-card',
  '.settings-nav-card',
  '.heatmap-container-card',
  '.distribution-container-card',
  '.journey-milestone-card',
  '.category-card',
  '.grade-scale-details'
];

searchTerms.forEach(term => {
  const idx = css.indexOf(term + ' {');
  const idx2 = css.indexOf(term + ' {') !== -1 ? css.indexOf(term + ' {') : css.indexOf(term);
  if (idx2 !== -1) {
    console.log(`\n================= ${term} =================`);
    console.log(css.substring(idx2, idx2 + 400));
  } else {
    console.log(`\nNOT FOUND: ${term}`);
  }
});
