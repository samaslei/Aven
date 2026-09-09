/**
 * Aven — Safe localStorage Accessor
 * Centralizes all localStorage access with try/catch guards and SSR safety.
 * Eliminates the 20+ scattered `try { if (typeof localStorage !== 'undefined') ... } catch {}` blocks.
 */

const storage = typeof localStorage !== 'undefined' ? localStorage : null;

/**
 * Reads a value from localStorage.
 * @param {string} key
 * @param {*} fallback - Returned if the key doesn't exist or localStorage is unavailable
 * @returns {string|*}
 */
export function getItem(key, fallback = null) {
  if (!storage) return fallback;
  try {
    const value = storage.getItem(key);
    return value !== null ? value : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Reads and JSON-parses a value from localStorage.
 * @param {string} key
 * @param {*} fallback
 * @returns {*}
 */
export function getJSON(key, fallback = null) {
  const raw = getItem(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/**
 * Writes a value to localStorage.
 * @param {string} key
 * @param {string} value
 */
export function setItem(key, value) {
  if (!storage) return;
  try {
    storage.setItem(key, value);
  } catch {
    // Quota exceeded or private browsing — silently degrade
  }
}

/**
 * Writes a JSON-serialized value to localStorage.
 * @param {string} key
 * @param {*} value
 */
export function setJSON(key, value) {
  setItem(key, JSON.stringify(value));
}

/**
 * Removes a key from localStorage.
 * @param {string} key
 */
export function removeItem(key) {
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch {
    // Silently degrade
  }
}
