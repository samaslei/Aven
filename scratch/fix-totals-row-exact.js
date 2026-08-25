import fs from 'fs';

// 1. UPDATE js/grades.js
let gradesJs = fs.readFileSync('js/grades.js', 'utf-8');

const oldTotalsRow = `                      <tfoot>
                        <tr class="cat-totals-row">
                          <td style="text-align: left;">
                            <span class="cell-value-text"><strong>TOTAL</strong></span>
                          </td>
                          <td style="text-align: center;">
                            <span class="cell-value-text mono-num" style="font-family: var(--font-numeric); font-variant-numeric: tabular-nums; font-weight: 600;">\${totalScore.toFixed(1)}</span>
                          </td>
                          <td style="text-align: center;">
                            <span class="cell-value-text mono-num" style="font-family: var(--font-numeric); font-variant-numeric: tabular-nums; font-weight: 600;">\${totalOutOf.toFixed(1)}</span>
                          </td>
                          <td style="text-align: center;">
                            <span class="entry-pct-text" style="color: \${getStandingColor(catPct)}; font-weight: 700; font-family: var(--font-numeric); font-variant-numeric: tabular-nums;">
                              \${catPct !== '—' ? \`\${catPct}%\` : '—'}
                            </span>
                          </td>
                          <td style="text-align: right;"></td>
                        </tr>
                      </tfoot>`;

const newTotalsRow = `                      <tfoot>
                        <tr class="cat-totals-row grade-entry-row" style="cursor: default;">
                          <td style="text-align: left;">
                            <span class="cell-value-text">TOTAL</span>
                          </td>
                          <td style="text-align: center;">
                            <span class="cell-value-text mono-num" style="font-family: var(--font-numeric); font-variant-numeric: tabular-nums;">\${totalScore.toFixed(1)}</span>
                          </td>
                          <td style="text-align: center;">
                            <span class="cell-value-text mono-num" style="font-family: var(--font-numeric); font-variant-numeric: tabular-nums;">\${totalOutOf.toFixed(1)}</span>
                          </td>
                          <td style="text-align: center;">
                            <span class="entry-pct-text" style="color: \${getStandingColor(catPct)}; font-weight: 700; font-family: var(--font-numeric); font-variant-numeric: tabular-nums;">
                              \${catPct !== '—' ? \`\${catPct}%\` : '—'}
                            </span>
                          </td>
                          <td style="text-align: right;"></td>
                        </tr>
                      </tfoot>`;

gradesJs = gradesJs.replace(oldTotalsRow, newTotalsRow);
fs.writeFileSync('js/grades.js', gradesJs, 'utf-8');

// 2. UPDATE css/style.css
let css = fs.readFileSync('css/style.css', 'utf-8');

const oldTotalsCss = `.grade-entries-table .cat-totals-row td {
  background: transparent !important;
  border-top: 1px solid var(--border-subtle);
  border-bottom: none;
  padding: 11px 16px;
  color: var(--text-primary);
  font-size: 13px;
}`;

const newTotalsCss = `.grade-entries-table .cat-totals-row td,
.grade-entries-table tr.cat-totals-row td,
.grade-entries-table tfoot td {
  background: transparent !important;
  border-top: 1px solid var(--border-subtle) !important;
  border-bottom: none !important;
  padding: 11px 16px !important;
  color: var(--text-primary) !important;
  font-size: 13px !important;
  box-shadow: none !important;
}

.grade-entries-table tr.cat-totals-row:hover td {
  background: var(--bg-surface-hover) !important;
}`;

css = css.replace(oldTotalsCss, newTotalsCss);
fs.writeFileSync('css/style.css', css, 'utf-8');

console.log('Successfully updated Totals row to perfectly match entry rows styling and background!');
