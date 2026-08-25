import fs from 'fs';

// 1. UPDATE js/subjects.js
let subjectsJs = fs.readFileSync('js/subjects.js', 'utf-8');

const oldCardTemplate = `    <div class="subject-card \${sub.archived ? 'archived' : ''}" data-id="\${sub.id}">
      <div class="subject-card-header-row">
        <!-- Circular Icon Badge (Reference Style) -->
        <div class="subject-icon-badge" style="background: rgba(80, 85, 55, 0.09); color: var(--olive-deep);">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
        </div>

        <div class="subject-title-area">
          \${sub.code ? \`<span class="subject-code-tag">\${sub.code}</span>\` : ''}
          <h4 class="subject-card-name">\${sub.name}</h4>
          \${sub.instructor ? \`
            <span class="subject-card-instructor">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              \${sub.instructor}
            </span>
          \` : ''}
        </div>
      </div>

      <div class="subject-meta-pills">
        <span class="subject-pill-tag">\${sub.year_level} · \${semAbbr}</span>
        \${getArchiveReasonBadge(sub)}
      </div>

      <!-- Clean Minimalist Metrics Strip -->
      <div class="subject-metrics-strip">
        <div class="subject-metric-col">
          <span class="subject-metric-lbl">Study Time</span>
          <span class="subject-metric-val">\${hoursFormatted}</span>
        </div>
        <div class="subject-metric-col">
          <span class="subject-metric-lbl">Standing</span>
          <span class="subject-metric-val">\${gradeStats.summaryLine}</span>
        </div>
        <div class="subject-metric-col">
          <span class="subject-metric-lbl">Plan</span>
          <span class="subject-metric-val">\${plan ? 'Ready' : '—'}</span>
        </div>
      </div>

      <!-- Pill Action Buttons -->
      <div class="subject-card-actions">
        \${!sub.archived ? \`<button class="btn btn-secondary btn-sm btn-edit-sub" data-id="\${sub.id}">Edit</button>\` : ''}
        <button class="btn btn-secondary btn-sm btn-archive-sub" data-id="\${sub.id}">
          \${sub.archived ? 'Unarchive' : 'Archive'}
        </button>
        <button class="btn btn-danger btn-sm btn-delete-sub" data-id="\${sub.id}">Delete</button>
      </div>
    </div>`;

const newCardTemplate = `    <div class="subject-card \${sub.archived ? 'archived' : ''}" data-id="\${sub.id}">
      <div class="subject-card-header-row">
        <!-- Circular Icon Badge (Reference Style) -->
        <div class="subject-icon-badge" style="background: rgba(80, 85, 55, 0.09); color: var(--olive-deep);">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
        </div>

        <div class="subject-title-area">
          <span class="subject-code-tag" style="\${!sub.code ? 'visibility: hidden;' : ''}">\${sub.code || '&nbsp;'}</span>
          <h4 class="subject-card-name" title="\${sub.name}">\${sub.name}</h4>
          \${sub.instructor ? \`
            <span class="subject-card-instructor">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              \${sub.instructor}
            </span>
          \` : '<span class="subject-card-instructor is-empty" aria-hidden="true">&nbsp;</span>'}
        </div>
      </div>

      <div class="subject-meta-pills">
        <span class="subject-pill-tag">\${sub.year_level} · \${semAbbr}</span>
        \${getArchiveReasonBadge(sub)}
      </div>

      <!-- Clean Minimalist Metrics Strip -->
      <div class="subject-metrics-strip">
        <div class="subject-metric-col">
          <span class="subject-metric-lbl">Study Time</span>
          <span class="subject-metric-val">\${hoursFormatted}</span>
        </div>
        <div class="subject-metric-col">
          <span class="subject-metric-lbl">Standing</span>
          <span class="subject-metric-val">\${gradeStats.summaryLine}</span>
        </div>
        <div class="subject-metric-col">
          <span class="subject-metric-lbl">Plan</span>
          <span class="subject-metric-val">\${plan ? 'Ready' : '—'}</span>
        </div>
      </div>

      <!-- Pill Action Buttons (Pinned to bottom baseline) -->
      <div class="subject-card-actions">
        \${!sub.archived ? \`<button class="btn btn-secondary btn-sm btn-edit-sub" data-id="\${sub.id}">Edit</button>\` : ''}
        <button class="btn btn-secondary btn-sm btn-archive-sub" data-id="\${sub.id}">
          \${sub.archived ? 'Unarchive' : 'Archive'}
        </button>
        <button class="btn btn-danger btn-sm btn-delete-sub" data-id="\${sub.id}">Delete</button>
      </div>
    </div>`;

subjectsJs = subjectsJs.replace(oldCardTemplate, newCardTemplate);
fs.writeFileSync('js/subjects.js', subjectsJs, 'utf-8');

// 2. UPDATE css/style.css
let css = fs.readFileSync('css/style.css', 'utf-8');

// Increase dark mode card border visibility to 12% subtle crisp light edge
css = css.replace(
  `--border-card: 1px solid rgba(255, 255, 255, 0.08);`,
  `--border-card: 1px solid rgba(255, 255, 255, 0.12);`
);

// Normalize subject-card layout and heights in CSS
const oldSubjectCardCss = `.subject-card {
  --sub-color: #505537;
  background: var(--bg-surface);
  border: var(--border-card);
  border-radius: var(--radius-xl);
  padding: 22px 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  position: relative;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-sizing: border-box;
}

.subject-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.09);
}

.subject-card-header-row {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.subject-icon-badge {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  background: rgba(80, 85, 55, 0.08);
  color: var(--olive-deep);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
  flex-shrink: 0;
}

.subject-title-area {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
  min-width: 0;
}

.subject-code-tag {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.subject-card-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.3;
  margin: 0;
}

.subject-card-instructor {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.subject-meta-pills {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.subject-pill-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: var(--radius-full);
  background: var(--bg-surface-hover);
  color: var(--text-secondary);
}

.subject-metrics-strip {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 12px 14px;
  background: var(--bg-surface-hover);
  border-radius: var(--radius-lg);
}

.subject-metric-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.subject-metric-lbl {
  font-size: 10.5px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.subject-metric-val {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  font-family: var(--font-numeric);
}

.subject-card-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-top: -4px;
}`;

const newSubjectCardCss = `.subject-card {
  --sub-color: #505537;
  background: var(--bg-surface);
  border: var(--border-card);
  border-radius: var(--radius-xl);
  padding: 22px 24px;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 290px;
  gap: 16px;
  position: relative;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-sizing: border-box;
}

.subject-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.09);
}

.subject-card-header-row {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.subject-icon-badge {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  background: rgba(80, 85, 55, 0.08);
  color: var(--olive-deep);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
  flex-shrink: 0;
}

.subject-title-area {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.subject-code-tag {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  min-height: 14px;
  line-height: 1.2;
}

.subject-card-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.3;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  overflow: hidden;
  min-height: 2.6em; /* Reserves identical 2-line vertical space across all cards */
}

.subject-card-instructor {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 18px;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.subject-card-instructor.is-empty {
  visibility: hidden;
  user-select: none;
}

.subject-meta-pills {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  min-height: 24px;
}

.subject-pill-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: var(--radius-full);
  background: var(--bg-surface-hover);
  color: var(--text-secondary);
}

.subject-metrics-strip {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 12px 14px;
  background: var(--bg-surface-hover);
  border-radius: var(--radius-lg);
}

.subject-metric-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.subject-metric-lbl {
  font-size: 10.5px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.subject-metric-val {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  font-family: var(--font-numeric);
}

.subject-card-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-top: auto; /* Pins action buttons to the exact bottom baseline */
  padding-top: 4px;
}`;

css = css.replace(oldSubjectCardCss, newSubjectCardCss);

// Ensure tool-card has border: var(--border-card)
css = css.replace(
  `.tool-card {\n  background: var(--bg-surface);\n  border: none;`,
  `.tool-card {\n  background: var(--bg-surface);\n  border: var(--border-card);`
);

// Ensure browser-panel-content has border: var(--border-card)
css = css.replace(
  `.browser-panel-content {\n  background: var(--bg-surface);\n  border: none;`,
  `.browser-panel-content {\n  background: var(--bg-surface);\n  border: var(--border-card);`
);

fs.writeFileSync('css/style.css', css, 'utf-8');

console.log('Successfully normalized subject card heights and extended subtle card border to dark mode!');
