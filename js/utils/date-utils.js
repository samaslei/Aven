/**
 * Aven - Shared Date & Time Utilities
 */

/**
 * Returns today's date formatted as YYYY-MM-DD (ISO standard local date string).
 * @returns {string}
 */
export function getTodayISO() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Formats seconds into MM:SS display format.
 * @param {number} seconds 
 * @returns {string}
 */
export function formatMinutesAndSeconds(seconds) {
  const totalSecs = Math.max(0, Math.floor(seconds || 0));
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Formats a duration in minutes into a clean human readable string (e.g., '1h 30m' or '45m').
 * @param {number} minutes 
 * @returns {string}
 */
export function formatDurationLabel(minutes) {
  const mins = Number(minutes) || 0;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  if (hours > 0 && remainingMins > 0) return `${hours}h ${remainingMins}m`;
  if (hours > 0) return `${hours}h`;
  return `${remainingMins}m`;
}

/**
 * Formats an ISO date string into a user-friendly format (e.g. 'Oct 24, 2026').
 * @param {string} isoString 
 * @returns {string}
 */
export function formatDateHuman(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
