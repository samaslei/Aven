/**
 * Aven - Unified Premium Tooltip System (Linear / Notion Inspired)
 * Centralizes tooltips across all interactive UI elements with unified surfaces, borders, typography, and motion.
 */

let tooltipEl = null;
let currentTarget = null;
let showTimeout = null;
let hideTimeout = null;

const TOOLTIP_SHOW_DELAY = 100; // Snappy micro-delay (ms)
const TOOLTIP_OFFSET = 7; // Gap between trigger and tooltip caret (px)

/**
 * Creates or retrieves the singleton tooltip element in the DOM
 */
function getTooltipElement() {
  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.id = 'app-global-tooltip';
    tooltipEl.className = 'app-global-tooltip';
    tooltipEl.setAttribute('role', 'tooltip');
    tooltipEl.setAttribute('aria-hidden', 'true');
    tooltipEl.innerHTML = `
      <span class="tooltip-content" id="app-global-tooltip-text"></span>
      <span class="tooltip-arrow" aria-hidden="true"></span>
    `;
    document.body.appendChild(tooltipEl);
  }
  return tooltipEl;
}

/**
 * Positions the tooltip relative to targetElement
 */
function positionTooltip(target, position = 'top') {
  const el = getTooltipElement();
  const targetRect = target.getBoundingClientRect();
  const tipRect = el.getBoundingClientRect();

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let pos = position;

  // Auto-flip if overflowing viewport edge
  if (pos === 'top' && targetRect.top - tipRect.height - TOOLTIP_OFFSET < 8) {
    pos = 'bottom';
  } else if (pos === 'bottom' && targetRect.bottom + tipRect.height + TOOLTIP_OFFSET > vh - 8) {
    pos = 'top';
  }

  let top = 0;
  let left = 0;

  if (pos === 'top') {
    top = targetRect.top - tipRect.height - TOOLTIP_OFFSET;
    left = targetRect.left + (targetRect.width / 2) - (tipRect.width / 2);
  } else if (pos === 'bottom') {
    top = targetRect.bottom + TOOLTIP_OFFSET;
    left = targetRect.left + (targetRect.width / 2) - (tipRect.width / 2);
  } else if (pos === 'left') {
    top = targetRect.top + (targetRect.height / 2) - (tipRect.height / 2);
    left = targetRect.left - tipRect.width - TOOLTIP_OFFSET;
  } else if (pos === 'right') {
    top = targetRect.top + (targetRect.height / 2) - (tipRect.height / 2);
    left = targetRect.right + TOOLTIP_OFFSET;
  }

  // Clamp within viewport horizontally with safe padding
  const padding = 8;
  const clampedLeft = Math.max(padding, Math.min(left, vw - tipRect.width - padding));

  // Compute caret arrow offset relative to clamped tooltip
  const targetCenterX = targetRect.left + (targetRect.width / 2);
  const arrowX = targetCenterX - clampedLeft;
  const arrowEl = el.querySelector('.tooltip-arrow');
  if (arrowEl && (pos === 'top' || pos === 'bottom')) {
    const safeArrowX = Math.max(8, Math.min(arrowX, tipRect.width - 8));
    arrowEl.style.left = `${safeArrowX}px`;
  }

  el.setAttribute('data-pos', pos);
  el.style.top = `${Math.round(top)}px`;
  el.style.left = `${Math.round(clampedLeft)}px`;
}

/**
 * Show tooltip for a target element
 */
export function showTooltip(target, text, options = {}) {
  if (!target || !text) return;

  clearTimeout(showTimeout);
  clearTimeout(hideTimeout);

  const el = getTooltipElement();
  const textEl = el.querySelector('#app-global-tooltip-text');
  textEl.textContent = text;

  currentTarget = target;
  const pos = options.position || target.getAttribute('data-tooltip-pos') || 'top';

  el.style.visibility = 'hidden';
  el.style.display = 'inline-flex';
  el.setAttribute('aria-hidden', 'false');

  positionTooltip(target, pos);

  el.style.visibility = 'visible';

  requestAnimationFrame(() => {
    el.classList.add('is-visible');
  });
}

/**
 * Hide the active global tooltip
 */
export function hideTooltip(immediate = false) {
  clearTimeout(showTimeout);
  clearTimeout(hideTimeout);

  if (!tooltipEl) return;

  if (immediate) {
    tooltipEl.classList.remove('is-visible');
    tooltipEl.style.display = 'none';
    tooltipEl.setAttribute('aria-hidden', 'true');
    currentTarget = null;
  } else {
    tooltipEl.classList.remove('is-visible');
    hideTimeout = setTimeout(() => {
      if (tooltipEl && !tooltipEl.classList.contains('is-visible')) {
        tooltipEl.style.display = 'none';
        tooltipEl.setAttribute('aria-hidden', 'true');
        currentTarget = null;
      }
    }, 120);
  }
}

/**
 * Initialize global tooltip event delegation on the document
 */
export function initGlobalTooltips() {
  if (typeof window === 'undefined') return;

  const handleTriggerEnter = (e) => {
    const target = e.target.closest('[data-tooltip], [title]');
    if (!target) return;

    // Skip the score fraction container since it uses its specialized score popover
    if (target.classList.contains('entry-score-fraction') || target.closest('.score-tooltip-wrapper:not(.btn-del-entry)')) {
      if (!target.classList.contains('btn-del-entry')) return;
    }

    let tooltipText = target.getAttribute('data-tooltip');
    const nativeTitle = target.getAttribute('title');

    if (nativeTitle) {
      tooltipText = nativeTitle;
      target.setAttribute('data-tooltip-saved', nativeTitle);
      target.removeAttribute('title');
      if (!target.getAttribute('aria-label')) {
        target.setAttribute('aria-label', nativeTitle);
      }
    } else if (!tooltipText && target.getAttribute('data-tooltip-saved')) {
      tooltipText = target.getAttribute('data-tooltip-saved');
    }

    if (!tooltipText || !tooltipText.trim()) return;

    // Fast warm-transition if another tooltip is already visible
    const isAnotherActive = tooltipEl && tooltipEl.classList.contains('is-visible');
    const delay = isAnotherActive ? 0 : TOOLTIP_SHOW_DELAY;

    clearTimeout(showTimeout);
    clearTimeout(hideTimeout);

    showTimeout = setTimeout(() => {
      showTooltip(target, tooltipText);
    }, delay);
  };

  const handleTriggerLeave = (e) => {
    const target = e.target.closest('[data-tooltip], [data-tooltip-saved]');
    if (!target) return;
    clearTimeout(showTimeout);
    hideTooltip(false);
  };

  document.addEventListener('mouseenter', handleTriggerEnter, true);
  document.addEventListener('mouseleave', handleTriggerLeave, true);
  document.addEventListener('focusin', handleTriggerEnter, true);
  document.addEventListener('focusout', handleTriggerLeave, true);

  // Close instantly on user interaction
  document.addEventListener('click', () => hideTooltip(true), true);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideTooltip(true);
  });
  window.addEventListener('scroll', () => hideTooltip(true), { passive: true });
}
