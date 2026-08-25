/**
 * Aven - Grades View Controller
 * Features: Grouped Subject list, Arc/Browser-style tabs, Weighted Categories with Totals row,
 * Philippine 1.00-5.00 grade conversion, Target Grade Solver, Midterm/Final term split,
 * Predefined Category Templates (bulk quick-start), and Copy Categories to Finals.
 */

import { store, events, GRADE_CATEGORIES, PHILIPPINE_GRADE_SCALE, getPhilippineGrade, getStandingColor, getStandingClass } from './store.js';
import { sortSubjectsList } from './subjects.js';
import { exportSubjectGradesToExcel, exportAllSubjectsGradesToExcel } from './export-excel.js';

export const GRADE_CATEGORY_TEMPLATES = [
  {
    id: 'user-default-5',
    name: 'Standard College Lab & Lecture (5 Categories)',
    badge: '100% Total',
    desc: 'Quizzes (20%), Long Quizzes (20%), Term Exams (20%), Laboratory Exercise (20%), Laboratory Practical (20%).',
    categories: [
      { name: 'Quizzes', weight: 20 },
      { name: 'Long Quizzes', weight: 20 },
      { name: 'Term Exams', weight: 20 },
      { name: 'Laboratory Exercise', weight: 20 },
      { name: 'Laboratory Practical', weight: 20 }
    ]
  },
  {
    id: 'standard-college-lab-6',
    name: 'Lecture + Lab + Attendance (6 Categories)',
    badge: '100% Total',
    desc: 'Quizzes (20%), Long Quizzes (20%), Term Exams (20%), Lab Exercise (20%), Lab Practical (15%), Attendance (5%).',
    categories: [
      { name: 'Quizzes', weight: 20 },
      { name: 'Long Quizzes', weight: 20 },
      { name: 'Term Exams', weight: 20 },
      { name: 'Laboratory Exercise', weight: 20 },
      { name: 'Laboratory Practical', weight: 15 },
      { name: 'Attendance', weight: 5 }
    ]
  },
  {
    id: 'pure-lecture',
    name: 'Pure Lecture / Non-Laboratory (4 Categories)',
    badge: '100% Total',
    desc: 'Quizzes (25%), Long Quizzes (25%), Departmental / Term Exams (40%), Attendance & Recitation (10%).',
    categories: [
      { name: 'Quizzes', weight: 25 },
      { name: 'Long Quizzes', weight: 25 },
      { name: 'Term Exams', weight: 40 },
      { name: 'Attendance', weight: 10 }
    ]
  },
  {
    id: 'project-capstone',
    name: 'Project & Capstone Driven (4 Categories)',
    badge: '100% Total',
    desc: 'Quizzes & Milestones (20%), Major Project / Capstone (40%), Term Defense & Exams (30%), Participation (10%).',
    categories: [
      { name: 'Quizzes / Milestones', weight: 20 },
      { name: 'Major Project / Capstone', weight: 40 },
      { name: 'Term Defense & Exams', weight: 30 },
      { name: 'Class Participation', weight: 10 }
    ]
  }
];

let selectedSubjectId = null;
let activeTab = 'Midterm'; // 'Midterm' | 'Final' | 'Overall'
let activeCatModalTab = 'manual'; // 'manual' | 'template'
let selectedTemplateId = GRADE_CATEGORY_TEMPLATES[0].id;
let editableTemplateCategories = JSON.parse(JSON.stringify(GRADE_CATEGORY_TEMPLATES[0].categories));
const categoryExpandedState = {}; // Tracks expanded state by category ID

export function renderGradesView(container) {
  const activeSubjects = store.getSubjects(false);
  const sidebarSort = store.getGradesSidebarSort();

  // Auto-select last-viewed subject, or first available active subject
  const savedSubjectId = localStorage.getItem('aven_last_viewed_subject_id');
  if (savedSubjectId && store.getSubjectById(savedSubjectId) && !store.getSubjectById(savedSubjectId).is_archived) {
    selectedSubjectId = savedSubjectId;
  } else if ((!selectedSubjectId || !store.getSubjectById(selectedSubjectId) || store.getSubjectById(selectedSubjectId).is_archived) && activeSubjects.length > 0) {
    selectedSubjectId = activeSubjects[0].id;
    try {
      localStorage.setItem('aven_last_viewed_subject_id', selectedSubjectId);
    } catch (e) {}
  }

  const selectedSubject = selectedSubjectId ? store.getSubjectById(selectedSubjectId) : null;
  const gradeStats = selectedSubjectId ? store.calculateSubjectGrade(selectedSubjectId) : null;

  // Helper to render individual subject item in sidebar
  const renderSubjectItem = (sub) => {
    const subGrade = store.calculateSubjectGrade(sub.id);
    const isSelected = sub.id === selectedSubjectId;
    const standingClass = getStandingClass(subGrade.overallPercentage);
    return `
      <div class="grades-subject-item ${isSelected ? 'active' : ''}" data-id="${sub.id}" style="--item-color: ${sub.color || '#505537'};">
        <div class="grades-item-top">
          <span class="grades-item-dot" style="background: ${sub.color || '#6366f1'};"></span>
          <span class="grades-item-name">${sub.name}</span>
        </div>
        <div class="grades-item-bottom">
          ${sub.code ? `<span class="subject-list-code" style="font-size: 10px; padding: 1px 5px;">${sub.code}</span>` : `<span></span>`}
          <div class="subject-standing-pill ${standingClass}" style="font-size: 11px;">
            <span class="standing-dot" style="background: currentColor; width: 4.5px; height: 4.5px;"></span>
            <span>${subGrade.summaryLine}</span>
          </div>
        </div>
      </div>
    `;
  };

  // Group subjects by Year & Semester if grouped sort is active
  const isGrouped = sidebarSort === 'year-sem-grouped';
  const groups = {};
  if (isGrouped) {
    activeSubjects.forEach(s => {
      const key = `${s.year_level} — ${s.semester}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });
  }

  const sortedFlatSubjects = !isGrouped ? sortSubjectsList(activeSubjects, sidebarSort) : [];

  container.innerHTML = `
    <div class="grades-layout">
      <!-- Left Subject Sidebar with Grade Summaries & Sort Menu -->
      <div class="grades-subject-list">
        <div class="grades-sidebar-header">
          <span class="grades-sidebar-title">Subjects & Standings</span>
          <div style="position: relative;">
            <button class="btn btn-ghost btn-icon btn-sm" id="btn-grades-sidebar-sort" title="Sort subjects" style="padding: 2px 6px; height: 22px; width: 22px;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m3 16 4 4 4-4"></path>
                <path d="M7 20V4"></path>
                <path d="m21 8-4-4-4 4"></path>
                <path d="M17 4v16"></path>
              </svg>
            </button>
            <div class="user-popover grades-sort-popover" id="grades-sort-menu">
              <div style="font-size: 10.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; padding: 4px 8px 6px 8px; border-bottom: 1px solid var(--border-subtle); margin-bottom: 4px; letter-spacing: 0.04em;">
                Sort Sidebar List
              </div>
              <button class="popover-item ${sidebarSort === 'year-sem-grouped' ? 'active' : ''}" data-sort="year-sem-grouped">
                ${sidebarSort === 'year-sem-grouped' ? '✓ ' : ''}Year & Semester (Grouped)
              </button>
              <button class="popover-item ${sidebarSort === 'name-asc' ? 'active' : ''}" data-sort="name-asc">
                ${sidebarSort === 'name-asc' ? '✓ ' : ''}Name (A–Z)
              </button>
              <button class="popover-item ${sidebarSort === 'name-desc' ? 'active' : ''}" data-sort="name-desc">
                ${sidebarSort === 'name-desc' ? '✓ ' : ''}Name (Z–A)
              </button>
              <button class="popover-item ${sidebarSort === 'standing-desc' ? 'active' : ''}" data-sort="standing-desc">
                ${sidebarSort === 'standing-desc' ? '✓ ' : ''}Standing (Highest first)
              </button>
              <button class="popover-item ${sidebarSort === 'standing-asc' ? 'active' : ''}" data-sort="standing-asc">
                ${sidebarSort === 'standing-asc' ? '✓ ' : ''}Standing (Lowest first)
              </button>
              <button class="popover-item ${sidebarSort === 'recent-desc' ? 'active' : ''}" data-sort="recent-desc">
                ${sidebarSort === 'recent-desc' ? '✓ ' : ''}Recently added
              </button>
            </div>
          </div>
        </div>

        ${activeSubjects.length === 0 ? `
          <div style="padding: 20px 8px; text-align: center; color: var(--text-muted); font-size: 13px;">
            No active subjects found.
          </div>
        ` : isGrouped ? (
          Object.keys(groups).map(grpKey => `
            <div style="margin-top: 6px;">
              <div style="font-size: 11px; font-weight: 600; color: var(--text-muted); padding: 4px 8px;">${grpKey}</div>
              ${groups[grpKey].map(sub => renderSubjectItem(sub)).join('')}
            </div>
          `).join('')
        ) : (
          `<div style="display: flex; flex-direction: column; gap: 4px; margin-top: 4px;">
            ${sortedFlatSubjects.map(sub => renderSubjectItem(sub)).join('')}
          </div>`
        )}
      </div>

      <!-- Right Grade Content Panel -->
      <div class="grade-panel-container">
        ${!selectedSubject ? `
          <div style="background: var(--bg-surface); border: none; border-radius: var(--radius-lg); padding: 60px; text-align: center; color: var(--text-muted); box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.40), inset 0 1px 0 rgba(255, 255, 255, 0.08);">
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

    <!-- Add Category Modal with Single & Template Mode Tabs -->
    <div class="modal-overlay" id="add-category-modal">
      <div class="modal-card" style="max-width: 520px;">
        <div class="modal-header">
          <h3 class="modal-title">Configure Grade Categories</h3>
          <button class="btn btn-ghost btn-icon close-cat-modal-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- Mode Switcher Tabs -->
        <div class="modal-tab-strip">
          <button type="button" class="modal-tab-btn ${activeCatModalTab === 'manual' ? 'active' : ''}" id="cat-tab-manual-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14"></path>
            </svg>
            Single Category
          </button>
          <button type="button" class="modal-tab-btn ${activeCatModalTab === 'template' ? 'active' : ''}" id="cat-tab-template-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
            Preset Templates
          </button>
        </div>

        <!-- 1. MANUAL SINGLE CATEGORY FORM -->
        <form id="add-category-form" style="${activeCatModalTab === 'manual' ? 'display: block;' : 'display: none;'}">
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
            <div id="cat-weight-preview" style="padding: 10px 12px; background: var(--bg-surface); border: none; border-radius: var(--radius-md); font-size: 12.5px; display: flex; flex-direction: column; gap: 4px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08);">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <span style="color: var(--text-muted);">Current Term Weight:</span>
                <strong id="cat-current-weight-display" style="font-family: var(--font-numeric); font-variant-numeric: tabular-nums; color: var(--text-primary);">0%</strong>
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <span style="color: var(--text-muted);">Projected Total:</span>
                <strong id="cat-projected-weight-display" style="font-family: var(--font-numeric); font-variant-numeric: tabular-nums; color: var(--accent);">0%</strong>
              </div>
              <div id="cat-validation-msg" style="font-size: 11.5px; margin-top: 4px; line-height: 1.35; display: none;"></div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-ghost close-cat-modal-btn">Cancel</button>
            <button type="submit" class="btn btn-primary" id="btn-submit-add-cat">Add Category</button>
          </div>
        </form>

        <!-- 2. QUICK-START TEMPLATES FORM -->
        <div id="template-category-form" style="${activeCatModalTab === 'template' ? 'display: block;' : 'display: none;'}">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Select Standard Preset</label>
              <div class="template-preset-grid">
                ${GRADE_CATEGORY_TEMPLATES.map(tpl => `
                  <div class="template-preset-card ${tpl.id === selectedTemplateId ? 'active' : ''}" data-tpl-id="${tpl.id}">
                    <div class="template-preset-header">
                      <span class="template-preset-name">${tpl.name}</span>
                      <span class="template-preset-badge">${tpl.badge}</span>
                    </div>
                    <span class="template-preset-desc">${tpl.desc}</span>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Customizable Template Categories Rows -->
            <div class="form-group">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                <label class="form-label" style="margin: 0;">Categories & Weights Breakdown</label>
                <button type="button" class="btn btn-ghost btn-sm" id="btn-add-template-row" style="font-size: 11.5px; padding: 2px 6px;">
                  + Add Row
                </button>
              </div>

              <div class="template-rows-wrapper" id="template-rows-container">
                <!-- Populated dynamically -->
              </div>

              <div class="template-total-bar">
                <span style="color: var(--text-muted);">Configured Template Total:</span>
                <strong id="template-total-weight-display" style="font-family: var(--font-numeric); font-variant-numeric: tabular-nums; font-size: 13.5px;">100%</strong>
              </div>
            </div>

            <div style="margin-top: 10px; font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" id="tpl-replace-existing" checked style="accent-color: var(--accent); width: 15px; height: 15px; cursor: pointer;">
              <label for="tpl-replace-existing" style="cursor: pointer; margin: 0;">Replace any existing categories for this term</label>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-ghost close-cat-modal-btn">Cancel</button>
            <button type="button" class="btn btn-primary" id="btn-apply-template">
              Apply Template to ${activeTab}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Copy to Finals Confirmation Dialog Modal -->
    <div class="modal-overlay" id="copy-finals-confirm-modal">
      <div class="modal-card" style="max-width: 440px;">
        <div class="modal-header">
          <h3 class="modal-title" style="color: var(--warning);">Replace Finals Categories?</h3>
          <button class="btn btn-ghost btn-icon close-copy-modal-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <p style="font-size: 13.5px; line-height: 1.5; color: var(--text-primary);">
            Finals already has categories set up. Copying will replace all current Final term categories with your Midterm structure.
          </p>
          <p style="font-size: 12.5px; color: var(--text-muted); margin-top: 8px;">
            Note: Only category names and weights are duplicated. Each category in Finals will start empty (zero score entries).
          </p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost close-copy-modal-btn">Cancel</button>
          <button type="button" class="btn btn-primary" id="btn-confirm-copy-finals">Replace & Copy</button>
        </div>
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

function renderSyncIndicatorHtml(syncState) {
  const status = syncState ? syncState.status : 'idle';
  if (status === 'saving') {
    return `<span class="sync-spinner"></span> <span>Saving...</span>`;
  } else if (status === 'synced') {
    return `<span>✓ Synced</span>`;
  } else if (status === 'error') {
    const msg = syncState.error || 'Sync failed';
    return `<span title="${msg}">⚠️ Sync failed</span>`;
  }
  return '';
}

function renderWeightIndicator(weight, catId = '') {
  const w = Number(weight) || 0;
  return `
    <span class="cat-weight-editable" data-cat-id="${catId}" data-weight="${w}" title="Click to edit category weight %">
      <span class="cat-weight-val">${w}%</span>
      <svg class="cat-weight-edit-icon" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
      </svg>
    </span>
  `;
}

function renderTermTabContent(subject, term, gradeStats) {
  const termData = term === 'Midterm' ? gradeStats.midterm : gradeStats.final;
  const categories = store.getSubjectGradeCategories(subject.id, term);
  const midtermCategories = store.getSubjectGradeCategories(subject.id, 'Midterm');
  const syncState = store.getSyncStatus();

  return `
    <div class="term-breakdown-container">
      <div class="term-header-row">
        <div class="term-header-left">
          <h3 style="font-size: 18px; font-weight: 700; letter-spacing: -0.02em;">${subject.name} — ${term} Breakdown</h3>
        </div>

        <div class="term-header-right" style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: flex-end;">
            <div id="grades-sync-indicator" class="sync-status-indicator sync-${syncState.status}">
              ${renderSyncIndicatorHtml(syncState)}
            </div>

            ${term === 'Final' && midtermCategories.length > 0 ? `
              <button class="btn btn-secondary btn-sm" id="btn-copy-to-finals" title="Duplicate category names & weights into Final term">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                Copy categories to Finals
              </button>
            ` : ''}



            <!-- Export to Excel Dropdown Menu -->
            <div style="position: relative;">
              <button class="btn btn-secondary btn-sm btn-grades-export-toggle" title="Export grade report to Excel (.xlsx)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <span>Export</span>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-left: 2px;">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              <div class="user-popover grades-export-popover">
                <div style="font-size: 10.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; padding: 4px 8px 6px 8px; border-bottom: 1px solid var(--border-subtle); margin-bottom: 4px; letter-spacing: 0.04em;">
                  Export Excel (.xlsx)
                </div>
                <button class="popover-item btn-export-current-subject" data-subject-id="${subject.id}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--success); flex-shrink: 0;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                  <span>${subject.code || 'Current Subject'} (.xlsx)</span>
                </button>
                <button class="popover-item btn-export-all-subjects">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--accent); flex-shrink: 0;"><rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                  <span>All Active Subjects (.xlsx)</span>
                </button>
              </div>
            </div>

            <button class="btn btn-primary btn-sm" id="btn-open-add-cat">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add Category
            </button>
          </div>

          <span class="term-weight-summary" style="font-size: 12.5px; color: var(--text-secondary); text-align: right;">
            Total configured weight: <strong>${termData.totalWeight}%</strong> ${termData.totalWeight === 100 ? '<span style="color: var(--success); font-weight: 600;">✓ (100% Balanced)</span>' : `<span style="color: var(--warning);">(Need ${100 - termData.totalWeight}% more)</span>`}
          </span>
        </div>
      </div>

      <!-- Categories & Assessment Entries List (Clean Breakdown Accordion) -->
      <div class="category-breakdown-list">
        ${categories.length === 0 ? `
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
              ${term === 'Final' && midtermCategories.length > 0 ? `
                <button class="btn btn-secondary btn-sm btn-quick-copy-midterm">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  Copy Categories from Midterm
                </button>
              ` : ''}
              <button class="btn btn-sm btn-open-manual-cat">
                + Manual Category
              </button>
            </div>
          </div>
        ` : categories.map(cat => {
          const entries = cat.entries || [];
          const safeCatName = (cat.category || '').replace(/"/g, '&quot;');
          const isExpanded = categoryExpandedState[cat.id] !== undefined ? categoryExpandedState[cat.id] : (entries.length > 0);

          const totalScore = entries.reduce((a, e) => a + Number(e.score || 0), 0);
          const totalOutOf = entries.reduce((a, e) => a + Number(e.out_of || 0), 0);
          const catPct = totalOutOf > 0 ? ((totalScore / totalOutOf) * 100).toFixed(1) : '—';
          const weightedPts = totalOutOf > 0 ? (((totalScore / totalOutOf) * cat.weight)).toFixed(2) : '—';

          return `
            <div class="category-breakdown-section ${isExpanded ? 'is-expanded' : 'is-collapsed'}" data-cat-id="${cat.id}">
              <!-- Header Row (Always Visible & Clickable to Expand/Collapse) -->
              <div class="category-breakdown-header" data-cat-id="${cat.id}">
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
                  <h4 class="cat-breakdown-name" title="${safeCatName}">${cat.category}</h4>
                  ${renderWeightIndicator(cat.weight, cat.id)}
                </div>

                <div class="cat-header-right">
                  ${entries.length > 0 ? `
                    <div class="cat-header-summary">
                      <span>Avg: <strong style="color: ${getStandingColor(catPct)};">${catPct}%</strong></span>
                      <span class="cat-summary-divider">·</span>
                      <span>${weightedPts} pts</span>
                    </div>
                  ` : ''}
                  <button type="button" class="btn btn-ghost btn-sm btn-add-entry" data-cat-id="${cat.id}" title="Add assessment entry">
                    + Entry
                  </button>
                  <button type="button" class="btn btn-ghost btn-sm btn-del-cat" data-cat-id="${cat.id}" style="color: var(--danger); padding: 4px 7px;" title="Delete Category">
                    ✕
                  </button>
                  <button type="button" class="cat-chevron-btn ${isExpanded ? 'expanded' : ''}" data-cat-id="${cat.id}" aria-label="Toggle Expand Category">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="cat-chevron-icon">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Expandable Content Body -->
              <div class="category-breakdown-body" style="${!isExpanded ? 'display: none;' : ''}">
                ${entries.length === 0 ? `
                  <div class="cat-empty-body">
                    <p class="cat-empty-msg">No entries in this category yet. Click <strong>+ Entry</strong> to add one.</p>
                  </div>
                ` : `
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
                        ${entries.map(ent => {
                          const entPct = ((ent.score / ent.out_of) * 100).toFixed(1);
                          const safeName = (ent.name || '').replace(/"/g, '&quot;');
                          const standingColor = getStandingColor(entPct);
                          return `
                            <tr class="grade-entry-row" data-cat-id="${cat.id}" data-ent-id="${ent.id}">
                              <td style="text-align: left;">
                                <div class="editable-cell editable-name" data-field="name" data-cat-id="${cat.id}" data-ent-id="${ent.id}" data-value="${safeName}" title="Click to edit assessment name">
                                  <span class="cell-value-text"><strong>${ent.name}</strong></span>
                                  <svg class="edit-hint-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                  </svg>
                                </div>
                              </td>
                              <td style="text-align: center;">
                                <div class="editable-cell editable-score" data-field="score" data-cat-id="${cat.id}" data-ent-id="${ent.id}" data-value="${ent.score}" title="Click to edit score">
                                  <span class="cell-value-text mono-num" style="font-family: var(--font-numeric); font-variant-numeric: tabular-nums; font-weight: 600;">${ent.score}</span>
                                  <svg class="edit-hint-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                  </svg>
                                </div>
                              </td>
                              <td style="text-align: center;">
                                <div class="editable-cell editable-outof" data-field="out_of" data-cat-id="${cat.id}" data-ent-id="${ent.id}" data-value="${ent.out_of}" title="Click to edit total points">
                                  <span class="cell-value-text mono-num" style="font-family: var(--font-numeric); font-variant-numeric: tabular-nums; font-weight: 600;">${ent.out_of}</span>
                                  <svg class="edit-hint-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                  </svg>
                                </div>
                              </td>
                              <td style="text-align: center;">
                                <span class="entry-pct-text" style="color: ${standingColor}; font-weight: 700; font-family: var(--font-numeric); font-variant-numeric: tabular-nums;">
                                  ${entPct}%
                                </span>
                              </td>
                              <td style="text-align: right;">
                                <button type="button" class="btn btn-ghost btn-sm btn-del-entry" data-cat-id="${cat.id}" data-ent-id="${ent.id}" title="Delete Entry" style="color: var(--text-muted); padding: 4px;">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          `;
                        }).join('')}
                      </tbody>
                      <tfoot>
                        <tr class="cat-totals-row grade-entry-row" style="cursor: default;">
                          <td style="text-align: left;">
                            <span class="cell-value-text">TOTAL</span>
                          </td>
                          <td style="text-align: center;">
                            <span class="cell-value-text mono-num" style="font-family: var(--font-numeric); font-variant-numeric: tabular-nums;">${totalScore.toFixed(1)}</span>
                          </td>
                          <td style="text-align: center;">
                            <span class="cell-value-text mono-num" style="font-family: var(--font-numeric); font-variant-numeric: tabular-nums;">${totalOutOf.toFixed(1)}</span>
                          </td>
                          <td style="text-align: center;">
                            <span class="entry-pct-text" style="color: ${getStandingColor(catPct)}; font-weight: 700; font-family: var(--font-numeric); font-variant-numeric: tabular-nums;">
                              ${catPct !== '—' ? `${catPct}%` : '—'}
                            </span>
                          </td>
                          <td style="text-align: right;"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                `}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Clean Term Standing Summary -->
      <div class="grade-summary-box" style="--standing-color: ${getStandingColor(termData.percentage)};">
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
      <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
        <div>
          <h3 style="font-size: 18px; font-weight: 700;">${subject.name} — Overall Standing & Target Solver</h3>
          <p style="font-size: 13px; color: var(--text-secondary); margin-top: 2px;">
            Combine Midterm and Final terms with customized weighting.
          </p>
        </div>

        <!-- Export to Excel Dropdown Menu -->
        <div style="position: relative;">
          <button class="btn btn-secondary btn-sm btn-grades-export-toggle" title="Export grade report to Excel (.xlsx)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <span>Export to Excel</span>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-left: 2px;">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          <div class="user-popover grades-export-popover">
            <div style="font-size: 10.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; padding: 4px 8px 6px 8px; border-bottom: 1px solid var(--border-subtle); margin-bottom: 4px; letter-spacing: 0.04em;">
              Export Excel (.xlsx)
            </div>
            <button class="popover-item btn-export-current-subject" data-subject-id="${subject.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--success); flex-shrink: 0;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
              <span>${subject.code || 'Current Subject'} (.xlsx)</span>
            </button>
            <button class="popover-item btn-export-all-subjects">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--accent); flex-shrink: 0;"><rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
              <span>All Active Subjects (.xlsx)</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Weight Split Controller -->
      <div style="background: var(--bg-input); border: none; border-radius: var(--radius-md); padding: 18px; display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.06);">
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

      <!-- Overall Standing & Target Solver Grid (Pulse Ring & Minimalist Layout) -->
      <div class="grade-summary-grid">
        <div class="grade-summary-box pulse-card">
          <div class="pulse-card-header">
            <span class="stat-card-title">Academic Standing Pulse</span>
            <span class="stat-pill success">${gradeStats.philGrade.desc || 'Standing'}</span>
          </div>

          <div class="pulse-main-row">
            <!-- Large Center Pulse Ring (Reference FeedBacker Style) -->
            <div class="pulse-ring-container">
              <div class="pulse-ring-outer">
                <span class="pulse-ring-score">${gradeStats.overallPercentage !== null ? gradeStats.overallPercentage.toFixed(1) : '—'}</span>
                <span class="pulse-ring-sub">Grade ${gradeStats.philGrade.grade}</span>
              </div>
            </div>

            <!-- Metric Breakdown List with Circular Icon Badges -->
            <div class="pulse-metrics-list">
              <div class="pulse-metric-item">
                <div class="pulse-metric-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path></svg>
                </div>
                <div class="pulse-metric-text">
                  <span class="pulse-metric-val" style="color: ${getStandingColor(midtermPct)};">${midtermPct !== null ? `${midtermPct.toFixed(1)}%` : '—'}</span>
                  <span class="pulse-metric-lbl">Midterm (${config.midterm_weight}%)</span>
                </div>
              </div>

              <div class="pulse-metric-item">
                <div class="pulse-metric-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline></svg>
                </div>
                <div class="pulse-metric-text">
                  <span class="pulse-metric-val" style="color: ${getStandingColor(finalPct)};">${finalPct !== null ? `${finalPct.toFixed(1)}%` : '—'}</span>
                  <span class="pulse-metric-lbl">Final (${config.final_weight}%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Target Grade Solver -->
        <div class="grade-summary-box">
          <div class="pulse-card-header">
            <span class="stat-card-title">Target Grade Solver</span>
            <span class="stat-pill" style="background: var(--accent-surface); color: var(--accent);">Target 91.0%</span>
          </div>
          <p style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.45;">
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

      <!-- Collapsible Philippine Grading Scale Reference -->
      <details class="grade-scale-details" style="background: var(--bg-surface-elevated); border: none; border-radius: var(--radius-md); padding: 14px 18px; cursor: pointer; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08);">
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
  // Sidebar Sort Menu Popover
  const sortBtn = container.querySelector('#btn-grades-sidebar-sort');
  const sortMenu = container.querySelector('#grades-sort-menu');

  if (sortBtn && sortMenu) {
    sortBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sortMenu.classList.toggle('open');
    });

    sortMenu.querySelectorAll('.popover-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const sortKey = item.dataset.sort;
        store.setGradesSidebarSort(sortKey);
        sortMenu.classList.remove('open');
        renderGradesView(container);
      });
    });

    const closeSortMenu = (e) => {
      if (sortMenu && !sortMenu.contains(e.target) && !sortBtn.contains(e.target)) {
        sortMenu.classList.remove('open');
      }
    };
    document.addEventListener('click', closeSortMenu);
  }

  // Switch Subject
  container.querySelectorAll('.grades-subject-item').forEach(item => {
    item.addEventListener('click', () => {
      selectedSubjectId = item.dataset.id;
      try {
        localStorage.setItem('aven_last_viewed_subject_id', selectedSubjectId);
      } catch (e) {}
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
  const catForm = container.querySelector('#add-category-form');
  const templateForm = container.querySelector('#template-category-form');
  const tabManualBtn = container.querySelector('#cat-tab-manual-btn');
  const tabTemplateBtn = container.querySelector('#cat-tab-template-btn');
  const rowsContainer = container.querySelector('#template-rows-container');
  const totalWeightDisplay = container.querySelector('#template-total-weight-display');

  const renderTemplateRows = () => {
    if (!rowsContainer) return;
    rowsContainer.innerHTML = editableTemplateCategories.map((c, idx) => `
      <div class="template-category-row" data-idx="${idx}">
        <input type="text" class="form-input template-row-name-input" value="${c.name}" placeholder="Category Name" data-idx="${idx}">
        <div class="template-row-weight-wrap">
          <input type="number" class="form-input template-row-weight-input" min="1" max="100" value="${c.weight}" data-idx="${idx}">
          <span style="font-size: 12px; color: var(--text-muted);">%</span>
        </div>
        <button type="button" class="template-row-remove-btn" data-idx="${idx}" title="Remove Category">
          ✕
        </button>
      </div>
    `).join('');

    updateTemplateTotal();
  };

  const updateTemplateTotal = () => {
    const total = editableTemplateCategories.reduce((sum, c) => sum + Number(c.weight || 0), 0);
    if (totalWeightDisplay) {
      totalWeightDisplay.textContent = `${total}%`;
      if (total === 100) {
        totalWeightDisplay.style.color = 'var(--success)';
      } else if (total > 100) {
        totalWeightDisplay.style.color = 'var(--danger)';
      } else {
        totalWeightDisplay.style.color = 'var(--accent)';
      }
    }
  };

  const setCategoryModalTab = (tab) => {
    activeCatModalTab = tab;
    tabManualBtn?.classList.toggle('active', tab === 'manual');
    tabTemplateBtn?.classList.toggle('active', tab === 'template');
    if (catForm) catForm.style.display = tab === 'manual' ? 'block' : 'none';
    if (templateForm) templateForm.style.display = tab === 'template' ? 'block' : 'none';
    if (tab === 'template') {
      renderTemplateRows();
    }
  };

  tabManualBtn?.addEventListener('click', () => setCategoryModalTab('manual'));
  tabTemplateBtn?.addEventListener('click', () => setCategoryModalTab('template'));

  const openCategoryModal = (initialTab = 'manual') => {
    setCategoryModalTab(initialTab);
    catForm?.reset();

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

    catModal?.classList.add('open');
  };

  container.querySelector('#btn-open-add-cat')?.addEventListener('click', () => openCategoryModal('manual'));
  container.querySelector('.btn-open-manual-cat')?.addEventListener('click', () => openCategoryModal('manual'));
  container.querySelector('.btn-quick-use-template')?.addEventListener('click', () => openCategoryModal('template'));

  container.querySelectorAll('.close-cat-modal-btn').forEach(b => {
    b.addEventListener('click', () => catModal?.classList.remove('open'));
  });

  // Template preset selection
  container.querySelectorAll('.template-preset-card').forEach(card => {
    card.addEventListener('click', () => {
      container.querySelectorAll('.template-preset-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      selectedTemplateId = card.dataset.tplId;
      const found = GRADE_CATEGORY_TEMPLATES.find(t => t.id === selectedTemplateId);
      if (found) {
        editableTemplateCategories = JSON.parse(JSON.stringify(found.categories));
        renderTemplateRows();
      }
    });
  });

  // Template row editing and removal
  rowsContainer?.addEventListener('input', (e) => {
    const idx = Number(e.target.dataset.idx);
    if (isNaN(idx) || !editableTemplateCategories[idx]) return;

    if (e.target.classList.contains('template-row-name-input')) {
      editableTemplateCategories[idx].name = e.target.value;
    } else if (e.target.classList.contains('template-row-weight-input')) {
      editableTemplateCategories[idx].weight = Number(e.target.value) || 0;
      updateTemplateTotal();
    }
  });

  rowsContainer?.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.template-row-remove-btn');
    if (removeBtn) {
      const idx = Number(removeBtn.dataset.idx);
      if (!isNaN(idx) && editableTemplateCategories[idx]) {
        editableTemplateCategories.splice(idx, 1);
        renderTemplateRows();
      }
    }
  });

  // Add custom row into template
  container.querySelector('#btn-add-template-row')?.addEventListener('click', () => {
    editableTemplateCategories.push({ name: 'Other', weight: 10 });
    renderTemplateRows();
  });

  // Apply Template Action
  container.querySelector('#btn-apply-template')?.addEventListener('click', () => {
    if (!selectedSubjectId) return;

    if (editableTemplateCategories.length === 0) {
      window.avenApp?.showToast('Please specify at least one category in the template', 'warning');
      return;
    }

    const invalidName = editableTemplateCategories.find(c => !c.name || !c.name.trim());
    if (invalidName) {
      window.avenApp?.showToast('All template categories must have a valid name', 'warning');
      return;
    }

    const replaceExisting = container.querySelector('#tpl-replace-existing')?.checked ?? true;

    const bulkList = editableTemplateCategories.map(c => ({
      subject_id: selectedSubjectId,
      term: activeTab,
      category: c.name.trim(),
      weight: Number(c.weight) || 0
    }));

    store.saveGradeCategoriesBulk(
      bulkList,
      replaceExisting ? selectedSubjectId : null,
      replaceExisting ? activeTab : null
    );

    catModal?.classList.remove('open');
    window.avenApp?.showToast(`Applied template: created ${bulkList.length} categories for ${activeTab}!`, 'success');
    renderGradesView(container);
  });

  // Manual single category form submission
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

      catModal?.classList.remove('open');
      window.avenApp?.showToast(`Added ${catName} category (${weight}%)`, 'success');
      renderGradesView(container);
    });
  }

  // Copy Categories to Finals
  const copyModal = container.querySelector('#copy-finals-confirm-modal');
  const triggerCopyFinals = () => {
    if (!selectedSubjectId) return;
    const finalsCategories = store.getSubjectGradeCategories(selectedSubjectId, 'Final');

    if (finalsCategories.length > 0) {
      copyModal?.classList.add('open');
    } else {
      executeCopyToFinals();
    }
  };

  const executeCopyToFinals = () => {
    const copied = store.copyCategoriesBetweenTerms(selectedSubjectId, 'Midterm', 'Final', true);
    copyModal?.classList.remove('open');
    window.avenApp?.showToast(`Copied ${copied.length} categories to Finals (0 entries created)`, 'success');
    renderGradesView(container);
  };

  container.querySelector('#btn-copy-to-finals')?.addEventListener('click', triggerCopyFinals);
  container.querySelector('.btn-quick-copy-midterm')?.addEventListener('click', triggerCopyFinals);
  container.querySelector('#btn-confirm-copy-finals')?.addEventListener('click', executeCopyToFinals);
  container.querySelectorAll('.close-copy-modal-btn').forEach(b => {
    b.addEventListener('click', () => copyModal?.classList.remove('open'));
  });

  // Expand / Collapse Category Breakdown Section Header Toggle
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
  });

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
      entryForm?.reset();
      container.querySelector('#entry-target-category-id').value = btn.dataset.catId;
      entryModal?.classList.add('open');
    });
  });

  container.querySelectorAll('.close-entry-modal-btn').forEach(b => {
    b.addEventListener('click', () => entryModal?.classList.remove('open'));
  });

  if (entryForm) {
    entryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const catId = container.querySelector('#entry-target-category-id').value;
      const name = container.querySelector('#new-entry-name').value;
      const score = container.querySelector('#new-entry-score').value;
      const out_of = container.querySelector('#new-entry-outof').value;

      store.saveGradeEntry(catId, { name, score, out_of });
      entryModal?.classList.remove('open');
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

  // Click-to-Edit Category Weight %
  container.querySelectorAll('.cat-weight-editable').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (el.querySelector('input')) return;

      const catId = el.dataset.catId;
      const currentWeight = Number(el.dataset.weight) || 0;

      const input = document.createElement('input');
      input.type = 'number';
      input.min = '0';
      input.max = '100';
      input.step = 'any';
      input.className = 'cat-weight-input';
      input.value = currentWeight;

      el.innerHTML = '';
      el.appendChild(input);
      input.focus();
      input.select();

      let committed = false;
      const commit = () => {
        if (committed) return;
        committed = true;
        const newWeight = parseFloat(input.value);
        if (!isNaN(newWeight) && newWeight >= 0 && newWeight !== currentWeight) {
          store.saveGradeCategory({ id: catId, weight: newWeight });
          window.avenApp?.showToast(`Updated weight to ${newWeight}%`, 'success');
        }
        renderGradesView(container);
      };

      input.addEventListener('blur', commit);
      input.addEventListener('keydown', (evt) => {
        if (evt.key === 'Enter') {
          evt.preventDefault();
          commit();
        } else if (evt.key === 'Escape') {
          evt.preventDefault();
          committed = true;
          renderGradesView(container);
        }
      });
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

  // Drag-and-Drop Category Reordering with smooth FLIP animation
  const categoryList = container.querySelector('.category-breakdown-list') || container.querySelector('.category-list');
  if (categoryList) {
    let draggedCard = null;
    let isHandleGrabbed = false;

    // Track grab on drag handle specifically
    categoryList.addEventListener('mousedown', (e) => {
      const handle = e.target.closest('.cat-drag-handle');
      if (handle) {
        isHandleGrabbed = true;
        const card = handle.closest('.category-breakdown-section') || handle.closest('.category-card');
        if (card) card.setAttribute('draggable', 'true');
      } else {
        isHandleGrabbed = false;
      }
    });

    document.addEventListener('mouseup', () => {
      isHandleGrabbed = false;
      if (categoryList) {
        categoryList.querySelectorAll('.category-breakdown-section, .category-card').forEach(c => c.removeAttribute('draggable'));
      }
    }, { once: true });

    categoryList.addEventListener('dragstart', (e) => {
      const card = e.target.closest('.category-breakdown-section') || e.target.closest('.category-card');
      if (!card || !isHandleGrabbed) {
        e.preventDefault();
        return;
      }

      draggedCard = card;
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', card.dataset.catId || '');
      }

      // Add dragging class on next tick so drag ghost retains original appearance
      requestAnimationFrame(() => {
        if (draggedCard) draggedCard.classList.add('is-dragging');
      });
    });

    categoryList.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
      if (!draggedCard) return;

      const targetCard = e.target.closest('.category-breakdown-section') || e.target.closest('.category-card');
      if (!targetCard || targetCard === draggedCard) {
        return;
      }

      const cards = Array.from(categoryList.querySelectorAll('.category-breakdown-section, .category-card'));
      const draggedIdx = cards.indexOf(draggedCard);
      const targetIdx = cards.indexOf(targetCard);
      if (draggedIdx === -1 || targetIdx === -1) return;

      const rect = targetCard.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;

      let isInsertBefore = e.clientY < centerY;

      // Check if position would actually change
      if (isInsertBefore && draggedIdx === targetIdx - 1) return;
      if (!isInsertBefore && draggedIdx === targetIdx + 1) return;

      // 1. FLIP - First: measure all card bounding rects
      const firstRects = new Map();
      cards.forEach(c => firstRects.set(c, c.getBoundingClientRect()));

      // 2. FLIP - Last: Move DOM node directly in categoryList
      if (isInsertBefore) {
        categoryList.insertBefore(draggedCard, targetCard);
      } else {
        categoryList.insertBefore(draggedCard, targetCard.nextSibling);
      }

      // 3. FLIP - Invert & Play
      const updatedCards = Array.from(categoryList.querySelectorAll('.category-breakdown-section, .category-card'));
      updatedCards.forEach(c => {
        const first = firstRects.get(c);
        if (!first) return;
        const last = c.getBoundingClientRect();
        const deltaX = first.left - last.left;
        const deltaY = first.top - last.top;

        if (deltaX !== 0 || deltaY !== 0) {
          c.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
          c.style.transition = 'none';
          c.offsetHeight; // Force reflow
          c.style.transition = 'transform 0.24s cubic-bezier(0.16, 1, 0.3, 1)';
          c.style.transform = '';
        }
      });
    });

    const finishDrag = async () => {
      if (!draggedCard) return;
      const currentDragged = draggedCard;
      draggedCard = null;
      isHandleGrabbed = false;

      currentDragged.classList.remove('is-dragging');

      const cards = Array.from(categoryList.querySelectorAll('.category-breakdown-section, .category-card'));
      cards.forEach(c => {
        c.removeAttribute('draggable');
        c.style.transition = '';
        c.style.transform = '';
      });

      const newOrderedIds = cards.map(c => c.dataset.catId).filter(Boolean);
      const currentCats = store.getSubjectGradeCategories(selectedSubjectId, activeTab);
      const currentIds = currentCats.map(c => c.id);

      const hasOrderChanged = newOrderedIds.length === currentIds.length && newOrderedIds.some((id, idx) => id !== currentIds[idx]);

      if (hasOrderChanged && selectedSubjectId && activeTab) {
        await store.reorderGradeCategories(selectedSubjectId, activeTab, newOrderedIds);
      }
    };

    categoryList.addEventListener('dragend', finishDrag);
    categoryList.addEventListener('drop', (e) => {
      e.preventDefault();
      finishDrag();
    });
  }

  // Category Layout Toggle (1-col vs 2-col)
  const layoutToggle = container.querySelector('#cat-layout-toggle');
  if (layoutToggle) {
    layoutToggle.querySelectorAll('.seg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        categoryLayout = btn.dataset.layout || '1-col';
        localStorage.setItem('aven_grades_category_layout', categoryLayout);
        renderGradesView(container);
      });
    });
  }

  // Live Sync Status Listener
  const syncIndicator = container.querySelector('#grades-sync-indicator');
  if (syncIndicator) {
    const handleSyncStatus = (syncState) => {
      if (!syncIndicator) return;
      syncIndicator.className = `sync-status-indicator sync-${syncState.status}`;
      syncIndicator.innerHTML = renderSyncIndicatorHtml(syncState);
    };

    events.on('sync:status', handleSyncStatus);
  }

  // Export to Excel Popover & Action Handlers
  container.querySelectorAll('.btn-grades-export-toggle').forEach(btn => {
    const popover = btn.parentElement?.querySelector('.grades-export-popover');
    if (!popover) return;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      container.querySelectorAll('.grades-export-popover').forEach(p => {
        if (p !== popover) p.classList.remove('open');
      });
      popover.classList.toggle('open');
    });

    popover.querySelectorAll('.btn-export-current-subject').forEach(item => {
      item.addEventListener('click', async (e) => {
        e.stopPropagation();
        popover.classList.remove('open');
        const subId = item.dataset.subjectId || selectedSubjectId;
        try {
          window.avenApp?.showToast('Generating Excel report...', 'info');
          const filename = await exportSubjectGradesToExcel(subId);
          window.avenApp?.showToast(`Exported ${filename}`, 'success');
        } catch (err) {
          console.error(err);
          window.avenApp?.showToast(err.message || 'Failed to export Excel report', 'error');
        }
      });
    });

    popover.querySelectorAll('.btn-export-all-subjects').forEach(item => {
      item.addEventListener('click', async (e) => {
        e.stopPropagation();
        popover.classList.remove('open');
        try {
          window.avenApp?.showToast('Generating multi-sheet Excel report...', 'info');
          const filename = await exportAllSubjectsGradesToExcel();
          window.avenApp?.showToast(`Exported ${filename}`, 'success');
        } catch (err) {
          console.error(err);
          window.avenApp?.showToast(err.message || 'Failed to export Excel report', 'error');
        }
      });
    });

    document.addEventListener('click', (e) => {
      if (popover && !popover.contains(e.target) && !btn.contains(e.target)) {
        popover.classList.remove('open');
      }
    });
  });
}
