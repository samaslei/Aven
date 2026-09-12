/**
 * Aven - Subjects View & Home Dashboard Controller
 * Features: Summary banner, Grid vs List compact view toggle, paired-row modal,
 * archive reason dialog, bulk End Semester archiver, and term-grouped archived view.
 */

import { store, events, YEAR_LEVELS, SEMESTERS, DEFAULT_COLOR_SWATCHES, getStandingColor } from '../core/store.js';

let currentFilter = 'active'; // 'active' | 'archived' | 'all'
let currentYearFilter = 'all';
let currentSearchQuery = '';
let deleteTargetSubjectId = null;
let archiveTargetSubjectId = null;

let activeToolbarPopoversCleanup = null;
let activeRowActionPopoversCleanup = null;

export function cleanupSubjectsView() {
  if (activeToolbarPopoversCleanup) {
    document.removeEventListener('click', activeToolbarPopoversCleanup);
    activeToolbarPopoversCleanup = null;
  }
  if (activeRowActionPopoversCleanup) {
    document.removeEventListener('click', activeRowActionPopoversCleanup);
    activeRowActionPopoversCleanup = null;
  }
}

export function sortSubjectsList(subjects, sortKey) {
  const list = [...subjects];
  const YEAR_ORDER = {
    '1st Year': 1,
    '2nd Year': 2,
    '3rd Year': 3,
    '4th Year': 4,
    '5th Year': 5,
    '6th Year': 6,
    '7th Year': 7
  };
  const SEM_ORDER = {
    '1st Semester': 1,
    '2nd Semester': 2,
    'Summer': 3
  };

  switch (sortKey) {
    case 'name-asc':
      return list.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));
    case 'name-desc':
      return list.sort((a, b) => (b.name || '').localeCompare(a.name || '', undefined, { sensitivity: 'base' }));
    case 'recent-asc':
      return list.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
    case 'recent-desc':
      return list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    case 'standing-desc': {
      const gradeMap = new Map();
      list.forEach(s => {
        const grade = store.calculateSubjectGrade(s.id).overallPercentage;
        gradeMap.set(s.id, grade !== null && grade !== undefined ? grade : -1);
      });
      return list.sort((a, b) => gradeMap.get(b.id) - gradeMap.get(a.id));
    }
    case 'standing-asc': {
      const gradeMap = new Map();
      list.forEach(s => {
        const grade = store.calculateSubjectGrade(s.id).overallPercentage;
        gradeMap.set(s.id, grade !== null && grade !== undefined ? grade : 9999);
      });
      return list.sort((a, b) => gradeMap.get(a.id) - gradeMap.get(b.id));
    }
    case 'time-desc': {
      const timeMap = new Map();
      list.forEach(s => timeMap.set(s.id, store.getSubjectTotalStudyMinutes(s.id)));
      return list.sort((a, b) => timeMap.get(b.id) - timeMap.get(a.id));
    }
    case 'time-asc': {
      const timeMap = new Map();
      list.forEach(s => timeMap.set(s.id, store.getSubjectTotalStudyMinutes(s.id)));
      return list.sort((a, b) => timeMap.get(a.id) - timeMap.get(b.id));
    }
    case 'year-sem-asc':
      return list.sort((a, b) => {
        const aY = YEAR_ORDER[a.year_level] || 99;
        const bY = YEAR_ORDER[b.year_level] || 99;
        if (aY !== bY) return aY - bY;
        const aS = SEM_ORDER[a.semester] || 99;
        const bS = SEM_ORDER[b.semester] || 99;
        if (aS !== bS) return aS - bS;
        return (a.name || '').localeCompare(b.name || '');
      });
    default:
      return list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }
}

function getDisplayedSubjects() {
  const allSubjects = store.getSubjects(true);
  let displayed = allSubjects;
  if (currentFilter === 'active') {
    displayed = allSubjects.filter(s => !s.archived);
  } else if (currentFilter === 'archived') {
    displayed = allSubjects.filter(s => s.archived);
  }
  if (currentYearFilter !== 'all') {
    displayed = displayed.filter(s => s.year_level === currentYearFilter);
  }
  if (currentSearchQuery.trim()) {
    const q = currentSearchQuery.trim().toLowerCase();
    displayed = displayed.filter(s =>
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.code && s.code.toLowerCase().includes(q)) ||
      (s.instructor && s.instructor.toLowerCase().includes(q))
    );
  }
  return sortSubjectsList(displayed, store.getSubjectsSort());
}

export function renderSubjectsView(container) {
  cleanupSubjectsView();

  const activeSubjects = store.getSubjects(false);
  const allSubjects = store.getSubjects(true);
  const academicStanding = store.calculateOverallAcademicStanding();
  const streakStats = store.getStreakStats();
  const weeklyHours = store.getWeeklyStudyHours();
  const viewMode = store.getSubjectsViewMode(); // 'grid' | 'list'
  const currentSort = store.getSubjectsSort();

  // Filter & Sort subjects
  const displayedSubjects = getDisplayedSubjects();

  container.innerHTML = `
    <!-- Top Summary Banner (Scoped to Active Subjects, Uniform 3-Row Layout) -->
    <div class="stats-banner">
      <div class="stat-card">
        <div class="stat-icon-circle">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
        </div>
        <div class="stat-card-body">
          <span class="stat-card-title">Enrolled Subjects</span>
          <div class="stat-card-value">${activeSubjects.length} Active</div>
          <span class="stat-card-subtitle">${allSubjects.length} total enrolled courses</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-circle">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <div class="stat-card-body">
          <span class="stat-card-title">Study Time (Week)</span>
          <div class="stat-card-value">${weeklyHours}h</div>
          <span class="stat-card-subtitle">${streakStats.totalHours}h all-time · ${streakStats.totalSessions} sessions</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-circle">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
            <polyline points="16 7 22 7 22 13"></polyline>
          </svg>
        </div>
        <div class="stat-card-body">
          <span class="stat-card-title">Cumulative GPA</span>
          <div class="stat-card-value">${academicStanding.gpa !== '—' ? academicStanding.gpa : '—'}</div>
          <span class="stat-card-subtitle">Avg ${academicStanding.avgPct} · ${academicStanding.gradedSubjects}/${activeSubjects.length} graded</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-circle">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
          </svg>
        </div>
        <div class="stat-card-body">
          <span class="stat-card-title">Study Streak</span>
          <div class="stat-card-value">${streakStats.currentStreak} ${streakStats.currentStreak === 1 ? 'day' : 'days'}</div>
          <span class="stat-card-subtitle">Personal best: ${streakStats.longestStreak} days streak</span>
        </div>
      </div>
    </div>


    <!-- Controls & Local Filtering Bar with Grid/List Toggle, Sorting & Bulk Actions -->
    <div class="controls-bar">
      <div class="filter-group" style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
        <button class="filter-chip ${currentFilter === 'active' ? 'active' : ''}" data-filter="active">
          Active (${activeSubjects.length})
        </button>
        <button class="filter-chip ${currentFilter === 'archived' ? 'active' : ''}" data-filter="archived">
          Archived (${allSubjects.filter(s => s.archived).length})
        </button>
        <button class="filter-chip ${currentFilter === 'all' ? 'active' : ''}" data-filter="all">
          All (${allSubjects.length})
        </button>

        <div style="width: 1px; height: 16px; background: var(--border-default); margin: 0 2px;"></div>

        <!-- 1. Notion-Inspired Year Level Filter Icon Button -->
        <div style="position: relative;">
          <button class="toolbar-icon-btn ${currentYearFilter !== 'all' ? 'has-active-filter' : ''}" 
                  id="btn-subject-year-filter" 
                  title="${currentYearFilter === 'all' ? 'Filter by year level' : `Filtered: ${currentYearFilter}`}"
                  aria-label="Filter by year level">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
            ${currentYearFilter !== 'all' ? `<span class="icon-active-dot"></span>` : ''}
          </button>

          <div class="user-popover toolbar-popover" id="subject-year-filter-menu" style="min-width: 175px; top: calc(100% + 6px); bottom: auto; left: 0;">
            <div class="popover-section-header">Filter Year Level</div>
            <button class="popover-item ${currentYearFilter === 'all' ? 'active' : ''}" data-year="all">
              ${currentYearFilter === 'all' ? '✓ ' : ''}All Year Levels
            </button>
            ${YEAR_LEVELS.map(y => `
              <button class="popover-item ${currentYearFilter === y ? 'active' : ''}" data-year="${y}">
                ${currentYearFilter === y ? '✓ ' : ''}${y}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- 2. Notion-Inspired Sort Icon Button -->
        <div style="position: relative;">
          <button class="toolbar-icon-btn ${currentSort !== 'recent-desc' ? 'has-active-filter' : ''}" 
                  id="btn-subject-sort" 
                  title="Sort subjects"
                  aria-label="Sort subjects">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m3 16 4 4 4-4"></path>
              <path d="M7 20V4"></path>
              <path d="m21 8-4-4-4 4"></path>
              <path d="M17 4v16"></path>
            </svg>
            ${currentSort !== 'recent-desc' ? `<span class="icon-active-dot"></span>` : ''}
          </button>

          <div class="user-popover toolbar-popover" id="subject-sort-menu" style="min-width: 215px; top: calc(100% + 6px); bottom: auto; left: 0;">
            <div class="popover-section-header">Sort Subjects</div>
            <button class="popover-item ${currentSort === 'recent-desc' ? 'active' : ''}" data-sort="recent-desc">
              ${currentSort === 'recent-desc' ? '✓ ' : ''}Recently added (Newest)
            </button>
            <button class="popover-item ${currentSort === 'recent-asc' ? 'active' : ''}" data-sort="recent-asc">
              ${currentSort === 'recent-asc' ? '✓ ' : ''}Recently added (Oldest)
            </button>
            <button class="popover-item ${currentSort === 'name-asc' ? 'active' : ''}" data-sort="name-asc">
              ${currentSort === 'name-asc' ? '✓ ' : ''}Name (A–Z)
            </button>
            <button class="popover-item ${currentSort === 'name-desc' ? 'active' : ''}" data-sort="name-desc">
              ${currentSort === 'name-desc' ? '✓ ' : ''}Name (Z–A)
            </button>
            <button class="popover-item ${currentSort === 'standing-desc' ? 'active' : ''}" data-sort="standing-desc">
              ${currentSort === 'standing-desc' ? '✓ ' : ''}Standing (Highest)
            </button>
            <button class="popover-item ${currentSort === 'standing-asc' ? 'active' : ''}" data-sort="standing-asc">
              ${currentSort === 'standing-asc' ? '✓ ' : ''}Standing (Lowest)
            </button>
            <button class="popover-item ${currentSort === 'time-desc' ? 'active' : ''}" data-sort="time-desc">
              ${currentSort === 'time-desc' ? '✓ ' : ''}Study time (Most)
            </button>
            <button class="popover-item ${currentSort === 'time-asc' ? 'active' : ''}" data-sort="time-asc">
              ${currentSort === 'time-asc' ? '✓ ' : ''}Study time (Least)
            </button>
            <button class="popover-item ${currentSort === 'year-sem-asc' ? 'active' : ''}" data-sort="year-sem-asc">
              ${currentSort === 'year-sem-asc' ? '✓ ' : ''}Year & Semester
            </button>
          </div>
        </div>
      </div>

      <div class="controls-actions-group" style="display: flex; align-items: center; gap: 8px;">
        <!-- Subject Search Input with Debounce -->
        <div class="subject-search-wrapper" style="position: relative; display: flex; align-items: center;">
          <input type="text"
                 id="subject-search-input"
                 class="toolbar-search-input"
                 placeholder="Search subjects..."
                 value="${currentSearchQuery.replace(/"/g, '&quot;')}"
                 aria-label="Search subjects"
                 style="height: 28px; border-radius: var(--radius-full); padding: 0 10px 0 26px; font-size: 12px; background: var(--bg-surface); border: 1px solid var(--border-default); color: var(--text-primary); outline: none; width: 135px; transition: width 0.2s ease, border-color 0.2s ease;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="position: absolute; left: 8px; pointer-events: none; opacity: 0.5;">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>

        <!-- Grid / List View Switcher Buttons -->
        <div class="segmented-control" id="view-mode-toggle" data-active="${viewMode}">
          <button class="seg-btn ${viewMode === 'grid' ? 'active' : ''}" data-view="grid" title="Grid View" aria-label="Grid View">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
          </button>
          <button class="seg-btn ${viewMode === 'list' ? 'active' : ''}" data-view="list" title="Compact List View" aria-label="Compact List View">
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
        <button id="btn-bulk-end-semester" class="btn btn-responsive-action" ${activeSubjects.length === 0 ? 'disabled' : ''} title="End Semester (Archive completed subjects)" aria-label="End Semester">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <span class="btn-text">End Semester</span>
        </button>

        <button id="btn-create-subject" class="btn btn-primary btn-responsive-action" title="New Subject (Create Course)" aria-label="New Subject">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span class="btn-text">New Subject</span>
        </button>
      </div>
    </div>

    <!-- Subjects Container (Grouped by Term if Archived Filter, else Regular View) -->
    <div id="subjects-cards-wrapper">
      ${displayedSubjects.length === 0 ? `
        <div style="padding: 48px 24px; text-align: center; color: var(--text-muted); background: var(--bg-surface); border: none; border-radius: var(--radius-lg); box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.40), inset 0 1px 0 rgba(255, 255, 255, 0.08);">
          <p style="font-size: 15px; font-weight: 500; margin-bottom: 8px;">No subjects found</p>
          <p style="font-size: 13px;">${currentFilter === 'archived' ? 'No archived subjects in your repository.' : 'Create your first academic subject or adjust filters above to get started.'}</p>
        </div>
      ` : (currentFilter === 'archived' ? renderArchivedGroupedView(displayedSubjects, viewMode) : (viewMode === 'list' ? renderSubjectsListView(displayedSubjects) : renderSubjectsGridView(displayedSubjects)))}
    </div>

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
          <input type="hidden" id="sub-form-id">
          
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label" for="sub-form-name">Subject Name *</label>
              <input type="text" id="sub-form-name" class="form-input" placeholder="e.g. Data Structures & Algorithms" required>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="sub-form-code">Course Code</label>
                <input type="text" id="sub-form-code" class="form-input" placeholder="e.g. CS 201">
              </div>
              <div class="form-group">
                <label class="form-label" for="sub-form-year">Year Level *</label>
                <select id="sub-form-year" class="form-input" required>
                  ${YEAR_LEVELS.map(y => `<option value="${y}">${y}</option>`).join('')}
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="sub-form-semester">Semester *</label>
                <select id="sub-form-semester" class="form-input" required>
                  ${SEMESTERS.map(s => `<option value="${s}">${s}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="sub-form-instructor">Instructor</label>
                <input type="text" id="sub-form-instructor" class="form-input" placeholder="e.g. Dr. Jane Smith">
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary close-modal-btn">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Subject</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Cascade Delete Warning Modal -->
    <div class="modal-overlay" id="cascade-delete-modal">
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title" style="color: var(--danger);">Delete Subject &amp; All Linked Data?</h3>
          <button class="btn btn-ghost btn-icon close-delete-modal-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <p style="margin-bottom: 8px;">Are you sure you want to delete this subject? <strong>This action cannot be undone.</strong></p>
          <div id="cascade-impact-details" style="padding: 12px; background: rgba(239, 68, 68, 0.08); border-radius: var(--radius-md); font-size: 13px; color: var(--text-primary); border: 1px solid rgba(239, 68, 68, 0.2);">
            <!-- Populated via JS -->
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary close-delete-modal-btn">Cancel</button>
          <button type="button" class="btn btn-danger" id="btn-confirm-cascade-delete">Delete Everything</button>
        </div>
      </div>
    </div>

    <!-- Archive Reason Selector Modal -->
    <div class="modal-overlay" id="archive-reason-modal">
      <div class="modal-card">
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
              <label class="bulk-subject-item" for="bulk-sub-${sub.id}">
                <input type="checkbox" id="bulk-sub-${sub.id}" name="bulk-sub-checkbox" class="bulk-sub-checkbox" value="${sub.id}" checked aria-label="${sub.name}">
                
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
  return cleanupSubjectsView;
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
          <col style="width: 44%;">
          <col style="width: 17%;">
          <col style="width: 12%;">
          <col style="width: 14%;">
          <col style="width: 8%;">
          <col style="width: 5%;">
        </colgroup>
        <thead>
          <tr>
            <th>Course &amp; Subject</th>
            <th>Term / Status</th>
            <th>Study Time</th>
            <th>Standing</th>
            <th>Plan</th>
            <th style="text-align: right;"></th>
          </tr>
        </thead>
        <tbody>
          ${subjects.map(sub => renderSubjectListRow(sub)).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function getStandingClass(pct) {
  if (pct === null || pct === undefined || isNaN(pct)) return 'grade-none';
  if (pct >= 75) return 'grade-pass';
  if (pct >= 60) return 'grade-warn';
  return 'grade-danger';
}

function getArchiveReasonBadge(sub) {
  if (!sub.archived) return '';
  const reason = sub.archive_reason || 'Archived';
  if (reason.toLowerCase().includes('dropped')) {
    return `<span class="tag-status-warn" title="Dropped subject">Dropped</span>`;
  }
  if (reason.toLowerCase().includes('semester')) {
    return `<span class="tag-status-success" title="Semester completed">Semester Ended</span>`;
  }
  return `<span class="tag-status-archived" title="${reason}">${reason}</span>`;
}

function renderSubjectCard(sub) {
  const totalMins = store.getSubjectTotalStudyMinutes(sub.id);
  const hoursFormatted = (totalMins / 60).toFixed(1) + 'h';
  const gradeStats = store.calculateSubjectGrade(sub.id);
  const plan = store.getStudyPlanBySubject(sub.id);
  const standingClass = getStandingClass(gradeStats.overallPercentage);

  const semAbbr = (sub.semester || '')
    .replace('1st Semester', '1st Sem')
    .replace('2nd Semester', '2nd Sem');

  // Extract 2 initials for the circular subject badge
  const initials = (sub.code || sub.name || 'CS').substring(0, 2).toUpperCase();

  return `
    <div class="subject-card ${sub.archived ? 'archived' : ''}" data-id="${sub.id}">
      <div class="subject-card-header-row">
        <!-- Circular Icon Badge (Reference Style) -->
        <div class="subject-icon-badge">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
        </div>

        <div class="subject-title-area">
          <span class="subject-code-tag" style="${!sub.code ? 'visibility: hidden;' : ''}">${sub.code || '&nbsp;'}</span>
          <h4 class="subject-card-name subject-grades-link" data-subject-id="${sub.id}" title="View ${sub.name} Grades">${sub.name}</h4>
          ${sub.instructor ? `
            <span class="subject-card-instructor">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              ${sub.instructor}
            </span>
          ` : '<span class="subject-card-instructor is-empty" aria-hidden="true">&nbsp;</span>'}
        </div>
      </div>

      <div class="subject-meta-pills">
        <span class="subject-pill-tag">${sub.year_level} · ${semAbbr}</span>
        ${getArchiveReasonBadge(sub)}
      </div>

      <!-- Clean Minimalist Metrics Strip -->
      <div class="subject-metrics-strip">
        <div class="subject-metric-col">
          <span class="subject-metric-lbl">Study Time</span>
          <span class="subject-metric-val">${hoursFormatted}</span>
        </div>
        <div class="subject-metric-col">
          <span class="subject-metric-lbl">Standing</span>
          <span class="subject-metric-val">${gradeStats.summaryLine}</span>
        </div>
        <div class="subject-metric-col">
          <span class="subject-metric-lbl">Plan</span>
          ${plan ? `
            <button type="button" class="subject-metric-val subject-plan-link" data-subject-id="${sub.id}" data-plan-id="${plan.id}" title="View ${sub.name} Study Plan">
              Attached
            </button>
          ` : `
            <span class="subject-metric-val subject-plan-none">None</span>
          `}
        </div>
      </div>

      <!-- Pill Action Buttons (Pinned to bottom baseline) -->
      <div class="subject-card-actions">
        ${!sub.archived ? `<button class="btn btn-secondary btn-sm btn-edit-sub" data-id="${sub.id}">Edit</button>` : ''}
        <button class="btn btn-secondary btn-sm btn-archive-sub" data-id="${sub.id}">
          ${sub.archived ? 'Unarchive' : 'Archive'}
        </button>
        <button class="btn btn-danger btn-sm btn-delete-sub" data-id="${sub.id}">Delete</button>
      </div>
    </div>
  `;
}

function renderSubjectListRow(sub) {
  const totalMins = store.getSubjectTotalStudyMinutes(sub.id);
  const hoursFormatted = (totalMins / 60).toFixed(1) + 'h';
  const gradeStats = store.calculateSubjectGrade(sub.id);
  const plan = store.getStudyPlanBySubject(sub.id);
  const standingClass = getStandingClass(gradeStats.overallPercentage);

  const semAbbr = (sub.semester || '')
    .replace('1st Semester', '1st Sem')
    .replace('2nd Semester', '2nd Sem');

  return `
    <tr class="subject-list-row ${sub.archived ? 'archived' : ''}" data-id="${sub.id}" style="--sub-color: ${sub.color || '#6366f1'};">
      <td class="subject-list-name-cell">
        <div style="display: flex; align-items: flex-start; gap: 12px; min-width: 0;">
          
          <div class="subject-list-title-block">
            <div class="subject-list-header-line">
              ${sub.code ? `<span class="subject-list-code">${sub.code}</span>` : ''}
              <span class="subject-list-name subject-grades-link" data-subject-id="${sub.id}" title="View ${sub.name} Grades">${sub.name}</span>
            </div>
            ${sub.instructor ? `
              <span class="subject-list-instructor">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                ${sub.instructor}
              </span>
            ` : ''}
          </div>
        </div>
      </td>
      <td>
        <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
          <span class="subject-term-badge">
            <span>${sub.year_level}</span>
            <span class="term-dot">·</span>
            <span>${semAbbr}</span>
          </span>
          ${getArchiveReasonBadge(sub)}
        </div>
      </td>
      <td>
        <span class="subject-study-time">${hoursFormatted}</span>
      </td>
      <td>
        <div class="subject-standing-pill ${standingClass}">
          <span class="standing-dot" style="background: currentColor;"></span>
          <span>${gradeStats.summaryLine}</span>
        </div>
      </td>
      <td>
        ${plan ? `
          <button type="button" class="subject-plan-pill ready subject-plan-link" data-subject-id="${sub.id}" data-plan-id="${plan.id}" title="View ${sub.name} Study Plan">
            ● Attached
          </button>
        ` : `
          <span class="subject-plan-pill subject-plan-none">
            None
          </span>
        `}
      </td>
      <td style="text-align: right;">
        <div class="row-actions-dropdown-wrapper">
          <button type="button" class="subject-row-actions-btn" data-id="${sub.id}" title="Subject options" aria-label="Subject options">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="2.2"></circle>
              <circle cx="19" cy="12" r="2.2"></circle>
              <circle cx="5" cy="12" r="2.2"></circle>
            </svg>
          </button>
          <div class="user-popover toolbar-popover row-actions-popover" id="row-actions-${sub.id}">
            ${!sub.archived ? `
              <button class="popover-item btn-edit-sub" data-id="${sub.id}">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                Edit Subject
              </button>
            ` : ''}
            <button class="popover-item btn-archive-sub" data-id="${sub.id}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              ${sub.archived ? 'Unarchive' : 'Archive'}
            </button>
            <div class="popover-divider"></div>
            <button class="popover-item popover-item-danger btn-delete-sub" data-id="${sub.id}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              Delete
            </button>
          </div>
        </div>
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

  // Subject Search Input with 180ms Debounce
  const searchInput = container.querySelector('#subject-search-input');
  if (searchInput) {
    let searchDebounce = null;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        currentSearchQuery = e.target.value;
        const wrapper = container.querySelector('#subjects-cards-wrapper');
        if (wrapper) {
          const displayed = getDisplayedSubjects();
          const mode = store.getSubjectsViewMode();
          wrapper.innerHTML = displayed.length === 0 ? `
            <div style="padding: 48px 24px; text-align: center; color: var(--text-muted); background: var(--bg-surface); border: none; border-radius: var(--radius-lg); box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.40), inset 0 1px 0 rgba(255, 255, 255, 0.08);">
              <p style="font-size: 15px; font-weight: 500; margin-bottom: 8px;">No subjects found</p>
              <p style="font-size: 13px;">${currentSearchQuery ? 'No subjects matched your search.' : (currentFilter === 'archived' ? 'No archived subjects in your repository.' : 'Create your first academic subject or adjust filters above to get started.')}</p>
            </div>
          ` : (currentFilter === 'archived' ? renderArchivedGroupedView(displayed, mode) : (mode === 'list' ? renderSubjectsListView(displayed) : renderSubjectsGridView(displayed)));
          attachCardActionEvents(wrapper);
        }
      }, 180);
    });
  }

  // 1. Notion-Inspired Year level filter popover menu
  const yearBtn = container.querySelector('#btn-subject-year-filter');
  const yearMenu = container.querySelector('#subject-year-filter-menu');
  if (yearBtn && yearMenu) {
    yearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = yearMenu.classList.contains('open');
      container.querySelectorAll('.toolbar-popover').forEach(p => p.classList.remove('open'));
      if (!isOpen) yearMenu.classList.add('open');
    });

    yearMenu.querySelectorAll('.popover-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        currentYearFilter = item.dataset.year;
        yearMenu.classList.remove('open');
        renderSubjectsView(container);
      });
    });
  }

  // 2. Notion-Inspired Sort popover menu
  const sortBtn = container.querySelector('#btn-subject-sort');
  const sortMenu = container.querySelector('#subject-sort-menu');
  if (sortBtn && sortMenu) {
    sortBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = sortMenu.classList.contains('open');
      container.querySelectorAll('.toolbar-popover').forEach(p => p.classList.remove('open'));
      if (!isOpen) sortMenu.classList.add('open');
    });

    sortMenu.querySelectorAll('.popover-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const sortKey = item.dataset.sort;
        store.setSubjectsSort(sortKey);
        sortMenu.classList.remove('open');
        renderSubjectsView(container);
      });
    });
  }

  // Close toolbar popovers on outside click (singleton guarded)
  if (activeToolbarPopoversCleanup) {
    document.removeEventListener('click', activeToolbarPopoversCleanup);
    activeToolbarPopoversCleanup = null;
  }
  const closeToolbarPopovers = (e) => {
    if (!container || !container.isConnected) {
      cleanupSubjectsView();
      return;
    }
    container.querySelectorAll('.toolbar-popover.open').forEach(p => {
      if (!p.contains(e.target) && !e.target.closest('.toolbar-icon-btn')) {
        p.classList.remove('open');
      }
    });
  };
  document.addEventListener('click', closeToolbarPopovers);
  activeToolbarPopoversCleanup = closeToolbarPopovers;

  // Modals
  const createModal = container.querySelector('#subject-modal');
  const deleteModal = container.querySelector('#cascade-delete-modal');
  const archiveModal = container.querySelector('#archive-reason-modal');
  const bulkModal = container.querySelector('#bulk-end-semester-modal');
  const form = container.querySelector('#subject-form');
  const archiveForm = container.querySelector('#archive-reason-form');

  const openCreateModal = () => {
    form?.reset();
    container.querySelector('#sub-form-id').value = '';
    container.querySelector('#subject-modal-title').textContent = 'New Subject';
    createModal?.classList.add('open');
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
    createModal?.classList.add('open');
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

    archiveModal?.classList.add('open');
  };

  const openDeleteModal = (subId) => {
    const sub = store.getSubjectById(subId);
    if (!sub) return;

    deleteTargetSubjectId = subId;
    const stats = store.getCascadeStats(subId);

    const detailsDiv = container.querySelector('#cascade-impact-details');
    if (detailsDiv) {
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
    }

    deleteModal?.classList.add('open');
  };

  const closeModals = () => {
    createModal?.classList.remove('open');
    deleteModal?.classList.remove('open');
    archiveModal?.classList.remove('open');
    bulkModal?.classList.remove('open');
    deleteTargetSubjectId = null;
    archiveTargetSubjectId = null;
  };

  const attachCardActionEvents = (rootEl) => {
    // Row overflow actions popover toggles
    rootEl.querySelectorAll('.subject-row-actions-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const subId = btn.dataset.id;
        const popover = rootEl.querySelector(`#row-actions-${subId}`);
        if (!popover) return;
        const isOpen = popover.classList.contains('open');
        rootEl.querySelectorAll('.row-actions-popover').forEach(p => p.classList.remove('open'));
        if (!isOpen) popover.classList.add('open');
      });
    });

    // Edit buttons
    rootEl.querySelectorAll('.btn-edit-sub').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        rootEl.querySelectorAll('.row-actions-popover').forEach(p => p.classList.remove('open'));
        openEditModal(btn.dataset.id);
      });
    });

    // Archive / Unarchive buttons
    rootEl.querySelectorAll('.btn-archive-sub').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        rootEl.querySelectorAll('.row-actions-popover').forEach(p => p.classList.remove('open'));
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

    // Delete buttons
    rootEl.querySelectorAll('.btn-delete-sub').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        rootEl.querySelectorAll('.row-actions-popover').forEach(p => p.classList.remove('open'));
        openDeleteModal(btn.dataset.id);
      });
    });

    // Click on Subject Name (Navigates to Grades with subject pre-selected - Prompt 68)
    rootEl.querySelectorAll('.subject-grades-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const subjectId = link.dataset.subjectId;
        if (subjectId) {
          events.emit('grades:select-subject', subjectId);
          if (window.avenApp && typeof window.avenApp.navigateTo === 'function') {
            window.avenApp.navigateTo('grades');
          } else {
            window.location.hash = 'grades';
          }
        }
      });
    });

    // Click on Subject Plan Link (Navigates to Study Plans with subject or plan pre-selected)
    rootEl.querySelectorAll('.subject-plan-link').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const planId = btn.dataset.planId;
        const subjectId = btn.dataset.subjectId;
        if (planId) {
          events.emit('plans:select-plan', planId);
        } else if (subjectId) {
          events.emit('plans:select-subject', subjectId);
        }
        if (window.avenApp && typeof window.avenApp.navigateTo === 'function') {
          window.avenApp.navigateTo('plans');
        } else {
          window.location.hash = 'plans';
        }
      });
    });
  };

  // Close row actions popovers on outside click (singleton guarded)
  if (activeRowActionPopoversCleanup) {
    document.removeEventListener('click', activeRowActionPopoversCleanup);
    activeRowActionPopoversCleanup = null;
  }
  const closeRowActionPopovers = (e) => {
    if (!container || !container.isConnected) {
      cleanupSubjectsView();
      return;
    }
    container.querySelectorAll('.row-actions-popover.open').forEach(p => {
      if (!p.contains(e.target) && !e.target.closest('.subject-row-actions-btn')) {
        p.classList.remove('open');
      }
    });
  };
  document.addEventListener('click', closeRowActionPopovers);
  activeRowActionPopoversCleanup = closeRowActionPopovers;

  // Grid / List View Mode Toggle (Prompt 64: In-place animated sliding)
  const viewToggle = container.querySelector('#view-mode-toggle');
  if (viewToggle) {
    viewToggle.querySelectorAll('.seg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.view;
        if (mode === store.getSubjectsViewMode()) return;
        store.setSubjectsViewMode(mode);
        
        // 1. Update in-place so sliding indicator animates smoothly
        viewToggle.dataset.active = mode;
        viewToggle.querySelectorAll('.seg-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.view === mode);
        });

        // 2. Update subjects cards content
        const wrapper = container.querySelector('#subjects-cards-wrapper');
        if (wrapper) {
          const displayed = getDisplayedSubjects();
          wrapper.innerHTML = displayed.length === 0 ? `
            <div style="padding: 48px 24px; text-align: center; color: var(--text-muted); background: var(--bg-surface); border: none; border-radius: var(--radius-lg); box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.40), inset 0 1px 0 rgba(255, 255, 255, 0.08);">
              <p style="font-size: 15px; font-weight: 500; margin-bottom: 8px;">No subjects found</p>
              <p style="font-size: 13px;">${currentFilter === 'archived' ? 'No archived subjects in your repository.' : 'Create your first academic subject or adjust filters above to get started.'}</p>
            </div>
          ` : (currentFilter === 'archived' ? renderArchivedGroupedView(displayed, mode) : (mode === 'list' ? renderSubjectsListView(displayed) : renderSubjectsGridView(displayed)));
          attachCardActionEvents(wrapper);
        }
      });
    });
  }

  container.querySelector('#btn-create-subject')?.addEventListener('click', openCreateModal);

  container.querySelectorAll('.close-modal-btn, .close-delete-modal-btn, .close-archive-modal-btn, .close-bulk-modal-btn').forEach(b => {
    b.addEventListener('click', closeModals);
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

  // Initial Card/Row action event binding
  attachCardActionEvents(container);

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

    const payload = { id: id || undefined, name, code, year_level, semester, instructor };
    store.saveSubject(payload);

    closeModals();
    window.avenApp?.showToast(id ? 'Subject updated' : 'Subject created', 'success');
    renderSubjectsView(container);
  });
}

