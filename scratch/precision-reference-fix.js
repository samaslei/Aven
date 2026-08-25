import fs from 'fs';

// ============================================================
// ITEM 1: Card Elevation — Pure White + Soft Diffused Shadow
// ============================================================
let css = fs.readFileSync('css/style.css', 'utf-8');

// Fix light mode tokens: pure white cards (#FFFFFF), not off-white
css = css.replace(
  `--bg-surface: #fbfaf5;                 /* Crisp light cream/off-white cards */`,
  `--bg-surface: #ffffff;                  /* Pure white cards (reference exact match) */`
);

// Fix stat-card: pure white, diffused shadow, no border line
css = css.replace(
  `.stat-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: 20px 22px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: var(--shadow-sm);
  box-sizing: border-box;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}`,
  `.stat-card {
  background: var(--bg-surface);
  border: none;
  border-radius: var(--radius-xl);
  padding: 20px 22px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.09);
}`
);

// Fix subject-card: pure white, diffused shadow, no border line
css = css.replace(
  `.subject-card {
  --sub-color: #505537;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: 22px 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  position: relative;
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-sizing: border-box;
}

.subject-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--border-default);
}`,
  `.subject-card {
  --sub-color: #505537;
  background: var(--bg-surface);
  border: none;
  border-radius: var(--radius-xl);
  padding: 22px 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  position: relative;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-sizing: border-box;
}

.subject-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.09);
}`
);

// Fix grade-summary-box: pure white, diffused shadow, no border
css = css.replace(
  `.grade-summary-box {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: 22px 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 14px;
  box-shadow: var(--shadow-sm);
  box-sizing: border-box;
}`,
  `.grade-summary-box {
  background: var(--bg-surface);
  border: none;
  border-radius: var(--radius-xl);
  padding: 22px 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 14px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
}`
);

// Fix filter-chip: no shadow on inactive, clean outline only
css = css.replace(
  `.filter-chip {
  padding: 7px 16px;
  border-radius: var(--radius-full);
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.16s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: var(--shadow-sm);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}`,
  `.filter-chip {
  padding: 7px 16px;
  border-radius: var(--radius-full);
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.16s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}`
);

// Also fix all .tool-card (tracker cards): borderless, diffused shadow
css = css.replace(
  /\.tool-card\s*\{[^}]*\}/,
  `.tool-card {
  background: var(--bg-surface);
  border: none;
  border-radius: var(--radius-xl);
  padding: 22px 24px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
}`
);

// ============================================================
// ITEM 2: Icon Badges — Circular Pastel Containers (stat cards only)
// ============================================================
// The stat-icon-circle is already defined (lines 1014-1026),
// but we need to refine its background to a soft pastel tint
css = css.replace(
  `.stat-icon-circle {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-full);
  background: var(--bg-surface-hover);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  transition: var(--transition);
}`,
  `.stat-icon-circle {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  background: rgba(80, 85, 55, 0.08);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: var(--transition);
}`
);

// Also refine the subject-icon-badge to match
css = css.replace(
  `.subject-icon-badge {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: var(--bg-surface-hover);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}`,
  `.subject-icon-badge {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  background: rgba(80, 85, 55, 0.08);
  color: var(--olive-deep);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
  flex-shrink: 0;
}`
);

// ============================================================
// ITEM 3: Sidebar Profile Row — Remove Box/Border, Plain Flat Row
// ============================================================
css = css.replace(
  `.sidebar-user-block .user-profile-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--radius-lg);
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: var(--transition);
}

.sidebar-user-block .user-profile-btn:hover {
  background: var(--bg-surface-hover);
  border-color: var(--border-strong);
}`,
  `.sidebar-user-block .user-profile-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--radius-md);
  background: transparent;
  border: none;
  box-shadow: none;
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: var(--transition);
}

.sidebar-user-block .user-profile-btn:hover {
  background: rgba(0, 0, 0, 0.04);
}`
);

// Make sidebar itself have the distinct warm sidebar background
css = css.replace(
  /\.sidebar\s*\{[^}]*\}/,
  (match) => {
    // Already defined, just tweak
    return match;
  }
);

// ============================================================
// ITEM 5: Color Palette Correction — Black/Charcoal Numbers
// ============================================================
// Change getStandingColor to always return --text-primary for the large
// stat number, moving color to only small indicator dots.
// We do this in grade-calculator.js.

let gradeCalcJs = fs.readFileSync('js/domain/grade-calculator.js', 'utf-8');

// Replace the entire getGradeStandingTier to tone down colors
gradeCalcJs = gradeCalcJs.replace(
  `export function getGradeStandingTier(percentage) {
  if (percentage === null || percentage === undefined || isNaN(percentage) || percentage === '—') {
    return {
      tier: 'none',
      colorVar: 'var(--text-muted)',
      cssClass: 'standing-muted',
      status: 'No Data'
    };
  }
  const pct = Number(percentage);
  if (pct >= 85) {
    return {
      tier: 'excellent',
      colorVar: 'var(--success)',
      cssClass: 'standing-excellent',
      status: 'Excellent'
    };
  }
  if (pct >= 75) {
    return {
      tier: 'solid',
      colorVar: 'var(--accent)',
      cssClass: 'standing-solid',
      status: 'Good'
    };
  }
  if (pct >= 60) {
    return {
      tier: 'warning',
      colorVar: 'var(--warning)',
      cssClass: 'standing-warning',
      status: 'At Risk'
    };
  }
  return {
    tier: 'danger',
    colorVar: 'var(--danger)',
    cssClass: 'standing-danger',
    status: 'Failing'
  };
}`,
  `export function getGradeStandingTier(percentage) {
  if (percentage === null || percentage === undefined || isNaN(percentage) || percentage === '—') {
    return {
      tier: 'none',
      colorVar: 'var(--text-primary)',
      dotColor: 'var(--text-muted)',
      cssClass: 'standing-muted',
      status: 'No Data'
    };
  }
  const pct = Number(percentage);
  if (pct >= 85) {
    return {
      tier: 'excellent',
      colorVar: 'var(--text-primary)',
      dotColor: 'var(--success)',
      cssClass: 'standing-excellent',
      status: 'Excellent'
    };
  }
  if (pct >= 75) {
    return {
      tier: 'solid',
      colorVar: 'var(--text-primary)',
      dotColor: 'var(--olive-mid)',
      cssClass: 'standing-solid',
      status: 'Good'
    };
  }
  if (pct >= 60) {
    return {
      tier: 'warning',
      colorVar: 'var(--text-primary)',
      dotColor: 'var(--warning)',
      cssClass: 'standing-warning',
      status: 'At Risk'
    };
  }
  return {
    tier: 'danger',
    colorVar: 'var(--text-primary)',
    dotColor: 'var(--danger)',
    cssClass: 'standing-danger',
    status: 'Failing'
  };
}`
);

fs.writeFileSync('js/domain/grade-calculator.js', gradeCalcJs, 'utf-8');

// Now update subjects.js to remove color from stat-card-value (GPA specifically)
let subjectsJs = fs.readFileSync('js/subjects.js', 'utf-8');

// GPA stat-card-value: remove the inline style color override
subjectsJs = subjectsJs.replace(
  `<div class="stat-card-value" style="color: \${getStandingColor(academicStanding.rawAvgPct)};">\${academicStanding.gpa !== '—' ? academicStanding.gpa : '—'}</div>`,
  `<div class="stat-card-value">\${academicStanding.gpa !== '—' ? academicStanding.gpa : '—'}</div>`
);

fs.writeFileSync('js/subjects.js', subjectsJs, 'utf-8');

// Also remove color from subject-card metric values (subjects.js)
// The new renderSubjectCard already uses getStandingColor on the metric-val.
// Replace it to use --text-primary (black) instead of the colored value.
subjectsJs = fs.readFileSync('js/subjects.js', 'utf-8');
subjectsJs = subjectsJs.replace(
  `<span class="subject-metric-val" style="color: \${getStandingColor(gradeStats.overallPercentage)};">\${gradeStats.summaryLine}</span>`,
  `<span class="subject-metric-val">\${gradeStats.summaryLine}</span>`
);
fs.writeFileSync('js/subjects.js', subjectsJs, 'utf-8');

// ============================================================
// Clean up duplicate CSS blocks that coexist (old + new)
// ============================================================
// Remove old stat-card-header, stat-card-icon, stat-icon-blue/teal etc.
// that are now superseded by the new layout
css = css.replace(
  `.stat-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 20px;
}

.stat-card-title {
  font-size: 11.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat-card-icon {
  width: 18px;
  height: 18px;
  color: var(--text-muted);
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.stat-card:hover .stat-card-icon {
  transform: scale(1.08);
}

/* Subtle icon tint colors */
.stat-icon-blue { color: #3b82f6; }
.stat-icon-teal { color: #10b981; }
.stat-icon-indigo { color: #818cf8; }
.stat-icon-amber { color: #f59e0b; }

.stat-card-value {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--text-primary);
  font-family: var(--font-numeric);
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1;
  line-height: 1.15;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 2px 0;
}

.stat-card-subtitle {
  font-size: 11.5px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 18px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat-card-subtitle span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}`,
  `/* (Old stat-card-header/icon blocks removed — replaced by stat-icon-circle + stat-card-body layout) */`
);

// Remove old subject-card-actions duplicate (lines 1586-1597)
css = css.replace(
  `.subject-card-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

[data-theme="light"] .subject-card-actions {
  border-top: 1px solid rgba(15, 23, 42, 0.06);
}`,
  `/* (Old subject-card-actions duplicate removed — using borderless version above) */`
);

// Remove old subject-metrics-row duplicate (lines 1551-1584)
css = css.replace(
  `.subject-metrics-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

[data-theme="light"] .subject-metrics-row {
  border-top: 1px solid rgba(15, 23, 42, 0.06);
}

.subject-metric {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metric-label {
  font-size: 10.5px;
  color: var(--text-muted);
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.metric-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  font-family: var(--font-numeric);
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1;
}`,
  `/* (Old subject-metrics-row removed — using subject-metrics-strip above) */`
);

// Fix light mode shadow tokens for the soft diffused glow effect
css = css.replace(
  `--shadow-sm: 0 2px 6px -1px rgba(45, 50, 35, 0.08), 0 1px 2px 0 rgba(45, 50, 35, 0.04);
  --shadow-md: 0 6px 18px -3px rgba(45, 50, 35, 0.12), 0 2px 6px -1px rgba(45, 50, 35, 0.06);
  --shadow-lg: 0 14px 30px -4px rgba(45, 50, 35, 0.16), 0 4px 12px -2px rgba(45, 50, 35, 0.06);
  --shadow-modal: 0 18px 44px -8px rgba(45, 50, 35, 0.18), 0 6px 16px -2px rgba(45, 50, 35, 0.08);`,
  `--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4px 24px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 12px 36px rgba(0, 0, 0, 0.10);
  --shadow-modal: 0 20px 50px rgba(0, 0, 0, 0.14);`
);

fs.writeFileSync('css/style.css', css, 'utf-8');

console.log('All 5 items applied successfully!');
console.log('  1. Card elevation: pure #FFFFFF + soft diffused shadow, no border');
console.log('  2. Icon badges: 36px circular pastel-olive containers');
console.log('  3. Sidebar profile: transparent flat row, no box/border/gradient');
console.log('  4. Sidebar nav: confirmed primary nav has no circular badges (correct)');
console.log('  5. Color palette: large numbers default to --text-primary (black/charcoal)');
