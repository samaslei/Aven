/**
 * Aven — HTML Sanitization & Escaping Utilities
 * Provides robust HTML entity encoding to prevent Cross-Site Scripting (XSS).
 */

/**
 * Escapes characters with special meaning in HTML (&, <, >, ", ')
 * to prevent stored and reflected XSS vulnerabilities when inserting
 * user-controlled strings into innerHTML or HTML attributes.
 *
 * @param {*} value - The value to escape (handles string, number, null, undefined)
 * @returns {string} The escaped string safe for HTML interpolation
 */
export function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
