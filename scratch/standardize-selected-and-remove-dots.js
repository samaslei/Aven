import fs from 'fs';

// =========================================================================
// 1. UPDATE js/grades.js
// Remove colored dot from sidebar item, use standard active class
// =========================================================================
let gradesJs = fs.readFileSync('js/grades.js', 'utf-8');

const oldGradesRenderSubjectItem = `  const renderSubjectItem = (sub) => {
    const subGrade = store.calculateSubjectGrade(sub.id);
    const isSelected = sub.id === selectedSubjectId;
    const standingClass = getStandingClass(subGrade.overallPercentage);
    return \`
      <div class="grades-subject-item \${isSelected ? 'active' : ''}" data-id="\${sub.id}" style="--item-color: \${sub.color || '#505537'};">
        <div class="grades-item-top">
          <span class="grades-item-dot" style="background: \${sub.color || '#505537'};"></span>
          <span class="grades-item-name">\${sub.name}</span>
        </div>
        <div class="grades-item-bottom">
          \${sub.code ? \`<span class="subject-list-code" style="font-size: 10px; padding: 1px 5px;">\${sub.code}</span>\` : \`<span></span>\`}
          <div class="subject-standing-pill \${standingClass}" style="font-size: 11px;">
            <span class="standing-dot" style="background: currentColor; width: 4.5px; height: 4.5px;"></span>
            <span>\${subGrade.summaryLine}</span>
          </div>
        </div>
      </div>
    \`;
  };`;

const newGradesRenderSubjectItem = `  const renderSubjectItem = (sub) => {
    const subGrade = store.calculateSubjectGrade(sub.id);
    const isSelected = sub.id === selectedSubjectId;
    const standingClass = getStandingClass(subGrade.overallPercentage);
    return \`
      <div class="grades-subject-item \${isSelected ? 'active' : ''}" data-id="\${sub.id}">
        <div class="grades-item-top">
          <span class="grades-item-name">\${sub.name}</span>
        </div>
        <div class="grades-item-bottom">
          \${sub.code ? \`<span class="subject-list-code" style="font-size: 10px; padding: 1px 5px;">\${sub.code}</span>\` : \`<span></span>\`}
          <div class="subject-standing-pill \${standingClass}" style="font-size: 11px;">
            <span class="standing-dot" style="background: currentColor; width: 4.5px; height: 4.5px;"></span>
            <span>\${subGrade.summaryLine}</span>
          </div>
        </div>
      </div>
    \`;
  };`;

gradesJs = gradesJs.replace(oldGradesRenderSubjectItem, newGradesRenderSubjectItem);
fs.writeFileSync('js/grades.js', gradesJs, 'utf-8');

// =========================================================================
// 2. UPDATE js/plans.js
// Remove colored dots from Study Plans sidebar and header
// =========================================================================
let plansJs = fs.readFileSync('js/plans.js', 'utf-8');

// Sidebar course syllabus item dot
plansJs = plansJs.replace(
  `<div style="display: flex; align-items: center; gap: 8px;">\n                      <span style="width: 8px; height: 8px; border-radius: 50%; background-color: \${subject.color || '#6366f1'}; flex-shrink: 0;"></span>\n                      <strong`,
  `<div style="display: flex; align-items: center; gap: 8px;">\n                      <strong`
);

// Fix padding in syllabus sub-line
plansJs = plansJs.replace(
  `<div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted); padding-left: 16px;">`,
  `<div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted);">`
);

plansJs = plansJs.replace(
  `<div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted); padding-left: 21px;">`,
  `<div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted);">`
);

// Viewer header subject color dot -> clean syllabus icon
plansJs = plansJs.replace(
  `\${currentSubject ? \`\n                <span style="width: 10px; height: 10px; border-radius: 50%; background-color: \${currentSubject.color || '#6366f1'}; flex-shrink: 0;"></span>\n              \` : \`\n                <span style="display: flex; align-items: center; color: var(--accent); flex-shrink: 0;">`,
  `\${currentSubject ? \`\n                <span style="display: flex; align-items: center; color: var(--accent); flex-shrink: 0;">\n                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">\n                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>\n                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>\n                  </svg>\n                </span>\n              \` : \`\n                <span style="display: flex; align-items: center; color: var(--accent); flex-shrink: 0;">`
);

fs.writeFileSync('js/plans.js', plansJs, 'utf-8');

// =========================================================================
// 3. UPDATE js/subjects.js
// Remove color bars from bulk archive modal and list view
// =========================================================================
let subjectsJs = fs.readFileSync('js/subjects.js', 'utf-8');

// Bulk archive modal color bar
subjectsJs = subjectsJs.replace(
  `<span class="subject-color-bar" style="background-color: \${sub.color || '#6366f1'}; height: 16px; width: 3px; border-radius: 2px;"></span>`,
  ``
);

// List view table row color bar
subjectsJs = subjectsJs.replace(
  `<div class="subject-color-bar" style="background-color: \${sub.color || '#6366f1'}; height: 22px; width: 5px; border-radius: var(--radius-full); flex-shrink: 0; margin-top: 2px;"></div>`,
  ``
);

// Hide the unused subject color swatch picker in create/edit modal
subjectsJs = subjectsJs.replace(
  `<div class="form-group">\n              <label class="form-label">Subject Color</label>\n              <div class="color-swatches" id="sub-color-swatches">\n                \${DEFAULT_COLOR_SWATCHES.map((hex, i) => \`\n                  <div class="color-swatch-opt \${i === 0 ? 'active' : ''}" data-color="\${hex}" style="background-color: \${hex};"></div>\n                \`).join('')}\n              </div>\n              <input type="hidden" id="sub-form-color" value="\${DEFAULT_COLOR_SWATCHES[0]}">\n            </div>`,
  `<input type="hidden" id="sub-form-color" value="\${DEFAULT_COLOR_SWATCHES[0]}">`
);

fs.writeFileSync('js/subjects.js', subjectsJs, 'utf-8');

// =========================================================================
// 4. UPDATE css/style.css
// Standardize selected-state across all lists (Grades sidebar, Plans sidebar, Settings)
// =========================================================================
let css = fs.readFileSync('css/style.css', 'utf-8');

// Standardized Active State CSS for selectable lists
const oldGradesCss = `.grades-subject-item.active {
  background: rgba(80, 85, 55, 0.10);
  border-color: var(--item-color, var(--olive-deep));
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
}

[data-theme="dark"] .grades-subject-item.active {
  background: rgba(168, 176, 130, 0.14);
  border-color: var(--item-color, var(--olive-mid));
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
}`;

const newGradesCss = `.grades-subject-item.active {
  background: rgba(80, 85, 55, 0.10);
  border-color: var(--accent);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
}

[data-theme="dark"] .grades-subject-item.active {
  background: rgba(168, 176, 130, 0.14);
  border-color: var(--accent);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
}`;

css = css.replace(oldGradesCss, newGradesCss);

// Standardize .plan-subject-item.active in Plans Sidebar
const oldPlanItemCss = `.plan-subject-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition);
  border: none;
}

.plan-subject-item:hover {
  background: var(--bg-surface-hover);
}

.plan-subject-item.active {
  background: var(--bg-surface-elevated);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.035);
}`;

const newPlanItemCss = `.plan-subject-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.16s ease;
  border: 1.5px solid transparent;
  background: transparent;
  position: relative;
  box-sizing: border-box;
}

.plan-subject-item:hover:not(.active) {
  background: var(--bg-surface-hover);
}

.plan-subject-item.active {
  background: rgba(80, 85, 55, 0.10);
  border-color: var(--accent);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
}

[data-theme="dark"] .plan-subject-item.active {
  background: rgba(168, 176, 130, 0.14);
  border-color: var(--accent);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
}

.plan-subject-item.active strong {
  font-weight: 700;
  color: var(--text-primary);
}`;

css = css.replace(oldPlanItemCss, newPlanItemCss);

// Remove unused .grades-item-dot CSS rule
css = css.replace(
  `.grades-item-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 5px;
}`,
  `/* (grades-item-dot removed — standing conveyed by text/score only) */`
);

fs.writeFileSync('css/style.css', css, 'utf-8');
console.log('Successfully removed subject color dots and standardized selected-state across all lists!');
