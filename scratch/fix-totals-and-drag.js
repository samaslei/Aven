import fs from 'fs';

// 1. UPDATE js/grades.js
let gradesJs = fs.readFileSync('js/grades.js', 'utf-8');

// Update Totals row markup in js/grades.js
const oldTotalsRow = `                      <tfoot>
                        <tr class="cat-totals-row">
                          <td style="text-align: left; font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em;">
                            TOTAL: \${totalScore.toFixed(1)} / \${totalOutOf.toFixed(1)}
                          </td>
                          <td style="text-align: center; font-family: var(--font-numeric); font-variant-numeric: tabular-nums; font-size: 12px; color: var(--text-muted); font-weight: 600;">
                            \${totalScore.toFixed(1)}
                          </td>
                          <td style="text-align: center; font-family: var(--font-numeric); font-variant-numeric: tabular-nums; font-size: 12px; color: var(--text-muted); font-weight: 600;">
                            \${totalOutOf.toFixed(1)}
                          </td>
                          <td style="text-align: center; font-family: var(--font-numeric); font-variant-numeric: tabular-nums; font-size: 12px; font-weight: 700; color: \${getStandingColor(catPct)};">
                            \${catPct !== '—' ? \`\${catPct}%\` : '—'}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>`;

const newTotalsRow = `                      <tfoot>
                        <tr class="cat-totals-row">
                          <td style="text-align: left;">
                            <span class="cell-value-text"><strong>TOTAL</strong></span>
                          </td>
                          <td style="text-align: center;">
                            <span class="cell-value-text mono-num" style="font-family: var(--font-numeric); font-variant-numeric: tabular-nums; font-weight: 600;">\${totalScore.toFixed(1)}</span>
                          </td>
                          <td style="text-align: center;">
                            <span class="cell-value-text mono-num" style="font-family: var(--font-numeric); font-variant-numeric: tabular-nums; font-weight: 600;">\${totalOutOf.toFixed(1)}</span>
                          </td>
                          <td style="text-align: center;">
                            <span class="entry-pct-text" style="color: \${getStandingColor(catPct)}; font-weight: 700; font-family: var(--font-numeric); font-variant-numeric: tabular-nums;">
                              \${catPct !== '—' ? \`\${catPct}%\` : '—'}
                            </span>
                          </td>
                          <td style="text-align: right;"></td>
                        </tr>
                      </tfoot>`;

gradesJs = gradesJs.replace(oldTotalsRow, newTotalsRow);

// Update Drag-and-Drop listener to target category-breakdown-list and category-breakdown-section
const oldDragAndDrop = `  // Drag-and-Drop Category Reordering with smooth FLIP animation
  const categoryList = container.querySelector('.category-list');
  if (categoryList) {
    let draggedCard = null;
    let isHandleGrabbed = false;

    // Track grab on drag handle specifically
    categoryList.addEventListener('mousedown', (e) => {
      const handle = e.target.closest('.cat-drag-handle');
      if (handle) {
        isHandleGrabbed = true;
        const card = handle.closest('.category-card');
        if (card) card.setAttribute('draggable', 'true');
      } else {
        isHandleGrabbed = false;
      }
    });

    document.addEventListener('mouseup', () => {
      isHandleGrabbed = false;
      if (categoryList) {
        categoryList.querySelectorAll('.category-card').forEach(c => c.removeAttribute('draggable'));
      }
    }, { once: true });

    categoryList.addEventListener('dragstart', (e) => {
      const card = e.target.closest('.category-card');
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

      const targetCard = e.target.closest('.category-card');
      if (!targetCard || targetCard === draggedCard) {
        return;
      }

      const cards = Array.from(categoryList.querySelectorAll('.category-card'));
      const draggedIdx = cards.indexOf(draggedCard);
      const targetIdx = cards.indexOf(targetCard);
      if (draggedIdx === -1 || targetIdx === -1) return;

      const rect = targetCard.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      let isInsertBefore;
      if (targetIdx > draggedIdx) {
        // Dragging forward/downward
        isInsertBefore = (e.clientY < centerY - 15) && (e.clientX < centerX);
      } else {
        // Dragging backward/upward
        isInsertBefore = (e.clientY < centerY + 15) || (e.clientX < centerX);
      }

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

      // 3. FLIP - Invert & Play (supports both X and Y grid movement)
      const updatedCards = Array.from(categoryList.querySelectorAll('.category-card'));
      updatedCards.forEach(c => {
        const first = firstRects.get(c);
        if (!first) return;
        const last = c.getBoundingClientRect();
        const deltaX = first.left - last.left;
        const deltaY = first.top - last.top;

        if (deltaX !== 0 || deltaY !== 0) {
          c.style.transform = \`translate(\${deltaX}px, \${deltaY}px)\`;
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

      const cards = Array.from(categoryList.querySelectorAll('.category-card'));
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
  }`;

const newDragAndDrop = `  // Drag-and-Drop Category Reordering with smooth FLIP animation
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
          c.style.transform = \`translate(\${deltaX}px, \${deltaY}px)\`;
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
  }`;

gradesJs = gradesJs.replace(oldDragAndDrop, newDragAndDrop);
fs.writeFileSync('js/grades.js', gradesJs, 'utf-8');

// 2. UPDATE css/style.css
let css = fs.readFileSync('css/style.css', 'utf-8');

// Ensure totals row styling matches entry rows exactly without distinct background
css = css.replace(
  `.grade-entries-table .cat-totals-row td {
  background: var(--bg-surface-hover);
  border-top: 1px solid var(--border-default);
  padding: 9px 16px;
}`,
  `.grade-entries-table .cat-totals-row td {
  background: transparent !important;
  border-top: 1px solid var(--border-subtle);
  border-bottom: none;
  padding: 11px 16px;
  color: var(--text-primary);
  font-size: 13px;
}`
);

fs.writeFileSync('css/style.css', css, 'utf-8');

console.log('Successfully updated Totals row to match entry rows and restored category drag-and-drop reordering!');
