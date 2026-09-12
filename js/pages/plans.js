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
import { formatDateHuman } from '../utils/date-utils.js';

let selectedPlanId = null;
let isFullscreenActive = false;
let activePlanMessageListener = null;
let activePlanKeyDownListener = null;
let activeSyncStatusListener = null;
let activeSyncConnListener = null;
let autosaveDebounceTimer = null;
let pendingPlanSave = null;

export function flushPendingPlanSave() {
  if (autosaveDebounceTimer && pendingPlanSave) {
    clearTimeout(autosaveDebounceTimer);
    autosaveDebounceTimer = null;
    const toSave = pendingPlanSave;
    pendingPlanSave = null;
    try {
      store.saveStudyPlan(toSave.subject_id, toSave.title, toSave.html, toSave.id, true);
    } catch (e) {}
  }
}

export function cleanupPlansView() {
  flushPendingPlanSave();
  if (activePlanMessageListener) {
    window.removeEventListener('message', activePlanMessageListener);
    activePlanMessageListener = null;
  }
  if (activePlanKeyDownListener) {
    document.removeEventListener('keydown', activePlanKeyDownListener);
    activePlanKeyDownListener = null;
  }
  if (activeSyncStatusListener) {
    events.off('sync:status', activeSyncStatusListener);
    activeSyncStatusListener = null;
  }
  if (activeSyncConnListener) {
    events.off('sync:connection', activeSyncConnListener);
    activeSyncConnListener = null;
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', flushPendingPlanSave);
}

// Listen for cross-page subject plan selection
events.on('plans:select-subject', (subjectId) => {
  const plan = store.getStudyPlanBySubject(subjectId);
  if (plan) {
    selectedPlanId = plan.id;
  }
});

events.on('plans:select-plan', (planId) => {
  if (planId && store.getStudyPlanById(planId)) {
    selectedPlanId = planId;
  }
});

export function setSelectedStudyPlanBySubjectId(subjectId) {
  const plan = store.getStudyPlanBySubject(subjectId);
  if (plan) {
    selectedPlanId = plan.id;
  }
}

export function setSelectedStudyPlanId(planId) {
  if (planId && store.getStudyPlanById(planId)) {
    selectedPlanId = planId;
  }
}

export function renderPlansView(container) {
  cleanupPlansView();

  const activeSubjects = store.getSubjects(false);
  const allPlans = store.getStudyPlans().sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

  // Check URL query parameters for pre-selected subject or plan
  if (window.location.hash.includes('subjectId=')) {
    const hashQuery = window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '';
    const params = new URLSearchParams(hashQuery);
    const subId = params.get('subjectId');
    if (subId) {
      const p = store.getStudyPlanBySubject(subId);
      if (p) selectedPlanId = p.id;
    }
  }
  if (window.location.hash.includes('planId=')) {
    const hashQuery = window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '';
    const params = new URLSearchParams(hashQuery);
    const pId = params.get('planId');
    if (pId && store.getStudyPlanById(pId)) {
      selectedPlanId = pId;
    }
  }

  // Auto-select most recently updated plan if none selected or if previously selected was deleted
  if ((!selectedPlanId || !store.getStudyPlanById(selectedPlanId)) && allPlans.length > 0) {
    selectedPlanId = allPlans[0].id;
  }

  // Auto-retry syncing any pending plans if sync is currently in error status
  const currentConn = store.getConnectionStatus();
  if (currentConn.status === 'error') {
    if (selectedPlanId) {
      store.retryPlanSync(selectedPlanId);
    } else {
      store.syncAllPlansToCloud();
    }
  }

  const currentPlan = selectedPlanId ? store.getStudyPlanById(selectedPlanId) : null;
  const currentSubject = (currentPlan && currentPlan.subject_id) ? store.getSubjectById(currentPlan.subject_id) : null;

  const totalPlansCount = allPlans.length;

  container.innerHTML = `
    <div class="plans-layout">
      <!-- Left Sidebar: Flat List of All Study Plans -->
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
            No study plans uploaded yet. Click "Upload" to add a roadmap or course study plan.
          </div>
        ` : `
          <!-- Flat list of all study plans (independent of subject) -->
          <div class="plans-list-flat" style="display: flex; flex-direction: column; gap: 6px;">
            ${allPlans.map(p => {
              const isSelected = p.id === selectedPlanId;
              const linkedSub = p.subject_id ? store.getSubjectById(p.subject_id) : null;
              const updatedDate = formatDateHuman(p.updated_at);
              const safeTitle = (p.title || 'Untitled Plan').replace(/"/g, '&quot;');
              return `
                <div class="plan-subject-item ${isSelected ? 'active' : ''}" data-plan-id="${p.id}">
                  <div class="plan-item-header-row" style="display: flex; align-items: center; gap: 8px; min-width: 0;">
                    <span class="plan-item-type-icon" style="color: var(--accent); flex-shrink: 0; display: flex; align-items: center;">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                      </svg>
                    </span>
                    <strong class="plan-item-title" style="font-size: 13px; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; min-width: 0;" title="${safeTitle}">
                      ${p.title || 'Untitled Plan'}
                    </strong>
                  </div>

                  <div class="plan-item-meta-row" style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-top: 4px;">
                    <div class="plan-item-subject-status" style="display: flex; align-items: center; min-width: 0; flex-shrink: 0;">
                      ${linkedSub ? `
                        <span class="subject-code-badge plan-subject-tag" title="Linked to ${linkedSub.name}" style="${linkedSub.color ? `--tag-color: ${linkedSub.color};` : ''}">
                          ${linkedSub.code || linkedSub.name}
                        </span>
                      ` : `
                        <span class="plan-unlinked-badge" title="Not linked to any subject">
                          Unlinked
                        </span>
                      `}
                    </div>

                    <!-- Quick link/unlink picker on card -->
                    <div class="plan-card-link-picker-wrap" onclick="event.stopPropagation()">
                      <select class="plan-quick-subject-select" data-plan-id="${p.id}" title="Assign or change subject link" aria-label="Link subject">
                        <option value="">None (Unlink)</option>
                        ${activeSubjects.map(s => `
                          <option value="${s.id}" ${p.subject_id === s.id ? 'selected' : ''}>
                            ${s.code ? `${s.code} — ` : ''}${s.name}
                          </option>
                        `).join('')}
                      </select>
                    </div>
                  </div>

                  <div class="plan-item-date-row" style="display: flex; justify-content: flex-end; font-size: 11px; color: var(--text-muted); margin-top: 2px;">
                    <span>Updated ${updatedDate}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
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
            <div style="display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1;">
              <span style="display: flex; align-items: center; color: var(--accent); flex-shrink: 0;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
              </span>
              <div style="min-width: 0;">
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                  <strong style="font-size: 15px; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 320px;" title="${currentPlan.title}">
                    ${currentPlan.title}
                  </strong>
                  ${currentSubject ? `
                    <span class="subject-code-badge plan-subject-tag" style="${currentSubject.color ? `--tag-color: ${currentSubject.color};` : ''}" title="Linked to ${currentSubject.name}">
                      ${currentSubject.code || currentSubject.name}
                    </span>
                  ` : `
                    <span class="plan-unlinked-badge" title="Not linked to any subject">
                      Unlinked
                    </span>
                  `}
                </div>
                <div style="font-size: 11.5px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; gap: 6px; margin-top: 2px;">
                  <span id="plan-updated-time-display">Updated ${new Date(currentPlan.updated_at).toLocaleString()}</span>
                  <span class="plan-autosave-indicator" id="plan-autosave-status" style="display: inline-flex; align-items: center; gap: 3.5px; font-size: 10.5px; color: var(--text-muted); opacity: 0.85;">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <span id="plan-autosave-text">Synced</span>
                  </span>
                </div>
              </div>
            </div>

            <div class="plans-viewer-controls" style="display: flex; align-items: center; gap: 10px; flex-shrink: 0; flex-wrap: wrap;">
              <!-- Header Subject Link Picker -->
              <div class="plan-viewer-link-box" title="Assign or change subject link">
                <label for="plan-viewer-subject-select" class="plan-viewer-link-label">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                  </svg>
                  <span>Subject:</span>
                </label>
                <select id="plan-viewer-subject-select" class="plan-viewer-subject-select" data-plan-id="${currentPlan.id}">
                  <option value="">None (Unlinked)</option>
                  ${activeSubjects.map(s => `
                    <option value="${s.id}" ${currentPlan.subject_id === s.id ? 'selected' : ''}>
                      ${s.code ? `${s.code} — ` : ''}${s.name}
                    </option>
                  `).join('')}
                </select>
              </div>

              <div class="plans-viewer-actions" style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
                <button class="btn btn-ghost btn-sm btn-plan-action" id="btn-fullscreen-plan" title="Toggle Fullscreen View (Esc to exit)" aria-label="Toggle Fullscreen">
                  <svg class="fs-icon-expand" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                  </svg>
                  <svg class="fs-icon-compress" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: none;">
                    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
                  </svg>
                  <span class="btn-text fs-label-text">Fullscreen</span>
                </button>

                <button class="btn btn-ghost btn-sm btn-plan-action" id="btn-download-plan" title="Export/Download HTML File" aria-label="Export HTML">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  <span class="btn-text">Export HTML</span>
                </button>

                <button class="btn btn-ghost btn-sm btn-plan-action" id="btn-replace-plan" title="Replace / Update Study Plan" aria-label="Replace Plan">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  <span class="btn-text">Replace</span>
                </button>

                <button class="btn btn-ghost btn-sm btn-plan-action" id="btn-delete-plan" style="color: var(--danger);" title="Delete Study Plan" aria-label="Delete Plan">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                  <span class="btn-text">Delete</span>
                </button>
              </div>
            </div>
          </div>

          <div class="plan-frame-wrapper">
            <!-- Secure isolated sandbox: allow-scripts, allow-forms, allow-modals, allow-popups, allow-downloads (allow-same-origin omitted for origin isolation) -->
            <iframe id="sandboxed-plan-iframe"
                    class="sandboxed-plan-frame"
                    sandbox="allow-scripts allow-forms allow-modals allow-popups allow-downloads">
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
          <button class="modal-close close-plan-modal-btn">&times;</button>
        </div>

        <form id="plan-upload-form">
          <div class="modal-body">
            <input type="hidden" id="plan-edit-id" value="">

            <div class="form-group">
              <label class="form-label" for="plan-target-subject">Link to Subject (Optional)</label>
              <select id="plan-target-subject" class="form-select">
                <option value="">None (Unlinked)</option>
                ${activeSubjects.map(s => `
                  <option value="${s.id}">${s.code ? `${s.code} — ` : ''}${s.name}</option>
                `).join('')}
              </select>
              <span class="form-help">Optional: Link to an active course, or keep unlinked as a standalone study plan.</span>
            </div>

            <div class="form-group">
              <label class="form-label" for="plan-title-input">Plan Title *</label>
              <input type="text" id="plan-title-input" class="form-input" placeholder="e.g. CS101 Comprehensive 14-Week Roadmap" required>
            </div>

            <div class="form-group">
              <label class="form-label" for="plan-file-input">Upload .html File</label>
              <input type="file" id="plan-file-input" class="form-input" accept=".html,.htm" style="padding: 6px;">
            </div>

            <div class="form-group">
              <label class="form-label" for="plan-html-textarea">Or Paste Raw HTML Content *</label>
              <textarea id="plan-html-textarea" class="form-textarea" rows="6" placeholder="<!DOCTYPE html><html>...</html>" style="font-family: var(--font-mono); font-size: 11px;" required></textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary close-plan-modal-btn">Cancel</button>
            <button type="submit" class="btn btn-primary" id="btn-save-plan">Save & Render Plan</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div class="modal-overlay" id="plan-delete-modal">
      <div class="modal-card" style="max-width: 440px;">
        <div class="modal-header">
          <h3 class="modal-title" style="color: var(--danger);">Delete Study Plan</h3>
          <button class="modal-close close-delete-plan-modal-btn">&times;</button>
        </div>
        <div class="modal-body">
          <p style="color: var(--text-secondary); margin-bottom: 12px;">
            Are you sure you want to delete <strong id="delete-plan-name-display">this study plan</strong>?
          </p>
          <p style="font-size: 12px; color: var(--text-muted);">
            This will permanently remove the interactive study plan and its schedule. This action cannot be undone.
          </p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary close-delete-plan-modal-btn">Cancel</button>
          <button type="button" class="btn btn-primary" id="btn-confirm-delete-plan" style="background: var(--danger); border-color: var(--danger);">
            Delete Plan
          </button>
        </div>
      </div>
    </div>
  `;

  // Safely assign iframe.srcdoc as a direct DOM property to avoid HTML attribute escaping bugs and preserve scripts byte-for-byte
  const iframe = container.querySelector('#sandboxed-plan-iframe');
  if (iframe && currentPlan) {
    if (currentPlan.html_content !== undefined && currentPlan.html_content !== null) {
      iframe.srcdoc = prepareSandboxedHtml(currentPlan.html_content, currentPlan.id);
    } else {
      iframe.srcdoc = `<!DOCTYPE html><html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; color: #64748b; font-size: 13px; background: transparent;"><div style="display: flex; align-items: center; gap: 8px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg><span>Loading study plan...</span></div><style>@keyframes spin { 100% { transform: rotate(360deg); } }</style></body></html>`;
      const requestedId = currentPlan.id;
      store.loadStudyPlanContent(requestedId).then(content => {
        if (selectedPlanId === requestedId && iframe.isConnected) {
          iframe.srcdoc = prepareSandboxedHtml(content, requestedId);
        }
      });
    }
  }

  attachPlansEvents(container);
  return cleanupPlansView;
}

/**
 * Prepares the sandboxed HTML document:
 * 1. Resets default browser margins on html/body.
 * 2. Adds consistent outer padding (28px 32px) so content never sits flush against viewport edges.
 * 3. Injects a lightweight postMessage bridge to auto-save interactive state changes (checkboxes, inputs).
 */
function prepareSandboxedHtml(rawHtml, planId = '') {
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

  const autoSaveJs = `
<script id="aven-autosave-bridge">
(function() {
  var planId = ${JSON.stringify(planId || '')};
  var debounceTimer = null;

  function syncFormAttributes() {
    try {
      var checks = document.querySelectorAll('input[type="checkbox"], input[type="radio"]');
      for (var i = 0; i < checks.length; i++) {
        if (checks[i].checked) {
          checks[i].setAttribute('checked', '');
        } else {
          checks[i].removeAttribute('checked');
        }
      }

      var inputs = document.querySelectorAll('input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="reset"])');
      for (var j = 0; j < inputs.length; j++) {
        inputs[j].setAttribute('value', inputs[j].value || '');
      }

      var textareas = document.querySelectorAll('textarea');
      for (var k = 0; k < textareas.length; k++) {
        textareas[k].textContent = textareas[k].value || '';
      }

      var selects = document.querySelectorAll('select');
      for (var s = 0; s < selects.length; s++) {
        var options = selects[s].querySelectorAll('option');
        for (var o = 0; o < options.length; o++) {
          if (options[o].selected) {
            options[o].setAttribute('selected', '');
          } else {
            options[o].removeAttribute('selected');
          }
        }
      }

      var details = document.querySelectorAll('details');
      for (var d = 0; d < details.length; d++) {
        if (details[d].open) {
          details[d].setAttribute('open', '');
        } else {
          details[d].removeAttribute('open');
        }
      }
    } catch (err) {}
  }

  function serializeCleanHtml() {
    syncFormAttributes();
    var clone = document.documentElement.cloneNode(true);

    var injectedReset = clone.querySelector('#aven-iframe-reset');
    if (injectedReset) injectedReset.remove();
    var injectedScript = clone.querySelector('#aven-autosave-bridge');
    if (injectedScript) injectedScript.remove();

    var doctype = (document.doctype ? '<!DOCTYPE ' + document.doctype.name + '>' : '<!DOCTYPE html>') + '\\n';
    return doctype + clone.outerHTML;
  }

  function notifyParent() {
    try {
      if (!planId) return;
      var html = serializeCleanHtml();
      window.parent.postMessage({
        type: 'aven-plan-update',
        planId: planId,
        html: html
      }, '*');
    } catch (e) {}
  }

  function scheduleAutoSave() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(notifyParent, 400);
  }

  document.addEventListener('input', scheduleAutoSave, true);
  document.addEventListener('change', scheduleAutoSave, true);
  document.addEventListener('click', scheduleAutoSave, true);

  // Immediate synchronous flush on navigation, refresh, or tab hidden
  window.addEventListener('beforeunload', notifyParent);
  window.addEventListener('pagehide', notifyParent);
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') {
      notifyParent();
    }
  });
})();
</script>
`;

  const injectedCode = `${resetCss}${autoSaveJs}`;

  if (rawHtml.includes('</head>')) {
    return rawHtml.replace('</head>', `${injectedCode}</head>`);
  } else if (rawHtml.includes('<head>')) {
    return rawHtml.replace('<head>', `<head>${injectedCode}`);
  } else if (rawHtml.includes('<body>')) {
    return rawHtml.replace('<body>', `<body>${injectedCode}`);
  } else {
    return `<!DOCTYPE html><html><head><meta charset="utf-8">${injectedCode}</head><body>${rawHtml}</body></html>`;
  }
}

function attachPlansEvents(container) {
  // Switch selected plan
  container.querySelectorAll('.plan-subject-item').forEach(item => {
    item.addEventListener('click', () => {
      selectedPlanId = item.dataset.planId;
      renderPlansView(container);
    });
  });

  // Handle manual link/unlink changes (both on plan cards and inside the viewer header)
  container.querySelectorAll('.plan-quick-subject-select, #plan-viewer-subject-select').forEach(sel => {
    sel.addEventListener('click', (e) => e.stopPropagation());
    sel.addEventListener('mousedown', (e) => e.stopPropagation());
    sel.addEventListener('change', (e) => {
      e.stopPropagation();
      const pId = sel.dataset.planId;
      const subId = sel.value || null;
      if (!pId) return;

      store.updatePlanSubject(pId, subId);
      selectedPlanId = pId;

      const sub = subId ? store.getSubjectById(subId) : null;
      if (sub) {
        window.avenApp?.showToast(`Plan linked to ${sub.code || sub.name}`, 'success');
      } else {
        window.avenApp?.showToast('Plan unlinked from subject', 'info');
      }

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

  const openUploadModal = async (planToEdit = null) => {
    planForm.reset();
    if (planToEdit) {
      if (modalTitle) modalTitle.textContent = 'Replace / Update Study Plan';
      if (editIdInput) editIdInput.value = planToEdit.id;
      if (subjectSelect) subjectSelect.value = planToEdit.subject_id || '';
      if (titleInput) titleInput.value = planToEdit.title || '';
      if (planToEdit.html_content !== undefined && planToEdit.html_content !== null) {
        if (htmlTextarea) {
          htmlTextarea.value = planToEdit.html_content || '';
          htmlTextarea.disabled = false;
        }
      } else {
        if (htmlTextarea) {
          htmlTextarea.value = 'Loading study plan content...';
          htmlTextarea.disabled = true;
        }
        const content = await store.loadStudyPlanContent(planToEdit.id);
        if (htmlTextarea) {
          htmlTextarea.value = content || '';
          htmlTextarea.disabled = false;
        }
      }
    } else {
      if (modalTitle) modalTitle.textContent = 'Upload Interactive HTML Study Plan';
      if (editIdInput) editIdInput.value = '';
      if (subjectSelect) subjectSelect.value = '';
      if (htmlTextarea) htmlTextarea.disabled = false;
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

  // Delete Confirmation Modal Handling
  const deleteModal = container.querySelector('#plan-delete-modal');
  const deletePlanNameDisplay = container.querySelector('#delete-plan-name-display');

  container.querySelector('#btn-delete-plan')?.addEventListener('click', () => {
    if (!selectedPlanId) return;
    const plan = store.getStudyPlanById(selectedPlanId);
    if (!plan) return;

    if (deletePlanNameDisplay) {
      deletePlanNameDisplay.textContent = `"${plan.title}"`;
    }
    deleteModal?.classList.add('open');
  });

  container.querySelectorAll('.close-delete-plan-modal-btn').forEach(b => {
    b.addEventListener('click', () => {
      deleteModal?.classList.remove('open');
    });
  });

  container.querySelector('#btn-confirm-delete-plan')?.addEventListener('click', () => {
    if (selectedPlanId) {
      const planToDelete = store.getStudyPlanById(selectedPlanId);
      const planTitle = planToDelete ? planToDelete.title : 'Study plan';
      store.deleteStudyPlan(selectedPlanId);
      selectedPlanId = null;
      deleteModal?.classList.remove('open');
      window.avenApp?.showToast(`Deleted "${planTitle}"`, 'info');
      renderPlansView(container);
    }
  });

  // Download / Export Plan
  container.querySelector('#btn-download-plan')?.addEventListener('click', async () => {
    const currentPlan = selectedPlanId ? store.getStudyPlanById(selectedPlanId) : null;
    if (!currentPlan) return;

    let content = currentPlan.html_content;
    if (content === undefined || content === null) {
      content = await store.loadStudyPlanContent(currentPlan.id);
    }

    const blob = new Blob([content || ''], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentPlan.title.toLowerCase().replace(/[^a-z0-9]/gi, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
    window.avenApp?.showToast('Exported interactive HTML study plan', 'info');
  });

  // Fullscreen Viewer Toggle (Full Browser Window — leaves browser tabs & URL bar visible)
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

  const toggleFullscreen = () => {
    if (!viewerWrapper) return;
    const nowFullscreen = !viewerWrapper.classList.contains('is-fullscreen');
    updateFullscreenUI(nowFullscreen);
  };

  fullscreenBtn?.addEventListener('click', toggleFullscreen);

  // Esc key exits browser-level fullscreen overlay (singleton guarded)
  if (activePlanKeyDownListener) {
    document.removeEventListener('keydown', activePlanKeyDownListener);
    activePlanKeyDownListener = null;
  }
  const handleKeyDown = (evt) => {
    if (evt.key === 'Escape' && viewerWrapper?.classList.contains('is-fullscreen')) {
      updateFullscreenUI(false);
    }
  };
  document.addEventListener('keydown', handleKeyDown);
  activePlanKeyDownListener = handleKeyDown;

  // Listen for auto-save state snapshots from sandboxed iframe (deduplicated & debounced)
  if (activePlanMessageListener) {
    window.removeEventListener('message', activePlanMessageListener);
    activePlanMessageListener = null;
  }

  activePlanMessageListener = (event) => {
    if (!event.data || event.data.type !== 'aven-plan-update') return;
    const { planId, html } = event.data;
    if (!planId || !html) return;

    const plan = store.getStudyPlanById(planId);
    if (!plan) return;

    const statusTextEl = container.querySelector('#plan-autosave-text');
    const updatedTimeEl = container.querySelector('#plan-updated-time-display');

    if (statusTextEl) statusTextEl.textContent = 'Unsaved changes...';

    // Track pending save so unmount or page exit flushes immediately
    pendingPlanSave = {
      subject_id: plan.subject_id,
      title: plan.title,
      html: html,
      id: plan.id
    };

    if (autosaveDebounceTimer) {
      clearTimeout(autosaveDebounceTimer);
    }

    // Debounce save by 850ms so rapid keystrokes coalesce into a single Supabase write
    autosaveDebounceTimer = setTimeout(() => {
      autosaveDebounceTimer = null;
      if (!pendingPlanSave) return;
      const toSave = pendingPlanSave;
      pendingPlanSave = null;

      if (statusTextEl) statusTextEl.textContent = 'Saving...';
      const updatedPlan = store.saveStudyPlan(toSave.subject_id, toSave.title, toSave.html, toSave.id, true);

      if (statusTextEl) statusTextEl.textContent = 'Saved';
      if (updatedTimeEl && updatedPlan) {
        updatedTimeEl.textContent = `Updated ${new Date(updatedPlan.updated_at).toLocaleString()}`;
      }
      setTimeout(() => {
        if (statusTextEl && statusTextEl.textContent === 'Saved') {
          statusTextEl.textContent = 'Synced';
        }
      }, 2000);
    }, 850);
  };

  window.addEventListener('message', activePlanMessageListener);

  // Sync state tracking and retry control
  const updateSyncIndicator = (syncState) => {
    const statusTextEl = container.querySelector('#plan-autosave-text');
    const statusBoxEl = container.querySelector('#plan-autosave-status');
    if (!statusTextEl || !statusBoxEl) return;

    if (syncState.status === 'error') {
      statusTextEl.textContent = 'Sync failed — Click to retry';
      statusBoxEl.style.color = 'var(--danger)';
      statusBoxEl.style.cursor = 'pointer';
      statusBoxEl.title = syncState.error || 'Cloud sync failed. Click to retry syncing this plan.';
    } else if (syncState.status === 'saving') {
      statusTextEl.textContent = 'Syncing...';
      statusBoxEl.style.color = 'var(--text-muted)';
      statusBoxEl.style.cursor = 'default';
      statusBoxEl.title = 'Writing changes to Supabase Cloud...';
    } else if (syncState.status === 'synced') {
      statusTextEl.textContent = 'Synced';
      statusBoxEl.style.color = 'var(--text-muted)';
      statusBoxEl.style.cursor = 'default';
      statusBoxEl.title = 'Plan is synchronized with Supabase Cloud.';
    } else if (syncState.status === 'offline') {
      statusTextEl.textContent = 'Offline';
      statusBoxEl.style.color = 'var(--text-muted)';
      statusBoxEl.style.cursor = 'default';
      statusBoxEl.title = 'Offline mode. Changes saved locally.';
    }
  };

  updateSyncIndicator(store.getConnectionStatus());

  activeSyncStatusListener = (state) => updateSyncIndicator(state);
  activeSyncConnListener = (conn) => updateSyncIndicator(conn);
  events.on('sync:status', activeSyncStatusListener);
  events.on('sync:connection', activeSyncConnListener);

  container.querySelector('#plan-autosave-status')?.addEventListener('click', () => {
    if (selectedPlanId) {
      window.avenApp?.showToast('Retrying cloud sync for study plan...', 'info');
      store.retryPlanSync(selectedPlanId);
    } else {
      store.syncAllPlansToCloud();
    }
  });
}
