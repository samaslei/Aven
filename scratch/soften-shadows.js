import fs from 'fs';

let css = fs.readFileSync('css/style.css', 'utf-8');

// 1. Update Root & Light Mode variables
css = css.replace(
  /--glass-specular: inset 0 1px 0 0 rgba\(255, 255, 255, 0\.09\);/g,
  '--glass-specular: inset 0 1px 0 0 rgba(255, 255, 255, 0.035);'
);
css = css.replace(
  /--glass-specular: inset 0 1px 0 0 rgba\(255, 255, 255, 0\.9\);/g,
  '--glass-specular: inset 0 1px 0 0 rgba(255, 255, 255, 0.35);'
);

css = css.replace(
  /--shadow-sm: 0 1px 2px 0 rgba\(0, 0, 0, 0\.4\);/g,
  '--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.22);'
);
css = css.replace(
  /--shadow-md: 0 4px 12px -1px rgba\(0, 0, 0, 0\.5\);/g,
  '--shadow-md: 0 3px 8px -1px rgba(0, 0, 0, 0.28);'
);
css = css.replace(
  /--shadow-lg: 0 12px 32px -4px rgba\(0, 0, 0, 0\.6\);/g,
  '--shadow-lg: 0 8px 20px -3px rgba(0, 0, 0, 0.32);'
);
css = css.replace(
  /--shadow-modal: 0 24px 60px -8px rgba\(0, 0, 0, 0\.7\), 0 8px 24px -4px rgba\(0, 0, 0, 0\.4\);/g,
  '--shadow-modal: 0 18px 44px -8px rgba(0, 0, 0, 0.45), 0 6px 16px -2px rgba(0, 0, 0, 0.25);'
);

css = css.replace(
  /--shadow-modal: 0 26px 64px -10px rgba\(15, 23, 42, 0\.18\), 0 10px 24px -4px rgba\(15, 23, 42, 0\.08\);/g,
  '--shadow-modal: 0 16px 40px -8px rgba(15, 23, 42, 0.10), 0 4px 12px -2px rgba(15, 23, 42, 0.04);'
);

// 2. Dial back common dark mode card shadows
// Replace 0 4px 20px -2px rgba(0, 0, 0, 0.40), 0 2px 6px -1px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.08);
css = css.replaceAll(
  'box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.40), 0 2px 6px -1px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.08);',
  'box-shadow: 0 2px 10px -1px rgba(0, 0, 0, 0.24), 0 1px 3px 0 rgba(0, 0, 0, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.035);'
);

css = css.replaceAll(
  'box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.38), 0 2px 6px -1px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08);',
  'box-shadow: 0 2px 10px -1px rgba(0, 0, 0, 0.24), 0 1px 3px 0 rgba(0, 0, 0, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.035);'
);

css = css.replaceAll(
  'box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.08);',
  'box-shadow: 0 2px 10px -1px rgba(0, 0, 0, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.035);'
);

css = css.replaceAll(
  'box-shadow: 0 4px 24px -2px rgba(0, 0, 0, 0.42), 0 2px 8px -1px rgba(0, 0, 0, 0.30), inset 0 1px 0 rgba(255, 255, 255, 0.08);',
  'box-shadow: 0 2px 12px -1px rgba(0, 0, 0, 0.26), 0 1px 3px 0 rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.035);'
);

css = css.replaceAll(
  'box-shadow: 0 4px 24px -2px rgba(0, 0, 0, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.08);',
  'box-shadow: 0 2px 12px -1px rgba(0, 0, 0, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.035);'
);

css = css.replaceAll(
  'box-shadow: 0 3px 12px -2px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08);',
  'box-shadow: 0 2px 8px -1px rgba(0, 0, 0, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.035);'
);

// 3. Dial back colored stat card shadows & insets
css = css.replaceAll(
  'box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.40), 0 2px 6px -1px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(147, 197, 253, 0.18);',
  'box-shadow: 0 2px 10px -1px rgba(0, 0, 0, 0.24), 0 1px 3px 0 rgba(0, 0, 0, 0.14), inset 0 1px 0 rgba(147, 197, 253, 0.08);'
);
css = css.replaceAll(
  'box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.40), 0 2px 6px -1px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(110, 231, 183, 0.18);',
  'box-shadow: 0 2px 10px -1px rgba(0, 0, 0, 0.24), 0 1px 3px 0 rgba(0, 0, 0, 0.14), inset 0 1px 0 rgba(110, 231, 183, 0.08);'
);
css = css.replaceAll(
  'box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.40), 0 2px 6px -1px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(196, 181, 253, 0.20);',
  'box-shadow: 0 2px 10px -1px rgba(0, 0, 0, 0.24), 0 1px 3px 0 rgba(0, 0, 0, 0.14), inset 0 1px 0 rgba(196, 181, 253, 0.08);'
);
css = css.replaceAll(
  'box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.40), 0 2px 6px -1px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(216, 180, 254, 0.18);',
  'box-shadow: 0 2px 10px -1px rgba(0, 0, 0, 0.24), 0 1px 3px 0 rgba(0, 0, 0, 0.14), inset 0 1px 0 rgba(216, 180, 254, 0.08);'
);

// 4. Dial back hover states
css = css.replaceAll(
  'box-shadow: 0 10px 28px -4px rgba(0, 0, 0, 0.46), inset 0 1px 0 rgba(255, 255, 255, 0.12);',
  'box-shadow: 0 6px 18px -2px rgba(0, 0, 0, 0.30), inset 0 1px 0 rgba(255, 255, 255, 0.06);'
);
css = css.replaceAll(
  'box-shadow: 0 14px 30px -4px rgba(0, 0, 0, 0.46),',
  'box-shadow: 0 8px 20px -3px rgba(0, 0, 0, 0.30),'
);
css = css.replaceAll(
  'inset 0 1px 0 color-mix(in srgb, var(--sub-color) 50%, rgba(255, 255, 255, 0.22));',
  'inset 0 1px 0 color-mix(in srgb, var(--sub-color) 30%, rgba(255, 255, 255, 0.08));'
);

// 5. Dial back light mode card highlights & shadows
css = css.replaceAll(
  'box-shadow: 0 4px 18px -2px rgba(0, 0, 0, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.95);',
  'box-shadow: 0 2px 8px -1px rgba(15, 23, 42, 0.05), 0 1px 3px 0 rgba(15, 23, 42, 0.02), inset 0 1px 0 rgba(255, 255, 255, 0.40);'
);
css = css.replaceAll(
  'box-shadow: 0 4px 18px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.95);',
  'box-shadow: 0 2px 8px -1px rgba(15, 23, 42, 0.05), 0 1px 3px 0 rgba(15, 23, 42, 0.02), inset 0 1px 0 rgba(255, 255, 255, 0.40);'
);
css = css.replaceAll(
  'box-shadow: 0 4px 18px -2px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.95);',
  'box-shadow: 0 2px 8px -1px rgba(15, 23, 42, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.40);'
);
css = css.replaceAll(
  'box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.95);',
  'box-shadow: 0 2px 8px -1px rgba(15, 23, 42, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.40);'
);
css = css.replaceAll(
  'box-shadow: 0 2px 8px -2px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.95);',
  'box-shadow: 0 1px 5px -1px rgba(15, 23, 42, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.40);'
);
css = css.replaceAll(
  'box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.10), inset 0 1px 0 rgba(255, 255, 255, 1);',
  'box-shadow: 0 5px 14px -2px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.60);'
);
css = css.replaceAll(
  'box-shadow: 0 10px 24px -4px rgba(0, 0, 0, 0.10),',
  'box-shadow: 0 5px 14px -2px rgba(15, 23, 42, 0.08),'
);
css = css.replaceAll(
  'inset 0 1px 0 rgba(255, 255, 255, 1);',
  'inset 0 1px 0 rgba(255, 255, 255, 0.60);'
);
css = css.replaceAll(
  'inset 0 1px 0 rgba(255, 255, 255, 0.95);',
  'inset 0 1px 0 rgba(255, 255, 255, 0.40);'
);

// 6. Dial back Grade Summary Box & Standing Cards
css = css.replace(
  'inset 0 1px 0 color-mix(in srgb, var(--standing-color, var(--accent)) 25%, rgba(255, 255, 255, 0.14));',
  'inset 0 1px 0 color-mix(in srgb, var(--standing-color, var(--accent)) 15%, rgba(255, 255, 255, 0.05));'
);

// 7. Dial back active item bevels (e.g. active subject in grades/plans sidebar)
css = css.replaceAll(
  'box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08);',
  'box-shadow: 0 1px 4px rgba(0, 0, 0, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.035);'
);

// 8. Dial back Modal Cards
css = css.replace(
  'box-shadow: 0 24px 60px -10px rgba(0, 0, 0, 0.70), 0 10px 24px -4px rgba(0, 0, 0, 0.50), inset 0 1px 0 rgba(255, 255, 255, 0.15);',
  'box-shadow: 0 18px 44px -8px rgba(0, 0, 0, 0.45), 0 6px 16px -2px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.06);'
);

// 9. Template presets
css = css.replaceAll(
  'box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08);',
  'box-shadow: 0 1px 5px rgba(0, 0, 0, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.035);'
);
css = css.replaceAll(
  'box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.12);',
  'box-shadow: 0 2px 8px rgba(0, 0, 0, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.05);'
);

// 10. Subject Cards initial dark shadow
css = css.replaceAll(
  'box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.38),\n              0 2px 6px -1px rgba(0, 0, 0, 0.25),\n              inset 0 1px 0 rgba(255, 255, 255, 0.08);',
  'box-shadow: 0 2px 10px -1px rgba(0, 0, 0, 0.24),\n              0 1px 3px 0 rgba(0, 0, 0, 0.14),\n              inset 0 1px 0 rgba(255, 255, 255, 0.035);'
);

fs.writeFileSync('css/style.css', css, 'utf-8');
console.log('Successfully updated css/style.css with softened shadows & subtle bevels!');
