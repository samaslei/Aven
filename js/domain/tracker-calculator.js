/**
 * Aven - Pure Study Tracker Calculator
 * Pure mathematical domain logic for heatmap calendar matrices, study streaks,
 * milestone progress journeys, and study session history. Zero DOM dependencies.
 */

const MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const MILESTONE_TARGETS = [100, 200, 300, 500, 750, 1000, 1500, 2000, 3000, 5000, 10000];

/**
 * Calculates current and longest study streak in consecutive days.
 * @param {Array<{ date: string, duration: number }>} sessions 
 * @returns {{ currentStreak: number, longestStreak: number, totalHours: string, totalSessions: number }}
 */
export function calculateStreakStats(sessions = []) {
  if (!sessions || sessions.length === 0) {
    return { currentStreak: 0, longestStreak: 0, totalHours: '0.0', totalSessions: 0 };
  }

  const dateMap = {};
  sessions.forEach(s => {
    if (s.date) {
      dateMap[s.date] = (dateMap[s.date] || 0) + Number(s.duration || 0);
    }
  });

  const uniqueDates = Object.keys(dateMap).sort().reverse();
  if (uniqueDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, totalHours: '0.0', totalSessions: 0 };
  }

  const today = new Date().toISOString().split('T')[0];
  const yesterdayDate = new Date(Date.now() - 86400000);
  const yesterday = yesterdayDate.toISOString().split('T')[0];

  let currentStreak = 0;
  let checkDate = new Date();
  if (!dateMap[today]) {
    if (dateMap[yesterday]) {
      checkDate = yesterdayDate;
    } else {
      checkDate = null;
    }
  }

  if (checkDate) {
    let iter = new Date(checkDate);
    while (true) {
      const dStr = iter.toISOString().split('T')[0];
      if (dateMap[dStr] && dateMap[dStr] > 0) {
        currentStreak++;
        iter.setDate(iter.getDate() - 1);
      } else {
        break;
      }
    }
  }

  const sortedDatesAsc = Object.keys(dateMap).sort();
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate = null;

  sortedDatesAsc.forEach(dStr => {
    const curr = new Date(dStr + 'T00:00:00');
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const diffDays = Math.round((curr - prevDate) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays === 0) {
        // Same day
      } else {
        tempStreak = 1;
      }
    }
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
    prevDate = curr;
  });

  const totalMinutes = sessions.reduce((acc, s) => acc + Number(s.duration || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    totalHours,
    totalSessions: sessions.length
  };
}

/**
 * Builds the 12-month calendar grid matrix for the yearly activity heatmap.
 * @param {Array<{ date: string, duration: number, subject_id?: string }>} sessions 
 * @param {number} year 
 * @param {Function} [getSubjectById] 
 */
export function generateYearCalendarMatrix(sessions = [], year = new Date().getFullYear(), getSubjectById = null) {
  const dateMap = {};
  const subjectsMap = {};

  sessions.forEach(s => {
    if (!s.date) return;
    dateMap[s.date] = (dateMap[s.date] || 0) + Number(s.duration || 0);
    if (!subjectsMap[s.date]) subjectsMap[s.date] = [];
    const sub = getSubjectById && s.subject_id ? getSubjectById(s.subject_id) : null;
    subjectsMap[s.date].push({
      subjectName: sub ? sub.name : 'General Study',
      subjectCode: sub ? sub.code : '',
      color: sub ? sub.color : '#94a3b8',
      duration: s.duration
    });
  });

  const today = new Date();
  const months = [];

  for (let m = 0; m < 12; m++) {
    const firstDay = new Date(year, m, 1);
    const lastDayNum = new Date(year, m + 1, 0).getDate();
    const startOffset = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.

    const weeks = [];
    let currentWeek = new Array(startOffset).fill(null);

    for (let day = 1; day <= lastDayNum; day++) {
      const d = new Date(year, m, day);
      const dateStr = `${year}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const minutes = dateMap[dateStr] || 0;
      const isFuture = d > today;

      let level = 0;
      if (!isFuture && minutes > 0) {
        if (minutes <= 30) level = 1;
        else if (minutes <= 60) level = 2;
        else if (minutes <= 120) level = 3;
        else level = 4;
      }

      currentWeek.push({
        date: dateStr,
        dayOfWeek: d.getDay(),
        minutes,
        level,
        isFuture,
        subjects: subjectsMap[dateStr] || []
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      weeks.push(currentWeek);
    }

    months.push({ name: MONTH_NAMES[m], monthIndex: m, weeks });
  }

  const yearSessions = sessions.filter(s => s.date && s.date.startsWith(String(year)));
  const totalMins = yearSessions.reduce((a, s) => a + Number(s.duration || 0), 0);

  return {
    months,
    year,
    totalSessions: yearSessions.length,
    totalHours: (totalMins / 60).toFixed(1)
  };
}

/**
 * Calculates milestone targets, progress percentage, best day, and all-time records.
 * @param {Array<{ date: string, duration: number }>} sessions 
 */
export function calculateMilestoneData(sessions = []) {
  const totalMinutes = sessions.reduce((acc, s) => acc + Number(s.duration || 0), 0);
  const totalHoursNum = totalMinutes / 60;
  const totalHours = totalHoursNum.toFixed(1);

  let target = MILESTONE_TARGETS.find(m => m > totalHoursNum);
  if (!target) {
    target = Math.ceil((totalHoursNum + 1) / 1000) * 1000;
  }

  const progressPct = Math.min(100, Math.max(0, (totalHoursNum / target) * 100));
  const hoursRemaining = Math.max(0, target - totalHoursNum).toFixed(1);

  // 5 scale markers: 0%, 25%, 50%, 75%, 100% of target
  const scaleMarkers = [0, 0.25, 0.5, 0.75, 1].map(fraction => {
    const val = Math.round(target * fraction);
    return `${val}h`;
  });

  // Best Day calculation (highest cumulative minutes in a single date)
  const dayMap = {};
  sessions.forEach(s => {
    if (s.date) dayMap[s.date] = (dayMap[s.date] || 0) + Number(s.duration || 0);
  });
  const maxDayMinutes = Math.max(0, ...Object.values(dayMap));
  const bestDayHours = (maxDayMinutes / 60).toFixed(1);

  // Longest single session calculation
  const maxSessionMinutes = Math.max(0, ...sessions.map(s => Number(s.duration || 0)));
  const longestSessionHours = (maxSessionMinutes / 60).toFixed(1);

  return {
    totalHours,
    target,
    progressPct: progressPct.toFixed(1),
    hoursRemaining,
    scaleMarkers,
    bestDayHours,
    allTimeHours: totalHours,
    longestSessionHours
  };
}

/**
 * Merges sub-hour sessions (<60m) for the same subject on the same day for display in Recent Study History.
 * Sessions >= 60m and General Study (no subject_id) sessions remain unmerged.
 * @param {Array<Object>} sessions - Raw sorted session objects
 * @returns {Array<Object>} Display sessions list
 */
export function aggregateRecentStudyHistory(sessions = []) {
  if (!sessions || sessions.length === 0) return [];

  const result = [];
  const subHourGroups = new Map();

  for (const s of sessions) {
    const duration = Number(s.duration) || 0;
    const isSubHour = duration < 60;
    const hasSubject = Boolean(s.subject_id);
    const initialNote = (s.notes && s.notes.trim()) ? s.notes.trim() : 'Manually logged';

    if (isSubHour && hasSubject) {
      const groupKey = `${s.subject_id}__${s.date}`;
      if (!subHourGroups.has(groupKey)) {
        const entry = {
          id: s.id,
          ids: [s.id],
          subject_id: s.subject_id,
          duration: duration,
          date: s.date,
          created_at: s.created_at,
          notesList: [initialNote],
          isMerged: false
        };
        subHourGroups.set(groupKey, entry);
        result.push(entry);
      } else {
        const existing = subHourGroups.get(groupKey);
        existing.ids.push(s.id);
        existing.duration += duration;
        existing.isMerged = true;
        if (!existing.notesList.includes(initialNote)) {
          existing.notesList.push(initialNote);
        }
      }
    } else {
      // Sessions >= 60m OR General Study sessions stay as individual rows
      result.push({
        id: s.id,
        ids: [s.id],
        subject_id: s.subject_id,
        duration: duration,
        date: s.date,
        created_at: s.created_at,
        notes: initialNote,
        isMerged: false
      });
    }
  }

  // Format notes field for each entry
  return result.map(entry => {
    if (entry.notesList !== undefined) {
      const { notesList, ...rest } = entry;
      return {
        ...rest,
        notes: notesList.join(' · ')
      };
    }
    return entry;
  });
}