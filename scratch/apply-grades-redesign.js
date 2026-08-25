import fs from 'fs';

// 1. UPDATE js/grades.js
let gradesJs = fs.readFileSync('js/grades.js', 'utf-8');

// Replace categoryLayout with categoryExpandedState
gradesJs = gradesJs.replace(
  `let categoryLayout = localStorage.getItem('aven_grades_category_layout') || '1-col'; // '1-col' | '2-col'`,
  `const categoryExpandedState = {}; // Tracks expanded state by category ID`
);

// Replace renderTermBreakdownTabContent category list and header markup
const oldTermBreakdownHeaderAndList = `            <!-- Category Layout Toggle: 1-Column vs 2-Column Grid -->
            <div class="segmented-control" id="cat-layout-toggle" title="Switch between 1-Column and 2-Column layout">
              <button class="seg-btn \${categoryLayout === '1-col' ? 'active' : ''}" data-layout="1-col" title="1 Column (Stacked Full Width)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="16" rx="2"></rect>
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                </svg>
              </button>
              <button class="seg-btn \${categoryLayout === '2-col' ? 'active' : ''}" data-layout="2-col" title="2 Columns (Grid)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="16" rx="2"></rect>
                  <line x1="12" y1="4" x2="12" y2="20"></line>
                </svg>
              </button>
            </div>`;

gradesJs = gradesJs.replace(oldTermBreakdownHeaderAndList, '');

// Find the category list rendering section and replace it with the new breakdown accordion layout
const oldCategoryListPattern = /<!-- Categories & Assessment Entries List -->[\s\S]*?<\/div>\s*<!-- Clean Term Standing Summary -->/;

const newCategoryListMarkup = `<!-- Categories & Assessment Entries List (Clean Breakdown Accordion) -->
      <div class="category-breakdown-list">
        \${categories.length === 0 ? \`
          <div class="empty-categories-card">
            <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--bg-surface-elevated); border: 1px solid var(--border-default); display: flex; align-items: center; justify-content: center; margin-bottom: 4px; color: var(--accent);">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <div>
              <p style="font-size: 15px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">No Grade Categories Configured</p>
              <p style="font-size: 13px;">Get started quickly with a standard preset template or add categories individually.</p>
            </div>
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: center;">
              <button class="btn btn-primary btn-sm btn-quick-use-template">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
                Use Quick-Start Template
              </button>
              \${term === 'Final' && midtermCategories.length > 0 ? \`
                <button class="btn btn-secondary btn-sm btn-quick-copy-midterm">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  Copy Categories from Midterm
                </button>
              \` : ''}
              <button class="btn btn-sm btn-open-manual-cat">
                + Manual Category
              </button>
            </div>
          </div>
        \` : categories.map(cat => {
          const entries = cat.entries || [];
          const safeCatName = (cat.category || '').replace(/"/g, '&quot;');
          const isExpanded = categoryExpandedState[cat.id] !== undefined ? categoryExpandedState[cat.id] : (entries.length > 0);

          const totalScore = entries.reduce((a, e) => a + Number(e.score || 0), 0);
          const totalOutOf = entries.reduce((a, e) => a + Number(e.out_of || 0), 0);
          const catPct = totalOutOf > 0 ? ((totalScore / totalOutOf) * 100).toFixed(1) : '—';
          const weightedPts = totalOutOf > 0 ? (((totalScore / totalOutOf) * cat.weight)).toFixed(2) : '—';

          return \`
            <div class="category-breakdown-section \${isExpanded ? 'is-expanded' : 'is-collapsed'}" data-cat-id="\${cat.id}">
              <!-- Header Row (Always Visible & Clickable to Expand/Collapse) -->
              <div class="category-breakdown-header" data-cat-id="\${cat.id}">
                <div class="cat-header-left">
                  <div class="cat-drag-handle" title="Drag to reorder category" aria-label="Drag to reorder category">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="8" cy="5" r="2"></circle>
                      <circle cx="8" cy="12" r="2"></circle>
                      <circle cx="8" cy="19" r="2"></circle>
                      <circle cx="16" cy="5" r="2"></circle>
                      <circle cx="16" cy="12" r="2"></circle>
                      <circle cx="16" cy="19" r="2"></circle>
                    </svg>
                  </div>
                  <h4 class="cat-breakdown-name" title="\${safeCatName}">\${cat.category}</h4>
                  \${renderWeightIndicator(cat.weight, cat.id)}
                </div>

                <div class="cat-header-right">
                  \${entries.length > 0 ? \`
                    <div class="cat-header-summary">
                      <span>Avg: <strong style="color: \${getStandingColor(catPct)};">\${catPct}%</strong></span>
                      <span class="cat-summary-divider">·</span>
                      <span>\${weightedPts} pts</span>
                    </div>
                  \` : ''}
                  <button type="button" class="btn btn-ghost btn-sm btn-add-entry" data-cat-id="\${cat.id}" title="Add assessment entry">
                    + Entry
                  </button>
                  <button type="button" class="btn btn-ghost btn-sm btn-del-cat" data-cat-id="\${cat.id}" style="color: var(--danger); padding: 4px 7px;" title="Delete Category">
                    ✕
                  </button>
                  <button type="button" class="cat-chevron-btn \${isExpanded ? 'expanded' : ''}" data-cat-id="\${cat.id}" aria-label="Toggle Expand Category">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="cat-chevron-icon">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Expandable Content Body -->
              <div class="category-breakdown-body" style="\${!isExpanded ? 'display: none;' : ''}">
                \${entries.length === 0 ? \`
                  <div class="cat-empty-body">
                    <p class="cat-empty-msg">No entries in this category yet. Click <strong>+ Entry</strong> to add one.</p>
                  </div>
                \` : \`
                  <div class="cat-table-wrap">
                    <table class="cat-table grade-entries-table">
                      <thead>
                        <tr>
                          <th style="text-align: left;">Entry Name</th>
                          <th style="text-align: center; width: 85px;">Score</th>
                          <th style="text-align: center; width: 85px;">Out Of</th>
                          <th style="text-align: center; width: 85px;">Percentage</th>
                          <th style="text-align: right; width: 45px;"></th>
                        </tr>
                      </thead>
                      <tbody>
                        \${entries.map(ent => {
                          const entPct = ((ent.score / ent.out_of) * 100).toFixed(1);
                          const safeName = (ent.name || '').replace(/"/g, '&quot;');
                          const standingColor = getStandingColor(entPct);
                          return \`
                            <tr class="grade-entry-row" data-cat-id="\${cat.id}" data-ent-id="\${ent.id}">
                              <td style="text-align: left;">
                                <div class="editable-cell editable-name" data-field="name" data-cat-id="\${cat.id}" data-ent-id="\${ent.id}" data-value="\${safeName}" title="Click to edit assessment name">
                                  <span class="cell-value-text"><strong>\${ent.name}</strong></span>
                                  <svg class="edit-hint-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                  </svg>
                                </div>
                              </td>
                              <td style="text-align: center;">
                                <div class="editable-cell editable-score" data-field="score" data-cat-id="\${cat.id}" data-ent-id="\${ent.id}" data-value="\${ent.score}" title="Click to edit score">
                                  <span class="cell-value-text mono-num" style="font-family: var(--font-numeric); font-variant-numeric: tabular-nums; font-weight: 600;">\${ent.score}</span>
                                  <svg class="edit-hint-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                  </svg>
                                </div>
                              </td>
                              <td style="text-align: center;">
                                <div class="editable-cell editable-outof" data-field="out_of" data-cat-id="\${cat.id}" data-ent-id="\${ent.id}" data-value="\${ent.out_of}" title="Click to edit total points">
                                  <span class="cell-value-text mono-num" style="font-family: var(--font-numeric); font-variant-numeric: tabular-nums; font-weight: 600;">\${ent.out_of}</span>
                                  <svg class="edit-hint-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                  </svg>
                                </div>
                              </td>
                              <td style="text-align: center;">
                                <span class="entry-pct-text" style="color: \${standingColor}; font-weight: 700; font-family: var(--font-numeric); font-variant-numeric: tabular-nums;">
                                  \${entPct}%
                                </span>
                              </td>
                              <td style="text-align: right;">
                                <button type="button" class="btn btn-ghost btn-sm btn-del-entry" data-cat-id="\${cat.id}" data-ent-id="\${ent.id}" title="Delete Entry" style="color: var(--text-muted); padding: 4px;">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          \`;
                        }).join('')}
                      </tbody>
                      <tfoot>
                        <tr class="cat-totals-row">
                          <td style="text-align: left; font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em;">
                            TOTAL: \${totalScore.toFixed(1)} / \${totalOutOf.toFixed(1)}
                          </td>
                          <td style="text-align: center; font-family: var(--font-numeric); font-variant-numeric: tabular-nums; font-size: 12px; color: var(--text-muted); font-weight: 600;">
                            \${totalScore.toFixed(1)}
                          </td>
                          <td style="text-align: center; font-family: var(--font-numeric); font-variant-numeric: tabular-nums; font-size: 12px; color: var(--text-muted); font-weight: 600;">
                            \${totalOutOf.toFixed(1)}
                          </td>
                          <td style="text-align: center; font-family: var(--font-numeric); font-variant-numeric: tabular-nums; font-size: 12px; font-weight: 700; color: \${getStandingColor(catPct)};">
                            \${catPct !== '—' ? \`\${catPct}%\` : '—'}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                \`}
              </div>
            </div>
          \`;
        }).join('')}
      </div>

      <!-- Clean Term Standing Summary -->`;

gradesJs = gradesJs.replace(oldCategoryListPattern, newCategoryListMarkup);

// Update event handlers for Category Expand/Collapse
const oldExpandCollapseHandlers = `  // Expand / Collapse Category Toggle
  container.querySelectorAll('.cat-tree-header').forEach(header => {
    header.addEventListener('click', (e) => {
      // Don't toggle when clicking buttons, inputs, drag handles, or editable weights
      if (e.target.closest('.btn-add-entry, .btn-del-cat, .cat-weight-editable, .cat-drag-handle, input, button')) {
        return;
      }
      const item = header.closest('.category-tree-item');
      if (!item) return;
      const catId = item.dataset.catId;
      const isExpanded = item.classList.contains('is-expanded');
      const nextExpanded = !isExpanded;
      categoryExpandedState[catId] = nextExpanded;

      const childrenContainer = item.querySelector('.cat-children-container');
      const chevronBtn = item.querySelector('.cat-chevron-btn');

      if (nextExpanded) {
        item.classList.remove('is-collapsed');
        item.classList.add('is-expanded');
        if (childrenContainer) childrenContainer.style.display = '';
        if (chevronBtn) chevronBtn.classList.add('expanded');
      } else {
        item.classList.remove('is-expanded');
        item.classList.add('is-collapsed');
        if (childrenContainer) childrenContainer.style.display = 'none';
        if (chevronBtn) chevronBtn.classList.remove('expanded');
      }
    });
  });

  // Explicit Chevron button click
  container.querySelectorAll('.cat-chevron-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const item = btn.closest('.category-tree-item');
      if (!item) return;
      const catId = item.dataset.catId;
      const isExpanded = item.classList.contains('is-expanded');
      const nextExpanded = !isExpanded;
      categoryExpandedState[catId] = nextExpanded;

      const childrenContainer = item.querySelector('.cat-children-container');

      if (nextExpanded) {
        item.classList.remove('is-collapsed');
        item.classList.add('is-expanded');
        if (childrenContainer) childrenContainer.style.display = '';
        btn.classList.add('expanded');
      } else {
        item.classList.remove('is-expanded');
        item.classList.add('is-collapsed');
        if (childrenContainer) childrenContainer.style.display = 'none';
        btn.classList.remove('expanded');
      }
    });
  });`;

const newExpandCollapseHandlers = `  // Expand / Collapse Category Breakdown Section Header Toggle
  container.querySelectorAll('.category-breakdown-header').forEach(header => {
    header.addEventListener('click', (e) => {
      // Don't toggle if clicking buttons, inputs, drag handles, or editable weights
      if (e.target.closest('.btn-add-entry, .btn-del-cat, .cat-weight-editable, .cat-drag-handle, input, select')) {
        return;
      }
      const section = header.closest('.category-breakdown-section');
      if (!section) return;
      const catId = section.dataset.catId;
      const isExpanded = section.classList.contains('is-expanded');
      const nextExpanded = !isExpanded;
      categoryExpandedState[catId] = nextExpanded;

      const body = section.querySelector('.category-breakdown-body');
      const chevronBtn = section.querySelector('.cat-chevron-btn');

      if (nextExpanded) {
        section.classList.remove('is-collapsed');
        section.classList.add('is-expanded');
        if (body) body.style.display = '';
        if (chevronBtn) chevronBtn.classList.add('expanded');
      } else {
        section.classList.remove('is-expanded');
        section.classList.add('is-collapsed');
        if (body) body.style.display = 'none';
        if (chevronBtn) chevronBtn.classList.remove('expanded');
      }
    });
  });

  // Explicit Chevron button click
  container.querySelectorAll('.cat-chevron-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const section = btn.closest('.category-breakdown-section');
      if (!section) return;
      const catId = section.dataset.catId;
      const isExpanded = section.classList.contains('is-expanded');
      const nextExpanded = !isExpanded;
      categoryExpandedState[catId] = nextExpanded;

      const body = section.querySelector('.category-breakdown-body');

      if (nextExpanded) {
        section.classList.remove('is-collapsed');
        section.classList.add('is-expanded');
        if (body) body.style.display = '';
        btn.classList.add('expanded');
      } else {
        section.classList.remove('is-expanded');
        section.classList.add('is-collapsed');
        if (body) body.style.display = 'none';
        btn.classList.remove('expanded');
      }
    });
  });`;

gradesJs = gradesJs.replace(oldExpandCollapseHandlers, newExpandCollapseHandlers);

// Update live editing calculation in row
const oldLiveEditRow = `      // Live recalculation on row while user types
      const row = cell.closest('.grade-entry-row');
      const pctTag = row ? row.querySelector('.entry-pct-tag') : null;

      const updateRowLive = () => {
        if (!row || !pctTag) return;
        const sInput = cell.dataset.field === 'score' ? input : row.querySelector('.editable-score');
        const oInput = cell.dataset.field === 'out_of' ? input : row.querySelector('.editable-outof');
        const sVal = parseFloat(sInput.value !== undefined ? sInput.value : sInput.dataset.value);
        const oVal = parseFloat(oInput.value !== undefined ? oInput.value : oInput.dataset.value);
        if (!isNaN(sVal) && !isNaN(oVal) && oVal > 0) {
          const livePct = ((sVal / oVal) * 100).toFixed(1);
          pctTag.textContent = \`\${livePct}%\`;
          pctTag.className = \`entry-pct-tag \${getStandingClass(livePct)}\`;
        }
      };`;

const newLiveEditRow = `      // Live recalculation on row while user types
      const row = cell.closest('.grade-entry-row');
      const pctEl = row ? (row.querySelector('.entry-pct-text') || row.querySelector('.entry-pct-tag')) : null;

      const updateRowLive = () => {
        if (!row || !pctEl) return;
        const sInput = cell.dataset.field === 'score' ? input : row.querySelector('.editable-score');
        const oInput = cell.dataset.field === 'out_of' ? input : row.querySelector('.editable-outof');
        const sVal = parseFloat(sInput.value !== undefined ? sInput.value : sInput.dataset.value);
        const oVal = parseFloat(oInput.value !== undefined ? oInput.value : oInput.dataset.value);
        if (!isNaN(sVal) && !isNaN(oVal) && oVal > 0) {
          const livePct = ((sVal / oVal) * 100).toFixed(1);
          pctEl.textContent = \`\${livePct}%\`;
          pctEl.style.color = getStandingColor(livePct);
        }
      };`;

gradesJs = gradesJs.replace(oldLiveEditRow, newLiveEditRow);

fs.writeFileSync('js/grades.js', gradesJs, 'utf-8');

// 2. UPDATE css/style.css
let css = fs.readFileSync('css/style.css', 'utf-8');

const gradesBreakdownCss = `
/* ==========================================================================
   Grades Breakdown Layout (Clean Single-Column Accordion Sections)
   ========================================================================== */
.category-breakdown-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  box-sizing: border-box;
}

.category-breakdown-section {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.category-breakdown-section:hover {
  border-color: var(--border-default);
}

.category-breakdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 18px;
  background: var(--bg-surface);
  cursor: pointer;
  user-select: none;
  transition: background-color 0.15s ease;
  gap: 12px;
}

.category-breakdown-header:hover {
  background: var(--bg-surface-hover);
}

.cat-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.cat-breakdown-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cat-header-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.cat-header-summary {
  font-size: 12px;
  color: var(--text-secondary);
  font-family: var(--font-numeric);
  font-variant-numeric: tabular-nums;
  display: flex;
  align-items: center;
  gap: 6px;
}

.cat-summary-divider {
  color: var(--text-muted);
  opacity: 0.5;
}

.cat-chevron-btn {
  background: transparent;
  border: none;
  padding: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), color 0.15s ease;
}

.cat-chevron-btn:hover {
  color: var(--text-primary);
}

.cat-chevron-btn.expanded .cat-chevron-icon {
  transform: rotate(180deg);
}

.cat-chevron-icon {
  transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

.category-breakdown-body {
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-surface);
}

.cat-empty-body {
  padding: 20px;
  text-align: center;
  background: var(--bg-surface);
}

.cat-empty-msg {
  font-size: 12.5px;
  font-style: italic;
  color: var(--text-muted);
  margin: 0;
}

/* Minimal Assessment Entries Table */
.grade-entries-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.grade-entries-table th {
  padding: 10px 16px;
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-surface-hover);
}

.grade-entries-table td {
  padding: 11px 16px;
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-primary);
  vertical-align: middle;
}

.grade-entries-table tr:last-child td {
  border-bottom: none;
}

.grade-entries-table .cat-totals-row td {
  background: var(--bg-surface-hover);
  border-top: 1px solid var(--border-default);
  padding: 9px 16px;
}

.btn-del-entry {
  opacity: 0.5;
  transition: opacity 0.15s ease, color 0.15s ease;
}

.grade-entry-row:hover .btn-del-entry {
  opacity: 1;
}

.btn-del-entry:hover {
  color: var(--danger) !important;
}
`;

css += gradesBreakdownCss;
fs.writeFileSync('css/style.css', css, 'utf-8');

console.log('Successfully applied Grades category breakdown redesign!');
