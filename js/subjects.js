/**
 * Aven - Subjects View & Home Dashboard Controller
 * Features: Summary banner, Grid vs List compact view toggle, paired-row modal,
 * archive reason dialog, bulk End Semester archiver, and term-grouped archived view.
 */

import { store, events, YEAR_LEVELS, SEMESTERS, DEFAULT_COLOR_SWATCHES, getStandingColor } from './store.js';

let currentFilter = 'active'; // 'active' | 'archived' | 'all'
let currentYearFilter = 'all';
let deleteTargetSubjectId = null;
let archiveTargetSubjectId = null;

export function renderSubjectsView(container) {

  const activeSubjects = store.getSubjects(false);
  const allSubjects = store.getSubjects(true);
  const academicStanding = store.calculateOverallAcademicStanding();
  const streakStats = store.getStreakStats();
  const weeklyHours = store.getWeeklyStudyHours();
  const viewMode = store.getSubjectsViewMode(); // 'grid' | 'list'

  // Filter subjects
  let displayedSubjects = allSubjects;
  if (currentFilter === 'active') {
    displayedSubjects = allSubjects.filter(s => !s.archived);
  } else if (currentFilter === 'archived') {
    displayedSubjects = allSubjects.filter(s => s.archived);
  }

  if (currentYearFilter !== 'all') {
    displayedSubjects = displayedSubjects.filter(s => s.year_level === currentYearFilter);
  }

  container.innerHTML = `
    <!-- Top Summary Banner (Scoped to Active Subjects, Uniform 3-Row Layout) -->
    <div class="stats-banner">
      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-card-title">Enrolled Subjects</span>
          <svg class="stat-card-icon stat-icon-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
        </div>
        <div class="stat-card-value">${activeSubjects.length} Active</div>
        <div class="stat-card-subtitle">
          <span>${allSubjects.length} total enrolled courses</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-card-title">Study Time (Week)</span>
          <svg class="stat-card-icon stat-icon-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <div class="stat-card-value">${weeklyHours}h</div>
        <div class="stat-card-subtitle">
          <span>${streakStats.totalHours}h all-time · ${streakStats.totalSessions} sessions</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-card-title">Cumulative GPA</span>
          <svg class="stat-card-icon stat-icon-indigo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
            <polyline points="16 7 22 7 22 13"></polyline>
          </svg>
        </div>
        <div class="stat-card-value" style="color: ${getStandingColor(academicStanding.rawAvgPct)};">${academicStanding.gpa !== '—' ? academicStanding.gpa : '—'}</div>
        <div class="stat-card-subtitle">
          <span>Avg ${academicStanding.avgPct} · ${academicStanding.gradedSubjects}/${activeSubjects.length} graded</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-card-title">Study Streak</span>
          <svg class="stat-card-icon stat-icon-amber" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
          </svg>
        </div>
        <div class="stat-card-value">${streakStats.currentStreak} ${streakStats.currentStreak === 1 ? 'day' : 'days'}</div>
        <div class="stat-card-subtitle">
          <span>Personal best: ${streakStats.longestStreak} days streak</span>
        </div>
      </div>
    </div>


    <!-- Controls & Local Filtering Bar with Grid/List Toggle & Bulk Actions -->
    <div class="controls-bar">
      <div class="filter-group">
        <button class="filter-chip ${currentFilter === 'active' ? 'active' : ''}" data-filter="active">
          Active (${activeSubjects.length})
        </button>
        <button class="filter-chip ${currentFilter === 'archived' ? 'active' : ''}" data-filter="archived">
          Archived (${allSubjects.filter(s => s.archived).length})
        </button>
        <button class="filter-chip ${currentFilter === 'all' ? 'active' : ''}" data-filter="all">
          All (${allSubjects.length})
        </button>

        <select id="subject-year-filter" class="form-select" style="width: auto; padding: 5px 10px; font-size: 12.5px;">
          <option value="all">All Year Levels</option>
          ${YEAR_LEVELS.map(y => `<option value="${y}" ${currentYearFilter === y ? 'selected' : ''}>${y}</option>`).join('')}
        </select>
      </div>

      <div style="display: flex; align-items: center; gap: 10px;">
        <!-- Grid / List View Switcher Buttons -->
        <div class="segmented-control" id="view-mode-toggle">
          <button class="seg-btn ${viewMode === 'grid' ? 'active' : ''}" data-view="grid" title="Grid View">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
          </button>
          <button class="seg-btn ${viewMode === 'list' ? 'active' : ''}" data-view="list" title="Compact List View">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- Bulk End Semester Action Button -->
        <button id="btn-bulk-end-semester" class="btn" ${activeSubjects.length === 0 ? 'disabled' : ''} title="Archive all or selected completed subjects for this semester">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          End Semester
        </button>

        <button id="btn-create-subject" class="btn btn-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          New Subject
        </button>
      </div>
    </div>

    <!-- Subjects Container (Grouped by Term if Archived Filter, else Regular View) -->
    ${displayedSubjects.length === 0 ? `
      <div style="padding: 48px 24px; text-align: center; color: var(--text-muted); background: var(--bg-surface); border: 1px dashed var(--border-subtle); border-radius: var(--radius-lg);">
        <p style="font-size: 15px; font-weight: 500; margin-bottom: 8px;">No subjects found</p>
        <p style="font-size: 13px;">${currentFilter === 'archived' ? 'No archived subjects in your repository.' : 'Create your first academic subject or adjust filters above to get started.'}</p>
      </div>
    ` : (currentFilter === 'archived' ? renderArchivedGroupedView(displayedSubjects, viewMode) : (viewMode === 'list' ? renderSubjectsListView(displayedSubjects) : renderSubjectsGridView(displayedSubjects)))}

    <!-- Create/Edit Subject Modal -->
    <div class="modal-overlay" id="subject-modal">
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title" id="subject-modal-title">New Subject</h3>
          <button class="btn btn-ghost btn-icon close-modal-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form id="subject-form">
          <input type="hidden" id="sub-form-id" value="">
          <div class="modal-body">
            <!-- Row 1: Name + Code -->
            <div class="form-row-paired">
              <div class="form-group">
                <label class="form-label" for="sub-form-name">Subject Name *</label>
                <input type="text" id="sub-form-name" class="form-input" placeholder="e.g. Data Structures & Algorithms" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="sub-form-code">Course Code</label>
                <input type="text" id="sub-form-code" class="form-input" placeholder="e.g. CS 102">
              </div>
            </div>

            <!-- Row 2: Year Level + Semester -->
            <div class="form-row-paired">
              <div class="form-group">
                <label class="form-label" for="sub-form-year">Year Level *</label>
                <select id="sub-form-year" class="form-select" required>
                  ${YEAR_LEVELS.map(y => `<option value="${y}">${y}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="sub-form-semester">Semester *</label>
                <select id="sub-form-semester" class="form-select" required>
                  ${SEMESTERS.map(s => `<option value="${s}">${s}</option>`).join('')}
                </select>
              </div>
            </div>

            <!-- Row 3: Instructor -->
            <div class="form-group">
              <label class="form-label" for="sub-form-instructor">Instructor (Optional)</label>
              <input type="text" id="sub-form-instructor" class="form-input" placeholder="e.g. Dr. Elena Santos">
            </div>

            <!-- Row 4: Color Swatches -->
            <div class="form-group">
              <label class="form-label">Subject Color Accent</label>
              <div class="color-swatches" id="color-swatches-container">
                ${DEFAULT_COLOR_SWATCHES.map((hex, i) => `
                  <div class="color-swatch-opt ${i === 0 ? 'active' : ''}" data-color="${hex}" style="background-color: ${hex};"></div>
                `).join('')}
              </div>
              <input type="hidden" id="sub-form-color" value="${DEFAULT_COLOR_SWATCHES[0]}">
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-ghost close-modal-btn">Cancel</button>
            <button type="submit" class="btn btn-primary" id="btn-save-subject">Save Subject</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Archive Reason Dialog Modal -->
    <div class="modal-overlay" id="archive-reason-modal">
      <div class="modal-card" style="max-width: 480px;">
        <div class="modal-header">
          <h3 class="modal-title">Archive Subject</h3>
          <button class="btn btn-ghost btn-icon close-archive-modal-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form id="archive-reason-form">
          <input type="hidden" id="archive-subject-id" value="">
          <div class="modal-body">
            <p style="font-size: 13.5px; color: var(--text-primary); margin-bottom: 12px;">
              Select an archiving reason for <strong id="archive-subject-name-label"></strong>:
            </p>

            <div class="archive-reason-options">
              <label class="archive-option-card">
                <input type="radio" name="archive-reason-choice" value="Semester ended" checked>
                <div class="archive-option-text">
                  <strong>Semester ended</strong>
                  <p>Subject completed and final grades recorded.</p>
                </div>
              </label>

              <label class="archive-option-card">
                <input type="radio" name="archive-reason-choice" value="Dropped">
                <div class="archive-option-text">
                  <strong>Dropped</strong>
                  <p>Subject discontinued mid-term.</p>
                </div>
              </label>

              <label class="archive-option-card">
                <input type="radio" name="archive-reason-choice" value="Other">
                <div class="archive-option-text">
                  <strong>Other</strong>
                  <p>Provide a custom archive note.</p>
                </div>
              </label>
            </div>

            <div class="form-group" id="archive-custom-note-group" style="display: none; margin-top: 12px;">
              <label class="form-label" for="archive-custom-note">Custom Reason Note</label>
              <input type="text" id="archive-custom-note" class="form-input" placeholder="e.g. Transferred section or audited course">
            </div>

            <p style="font-size: 12px; color: var(--text-muted); margin-top: 14px; line-height: 1.4;">
              Archived subjects remain view-only with all historical study sessions, grades, and study plans preserved.
            </p>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-ghost close-archive-modal-btn">Cancel</button>
            <button type="submit" class="btn btn-primary" id="btn-confirm-archive">Archive Subject</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Bulk End Semester Modal -->
    <div class="modal-overlay" id="bulk-end-semester-modal">
      <div class="modal-card" style="max-width: 520px;">
        <div class="modal-header">
          <h3 class="modal-title">End Semester & Archive Courses</h3>
          <button class="btn btn-ghost btn-icon close-bulk-modal-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px; line-height: 1.4;">
            Select the courses to archive as completed for this semester. All records will be archived with reason <strong>Semester ended</strong>.
          </p>

          <div class="bulk-select-header">
            <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; cursor: pointer; color: var(--text-primary);">
              <input type="checkbox" id="bulk-select-all" checked>
              <span>Select All Active Courses (${activeSubjects.length})</span>
            </label>
          </div>

          <div class="bulk-subjects-list">
            ${activeSubjects.map(sub => `
              <label class="bulk-subject-item">
                <input type="checkbox" class="bulk-sub-checkbox" value="${sub.id}" checked>
                <span class="subject-color-bar" style="background-color: ${sub.color || '#6366f1'}; height: 16px; width: 3px; border-radius: 2px;"></span>
                <div style="flex: 1; min-width: 0;">
                  <div style="display: flex; align-items: center; gap: 6px;">
                    ${sub.code ? `<span class="subject-code-badge" style="font-size: 10.5px; padding: 1px 5px;">${sub.code}</span>` : ''}
                    <strong style="font-size: 13px; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${sub.name}</strong>
                  </div>
                  <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">${sub.year_level} &middot; ${sub.semester}</div>
                </div>
              </label>
            `).join('')}
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-ghost close-bulk-modal-btn">Cancel</button>
          <button type="button" class="btn btn-primary" id="btn-confirm-bulk-archive">
            Archive Selected (<span id="bulk-selected-count">${activeSubjects.length}</span>)
          </button>
        </div>
      </div>
    </div>

    <!-- Cascade Delete Confirmation Modal -->
    <div class="modal-overlay" id="cascade-delete-modal">
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title" style="color: var(--danger);">Delete Subject & Cascading Records</h3>
          <button class="btn btn-ghost btn-icon close-delete-modal-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <div class="alert-box danger">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <div>
              <strong>Warning: Cascading deletion cannot be undone.</strong>
              <div id="cascade-impact-details" style="margin-top: 6px;"></div>
            </div>
          </div>
          <p style="font-size: 13px; color: var(--text-secondary);">
            Deleting this Subject will permanently purge all related study sessions, grade records, and its uploaded study plan.
          </p>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-ghost close-delete-modal-btn">Keep Subject</button>
          <button type="button" class="btn btn-danger" id="btn-confirm-cascade-delete">
            Delete Subject & Everything
          </button>
        </div>
      </div>
    </div>
  `;

  attachSubjectsEvents(container);
}

function renderArchivedGroupedView(subjects, viewMode) {
  const groups = {};
  subjects.forEach(s => {
    const key = `${s.year_level}, ${s.semester}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(s);
  });

  const keys = Object.keys(groups);

  return `
    <div class="archived-groups-container">
      ${keys.map(termKey => `
        <div class="archived-term-section">
          <div class="archived-term-header">
            <div style="display: flex; align-items: center; gap: 8px;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--accent);">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <h4 class="archived-term-title">${termKey}</h4>
            </div>
            <span class="archive-term-badge">${groups[termKey].length} ${groups[termKey].length === 1 ? 'course' : 'courses'}</span>
          </div>
          ${viewMode === 'list' ? renderSubjectsListView(groups[termKey]) : renderSubjectsGridView(groups[termKey])}
        </div>
      `).join('')}
    </div>
  `;
}

function renderSubjectsGridView(subjects) {
  return `
    <div class="subjects-grid" id="subjects-card-grid">
      ${subjects.map(sub => renderSubjectCard(sub)).join('')}
    </div>
  `;
}

function renderSubjectsListView(subjects) {
  return `
    <div class="subjects-list-card">
      <table class="subjects-list-table">
        <colgroup>
          <col style="width: 32%;">
          <col style="width: 22%;">
          <col style="width: 10%;">
          <col style="width: 17%;">
          <col style="width: 7%;">
          <col style="width: 12%;">
        </colgroup>
        <thead>
          <tr>
            <th>Course &amp; Subject</th>
            <th>Term / Status</th>
            <th>Study Time</th>
            <th>Standing</th>
            <th>Plan</th>
            <th style="text-align: right;">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${subjects.map(sub => renderSubjectListRow(sub)).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function getArchiveReasonBadge(sub) {
  if (!sub.archived) return '';
  const reason = sub.archive_reason || 'Archived';
  if (reason.toLowerCase().includes('dropped')) {
    return `<span class="tag tag-dropped" title="Dropped subject">Dropped</span>`;
  }
  if (reason.toLowerCase().includes('semester')) {
    return `<span class="tag tag-completed" title="Semester completed">Semester Ended</span>`;
  }
  return `<span class="tag tag-archived" title="${reason}">${reason}</span>`;
}

function renderSubjectCard(sub) {
  const totalMins = store.getSubjectTotalStudyMinutes(sub.id);
  const hoursFormatted = (totalMins / 60).toFixed(1) + 'h';
  const gradeStats = store.calculateSubjectGrade(sub.id);
  const plan = store.getStudyPlanBySubject(sub.id);

  return `
    <div class="subject-card ${sub.archived ? 'archived' : ''}" data-id="${sub.id}">
      <div class="subject-card-top">
        <div class="subject-header-left">
          <div class="subject-color-bar" style="background-color: ${sub.color || '#6366f1'};"></div>
          <div>
            ${sub.code ? `<span class="subject-code-badge">${sub.code}</span>` : ''}
            <h4 class="subject-name">${sub.name}</h4>
          </div>
        </div>
      </div>

      ${sub.instructor ? `
        <div class="subject-instructor">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          ${sub.instructor}
        </div>
      ` : ''}

      <div class="subject-tags">
        <span class="tag">${sub.year_level}</span>
        <span class="tag">${sub.semester}</span>
        ${getArchiveReasonBadge(sub)}
      </div>

      <div class="subject-metrics-row">
        <div class="subject-metric">
          <span class="metric-label">Study Time</span>
          <span class="metric-value">${hoursFormatted}</span>
        </div>
        <div class="subject-metric">
          <span class="metric-label">Standing</span>
          <span class="metric-value" style="color: ${getStandingColor(gradeStats.overallPercentage)}; font-weight: 700;">${gradeStats.summaryLine}</span>
        </div>
        <div class="subject-metric">
          <span class="metric-label">Study Plan</span>
          <span class="metric-value" style="color: ${plan ? 'var(--success)' : 'var(--text-muted)'}; font-size: 12px;">
            ${plan ? '● Ready' : 'None'}
          </span>
        </div>
      </div>

      <div class="subject-card-actions">
        ${!sub.archived ? `<button class="btn btn-ghost btn-sm btn-edit-sub" data-id="${sub.id}">Edit</button>` : ''}
        <button class="btn btn-ghost btn-sm btn-archive-sub" data-id="${sub.id}">
          ${sub.archived ? 'Unarchive' : 'Archive'}
        </button>
        <button class="btn btn-ghost btn-sm btn-delete-sub" data-id="${sub.id}" style="color: var(--danger);">Delete</button>
      </div>
    </div>
  `;
}

function renderSubjectListRow(sub) {
  const totalMins = store.getSubjectTotalStudyMinutes(sub.id);
  const hoursFormatted = (totalMins / 60).toFixed(1) + 'h';
  const gradeStats = store.calculateSubjectGrade(sub.id);
  const plan = store.getStudyPlanBySubject(sub.id);

  const semAbbr = (sub.semester || '')
    .replace('1st Semester', '1st Sem')
    .replace('2nd Semester', '2nd Sem');

  return `
    <tr class="subject-list-row ${sub.archived ? 'archived' : ''}" data-id="${sub.id}">
      <td class="subject-list-name-cell">
        <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">
          <div class="subject-color-bar" style="background-color: ${sub.color || '#6366f1'}; height: 20px; flex-shrink: 0;"></div>
          ${sub.code ? `<span class="subject-code-badge" style="flex-shrink: 0;">${sub.code}</span>` : ''}
          <div style="min-width: 0; overflow: hidden;">
            <strong class="subject-list-name" title="${sub.name}">${sub.name}</strong>
            ${sub.instructor ? `<div style="font-size: 11.5px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${sub.instructor}">${sub.instructor}</div>` : ''}
          </div>
        </div>
      </td>
      <td>
        <div style="display: flex; gap: 4px; flex-wrap: wrap; row-gap: 3px;">
          <span class="tag" style="white-space: nowrap;">${sub.year_level}</span>
          <span class="tag" style="white-space: nowrap;">${semAbbr}</span>
          ${getArchiveReasonBadge(sub)}
        </div>
      </td>
      <td style="font-family: var(--font-mono); font-weight: 600; color: var(--text-primary); white-space: nowrap;">
        ${hoursFormatted}
      </td>
      <td>
        <span style="font-family: var(--font-mono); font-weight: 600; color: ${getStandingColor(gradeStats.overallPercentage)}; white-space: nowrap;">
          ${gradeStats.summaryLine}
        </span>
      </td>

      <td style="white-space: nowrap;">
        <span style="font-size: 12px; color: ${plan ? 'var(--success)' : 'var(--text-muted)'}; font-weight: 500;">
          ${plan ? '● Yes' : '—'}
        </span>
      </td>
      <td style="text-align: right; white-space: nowrap;">
        ${!sub.archived ? `<button class="btn btn-ghost btn-sm btn-edit-sub" data-id="${sub.id}">Edit</button>` : ''}
        <button class="btn btn-ghost btn-sm btn-archive-sub" data-id="${sub.id}">
          ${sub.archived ? 'Unarchive' : 'Archive'}
        </button>
        <button class="btn btn-ghost btn-sm btn-delete-sub" data-id="${sub.id}" style="color: var(--danger); padding: 4px 6px;">Delete</button>
      </td>
    </tr>
  `;
}

function attachSubjectsEvents(container) {
  // Filter chips
  container.querySelectorAll('.filter-chip').forEach(btn => {
    btn.addEventListener('click', (e) => {
      currentFilter = e.target.dataset.filter;
      renderSubjectsView(container);
    });
  });

  // Year level filter dropdown
  const yearSelect = container.querySelector('#subject-year-filter');
  if (yearSelect) {
    yearSelect.addEventListener('change', (e) => {
      currentYearFilter = e.target.value;
      renderSubjectsView(container);
    });
  }

  // Grid / List View Mode Toggle
  container.querySelectorAll('#view-mode-toggle .seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.view;
      store.setSubjectsViewMode(mode);
      renderSubjectsView(container);
    });
  });

  // Modals
  const createModal = container.querySelector('#subject-modal');
  const deleteModal = container.querySelector('#cascade-delete-modal');
  const archiveModal = container.querySelector('#archive-reason-modal');
  const bulkModal = container.querySelector('#bulk-end-semester-modal');
  const form = container.querySelector('#subject-form');
  const archiveForm = container.querySelector('#archive-reason-form');

  const openCreateModal = () => {
    form.reset();
    container.querySelector('#sub-form-id').value = '';
    container.querySelector('#subject-modal-title').textContent = 'New Subject';
    container.querySelector('#sub-form-color').value = DEFAULT_COLOR_SWATCHES[0];
    
    container.querySelectorAll('.color-swatch-opt').forEach((sw, i) => {
      sw.classList.toggle('active', i === 0);
    });

    createModal.classList.add('open');
  };

  const openEditModal = (id) => {
    const sub = store.getSubjectById(id);
    if (!sub) return;

    container.querySelector('#sub-form-id').value = sub.id;
    container.querySelector('#subject-modal-title').textContent = 'Edit Subject';
    container.querySelector('#sub-form-name').value = sub.name;
    container.querySelector('#sub-form-code').value = sub.code || '';
    container.querySelector('#sub-form-year').value = sub.year_level || '1st Year';
    container.querySelector('#sub-form-semester').value = sub.semester || '1st Semester';
    container.querySelector('#sub-form-instructor').value = sub.instructor || '';
    container.querySelector('#sub-form-color').value = sub.color || DEFAULT_COLOR_SWATCHES[0];

    container.querySelectorAll('.color-swatch-opt').forEach(sw => {
      sw.classList.toggle('active', sw.dataset.color === sub.color);
    });

    createModal.classList.add('open');
  };

  const openArchiveReasonModal = (subId) => {
    const sub = store.getSubjectById(subId);
    if (!sub) return;

    archiveTargetSubjectId = subId;
    container.querySelector('#archive-subject-id').value = subId;
    container.querySelector('#archive-subject-name-label').textContent = `${sub.code ? `[${sub.code}] ` : ''}${sub.name}`;
    
    // Reset inputs
    const defaultRadio = container.querySelector('input[name="archive-reason-choice"][value="Semester ended"]');
    if (defaultRadio) defaultRadio.checked = true;
    const customGroup = container.querySelector('#archive-custom-note-group');
    if (customGroup) customGroup.style.display = 'none';
    const customInput = container.querySelector('#archive-custom-note');
    if (customInput) customInput.value = '';

    archiveModal.classList.add('open');
  };

  const closeModals = () => {
    createModal?.classList.remove('open');
    deleteModal?.classList.remove('open');
    archiveModal?.classList.remove('open');
    bulkModal?.classList.remove('open');
    deleteTargetSubjectId = null;
    archiveTargetSubjectId = null;
  };

  container.querySelector('#btn-create-subject')?.addEventListener('click', openCreateModal);

  container.querySelectorAll('.close-modal-btn, .close-delete-modal-btn, .close-archive-modal-btn, .close-bulk-modal-btn').forEach(b => {
    b.addEventListener('click', closeModals);
  });

  // Color Swatches Selection
  container.querySelectorAll('.color-swatch-opt').forEach(swatch => {
    swatch.addEventListener('click', () => {
      container.querySelectorAll('.color-swatch-opt').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      container.querySelector('#sub-form-color').value = swatch.dataset.color;
    });
  });

  // Edit / Archive / Delete Buttons
  container.querySelectorAll('.btn-edit-sub').forEach(btn => {
    btn.addEventListener('click', () => {
      openEditModal(btn.dataset.id);
    });
  });

  container.querySelectorAll('.btn-archive-sub').forEach(btn => {
    btn.addEventListener('click', () => {
      const subId = btn.dataset.id;
      const sub = store.getSubjectById(subId);
      if (!sub) return;

      if (sub.archived) {
        store.unarchiveSubject(subId);
        window.avenApp?.showToast('Subject unarchived and reactivated', 'info');
        renderSubjectsView(container);
      } else {
        openArchiveReasonModal(subId);
      }
    });
  });

  // Archive Reason Radio Choice change
  container.querySelectorAll('input[name="archive-reason-choice"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const customGroup = container.querySelector('#archive-custom-note-group');
      if (customGroup) {
        customGroup.style.display = e.target.value === 'Other' ? 'block' : 'none';
      }
    });
  });

  // Archive Form Submit
  archiveForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const subId = container.querySelector('#archive-subject-id').value;
    const selectedRadio = container.querySelector('input[name="archive-reason-choice"]:checked');
    const reason = selectedRadio ? selectedRadio.value : 'Semester ended';
    const note = container.querySelector('#archive-custom-note')?.value || '';

    store.archiveSubject(subId, reason, note);
    closeModals();
    window.avenApp?.showToast(`Subject archived (${reason})`, 'info');
    renderSubjectsView(container);
  });

  // Bulk End Semester Button
  container.querySelector('#btn-bulk-end-semester')?.addEventListener('click', () => {
    bulkModal?.classList.add('open');
  });

  // Bulk Select All Checkbox
  const bulkSelectAll = container.querySelector('#bulk-select-all');
  const bulkCheckboxes = container.querySelectorAll('.bulk-sub-checkbox');
  const bulkCountSpan = container.querySelector('#bulk-selected-count');

  const updateBulkCount = () => {
    const checked = container.querySelectorAll('.bulk-sub-checkbox:checked').length;
    if (bulkCountSpan) bulkCountSpan.textContent = checked;
    if (bulkSelectAll) {
      bulkSelectAll.checked = checked === bulkCheckboxes.length;
      bulkSelectAll.indeterminate = checked > 0 && checked < bulkCheckboxes.length;
    }
  };

  bulkSelectAll?.addEventListener('change', (e) => {
    bulkCheckboxes.forEach(cb => { cb.checked = e.target.checked; });
    updateBulkCount();
  });

  bulkCheckboxes.forEach(cb => {
    cb.addEventListener('change', updateBulkCount);
  });

  // Confirm Bulk Archive
  container.querySelector('#btn-confirm-bulk-archive')?.addEventListener('click', () => {
    const selectedIds = Array.from(container.querySelectorAll('.bulk-sub-checkbox:checked')).map(cb => cb.value);
    if (selectedIds.length === 0) {
      window.avenApp?.showToast('No subjects selected', 'info');
      return;
    }

    const count = store.bulkArchiveSubjects(selectedIds, 'Semester ended');
    closeModals();
    window.avenApp?.showToast(`Archived ${count} subjects for completed semester`, 'success');
    renderSubjectsView(container);
  });

  // Delete modal triggers
  container.querySelectorAll('.btn-delete-sub').forEach(btn => {
    btn.addEventListener('click', () => {
      const subId = btn.dataset.id;
      const sub = store.getSubjectById(subId);
      if (!sub) return;

      deleteTargetSubjectId = subId;
      const stats = store.getCascadeStats(subId);

      const detailsDiv = container.querySelector('#cascade-impact-details');
      detailsDiv.innerHTML = `
        <div style="margin-top: 4px; font-weight: normal;">
          Subject to delete: <strong>${sub.name} (${sub.code || 'No Code'})</strong><br>
          Cascading impact:
          <ul style="margin: 4px 0 0 18px;">
            <li><strong>${stats.sessionCount}</strong> logged study sessions</li>
            <li><strong>${stats.gradeCategoriesCount}</strong> grade categories (${stats.gradeEntriesCount} grade entries)</li>
            <li><strong>${stats.hasPlan ? '1' : '0'}</strong> study plan document</li>
          </ul>
        </div>
      `;

      deleteModal.classList.add('open');
    });
  });

  // Confirm Cascade Delete
  container.querySelector('#btn-confirm-cascade-delete')?.addEventListener('click', () => {
    if (deleteTargetSubjectId) {
      store.deleteSubject(deleteTargetSubjectId);
      closeModals();
      window.avenApp?.showToast('Subject and all cascaded records deleted', 'danger');
      renderSubjectsView(container);
    }
  });

  // Create/Edit Subject Form Submit
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = container.querySelector('#sub-form-id').value;
    const name = container.querySelector('#sub-form-name').value;
    const code = container.querySelector('#sub-form-code').value;
    const year_level = container.querySelector('#sub-form-year').value;
    const semester = container.querySelector('#sub-form-semester').value;
    const instructor = container.querySelector('#sub-form-instructor').value;
    const color = container.querySelector('#sub-form-color').value;

    const payload = { id: id || undefined, name, code, year_level, semester, instructor, color };
    store.saveSubject(payload);

    closeModals();
    window.avenApp?.showToast(id ? 'Subject updated' : 'Subject created', 'success');
    renderSubjectsView(container);
  });
}
