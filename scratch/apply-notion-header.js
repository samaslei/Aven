import fs from 'fs';

// 1. UPDATE js/grades.js
let gradesJs = fs.readFileSync('js/grades.js', 'utf-8');

const oldHeaderBlock = `              <!-- Header Row (Always Visible & Clickable to Expand/Collapse) -->
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
              </div>`;

const newHeaderBlock = `              <!-- Header Row (Notion-Style: Drag Handle -> Chevron -> Name -> Weight) -->
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
                  <button type="button" class="cat-chevron-btn \${isExpanded ? 'expanded' : ''}" data-cat-id="\${cat.id}" aria-label="Toggle Expand Category">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" class="cat-chevron-icon">
                      <path d="M8 5v14l11-7z"></path>
                    </svg>
                  </button>
                  <h4 class="cat-breakdown-name" title="\${safeCatName}">\${cat.category}</h4>
                </div>

                <div class="cat-header-right">
                  \${renderWeightIndicator(cat.weight, cat.id)}
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
                </div>
              </div>`;

gradesJs = gradesJs.replace(oldHeaderBlock, newHeaderBlock);
fs.writeFileSync('js/grades.js', gradesJs, 'utf-8');

// 2. UPDATE css/style.css
let css = fs.readFileSync('css/style.css', 'utf-8');

const oldChevronCss = `.cat-chevron-btn {
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
}`;

const newChevronCss = `.cat-chevron-btn {
  background: transparent;
  border: none;
  padding: 2px 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: var(--radius-xs);
  transition: color 0.15s ease;
  flex-shrink: 0;
}

.cat-chevron-btn:hover {
  color: var(--text-primary);
}

.cat-chevron-icon {
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  transform: rotate(0deg);
}

.category-breakdown-section.is-expanded .cat-chevron-icon,
.cat-chevron-btn.expanded .cat-chevron-icon {
  transform: rotate(90deg);
}`;

css = css.replace(oldChevronCss, newChevronCss);
fs.writeFileSync('css/style.css', css, 'utf-8');

console.log('Successfully restructured category header to Notion-style: Drag -> Chevron -> Name -> Weight!');
