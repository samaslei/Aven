import fs from 'fs';

let css = fs.readFileSync('css/style.css', 'utf-8');

// 1. Dark Mode Root Tokens
css = css.replace(
  /--border-subtle: rgba\(255, 255, 255, 0\.06\);/g,
  '--border-subtle: rgba(255, 255, 255, 0.04);'
);
css = css.replace(
  /--border-default: rgba\(255, 255, 255, 0\.10\);/g,
  '--border-default: rgba(255, 255, 255, 0.07);'
);
css = css.replace(
  /--border-strong: rgba\(255, 255, 255, 0\.16\);/g,
  '--border-strong: rgba(255, 255, 255, 0.12);'
);

css = css.replace(
  /--bg-glass-sidebar: rgba\(16, 17, 20, 0\.76\);/g,
  '--bg-glass-sidebar: rgba(16, 17, 20, 0.92);'
);
css = css.replace(
  /--bg-glass-modal: rgba\(22, 24, 30, 0\.82\);/g,
  '--bg-glass-modal: rgba(22, 24, 30, 0.94);'
);
css = css.replace(
  /--bg-glass-modal-footer: rgba\(16, 17, 21, 0\.88\);/g,
  '--bg-glass-modal-footer: rgba(16, 17, 21, 0.96);'
);
css = css.replace(
  /--bg-glass-dropdown: rgba\(26, 28, 35, 0\.86\);/g,
  '--bg-glass-dropdown: rgba(26, 28, 35, 0.95);'
);
css = css.replace(
  /--bg-glass-floating: rgba\(20, 22, 27, 0\.80\);/g,
  '--bg-glass-floating: rgba(20, 22, 27, 0.93);'
);

css = css.replace(
  /--glass-blur: blur\(22px\) saturate\(180%\);/g,
  '--glass-blur: blur(10px) saturate(130%);'
);
css = css.replace(
  /--glass-blur-modal: blur\(28px\) saturate\(190%\);/g,
  '--glass-blur-modal: blur(14px) saturate(140%);'
);
css = css.replace(
  /--glass-blur-sm: blur\(14px\) saturate\(160%\);/g,
  '--glass-blur-sm: blur(8px) saturate(120%);'
);
css = css.replace(
  /--glass-border: rgba\(255, 255, 255, 0\.08\);/g,
  '--glass-border: rgba(255, 255, 255, 0.05);'
);
css = css.replace(
  /--glass-border-elevated: rgba\(255, 255, 255, 0\.12\);/g,
  '--glass-border-elevated: rgba(255, 255, 255, 0.08);'
);
css = css.replace(
  /--glass-specular: inset 0 1px 0 0 rgba\(255, 255, 255, 0\.035\);/g,
  '--glass-specular: inset 0 1px 0 0 rgba(255, 255, 255, 0.025);'
);

// 2. Light Mode Tokens
css = css.replace(
  /--border-subtle: rgba\(15, 23, 42, 0\.10\);/g,
  '--border-subtle: rgba(15, 23, 42, 0.06);'
);
css = css.replace(
  /--border-default: rgba\(15, 23, 42, 0\.16\);/g,
  '--border-default: rgba(15, 23, 42, 0.10);'
);
css = css.replace(
  /--border-strong: rgba\(15, 23, 42, 0\.24\);/g,
  '--border-strong: rgba(15, 23, 42, 0.16);'
);

css = css.replace(
  /--bg-glass-sidebar: rgba\(235, 240, 248, 0\.78\);/g,
  '--bg-glass-sidebar: rgba(235, 240, 248, 0.92);'
);
css = css.replace(
  /--bg-glass-modal: rgba\(255, 255, 255, 0\.88\);/g,
  '--bg-glass-modal: rgba(255, 255, 255, 0.96);'
);
css = css.replace(
  /--bg-glass-modal-footer: rgba\(246, 248, 252, 0\.92\);/g,
  '--bg-glass-modal-footer: rgba(246, 248, 252, 0.98);'
);
css = css.replace(
  /--bg-glass-dropdown: rgba\(255, 255, 255, 0\.94\);/g,
  '--bg-glass-dropdown: rgba(255, 255, 255, 0.97);'
);
css = css.replace(
  /--bg-glass-floating: rgba\(255, 255, 255, 0\.85\);/g,
  '--bg-glass-floating: rgba(255, 255, 255, 0.94);'
);

css = css.replace(
  /--glass-blur: blur\(24px\) saturate\(190%\);/g,
  '--glass-blur: blur(10px) saturate(130%);'
);
css = css.replace(
  /--glass-blur-modal: blur\(30px\) saturate\(200%\);/g,
  '--glass-blur-modal: blur(14px) saturate(140%);'
);
css = css.replace(
  /--glass-blur-sm: blur\(14px\) saturate\(170%\);/g,
  '--glass-blur-sm: blur(8px) saturate(120%);'
);
css = css.replace(
  /--glass-border: rgba\(15, 23, 42, 0\.09\);/g,
  '--glass-border: rgba(15, 23, 42, 0.06);'
);
css = css.replace(
  /--glass-border-elevated: rgba\(15, 23, 42, 0\.12\);/g,
  '--glass-border-elevated: rgba(15, 23, 42, 0.09);'
);
css = css.replace(
  /--glass-specular: inset 0 1px 0 0 rgba\(255, 255, 255, 0\.35\);/g,
  '--glass-specular: inset 0 1px 0 0 rgba(255, 255, 255, 0.25);'
);

// 3. Modal Overlay & Auth Card Blur
css = css.replace(
  /backdrop-filter: blur\(14px\) saturate\(140%\);/g,
  'backdrop-filter: blur(6px);'
);
css = css.replace(
  /-webkit-backdrop-filter: blur\(14px\) saturate\(140%\);/g,
  '-webkit-backdrop-filter: blur(6px);'
);

css = css.replace(
  /backdrop-filter: blur\(16px\);/g,
  'backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);'
);

fs.writeFileSync('css/style.css', css, 'utf-8');
console.log('Successfully dialed back glassmorphism across style.css!');
