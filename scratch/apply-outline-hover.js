import fs from 'fs';

let css = fs.readFileSync('css/style.css', 'utf-8');

// 1. Update .category-breakdown-section and header hover
const oldCategorySection = `.category-breakdown-section {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.category-breakdown-section:hover {
  border-color: var(--border-default);
}

.category-breakdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 18px;
  background: var(--bg-surface);
  cursor: pointer;
  user-select: none;
  transition: background-color 0.15s ease;
  gap: 12px;
}

.category-breakdown-header:hover {
  background: var(--bg-surface-hover);
}`;

const newCategorySection = `.category-breakdown-section {
  background: var(--bg-surface);
  border: 1.5px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.category-breakdown-section:hover {
  border-color: var(--accent);
  box-shadow: 0 2px 10px rgba(80, 85, 55, 0.08);
}

[data-theme="dark"] .category-breakdown-section:hover {
  border-color: var(--accent);
  box-shadow: 0 2px 10px rgba(168, 176, 130, 0.12);
}

.category-breakdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 18px;
  background: var(--bg-surface);
  cursor: pointer;
  user-select: none;
  transition: background-color 0.15s ease;
  gap: 12px;
}

.category-breakdown-header:hover {
  background: transparent;
}`;

css = css.replace(oldCategorySection, newCategorySection);

// 2. Update .grades-subject-item hover to outline
const oldSubjectItemHover = `.grades-subject-item:hover:not(.active) {
  background: var(--bg-surface-hover);
}`;

const newSubjectItemHover = `.grades-subject-item:hover:not(.active) {
  background: transparent;
  border-color: var(--border-strong);
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
}`;

css = css.replace(oldSubjectItemHover, newSubjectItemHover);

fs.writeFileSync('css/style.css', css, 'utf-8');

console.log('Successfully replaced background hover highlight with outline glow in Grades page!');
