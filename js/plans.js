/**
 * Aven - Study Plans Controller
 * Features: Per-subject interactive HTML upload & sandboxed viewer, auto-selection, one-plan-per-subject replacement.
 * Fully supports interactive HTML (embedded JS, canvas, CSS, interactive checklists, charts, etc.).
 */

import { store, events } from './store.js';

let selectedPlanSubjectId = null;

export function renderPlansView(container) {
  const activeSubjects = store.getSubjects(false);
  const allPlans = store.getStudyPlans().sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

  // Map subjects that have plans
  const subjectsWithPlans = allPlans.map(p => {
    const sub = store.getSubjectById(p.subject_id);
    return { plan: p, subject: sub };
  }).filter(item => item.subject !== null);

  // Auto-select most recently updated plan on page load if none selected
  if (!selectedPlanSubjectId && subjectsWithPlans.length > 0) {
    selectedPlanSubjectId = subjectsWithPlans[0].subject.id;
  }

  const currentPlan = selectedPlanSubjectId ? store.getStudyPlanBySubject(selectedPlanSubjectId) : null;
  const currentSubject = selectedPlanSubjectId ? store.getSubjectById(selectedPlanSubjectId) : null;

  container.innerHTML = `
    <div class="plans-layout">
      <!-- Left Sidebar: Subjects with Study Plans -->
      <div class="plans-sidebar">
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 4px 6px;">
          <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted);">
            Course Syllabi (${subjectsWithPlans.length})
          </span>
          <button class="btn btn-primary btn-sm" id="btn-open-upload-plan">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Upload
          </button>
        </div>

        ${subjectsWithPlans.length === 0 ? `
          <div style="padding: 32px 12px; text-align: center; color: var(--text-muted); font-size: 13px;">
            No study plans uploaded yet. Click "Upload" to attach an interactive syllabus or study roadmap.
          </div>
        ` : subjectsWithPlans.map(({ plan, subject }) => {
          const isSelected = subject.id === selectedPlanSubjectId;
          const updatedDate = new Date(plan.updated_at).toLocaleDateString();

          return `
            <div class="plan-subject-item ${isSelected ? 'active' : ''}" data-id="${subject.id}">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="width: 8px; height: 8px; border-radius: 50%; background-color: ${subject.color || '#6366f1'}; flex-shrink: 0;"></span>
                <strong style="font-size: 13px; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  ${subject.code ? `[${subject.code}] ` : ''}${subject.name}
                </strong>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted); padding-left: 16px;">
                <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px;">${plan.title}</span>
                <span>${updatedDate}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Right Panel: Interactive Sandboxed Viewer -->
      <div class="plan-viewer-container">
        ${!currentPlan || !currentSubject ? `
          <div class="plan-empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <h3 style="font-size: 16px;">No Study Plan Selected</h3>
            <p style="font-size: 13px; max-width: 340px;">
              Select a course syllabus on the left or upload an interactive HTML study plan with embedded JS/CSS for any subject.
            </p>
            <button class="btn btn-primary btn-sm" id="btn-empty-upload-plan" style="margin-top: 8px;">
              Upload HTML Study Plan
            </button>
          </div>
        ` : `
          <div class="plan-viewer-header">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="width: 10px; height: 10px; border-radius: 50%; background-color: ${currentSubject.color || '#6366f1'};"></span>
              <div>
                <strong style="font-size: 14px; color: var(--text-primary);">${currentSubject.name} — ${currentPlan.title}</strong>
                <div style="font-size: 11.5px; color: var(--text-muted);">
                  Updated ${new Date(currentPlan.updated_at).toLocaleString()} · Interactive Sandbox (JS & CSS Enabled)
                </div>
              </div>
            </div>

            <div style="display: flex; align-items: center; gap: 8px;">
              <button class="btn btn-ghost btn-sm" id="btn-download-plan" title="Download HTML File">
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
          <div class="modal-body">
            <div class="alert-box" style="background: var(--bg-surface); border: 1px solid var(--border-subtle);">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--accent); flex-shrink: 0;">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <span>Each subject has one active study plan. Uploading will replace any previous plan. Interactive scripts & styling are fully supported.</span>
            </div>

            <!-- Subject Dropdown -->
            <div class="form-group">
              <label class="form-label" for="plan-target-subject">Target Subject *</label>
              <select id="plan-target-subject" class="form-select" required>
                ${activeSubjects.length === 0 ? '<option value="">No Active Subjects (Create one first)</option>' : ''}
                ${activeSubjects.map(s => `
                  <option value="${s.id}" ${s.id === selectedPlanSubjectId ? 'selected' : ''}>
                    ${s.code ? `[${s.code}] ` : ''}${s.name}
                  </option>
                `).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="plan-title-input">Plan Title *</label>
              <input type="text" id="plan-title-input" class="form-input" placeholder="e.g. Interactive Mastery Syllabus & Milestone Tracker" required>
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
            <button type="submit" class="btn btn-primary" ${activeSubjects.length === 0 ? 'disabled' : ''}>
              Save & Render Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  attachPlansEvents(container);
}

function escapeHtmlDoc(html) {
  if (!html) return '';
  return html
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;');
}

function attachPlansEvents(container) {
  // Switch selected plan subject
  container.querySelectorAll('.plan-subject-item').forEach(item => {
    item.addEventListener('click', () => {
      selectedPlanSubjectId = item.dataset.id;
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

  const openUploadModal = (preselectedSubId = null) => {
    planForm.reset();
    if (preselectedSubId && subjectSelect) {
      subjectSelect.value = preselectedSubId;
    }
    planModal.classList.add('open');
  };

  container.querySelector('#btn-open-upload-plan')?.addEventListener('click', () => openUploadModal());
  container.querySelector('#btn-empty-upload-plan')?.addEventListener('click', () => openUploadModal());
  container.querySelector('#btn-replace-plan')?.addEventListener('click', () => openUploadModal(selectedPlanSubjectId));

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
      const subjectId = subjectSelect.value;
      const title = titleInput.value;
      const content = htmlTextarea.value || '<p>Study plan empty</p>';

      if (!subjectId) {
        window.avenApp?.showToast('Please select a subject', 'danger');
        return;
      }

      store.saveStudyPlan(subjectId, title, content);
      selectedPlanSubjectId = subjectId;
      planModal.classList.remove('open');

      window.avenApp?.showToast('Interactive study plan saved and rendered', 'success');
      renderPlansView(container);
    });
  }

  // Delete Plan
  container.querySelector('#btn-delete-plan')?.addEventListener('click', () => {
    if (selectedPlanSubjectId) {
      store.deleteStudyPlan(selectedPlanSubjectId);
      window.avenApp?.showToast('Study plan deleted', 'info');
      renderPlansView(container);
    }
  });

  // Download / Export Plan
  container.querySelector('#btn-download-plan')?.addEventListener('click', () => {
    const currentPlan = store.getStudyPlanBySubject(selectedPlanSubjectId);
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
}
