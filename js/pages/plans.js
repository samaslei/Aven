/**
 * Aven - Study Plans Controller
 * Features:
 * - Standalone general study plans & subject-specific syllabi
 * - Interactive sandboxed viewer (embedded JS, CSS, canvas, SVG) with clean reset (no false scrollbars)
 * - Fullscreen / expanded view mode with Esc key support
 * - Grouped sidebar (General Plans & Course Syllabi)
 * - File upload and direct HTML paste
 */

import { store, events } from '../core/store.js';

let selectedPlanId = null;
let isFullscreenActive = false;

// Listen for cross-page subject plan selection
events.on('plans:select-subject', (subjectId) => {
  const plan = store.getStudyPlanBySubject(subjectId);
  if (plan) {
    selectedPlanId = plan.id;
  }
});

export function setSelectedStudyPlanBySubjectId(subjectId) {
  const plan = store.getStudyPlanBySubject(subjectId);
  if (plan) {
    selectedPlanId = plan.id;
  }
}

export function renderPlansView(container) {
  const activeSubjects = store.getSubjects(false);
  const allPlans = store.getStudyPlans().sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

  // Check URL query parameters for pre-selected subject
  if (window.location.hash.includes('subjectId=')) {
    const hashQuery = window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '';
    const params = new URLSearchParams(hashQuery);
    const subId = params.get('subjectId');
    if (subId) {
      const p = store.getStudyPlanBySubject(subId);
      if (p) selectedPlanId = p.id;
    }
  }

  // Standalone general plans (no subject_id)
  const standalonePlans = allPlans.filter(p => !p.subject_id);

  // Subject-tied plans
  const subjectPlans = allPlans.filter(p => !!p.subject_id).map(p => {
    const sub = store.getSubjectById(p.subject_id);
    return { plan: p, subject: sub };
  }).filter(item => item.subject !== null);

  // Auto-select most recently updated plan if none selected or if previously selected was deleted
  if ((!selectedPlanId || !store.getStudyPlanById(selectedPlanId)) && allPlans.length > 0) {
    selectedPlanId = allPlans[0].id;
  }

  const currentPlan = selectedPlanId ? store.getStudyPlanById(selectedPlanId) : null;
  const currentSubject = (currentPlan && currentPlan.subject_id) ? store.getSubjectById(currentPlan.subject_id) : null;

  const totalPlansCount = standalonePlans.length + subjectPlans.length;

  container.innerHTML = `
    <div class="plans-layout">
      <!-- Left Sidebar: General Plans & Course Syllabi -->
      <div class="plans-sidebar">
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 4px 6px;">
          <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted);">
            Study Plans (${totalPlansCount})
          </span>
          <button class="btn btn-primary btn-sm" id="btn-open-upload-plan" style="padding: 3px 8px; font-size: 11.5px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Upload
          </button>
        </div>

        ${totalPlansCount === 0 ? `
          <div style="padding: 32px 12px; text-align: center; color: var(--text-muted); font-size: 13px;">
            No study plans uploaded yet. Click "Upload" to add a general roadmap or course syllabus.
          </div>
        ` : `
          <!-- 1. GENERAL / STANDALONE PLANS SECTION -->
          ${standalonePlans.length > 0 ? `
            <div class="plans-sidebar-section">
              <div class="plans-sidebar-section-header">
                <span>General Plans</span>
                <span class="tag" style="font-size: 10px; padding: 1px 6px;">${standalonePlans.length}</span>
              </div>
              ${standalonePlans.map(p => {
                const isSelected = p.id === selectedPlanId;
                const updatedDate = new Date(p.updated_at).toLocaleDateString();
                return `
                  <div class="plan-subject-item ${isSelected ? 'active' : ''}" data-plan-id="${p.id}">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <span style="display: flex; align-items: center; color: var(--accent); flex-shrink: 0;">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                        </svg>
                      </span>
                      <strong style="font-size: 13px; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${p.title}
                      </strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted);">
                      <span>Standalone Plan</span>
                      <span>${updatedDate}</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : ''}

          <!-- 2. COURSE SYLLABI SECTION -->
          ${subjectPlans.length > 0 ? `
            <div class="plans-sidebar-section">
              <div class="plans-sidebar-section-header">
                <span>Course Syllabi</span>
                <span class="tag" style="font-size: 10px; padding: 1px 6px;">${subjectPlans.length}</span>
              </div>
              ${subjectPlans.map(({ plan, subject }) => {
                const isSelected = plan.id === selectedPlanId;
                const updatedDate = new Date(plan.updated_at).toLocaleDateString();
                return `
                  <div class="plan-subject-item ${isSelected ? 'active' : ''}" data-plan-id="${plan.id}">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <strong style="font-size: 13px; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${subject.code ? `[${subject.code}] ` : ''}${subject.name}
                      </strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted);">
                      <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px;">${plan.title}</span>
                      <span>${updatedDate}</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : ''}
        `}
      </div>

      <!-- Right Panel: Interactive Sandboxed Viewer -->
      <div class="plan-viewer-container" id="plan-viewer-wrapper">
        ${!currentPlan ? `
          <div class="plan-empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <h3 style="font-size: 16px;">No Study Plan Selected</h3>
            <p style="font-size: 13px; max-width: 360px;">
              Select a plan from the left or upload an interactive HTML study plan (general roadmap or course-specific syllabus).
            </p>
            <button class="btn btn-primary btn-sm" id="btn-empty-upload-plan" style="margin-top: 8px;">
              Upload HTML Study Plan
            </button>
          </div>
        ` : `
          <div class="plan-viewer-header">
            <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">
              ${currentSubject ? `
                <span style="display: flex; align-items: center; color: var(--accent); flex-shrink: 0;">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                  </svg>
                </span>
              ` : `
                <span style="display: flex; align-items: center; color: var(--accent); flex-shrink: 0;">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                  </svg>
                </span>
              `}
              <div style="min-width: 0;">
                <strong style="font-size: 14px; color: var(--text-primary); display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  ${currentSubject ? `${currentSubject.name} — ${currentPlan.title}` : `General — ${currentPlan.title}`}
                </strong>
                <div style="font-size: 11.5px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  Updated ${new Date(currentPlan.updated_at).toLocaleString()} · Interactive Sandbox (JS & CSS Enabled)
                </div>
              </div>
            </div>

            <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
              <button class="btn btn-ghost btn-sm" id="btn-fullscreen-plan" title="Toggle Fullscreen View (Esc to exit)">
                <svg class="fs-icon-expand" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                </svg>
                <svg class="fs-icon-compress" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: none;">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
                </svg>
                <span class="fs-label-text">Fullscreen</span>
              </button>

              <button class="btn btn-ghost btn-sm" id="btn-download-plan" title="Export/Download HTML File">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Export HTML
              </button>

              <button class="btn btn-ghost btn-sm" id="btn-replace-plan">
                Replace Plan
              </button>

              <button class="btn btn-ghost btn-sm" id="btn-delete-plan" style="color: var(--danger);">
                Delete
              </button>
            </div>
          </div>

          <div class="plan-frame-wrapper">
            <!-- Full interactive sandbox support: allow-scripts, allow-same-origin, allow-forms, allow-modals, allow-popups -->
            <iframe id="sandboxed-plan-iframe"
                    class="sandboxed-plan-frame"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-downloads"
                    srcdoc="${escapeHtmlDoc(currentPlan.html_content)}">
            </iframe>
          </div>
        `}
      </div>
    </div>

    <!-- Upload/Replace Study Plan Modal -->
    <div class="modal-overlay" id="plan-upload-modal">
      <div class="modal-card" style="max-width: 580px;">
        <div class="modal-header">
          <h3 class="modal-title" id="plan-modal-title">Upload Interactive HTML Study Plan</h3>
          <button class="btn btn-ghost btn-icon close-plan-modal-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form id="plan-upload-form">
          <input type="hidden" id="plan-edit-id" value="">
          <div class="modal-body">
            <div class="alert-box" style="background: var(--bg-surface); border: none; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08); margin-bottom: 14px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--accent); flex-shrink: 0;">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <span>Subject-tied plans replace any existing plan for that subject. Standalone (General) plans can have multiple entries.</span>
            </div>

            <!-- Subject Dropdown -->
            <div class="form-group">
              <label class="form-label" for="plan-target-subject">Target Scope</label>
              <select id="plan-target-subject" class="form-select">
                <option value="">🌐 No Subject (General / Standalone Plan)</option>
                ${activeSubjects.length > 0 ? `
                  <optgroup label="Course Subjects">
                    ${activeSubjects.map(s => `
                      <option value="${s.id}">
                        ${s.code ? `[${s.code}] ` : ''}${s.name}
                      </option>
                    `).join('')}
                  </optgroup>
                ` : ''}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="plan-title-input">Plan Title *</label>
              <input type="text" id="plan-title-input" class="form-input" placeholder="e.g. Master Exam Roadmap or Interactive Syllabus" required>
            </div>

            <!-- File Upload or HTML Text Area -->
            <div class="form-group">
              <label class="form-label">Upload .html / .htm File</label>
              <input type="file" id="plan-file-input" class="form-input" accept=".html,.htm" style="padding: 6px;">
            </div>

            <div class="form-group">
              <label class="form-label" for="plan-html-textarea">Or Paste HTML Content Directly (with embedded &lt;script&gt; &amp; &lt;style&gt;)</label>
              <textarea id="plan-html-textarea" class="form-textarea" rows="7" placeholder="<!DOCTYPE html><html><head><script>...</script></head><body>...</body></html>"></textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-ghost close-plan-modal-btn">Cancel</button>
            <button type="submit" class="btn btn-primary" id="btn-submit-plan">
              Save & Render Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  attachPlansEvents(container);
}

/**
 * Prepares the sandboxed HTML document:
 * 1. Resets default browser margins on html/body.
 * 2. Adds consistent outer padding (28px 32px) so content (title, week cards, progress, detail sections)
 *    never sits flush against viewport edges in either standard or fullscreen views.
 * 3. Preserves natural scrolling for long plans while preventing false scrollbars on short plans.
 */
function prepareSandboxedHtml(rawHtml) {
  if (!rawHtml) return '<p style="font-family: sans-serif; padding: 28px 32px; color: #64748b;">Empty study plan content.</p>';

  const resetCss = `
<style id="aven-iframe-reset">
  *, *::before, *::after {
    box-sizing: border-box;
  }
  html {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    height: 100%;
    -webkit-text-size-adjust: 100%;
  }
  body {
    margin: 0 !important;
    padding: 28px 32px !important;
    box-sizing: border-box !important;
    min-height: 100%;
    overflow-x: auto;
    overflow-y: auto;
  }
  @media (max-width: 640px) {
    body {
      padding: 18px 16px !important;
    }
  }
</style>
`;

  if (rawHtml.includes('</head>')) {
    return rawHtml.replace('</head>', `${resetCss}</head>`);
  } else if (rawHtml.includes('<head>')) {
    return rawHtml.replace('<head>', `<head>${resetCss}`);
  } else if (rawHtml.includes('<body>')) {
    return rawHtml.replace('<body>', `<body>${resetCss}`);
  } else {
    return `<!DOCTYPE html><html><head><meta charset="utf-8">${resetCss}</head><body>${rawHtml}</body></html>`;
  }
}

function escapeHtmlDoc(html) {
  const prepared = prepareSandboxedHtml(html);
  return prepared
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;');
}

function attachPlansEvents(container) {
  // Switch selected plan
  container.querySelectorAll('.plan-subject-item').forEach(item => {
    item.addEventListener('click', () => {
      selectedPlanId = item.dataset.planId;
      renderPlansView(container);
    });
  });

  // Modal handlers
  const planModal = container.querySelector('#plan-upload-modal');
  const planForm = container.querySelector('#plan-upload-form');
  const fileInput = container.querySelector('#plan-file-input');
  const htmlTextarea = container.querySelector('#plan-html-textarea');
  const titleInput = container.querySelector('#plan-title-input');
  const subjectSelect = container.querySelector('#plan-target-subject');
  const editIdInput = container.querySelector('#plan-edit-id');
  const modalTitle = container.querySelector('#plan-modal-title');

  const openUploadModal = (planToEdit = null) => {
    planForm.reset();
    if (planToEdit) {
      if (modalTitle) modalTitle.textContent = 'Replace / Update Study Plan';
      if (editIdInput) editIdInput.value = planToEdit.id;
      if (subjectSelect) subjectSelect.value = planToEdit.subject_id || '';
      if (titleInput) titleInput.value = planToEdit.title || '';
      if (htmlTextarea) htmlTextarea.value = planToEdit.html_content || '';
    } else {
      if (modalTitle) modalTitle.textContent = 'Upload Interactive HTML Study Plan';
      if (editIdInput) editIdInput.value = '';
    }
    planModal.classList.add('open');
  };

  container.querySelector('#btn-open-upload-plan')?.addEventListener('click', () => openUploadModal());
  container.querySelector('#btn-empty-upload-plan')?.addEventListener('click', () => openUploadModal());
  container.querySelector('#btn-replace-plan')?.addEventListener('click', () => {
    const currentPlan = selectedPlanId ? store.getStudyPlanById(selectedPlanId) : null;
    openUploadModal(currentPlan);
  });

  container.querySelectorAll('.close-plan-modal-btn').forEach(b => {
    b.addEventListener('click', () => planModal.classList.remove('open'));
  });

  // Handle File Input Read
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        if (!titleInput.value) {
          titleInput.value = file.name.replace(/\.[^/.]+$/, '');
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          htmlTextarea.value = event.target.result;
        };
        reader.readAsText(file);
      }
    });
  }

  // Submit Plan Form
  if (planForm) {
    planForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const subjectId = subjectSelect.value || null;
      const title = titleInput.value;
      const content = htmlTextarea.value || '<p>Study plan empty</p>';
      const editPlanId = editIdInput ? editIdInput.value : null;

      const saved = store.saveStudyPlan(subjectId, title, content, editPlanId);
      selectedPlanId = saved.id;
      planModal.classList.remove('open');

      window.avenApp?.showToast('Interactive study plan saved and rendered', 'success');
      renderPlansView(container);
    });
  }

  // Delete Plan
  container.querySelector('#btn-delete-plan')?.addEventListener('click', () => {
    if (selectedPlanId) {
      store.deleteStudyPlan(selectedPlanId);
      selectedPlanId = null;
      window.avenApp?.showToast('Study plan deleted', 'info');
      renderPlansView(container);
    }
  });

  // Download / Export Plan
  container.querySelector('#btn-download-plan')?.addEventListener('click', () => {
    const currentPlan = selectedPlanId ? store.getStudyPlanById(selectedPlanId) : null;
    if (!currentPlan) return;

    const blob = new Blob([currentPlan.html_content], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentPlan.title.toLowerCase().replace(/[^a-z0-9]/gi, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
    window.avenApp?.showToast('Exported interactive HTML study plan', 'info');
  });

  // Fullscreen Viewer Toggle
  const viewerWrapper = container.querySelector('#plan-viewer-wrapper');
  const fullscreenBtn = container.querySelector('#btn-fullscreen-plan');
  const expandIcon = container.querySelector('.fs-icon-expand');
  const compressIcon = container.querySelector('.fs-icon-compress');
  const labelText = container.querySelector('.fs-label-text');

  const updateFullscreenUI = (isFullscreen) => {
    isFullscreenActive = isFullscreen;
    if (viewerWrapper) {
      viewerWrapper.classList.toggle('is-fullscreen', isFullscreen);
    }
    if (expandIcon) expandIcon.style.display = isFullscreen ? 'none' : 'block';
    if (compressIcon) compressIcon.style.display = isFullscreen ? 'block' : 'none';
    if (labelText) labelText.textContent = isFullscreen ? 'Exit Fullscreen' : 'Fullscreen';
  };

  const toggleFullscreen = async () => {
    if (!viewerWrapper) return;
    const nowFullscreen = !viewerWrapper.classList.contains('is-fullscreen');

    updateFullscreenUI(nowFullscreen);

    try {
      if (nowFullscreen) {
        if (viewerWrapper.requestFullscreen && !document.fullscreenElement) {
          await viewerWrapper.requestFullscreen();
        }
      } else {
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      // Graceful fallback to CSS full-viewport overlay mode
    }
  };

  fullscreenBtn?.addEventListener('click', toggleFullscreen);

  // Sync state if user exits via browser Escape key or OS controls
  const handleFullscreenChange = () => {
    if (!document.fullscreenElement && viewerWrapper?.classList.contains('is-fullscreen')) {
      updateFullscreenUI(false);
    }
  };
  document.addEventListener('fullscreenchange', handleFullscreenChange);

  // Esc key fallback for CSS overlay mode
  const handleKeyDown = (evt) => {
    if (evt.key === 'Escape' && viewerWrapper?.classList.contains('is-fullscreen')) {
      toggleFullscreen();
    }
  };
  document.addEventListener('keydown', handleKeyDown);
}
