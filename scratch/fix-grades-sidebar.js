import fs from 'fs';

// 1. Update js/grades.js to pass --item-color
let gradesJs = fs.readFileSync('js/grades.js', 'utf-8');

const oldRenderSubjectItem = `      <div class="grades-subject-item \${isSelected ? 'active' : ''}" data-id="\${sub.id}">`;
const newRenderSubjectItem = `      <div class="grades-subject-item \${isSelected ? 'active' : ''}" data-id="\${sub.id}" style="--item-color: \${sub.color || '#505537'};">`;

gradesJs = gradesJs.replace(oldRenderSubjectItem, newRenderSubjectItem);

fs.writeFileSync('js/grades.js', gradesJs, 'utf-8');

// 2. Update css/style.css for grades-subject-item.active and grades-sort-popover .popover-item.active
let css = fs.readFileSync('css/style.css', 'utf-8');

const oldGradesSidebarCss = `.grades-sort-popover .popover-item.active {
  color: var(--accent);
  font-weight: 600;
  background: var(--accent-surface);
}

.grades-subject-item {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition);
  border: none;
}

.grades-subject-item:hover {
  background: var(--bg-surface-hover);
}

.grades-subject-item.active {
  background: var(--bg-surface-elevated);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.035);
}`;

const newGradesSidebarCss = `.grades-sort-popover .popover-item.active {
  color: var(--text-inverse) !important;
  font-weight: 700;
  background: var(--accent) !important;
  border-radius: var(--radius-sm);
}

.grades-subject-item {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.16s ease;
  border: 1.5px solid transparent;
  background: transparent;
  position: relative;
  box-sizing: border-box;
}

.grades-subject-item:hover:not(.active) {
  background: var(--bg-surface-hover);
}

.grades-subject-item.active {
  background: rgba(80, 85, 55, 0.10);
  border-color: var(--item-color, var(--olive-deep));
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
}

[data-theme="dark"] .grades-subject-item.active {
  background: rgba(168, 176, 130, 0.14);
  border-color: var(--item-color, var(--olive-mid));
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
}

.grades-subject-item.active .grades-item-name {
  font-weight: 700;
  color: var(--text-primary);
}`;

css = css.replace(oldGradesSidebarCss, newGradesSidebarCss);

fs.writeFileSync('css/style.css', css, 'utf-8');
console.log('Successfully updated Grades sidebar selected state and sort dropdown contrast!');
