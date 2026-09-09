/**
 * Aven — Study Statistics (Pure Functions)
 * Extracts all study-time statistics from the Store class into pure functions.
 * Each function takes sessions as input and returns computed results.
 * Zero side effects, zero DOM access.
 */

import { calculateStreakStats, generateYearCalendarMatrix } from './tracker-calculator.js';

/**
 * Weekly study hours for the current ISO week.
 * Fixes: the original mutated the `now` Date object in-place.
 * @param {Array<{ date: string, duration: number }>} sessions
 * @returns {string} Hours formatted to 1 decimal (e.g. '4.5')
 */
export function getWeeklyStudyHours(sessions) {
  if (!sessions || sessions.length === 0) return '0.0';

  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  // Clone to avoid mutating the original Date
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);

  const minutes = sessions.reduce((acc, s) => {
    const sDate = new Date(s.date + 'T00:00:00');
    return sDate >= startOfWeek ? acc + (s.duration || 0) : acc;
  }, 0);

  return (minutes / 60).toFixed(1);
}

/**
 * Today's total study duration in minutes.
 * @param {Array<{ date: string, duration: number }>} sessions
 * @returns {number}
 */
export function getTodayStudyDuration(sessions) {
  const today = new Date().toISOString().split('T')[0];
  return (sessions || [])
    .filter(s => s.date === today)
    .reduce((sum, s) => sum + Number(s.duration || 0), 0);
}

/**
 * Last 7 days of study stats for weekly bar charts.
 * @param {Array<{ date: string, duration: number }>} sessions
 * @returns {Array<{ date: string, dayName: string, minutes: number, sessionsCount: number }>}
 */
export function getWeeklyStudyStats(sessions) {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const now = new Date();
  const days = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const daySessions = (sessions || []).filter(s => s.date === dateStr);
    days.push({
      date: dateStr,
      dayName: dayNames[d.getDay()],
      minutes: daySessions.reduce((acc, s) => acc + Number(s.duration || 0), 0),
      sessionsCount: daySessions.length
    });
  }

  return days;
}

/**
 * Last 4 weeks of study stats for monthly bar charts.
 * @param {Array<{ date: string, duration: number }>} sessions
 * @returns {Array<{ label: string, minutes: number }>}
 */
export function getMonthlyStudyStats(sessions) {
  const weeks = [0, 0, 0, 0];
  const now = new Date();

  (sessions || []).forEach(s => {
    const sDate = new Date(s.date);
    const diffDays = Math.floor((now - sDate) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays < 28) {
      const weekIdx = Math.floor(diffDays / 7);
      if (weekIdx >= 0 && weekIdx < 4) {
        weeks[3 - weekIdx] += Number(s.duration || 0);
      }
    }
  });

  return [
    { label: '3 wks ago', minutes: weeks[0] },
    { label: '2 wks ago', minutes: weeks[1] },
    { label: 'Last week', minutes: weeks[2] },
    { label: 'This week', minutes: weeks[3] }
  ];
}

/**
 * Heatmap data: date → total minutes for a given year.
 * @param {Array<{ date: string, duration: number }>} sessions
 * @param {number} [year]
 * @returns {Object<string, number>}
 */
export function getStudyHeatmapData(sessions, year = new Date().getFullYear()) {
  const map = {};
  (sessions || []).forEach(s => {
    if (s.date?.startsWith(String(year))) {
      map[s.date] = (map[s.date] || 0) + Number(s.duration || 0);
    }
  });
  return map;
}

/**
 * Current study streak in consecutive days.
 * Delegates to the canonical calculateStreakStats() to eliminate the duplicate.
 * @param {Array<{ date: string, duration: number }>} sessions
 * @returns {number}
 */
export function getStudyStreak(sessions) {
  return calculateStreakStats(sessions).currentStreak;
}

/**
 * Streak stats (current, longest, total hours, total sessions).
 * Thin wrapper around the domain function for Store compatibility.
 * @param {Array<{ date: string, duration: number }>} sessions
 */
export function getStreakStats(sessions) {
  return calculateStreakStats(sessions);
}

/**
 * Full year calendar matrix for the activity heatmap.
 * @param {Array} sessions
 * @param {number} year
 * @param {Function} getSubjectById
 */
export function getYearCalendarMatrix(sessions, year = new Date().getFullYear(), getSubjectById = null) {
  return generateYearCalendarMatrix(sessions, year, getSubjectById);
}
