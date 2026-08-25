import fs from 'fs';

// 1. Update js/tracker.js
let trackerJs = fs.readFileSync('js/tracker.js', 'utf-8');

const oldLegendHtml = `    const legendHtml = slices.map(slice => {
      const isOther = slice.id === 'other';
      const isGeneral = slice.id === 'general';
      return \`
        <div class="dist-legend-row" data-id="\${slice.id}">
          <div class="dist-legend-left">
            <span class="dist-circle-badge" style="background-color: \${slice.color}1c; color: \${slice.color}; border: 1px solid \${slice.color}30;">
              <span class="dist-circle-core" style="background-color: \${slice.color};"></span>
            </span>
            <div class="dist-legend-names">
              <div class="dist-legend-title-line">
                \${slice.code ? \`<span class="subject-list-code" style="font-size: 10px; padding: 1px 5px;">\${slice.code}</span>\` : (isOther ? \`<span class="tag-status-archived" style="font-size: 10px; padding: 1px 6px;">Aggregate</span>\` : (isGeneral ? \`<span class="tag-status-archived" style="font-size: 10px; padding: 1px 6px;">General</span>\` : ''))}
                <span class="dist-subject-name" title="\${slice.name}">\${slice.name}</span>
              </div>
            </div>
          </div>
          <div class="dist-legend-right">
            <strong class="dist-hours-val">\${slice.hours}h</strong>
            <span class="dist-pct-val">\${slice.percentage.toFixed(1)}%</span>
          </div>
        </div>
      \`;
    }).join('');`;

const newLegendHtml = `    const legendHtml = slices.map(slice => {
      const isOther = slice.id === 'other';
      const isGeneral = slice.id === 'general';
      const pillText = slice.code ? slice.code : (isOther ? 'Other' : (isGeneral ? 'General' : slice.name));
      const displayName = slice.code ? slice.name : (isOther ? 'Other Subjects' : (isGeneral ? 'General Study' : ''));

      return \`
        <div class="dist-legend-row" data-id="\${slice.id}">
          <div class="dist-legend-left">
            <span class="dist-code-pill" style="background-color: \${slice.color}1a; color: \${slice.color}; border: 1.2px solid \${slice.color}45;">
              \${pillText}
            </span>
            \${displayName ? \`<span class="dist-subject-name" title="\${slice.name}">\${displayName}</span>\` : ''}
          </div>
          <div class="dist-legend-right">
            <strong class="dist-hours-val">\${slice.hours}h</strong>
            <span class="dist-pct-val">\${slice.percentage.toFixed(1)}%</span>
          </div>
        </div>
      \`;
    }).join('');`;

trackerJs = trackerJs.replace(oldLegendHtml, newLegendHtml);
fs.writeFileSync('js/tracker.js', trackerJs, 'utf-8');

// 2. Update css/style.css
let css = fs.readFileSync('css/style.css', 'utf-8');

const oldCssBadges = `/* Small Colored Circular Badge (Reference Style) */
.dist-circle-badge {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.dist-circle-core {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

.dist-legend-names {
  min-width: 0;
  flex: 1;
}

.dist-legend-title-line {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}`;

const newCssBadges = `/* Color-Coded Course Pill in Donut Legend (Matching Slice Color) */
.dist-code-pill {
  font-family: var(--font-numeric);
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1;
  font-size: 11px;
  font-weight: 700;
  padding: 2.5px 8px;
  border-radius: var(--radius-full);
  line-height: 1.2;
  white-space: nowrap;
  letter-spacing: 0.02em;
  flex-shrink: 0;
  transition: transform 0.16s ease;
}`;

css = css.replace(oldCssBadges, newCssBadges);
fs.writeFileSync('css/style.css', css, 'utf-8');

console.log('Successfully moved color into course code pill and removed circle dots from donut legend!');
