/**
 * Aven - Grades View Controller
 * Features: Grouped Subject list, Arc/Browser-style tabs, Weighted Categories with Totals row,
 * Philippine 1.00-5.00 grade conversion, Target Grade Solver, Midterm/Final term split
 */

import { store, events, GRADE_CATEGORIES, PHILIPPINE_GRADE_SCALE, getPhilippineGrade, getStandingColor } from './store.js';

let selectedSubjectId = null;
let activeTab = 'Midterm'; // 'Midterm' | 'Final' | 'Overall'

export function renderGradesView(container) {
  const activeSubjects = store.getSubjects(false);

  // Auto-select first subject if none selected or if selected was deleted
  if ((!selectedSubjectId || !store.getSubjectById(selectedSubjectId)) && activeSubjects.length > 0) {
    selectedSubjectId = activeSubjects[0].id;
  }

  const selectedSubject = selectedSubjectId ? store.getSubjectById(selectedSubjectId) : null;
  const gradeStats = selectedSubjectId ? store.calculateSubjectGrade(selectedSubjectId) : null;

  // Group subjects by Year & Semester for clean sidebar listing
  const groups = {};
  activeSubjects.forEach(s => {
    const key = `${s.year_level} — ${s.semester}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(s);
  });

  container.innerHTML = `
    <div class="grades-layout">
      <!-- Left Subject Sidebar with Grade Summaries -->
      <div class="grades-subject-list">
        <div style="padding: 6px 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted);">
          Subjects & Standings
        </div>

        ${activeSubjects.length === 0 ? `
          <div style="padding: 20px 8px; text-align: center; color: var(--text-muted); font-size: 13px;">
            No active subjects found.
          </div>
        ` : Object.keys(groups).map(grpKey => `
          <div style="margin-top: 8px;">
            <div style="font-size: 11px; font-weight: 600; color: var(--text-muted); padding: 4px 8px;">${grpKey}</div>
            ${groups[grpKey].map(sub => {
              const subGrade = store.calculateSubjectGrade(sub.id);
              const isSelected = sub.id === selectedSubjectId;
              return `
                <div class="grades-subject-item ${isSelected ? 'active' : ''}" data-id="${sub.id}">
                  <div class="grades-item-top">
                    <div style="display: flex; align-items: center; gap: 6px; overflow: hidden;">
                      <span style="width: 6px; height: 6px; border-radius: 50%; background: ${sub.color || '#6366f1'}; flex-shrink: 0;"></span>
                      <span class="grades-item-name">${sub.code ? `[${sub.code}] ` : ''}${sub.name}</span>
                    </div>
                  </div>
                  <div style="display: flex; justify-content: flex-end;">
                    <span class="grades-item-summary" style="color: ${getStandingColor(subGrade.overallPercentage)}; font-weight: 600;">${subGrade.summaryLine}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `).join('')}
      </div>

      <!-- Right Grade Content Panel -->
      <div class="grade-panel-container">
        ${!selectedSubject ? `
          <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 60px; text-align: center; color: var(--text-muted);">
            <h3>No Subject Selected</h3>
            <p style="margin-top: 8px;">Select a subject from the left list to calculate weighted grades.</p>
          </div>
        ` : `
          <!-- Browser-Style Tab Strip (Arc / Chrome Tabs) -->
          <div class="browser-tab-strip">
            <div class="browser-tab ${activeTab === 'Midterm' ? 'active' : ''}" data-tab="Midterm">
              <span>Midterm Term</span>
              <span class="browser-tab-badge" style="color: ${getStandingColor(gradeStats.midterm.percentage)}; font-weight: 600;">
                ${gradeStats.midterm.percentage !== null ? `${gradeStats.midterm.percentage}%` : '—'}
              </span>
            </div>

            <div class="browser-tab ${activeTab === 'Final' ? 'active' : ''}" data-tab="Final">
              <span>Final Term</span>
              <span class="browser-tab-badge" style="color: ${getStandingColor(gradeStats.final.percentage)}; font-weight: 600;">
                ${gradeStats.final.percentage !== null ? `${gradeStats.final.percentage}%` : '—'}
              </span>
            </div>

            <div class="browser-tab ${activeTab === 'Overall' ? 'active' : ''}" data-tab="Overall">
              <span>Overall Composite</span>
              <span class="browser-tab-badge" style="color: ${getStandingColor(gradeStats.overallPercentage)}; font-weight: 600;">
                ${gradeStats.overallPercentage !== null ? `${gradeStats.overallPercentage}% · ${gradeStats.philGrade.grade}` : '—'}
              </span>
            </div>
          </div>


          <!-- Connected Panel Content with Fluid Tab Transition -->
          <div class="browser-panel-content">
            <div class="tab-pane-content" key="${activeTab}">
              ${activeTab === 'Overall' ? renderOverallTabContent(selectedSubject, gradeStats) : renderTermTabContent(selectedSubject, activeTab, gradeStats)}
            </div>
          </div>
        `}
      </div>
    </div>

    <!-- Add Category Modal with Validation & Running Total -->
    <div class="modal-overlay" id="add-category-modal">
      <div class="modal-card" style="max-width: 480px;">
        <div class="modal-header">
          <h3 class="modal-title">Add Grade Category</h3>
          <button class="btn btn-ghost btn-icon close-cat-modal-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <form id="add-category-form">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label" for="new-cat-type">Category Name *</label>
              <select id="new-cat-type" class="form-select" required>
                <option value="" disabled selected>Select category or choose Custom...</option>
                ${GRADE_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
                <option value="__custom__">+ Custom Category Name...</option>
              </select>
            </div>

            <div class="form-group" id="custom-cat-group" style="display: none;">
              <label class="form-label" for="new-cat-custom-name">Custom Category Name *</label>
              <input type="text" id="new-cat-custom-name" class="form-input" placeholder="e.g. Problem Sets or Capstone">
            </div>

            <div class="form-group">
              <label class="form-label" for="new-cat-weight">Category Weight (%) *</label>
              <input type="number" id="new-cat-weight" class="form-input" min="1" max="100" placeholder="e.g. 20" required>
            </div>

            <!-- Live Running Total & Validation Status -->
            <div id="cat-weight-preview" style="padding: 10px 12px; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); font-size: 12.5px; display: flex; flex-direction: column; gap: 4px;">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <span style="color: var(--text-muted);">Current Term Weight:</span>
                <strong id="cat-current-weight-display" style="font-family: var(--font-mono); color: var(--text-primary);">0%</strong>
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <span style="color: var(--text-muted);">Projected Total:</span>
                <strong id="cat-projected-weight-display" style="font-family: var(--font-mono); color: var(--accent);">0%</strong>
              </div>
              <div id="cat-validation-msg" style="font-size: 11.5px; margin-top: 4px; line-height: 1.35; display: none;"></div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-ghost close-cat-modal-btn">Cancel</button>
            <button type="submit" class="btn btn-primary" id="btn-submit-add-cat">Add Category</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Add Entry Modal -->
    <div class="modal-overlay" id="add-entry-modal">
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title">Add Assessment Entry</h3>
          <button class="btn btn-ghost btn-icon close-entry-modal-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <form id="add-entry-form">
          <input type="hidden" id="entry-target-category-id" value="">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label" for="new-entry-name">Assessment Name *</label>
              <input type="text" id="new-entry-name" class="form-input" placeholder="e.g. Quiz 1: Pointers & Recursion" required>
            </div>
            <div class="form-row-paired">
              <div class="form-group">
                <label class="form-label" for="new-entry-score">Score Earned *</label>
                <input type="number" id="new-entry-score" class="form-input" step="0.1" min="0" placeholder="e.g. 18" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="new-entry-outof">Total / Out Of *</label>
                <input type="number" id="new-entry-outof" class="form-input" step="0.1" min="1" placeholder="e.g. 20" required>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-ghost close-entry-modal-btn">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Assessment</button>
          </div>
        </form>
      </div>
    </div>
  `;

  attachGradesEvents(container);
}

function renderTermTabContent(subject, term, gradeStats) {
  const termData = term === 'Midterm' ? gradeStats.midterm : gradeStats.final;
  const categories = store.getSubjectGradeCategories(subject.id, term);

  return `
    <div class="term-breakdown-container">
      <div class="term-header-row">
        <div>
          <h3 style="font-size: 18px; font-weight: 700;">${subject.name} — ${term} Breakdown</h3>
          <p style="font-size: 13px; color: var(--text-secondary); margin-top: 2px;">
            Total configured weight: <strong>${termData.totalWeight}%</strong> ${termData.totalWeight === 100 ? '✓ (100% Balanced)' : `(Need ${100 - termData.totalWeight}% more)`}
          </p>
        </div>

        <button class="btn btn-primary btn-sm" id="btn-open-add-cat">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add Category
        </button>
      </div>

      <!-- Category Calculator List -->
      <div class="category-list">
        ${categories.length === 0 ? `
          <div style="padding: 40px; text-align: center; border: 1px dashed var(--border-subtle); border-radius: var(--radius-md); color: var(--text-muted);">
            No grading categories added for ${term} yet. Click "Add Category" above to configure quizzes, exams, or labs!
          </div>
        ` : categories.map(cat => {
          const entries = cat.entries || [];
          const totalScore = entries.reduce((a, e) => a + Number(e.score || 0), 0);
          const totalOutOf = entries.reduce((a, e) => a + Number(e.out_of || 0), 0);
          const catPct = totalOutOf > 0 ? ((totalScore / totalOutOf) * 100).toFixed(1) : '—';
          const weightedPts = totalOutOf > 0 ? (((totalScore / totalOutOf) * cat.weight)).toFixed(2) : '—';

          return `
            <div class="category-card" data-cat-id="${cat.id}">
              <div class="category-card-header">
                <div class="cat-title-group">
                  <strong style="font-size: 14px;">${cat.category}</strong>
                  <span class="cat-weight-tag">${cat.weight}% Weight</span>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                  <span class="cat-avg-tag">Avg: <strong style="color: ${getStandingColor(catPct)};">${catPct !== '—' ? `${catPct}%` : '—'}</strong> (${weightedPts} pts)</span>
                  <button class="btn btn-ghost btn-sm btn-add-entry" data-cat-id="${cat.id}">+ Entry</button>
                  <button class="btn btn-ghost btn-sm btn-del-cat" data-cat-id="${cat.id}" style="color: var(--danger); padding: 4px 6px;">✕</button>
                </div>
              </div>

              <table class="cat-table">
                <thead>
                  <tr>
                    <th>Assessment Item</th>
                    <th>Score</th>
                    <th>Out Of</th>
                    <th>Percentage</th>
                    <th style="text-align: right;">Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${entries.length === 0 ? `
                    <tr>
                      <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 16px;">
                        No entries in this category yet. Click "+ Entry" to record a score.
                      </td>
                    </tr>
                  ` : entries.map(ent => {
                    const entPct = ((ent.score / ent.out_of) * 100).toFixed(1);
                    const safeName = (ent.name || '').replace(/"/g, '&quot;');
                    return `
                      <tr class="grade-entry-row" data-cat-id="${cat.id}" data-ent-id="${ent.id}">
                        <td>
                          <div class="editable-cell editable-name" data-field="name" data-cat-id="${cat.id}" data-ent-id="${ent.id}" data-value="${safeName}" title="Click to edit assessment name">
                            <span class="cell-value-text"><strong>${ent.name}</strong></span>
                            <svg class="edit-hint-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </div>
                        </td>
                        <td>
                          <div class="editable-cell editable-score" data-field="score" data-cat-id="${cat.id}" data-ent-id="${ent.id}" data-value="${ent.score}" title="Click to edit score">
                            <span class="cell-value-text" style="font-family: var(--font-mono); font-weight: 600;">${ent.score}</span>
                            <svg class="edit-hint-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </div>
                        </td>
                        <td>
                          <div class="editable-cell editable-outof" data-field="out_of" data-cat-id="${cat.id}" data-ent-id="${ent.id}" data-value="${ent.out_of}" title="Click to edit total points">
                            <span class="cell-value-text" style="font-family: var(--font-mono); font-weight: 600;">${ent.out_of}</span>
                            <svg class="edit-hint-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </div>
                        </td>
                        <td>
                          <span class="tag entry-pct-tag" style="font-family: var(--font-mono); font-weight: 600; color: ${getStandingColor(entPct)};">
                            ${entPct}%
                          </span>
                        </td>
                        <td style="text-align: right;">
                          <button class="btn btn-ghost btn-sm btn-del-entry" data-cat-id="${cat.id}" data-ent-id="${ent.id}" style="color: var(--danger); padding: 2px 6px;">
                            Delete
                          </button>
                        </td>
                      </tr>
                    `;
                  }).join('')}

                </tbody>
                <!-- Totals Row at the bottom of each category -->
                ${entries.length > 0 ? `
                  <tfoot>
                    <tr class="cat-totals-row">
                      <td>TOTALS</td>
                      <td style="font-family: var(--font-mono);">${totalScore.toFixed(1)}</td>
                      <td style="font-family: var(--font-mono);">${totalOutOf.toFixed(1)}</td>
                      <td style="font-family: var(--font-mono); font-weight: 700; color: ${getStandingColor(catPct)};">${catPct !== '—' ? `${catPct}%` : '—'}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                ` : ''}
              </table>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Clean Term Standing Summary (Consistent 18px standardized spacing) -->
      <div class="grade-summary-box">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span class="stat-card-title">${term} Standing</span>
          <span style="font-size: 12px; color: var(--text-muted);">
            Weighted Points: <strong>${termData.weightedEarned.toFixed(2)}</strong> / ${termData.totalWeight} pts
          </span>
        </div>
        <div class="phil-grade-display">
          <span class="phil-grade-big" style="color: ${getStandingColor(termData.percentage)};">${termData.percentage !== null ? `${termData.percentage.toFixed(1)}%` : '—'}</span>
          <span class="phil-grade-desc">· Philippine Grade ${termData.philGrade ? termData.philGrade.grade : '—'} (${termData.philGrade ? termData.philGrade.desc : ''})</span>
        </div>
      </div>
    </div>
  `;
}


function renderOverallTabContent(subject, gradeStats) {
  const config = gradeStats.config;
  const midtermPct = gradeStats.midterm.percentage;
  const finalPct = gradeStats.final.percentage;

  return `
    <div class="overall-breakdown-container">
      <div>
        <h3 style="font-size: 18px; font-weight: 700;">${subject.name} — Overall Standing & Target Solver</h3>
        <p style="font-size: 13px; color: var(--text-secondary); margin-top: 2px;">
          Combine Midterm and Final terms with customized weighting.
        </p>
      </div>

      <!-- Weight Split Controller -->
      <div style="background: var(--bg-input); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 18px; display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap;">
        <div>
          <strong style="font-size: 13.5px;">Term Weight Split</strong>
          <p style="font-size: 12px; color: var(--text-muted);">Adjust the relative weight of Midterm vs Final term for this subject.</p>
        </div>

        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <label class="form-label" style="margin: 0;">Midterm %</label>
            <input type="number" id="split-midterm-weight" class="form-input" min="0" max="100" value="${config.midterm_weight}" style="width: 70px; padding: 4px 8px;">
          </div>
          <span style="color: var(--text-muted);">+</span>
          <div style="display: flex; align-items: center; gap: 6px;">
            <label class="form-label" style="margin: 0;">Final %</label>
            <input type="number" id="split-final-weight" class="form-input" min="0" max="100" value="${config.final_weight}" style="width: 70px; padding: 4px 8px;">
          </div>
          <button class="btn btn-primary btn-sm" id="btn-save-weight-split">Update Split</button>
        </div>
      </div>

      <!-- Overall Standing & Target Solver Grid -->
      <div class="grade-summary-grid">
        <div class="grade-summary-box">
          <span class="stat-card-title">Overall Composite Standing</span>
          <div class="phil-grade-display">
            <span class="phil-grade-big" style="color: ${getStandingColor(gradeStats.overallPercentage)};">${gradeStats.overallPercentage !== null ? `${gradeStats.overallPercentage.toFixed(1)}%` : '—'}</span>
            <span class="phil-grade-desc">· Grade ${gradeStats.philGrade.grade} (${gradeStats.philGrade.desc})</span>
          </div>
          <div style="margin-top: 8px; font-size: 12.5px; color: var(--text-secondary); display: flex; flex-direction: column; gap: 4px;">
            <div>Midterm (${config.midterm_weight}%): <strong style="color: ${getStandingColor(midtermPct)};">${midtermPct !== null ? `${midtermPct.toFixed(1)}%` : 'No Data'}</strong></div>
            <div>Final (${config.final_weight}%): <strong style="color: ${getStandingColor(finalPct)};">${finalPct !== null ? `${finalPct.toFixed(1)}%` : 'No Data'}</strong></div>
          </div>
        </div>


        <!-- Target Grade Solver -->
        <div class="grade-summary-box">
          <span class="stat-card-title">Target Grade Solver</span>
          <p style="font-size: 12px; color: var(--text-secondary);">
            Calculate the required Final term score to achieve your desired target subject grade.
          </p>

          <div style="display: flex; align-items: center; gap: 10px; margin-top: 4px;">
            <input type="number" id="target-grade-input" class="form-input" step="0.1" min="0" max="100" value="91.0" placeholder="e.g. 91.0%">
            <button class="btn btn-primary btn-sm" id="btn-solve-target">Solve Target</button>
          </div>

          <div id="target-solver-result" style="margin-top: 8px; font-size: 13px; font-weight: 500;">
            ${calculateTargetScore(midtermPct, config.midterm_weight, config.final_weight, 91.0)}
          </div>
        </div>
      </div>

      <!-- Collapsible Philippine Grading Scale Reference (Exclusively on Overall Tab) -->
      <details class="grade-scale-details" style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px 18px; cursor: pointer;">
        <summary style="font-size: 13px; font-weight: 600; color: var(--text-secondary); display: flex; align-items: center; justify-content: space-between; user-select: none;">
          <span>Philippine Grade-Point Reference Scale</span>
          <span style="font-size: 11.5px; color: var(--accent);">View Scale</span>
        </summary>
        <div class="phil-scale-mini" style="margin-top: 14px;">
          ${store.getGradingScale().map((item, idx, arr) => {
            const nextHigher = arr[idx - 1];
            let rangeText = '';
            if (!nextHigher) {
              rangeText = `${item.min}–100%`;
            } else if (item.grade === '5.00') {
              rangeText = `<${arr[idx - 1].min}%`;
            } else {
              rangeText = `${item.min}–${nextHigher.min - 1}%`;
            }
            const isFailed = item.grade === '5.00';
            return `
              <div class="phil-scale-cell" style="${isFailed ? 'color: var(--danger);' : ''}">
                <strong>${item.grade}</strong>${rangeText}<br><span style="color:var(--text-muted);">${item.desc}</span>
              </div>
            `;
          }).join('')}
        </div>
      </details>
    </div>
  `;
}


function calculateTargetScore(midtermPct, midtermWeight, finalWeight, targetOverallPct) {
  if (midtermPct === null) {
    return `<span style="color: var(--text-muted);">Enter midterm grades first to calculate target.</span>`;
  }
  const mWeight = midtermWeight / 100;
  const fWeight = finalWeight / 100;

  if (fWeight <= 0) {
    return `<span style="color: var(--warning);">Final weight is 0%. Cannot solve.</span>`;
  }

  const requiredFinal = (targetOverallPct - (midtermPct * mWeight)) / fWeight;
  const reqFormatted = requiredFinal.toFixed(1);
  const phil = getPhilippineGrade(targetOverallPct);

  if (requiredFinal > 100) {
    return `<span style="color: var(--danger);">Target ${targetOverallPct}% (${phil.grade}) requires <strong>${reqFormatted}%</strong> on Final Term (Unattainable).</span>`;
  } else if (requiredFinal <= 0) {
    return `<span style="color: var(--success);">You have already secured target ${targetOverallPct}% (${phil.grade}) regardless of Final.</span>`;
  } else {
    return `<span style="color: var(--accent);">To achieve <strong>${targetOverallPct}% (${phil.grade})</strong>, you need <strong>${reqFormatted}%</strong> on the Final Term.</span>`;
  }
}

function attachGradesEvents(container) {
  // Switch Subject
  container.querySelectorAll('.grades-subject-item').forEach(item => {
    item.addEventListener('click', () => {
      selectedSubjectId = item.dataset.id;
      renderGradesView(container);
    });
  });

  // Switch Browser-Style Tab
  container.querySelectorAll('.browser-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      activeTab = tab.dataset.tab;
      renderGradesView(container);
    });
  });

  // Add Category Modal
  const catModal = container.querySelector('#add-category-modal');
  const openCatBtn = container.querySelector('#btn-open-add-cat');
  const catForm = container.querySelector('#add-category-form');

  if (openCatBtn && catModal) {
    openCatBtn.addEventListener('click', () => {
      catForm.reset();
      
      const existingCategories = selectedSubjectId ? store.getSubjectGradeCategories(selectedSubjectId, activeTab) : [];
      const currentTotalWeight = existingCategories.reduce((sum, c) => sum + Number(c.weight || 0), 0);

      const typeSelect = container.querySelector('#new-cat-type');
      const customGroup = container.querySelector('#custom-cat-group');
      const customInput = container.querySelector('#new-cat-custom-name');
      const weightInput = container.querySelector('#new-cat-weight');
      const currDisplay = container.querySelector('#cat-current-weight-display');
      const projDisplay = container.querySelector('#cat-projected-weight-display');
      const valMsg = container.querySelector('#cat-validation-msg');
      const submitBtn = container.querySelector('#btn-submit-add-cat');

      if (typeSelect) typeSelect.value = '';
      if (customGroup) customGroup.style.display = 'none';
      if (customInput) customInput.value = '';
      if (weightInput) weightInput.value = '';
      if (currDisplay) currDisplay.textContent = `${currentTotalWeight}%`;
      if (projDisplay) {
        projDisplay.textContent = `${currentTotalWeight}%`;
        projDisplay.style.color = currentTotalWeight > 100 ? 'var(--danger)' : (currentTotalWeight === 100 ? 'var(--success)' : 'var(--accent)');
      }
      if (valMsg) {
        valMsg.style.display = 'none';
        valMsg.textContent = '';
      }
      if (submitBtn) submitBtn.disabled = false;

      const updateValidation = () => {
        const selVal = typeSelect?.value || '';
        const isCustom = selVal === '__custom__';
        if (customGroup) customGroup.style.display = isCustom ? 'block' : 'none';

        const rawName = isCustom ? (customInput?.value || '').trim() : selVal;
        const enteredWeight = Number(weightInput?.value || 0);
        const projectedTotal = currentTotalWeight + enteredWeight;

        if (projDisplay) {
          projDisplay.textContent = `${projectedTotal}%`;
          if (projectedTotal > 100) {
            projDisplay.style.color = 'var(--danger)';
          } else if (projectedTotal === 100) {
            projDisplay.style.color = 'var(--success)';
          } else {
            projDisplay.style.color = 'var(--accent)';
          }
        }

        const isDuplicate = rawName && existingCategories.some(c => c.category.toLowerCase() === rawName.toLowerCase());

        if (isDuplicate) {
          if (valMsg) {
            valMsg.style.display = 'block';
            valMsg.style.color = 'var(--danger)';
            valMsg.innerHTML = `⚠️ A category named <strong>"${rawName}"</strong> already exists in ${activeTab}. Duplicate names are not permitted.`;
          }
          if (submitBtn) submitBtn.disabled = true;
        } else if (projectedTotal > 100 && enteredWeight > 0) {
          if (valMsg) {
            valMsg.style.display = 'block';
            valMsg.style.color = 'var(--warning)';
            valMsg.innerHTML = `⚠️ Total will be <strong>${projectedTotal}%</strong> (exceeds 100% by ${projectedTotal - 100}%). Term calculation may become unbalanced.`;
          }
          if (submitBtn) submitBtn.disabled = false;
        } else if (projectedTotal === 100 && enteredWeight > 0) {
          if (valMsg) {
            valMsg.style.display = 'block';
            valMsg.style.color = 'var(--success)';
            valMsg.innerHTML = `✓ Total will be <strong>100%</strong> (perfectly balanced).`;
          }
          if (submitBtn) submitBtn.disabled = false;
        } else if (enteredWeight > 0 && projectedTotal < 100) {
          if (valMsg) {
            valMsg.style.display = 'block';
            valMsg.style.color = 'var(--text-muted)';
            valMsg.innerHTML = `ℹ️ ${100 - projectedTotal}% remaining to reach 100% total weight.`;
          }
          if (submitBtn) submitBtn.disabled = false;
        } else {
          if (valMsg) valMsg.style.display = 'none';
          if (submitBtn) submitBtn.disabled = false;
        }
      };

      typeSelect?.addEventListener('change', updateValidation);
      customInput?.addEventListener('input', updateValidation);
      weightInput?.addEventListener('input', updateValidation);

      catModal.classList.add('open');
    });
  }

  container.querySelectorAll('.close-cat-modal-btn').forEach(b => {
    b.addEventListener('click', () => catModal.classList.remove('open'));
  });

  if (catForm) {
    catForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const typeSelect = container.querySelector('#new-cat-type');
      const customInput = container.querySelector('#new-cat-custom-name');
      const weightInput = container.querySelector('#new-cat-weight');

      const isCustom = typeSelect?.value === '__custom__';
      const catName = isCustom ? (customInput?.value || '').trim() : (typeSelect?.value || '').trim();
      const weight = Number(weightInput?.value || 0);

      if (!catName) {
        window.avenApp?.showToast('Please select or enter a category name', 'danger');
        return;
      }

      const existingCategories = selectedSubjectId ? store.getSubjectGradeCategories(selectedSubjectId, activeTab) : [];
      const isDuplicate = existingCategories.some(c => c.category.toLowerCase() === catName.toLowerCase());

      if (isDuplicate) {
        window.avenApp?.showToast(`Category "${catName}" already exists for ${activeTab}`, 'danger');
        return;
      }

      if (weight <= 0) {
        window.avenApp?.showToast('Weight percentage must be greater than 0', 'danger');
        return;
      }

      store.saveGradeCategory({
        subject_id: selectedSubjectId,
        term: activeTab,
        category: catName,
        weight: weight
      });

      catModal.classList.remove('open');
      window.avenApp?.showToast(`Added ${catName} category (${weight}%)`, 'success');
      renderGradesView(container);
    });
  }


  // Delete Category
  container.querySelectorAll('.btn-del-cat').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      store.deleteGradeCategory(btn.dataset.catId);
      window.avenApp?.showToast('Category deleted', 'info');
      renderGradesView(container);
    });
  });

  // Add Entry Modal
  const entryModal = container.querySelector('#add-entry-modal');
  const entryForm = container.querySelector('#add-entry-form');

  container.querySelectorAll('.btn-add-entry').forEach(btn => {
    btn.addEventListener('click', () => {
      entryForm.reset();
      container.querySelector('#entry-target-category-id').value = btn.dataset.catId;
      entryModal.classList.add('open');
    });
  });

  container.querySelectorAll('.close-entry-modal-btn').forEach(b => {
    b.addEventListener('click', () => entryModal.classList.remove('open'));
  });

  if (entryForm) {
    entryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const catId = container.querySelector('#entry-target-category-id').value;
      const name = container.querySelector('#new-entry-name').value;
      const score = container.querySelector('#new-entry-score').value;
      const out_of = container.querySelector('#new-entry-outof').value;

      store.saveGradeEntry(catId, { name, score, out_of });
      entryModal.classList.remove('open');
      window.avenApp?.showToast('Assessment entry saved', 'success');
      renderGradesView(container);
    });
  }

  // Delete Entry
  container.querySelectorAll('.btn-del-entry').forEach(btn => {
    btn.addEventListener('click', () => {
      store.deleteGradeEntry(btn.dataset.catId, btn.dataset.entId);
      window.avenApp?.showToast('Entry deleted', 'info');
      renderGradesView(container);
    });
  });

  // Inline Click-to-Edit for Assessment Item, Score, and Out Of cells
  container.querySelectorAll('.editable-cell').forEach(cell => {
    cell.addEventListener('click', (e) => {
      if (cell.classList.contains('editing')) return;

      const field = cell.dataset.field;
      const catId = cell.dataset.catId;
      const entId = cell.dataset.entId;
      const originalValue = cell.dataset.value;

      cell.classList.add('editing');
      const textSpan = cell.querySelector('.cell-value-text');
      const hintIcon = cell.querySelector('.edit-hint-icon');
      if (hintIcon) hintIcon.style.display = 'none';

      const isNumeric = field === 'score' || field === 'out_of';
      const input = document.createElement('input');
      input.type = isNumeric ? 'number' : 'text';
      input.className = `inline-edit-input ${isNumeric ? 'mono-num' : ''}`;
      input.value = originalValue;
      if (isNumeric) {
        input.min = field === 'out_of' ? '1' : '0';
        input.step = 'any';
      }

      // Live recalculation on row while user types
      const row = cell.closest('.grade-entry-row');
      const pctTag = row ? row.querySelector('.entry-pct-tag') : null;

      const updateRowLive = () => {
        if (!row || !pctTag) return;
        const currentScore = field === 'score' ? Number(input.value) : Number(row.querySelector('.editable-score')?.dataset.value || 0);
        const currentOutOf = field === 'out_of' ? Number(input.value) : Number(row.querySelector('.editable-outof')?.dataset.value || 100);
        if (currentOutOf > 0 && !isNaN(currentScore) && !isNaN(currentOutOf)) {
          const livePct = ((currentScore / currentOutOf) * 100).toFixed(1);
          pctTag.textContent = `${livePct}%`;
          pctTag.style.color = getStandingColor(livePct);
        }
      };

      if (isNumeric) {
        input.addEventListener('input', updateRowLive);
      }

      let isCancelled = false;

      const revert = () => {
        cell.classList.remove('editing');
        if (hintIcon) hintIcon.style.display = '';
        renderGradesView(container);
      };

      const commit = () => {
        if (isCancelled) return;

        const rawVal = input.value;
        if (field === 'name') {
          const trimmed = rawVal.trim();
          if (!trimmed) {
            window.avenApp?.showToast('Assessment name cannot be empty', 'warning');
            revert();
            return;
          }
          if (trimmed !== originalValue) {
            store.updateGradeEntry(catId, entId, { name: trimmed });
            window.avenApp?.showToast('Updated assessment name', 'success');
          }
        } else if (field === 'score') {
          const num = Number(rawVal);
          if (isNaN(num) || num < 0) {
            window.avenApp?.showToast('Score must be a positive number', 'warning');
            revert();
            return;
          }
          if (num !== Number(originalValue)) {
            store.updateGradeEntry(catId, entId, { score: num });
          }
        } else if (field === 'out_of') {
          const num = Number(rawVal);
          if (isNaN(num) || num <= 0) {
            window.avenApp?.showToast('Total points must be greater than 0', 'warning');
            revert();
            return;
          }
          if (num !== Number(originalValue)) {
            store.updateGradeEntry(catId, entId, { out_of: num });
          }
        }

        renderGradesView(container);
      };

      input.addEventListener('keydown', (evt) => {
        if (evt.key === 'Enter') {
          evt.preventDefault();
          input.blur();
        } else if (evt.key === 'Escape') {
          evt.preventDefault();
          isCancelled = true;
          revert();
        }
      });

      input.addEventListener('blur', () => {
        commit();
      });

      cell.innerHTML = '';
      cell.appendChild(input);
      input.focus();
      input.select();
    });
  });


  // Save Weight Split
  const saveSplitBtn = container.querySelector('#btn-save-weight-split');
  if (saveSplitBtn) {
    saveSplitBtn.addEventListener('click', () => {
      const mWeight = container.querySelector('#split-midterm-weight').value;
      const fWeight = container.querySelector('#split-final-weight').value;
      store.saveSubjectGradeConfig(selectedSubjectId, mWeight, fWeight);
      window.avenApp?.showToast('Term weight split saved', 'success');
      renderGradesView(container);
    });
  }

  // Solve Target Grade
  const solveTargetBtn = container.querySelector('#btn-solve-target');
  if (solveTargetBtn) {
    solveTargetBtn.addEventListener('click', () => {
      const targetVal = Number(container.querySelector('#target-grade-input').value) || 91.0;
      const stats = store.calculateSubjectGrade(selectedSubjectId);
      const resDiv = container.querySelector('#target-solver-result');
      resDiv.innerHTML = calculateTargetScore(
        stats.midterm.percentage,
        stats.config.midterm_weight,
        stats.config.final_weight,
        targetVal
      );
    });
  }
}
