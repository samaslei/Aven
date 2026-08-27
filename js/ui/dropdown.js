/**
 * Aven - Custom Searchable Dropdown Component
 * Features: Search-as-you-type, keyboard navigation, popover styling, theme-aware.
 */

/**
 * Builds HTML for a custom searchable subject dropdown.
 * @param {Object} options
 * @param {string} options.id - Element ID for hidden input & wrapper
 * @param {string} options.selectedId - Currently selected subject ID
 * @param {Array<{ id: string, name: string }>} options.subjects - List of subjects
 * @param {boolean} [options.includeGeneral=true] - Whether to include General Study option
 * @param {string} [options.generalLabel='General Study'] - Label for general option
 * @param {string} [options.searchPlaceholder='Search subjects...'] - Search input placeholder
 * @param {string} [options.customClass=''] - Extra classes for trigger
 * @returns {string} HTML string
 */
export function renderCustomSubjectDropdown({
  id,
  selectedId = '',
  subjects = [],
  includeGeneral = true,
  generalLabel = 'General Study',
  searchPlaceholder = 'Search subject...',
  customClass = ''
}) {
  const selectedSubject = selectedId ? subjects.find(s => s.id === selectedId) : null;
  const triggerText = selectedSubject ? selectedSubject.name : generalLabel;

  const items = [];
  if (includeGeneral) {
    items.push({
      id: '',
      name: generalLabel,
      isGeneral: true
    });
  }
  subjects.forEach(s => items.push(s));

  const optionsHtml = items.map(item => {
    const isSelected = item.id === (selectedId || '');

    return `
      <div class="custom-dropdown-option ${isSelected ? 'selected' : ''}"
           data-value="${item.id}"
           data-name="${item.name}"
           role="option"
           aria-selected="${isSelected}">
        <div class="custom-dd-option-left">
          <span class="custom-dd-option-name" title="${item.name}">${item.name}</span>
        </div>
        ${isSelected ? `
          <svg class="custom-dd-check" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        ` : ''}
      </div>
    `;
  }).join('');

  return `
    <div class="custom-dropdown ${customClass}" id="${id}-wrap" data-dropdown-id="${id}">
      <input type="hidden" id="${id}" name="${id}" value="${selectedId || ''}">
      
      <button type="button" class="custom-dropdown-trigger" id="${id}-trigger" aria-haspopup="listbox" aria-expanded="false">
        <div class="custom-dropdown-trigger-content">
          <span class="custom-dropdown-trigger-text">${triggerText}</span>
        </div>
        <svg class="custom-dropdown-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      <div class="custom-dropdown-menu" id="${id}-menu" role="listbox">
        <div class="custom-dropdown-search-box">
          <svg class="custom-dropdown-search-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" class="custom-dropdown-search-input" placeholder="${searchPlaceholder}" autocomplete="off">
        </div>

        <div class="custom-dropdown-options-list" tabindex="-1">
          ${optionsHtml}
          <div class="custom-dropdown-empty" style="display: none;">No matching subjects</div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Initializes interactive behavior on a custom dropdown component.
 * @param {HTMLElement} wrap - Wrapper element (.custom-dropdown)
 * @param {Function} [onChange] - Callback fired when selection changes: (value, itemData) => void
 */
export function initCustomDropdown(wrap, onChange) {
  if (!wrap) return;

  const trigger = wrap.querySelector('.custom-dropdown-trigger');
  const menu = wrap.querySelector('.custom-dropdown-menu');
  const hiddenInput = wrap.querySelector('input[type="hidden"]');
  const searchInput = wrap.querySelector('.custom-dropdown-search-input');
  const emptyNotice = wrap.querySelector('.custom-dropdown-empty');
  const options = wrap.querySelectorAll('.custom-dropdown-option');

  if (!trigger || !menu || !hiddenInput) return;

  function openDropdown() {
    // Close other open custom dropdowns first
    document.querySelectorAll('.custom-dropdown.open').forEach(d => {
      if (d !== wrap) closeDropdownElement(d);
    });

    wrap.classList.add('open');
    trigger.setAttribute('aria-expanded', 'true');
    if (searchInput) {
      searchInput.value = '';
      filterOptions('');
      setTimeout(() => searchInput.focus(), 30);
    }
  }

  function closeDropdown() {
    wrap.classList.remove('open');
    trigger.setAttribute('aria-expanded', 'false');
    options.forEach(opt => opt.classList.remove('focused'));
  }

  function filterOptions(query) {
    const q = (query || '').toLowerCase().trim();
    let visibleCount = 0;

    options.forEach(opt => {
      const name = (opt.dataset.name || '').toLowerCase();
      const matches = !q || name.includes(q);
      opt.style.display = matches ? 'flex' : 'none';
      if (matches) visibleCount++;
    });

    if (emptyNotice) {
      emptyNotice.style.display = visibleCount === 0 ? 'block' : 'none';
    }
  }

  // Trigger button click
  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (wrap.classList.contains('open')) {
      closeDropdown();
    } else {
      openDropdown();
    }
  });

  // Search input typing
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      filterOptions(e.target.value);
    });

    searchInput.addEventListener('keydown', (e) => {
      const visible = Array.from(options).filter(o => o.style.display !== 'none');
      const focusedIdx = visible.findIndex(o => o.classList.contains('focused'));

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIdx = focusedIdx < visible.length - 1 ? focusedIdx + 1 : 0;
        visible.forEach(o => o.classList.remove('focused'));
        if (visible[nextIdx]) {
          visible[nextIdx].classList.add('focused');
          visible[nextIdx].scrollIntoView({ block: 'nearest' });
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIdx = focusedIdx > 0 ? focusedIdx - 1 : visible.length - 1;
        visible.forEach(o => o.classList.remove('focused'));
        if (visible[prevIdx]) {
          visible[prevIdx].classList.add('focused');
          visible[prevIdx].scrollIntoView({ block: 'nearest' });
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (focusedIdx >= 0 && visible[focusedIdx]) {
          selectOption(visible[focusedIdx]);
        } else if (visible.length === 1) {
          selectOption(visible[0]);
        }
      } else if (e.key === 'Escape') {
        closeDropdown();
        trigger.focus();
      }
    });
  }

  function selectOption(opt) {
    const val = opt.dataset.value;
    const name = opt.dataset.name;

    hiddenInput.value = val;
    hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));

    // Update trigger UI
    const triggerText = trigger.querySelector('.custom-dropdown-trigger-text');
    if (triggerText) {
      triggerText.textContent = name;
    }

    // Update selected class
    options.forEach(o => {
      const isSel = o === opt;
      o.classList.toggle('selected', isSel);
      o.setAttribute('aria-selected', isSel ? 'true' : 'false');
      const check = o.querySelector('.custom-dd-check');
      if (isSel && !check) {
        o.insertAdjacentHTML('beforeend', `
          <svg class="custom-dd-check" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        `);
      } else if (!isSel && check) {
        check.remove();
      }
    });

    closeDropdown();
    trigger.focus();

    if (typeof onChange === 'function') {
      onChange(val, { name });
    }
  }

  // Click on option
  options.forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      selectOption(opt);
    });
  });

  // Global click outside listener
  if (!window._customDropdownGlobalListenerAdded) {
    window._customDropdownGlobalListenerAdded = true;
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.custom-dropdown')) {
        document.querySelectorAll('.custom-dropdown.open').forEach(closeDropdownElement);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.custom-dropdown.open').forEach(closeDropdownElement);
      }
    });
  }
}

function closeDropdownElement(d) {
  d.classList.remove('open');
  d.querySelector('.custom-dropdown-trigger')?.setAttribute('aria-expanded', 'false');
}

/**
 * Legacy compatibility builder.
 */
export function renderSubjectSelectOptions(subjects = [], selectedId = '', includeGeneralOption = true) {
  let html = '';
  if (includeGeneralOption) {
    html += '<option value="">General Study</option>';
  }
  subjects.forEach(s => {
    const isSelected = s.id === selectedId ? 'selected' : '';
    html += `<option value="${s.id}" ${isSelected}>${s.name}</option>`;
  });
  return html;
}
