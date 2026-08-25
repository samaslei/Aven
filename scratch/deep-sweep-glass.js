import fs from 'fs';

let css = fs.readFileSync('css/style.css', 'utf-8');

// Replace all remaining backdrop-filter and -webkit-backdrop-filter in style.css
// 1. Line 2111: heatmap-tooltip
css = css.replace(
  /background:\s*var\(--bg-glass-dropdown\);\s*backdrop-filter:\s*var\(--glass-blur-sm\);\s*-webkit-backdrop-filter:\s*var\(--glass-blur-sm\);/g,
  `background: var(--bg-surface-elevated);`
);

// 2. Line 4347: modal-card
css = css.replace(
  /background:\s*var\(--bg-glass-modal\);\s*backdrop-filter:\s*var\(--glass-blur-modal\);\s*-webkit-backdrop-filter:\s*var\(--glass-blur-modal\);/g,
  `background: var(--bg-surface);`
);

// 3. Line 4974: auth-card
css = css.replace(
  /backdrop-filter:\s*blur\(8px\);\s*-webkit-backdrop-filter:\s*blur\(8px\);/g,
  ``
);

// 4. Line 6227: landing-nav
css = css.replace(
  /backdrop-filter:\s*var\(--glass-blur\);\s*-webkit-backdrop-filter:\s*var\(--glass-blur\);\s*background:\s*var\(--bg-glass-sidebar\);/g,
  `background: var(--bg-sidebar);`
);

// 5. Lines 7175, 7244: mobile media queries
css = css.replace(
  /background-color:\s*var\(--bg-glass-sidebar\);\s*backdrop-filter:\s*var\(--glass-blur\);\s*-webkit-backdrop-filter:\s*var\(--glass-blur\);/g,
  `background-color: var(--bg-sidebar);`
);

css = css.replace(
  /backdrop-filter:\s*blur\(4px\);\s*-webkit-backdrop-filter:\s*blur\(4px\);/g,
  ``
);

// Any remaining backdrop-filter lines
css = css.replace(/[^\n]*backdrop-filter:[^\n]*\n/g, '');

fs.writeFileSync('css/style.css', css, 'utf-8');

console.log('Finished deep sweep of all backdrop-filter declarations!');
