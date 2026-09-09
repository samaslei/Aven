/**
 * Aven — ID Generation Utility
 * Generates collision-resistant prefixed IDs using crypto.getRandomValues()
 * when available, with a Math.random() fallback for non-secure contexts.
 */

/**
 * @param {string} prefix - Short namespace prefix (e.g. 'sub', 'ses', 'cat', 'ent', 'plan')
 * @returns {string} A unique ID like "sub_1694000000000_a7f3b2c"
 */
export function generateId(prefix = 'id') {
  const timestamp = Date.now();
  const random = typeof crypto !== 'undefined' && crypto.getRandomValues
    ? Array.from(crypto.getRandomValues(new Uint8Array(5)), b => b.toString(36)).join('').slice(0, 7)
    : Math.random().toString(36).slice(2, 9);

  return `${prefix}_${timestamp}_${random}`;
}
