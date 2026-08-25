import fs from 'fs';

let code = fs.readFileSync('js/store.js', 'utf-8');

// 1. Replace constants & functions header with imports and re-exports
const oldHeader = `import { supabase, getCurrentUser } from './supabase.js';

// Available Year Levels & Semesters
export const YEAR_LEVELS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  '5th Year',
  '6th Year',
  '7th Year'
];

export const SEMESTERS = [
  '1st Semester',
  '2nd Semester',
  'Summer'
];

export const DEFAULT_COLOR_SWATCHES = [
  '#6366f1', // Electric Indigo
  '#3b82f6', // Cobalt Blue
  '#06b6d4', // Cyan
  '#10b981', // Emerald Green
  '#84cc16', // Lime
  '#eab308', // Amber / Gold
  '#f97316', // Bright Orange
  '#ef4444', // Crimson Red
  '#ec4899', // Pink
  '#a855f7'  // Purple
];

export const GRADE_CATEGORIES = [
  'Quizzes',
  'Long Quizzes',
  'Term Exams',
  'Laboratory',
  'Attendance',
  'Other'
];

// Philippine 1.00 - 5.00 Grading Scale (with 60% = 3.00 Passing Cutoff)
export const PHILIPPINE_GRADE_SCALE = [
  { min: 97.00, grade: '1.00', desc: 'Excellent' },
  { min: 94.00, grade: '1.25', desc: 'Superior' },
  { min: 91.00, grade: '1.50', desc: 'Very Good' },
  { min: 88.00, grade: '1.75', desc: 'Good' },
  { min: 85.00, grade: '2.00', desc: 'Satisfactory' },
  { min: 82.00, grade: '2.25', desc: 'Fair' },
  { min: 79.00, grade: '2.50', desc: 'Pass' },
  { min: 76.00, grade: '2.75', desc: 'Pass' },
  { min: 60.00, grade: '3.00', desc: 'Passing' },
  { min: 0.00,  grade: '5.00', desc: 'Failed' }
];

export function getPhilippineGrade(percentage) {
  if (percentage === null || percentage === undefined || isNaN(percentage)) {
    return { grade: '—', desc: 'No Data' };
  }
  const pct = Math.max(0, Math.min(100, Number(percentage)));
  const scale = store ? store.getGradingScale() : PHILIPPINE_GRADE_SCALE;
  for (const item of scale) {
    if (pct >= Number(item.min)) {
      return item;
    }
  }
  return { grade: '5.00', desc: 'Failed' };
}

export function getGradeStandingTier(percentage) {
  if (percentage === null || percentage === undefined || percentage === '' || isNaN(Number(percentage))) {
    return {
      tier: 'none',
      colorVar: 'var(--text-muted)',
      cssClass: 'standing-muted',
      status: 'No Data'
    };
  }
  const pct = Number(percentage);
  if (pct >= 85) {
    return {
      tier: 'excellent',
      colorVar: 'var(--success)',
      cssClass: 'standing-excellent',
      status: 'Excellent'
    };
  }
  if (pct >= 75) {
    return {
      tier: 'solid',
      colorVar: 'var(--accent)',
      cssClass: 'standing-solid',
      status: 'Good'
    };
  }
  if (pct >= 60) {
    return {
      tier: 'warning',
      colorVar: 'var(--warning)',
      cssClass: 'standing-warning',
      status: 'At Risk'
    };
  }
  return {
    tier: 'danger',
    colorVar: 'var(--danger)',
    cssClass: 'standing-danger',
    status: 'Failing'
  };
}

export function getStandingColor(percentage) {
  return getGradeStandingTier(percentage).colorVar;
}

export function getStandingClass(percentage) {
  if (percentage === null || percentage === undefined || isNaN(percentage) || percentage === '—') return 'grade-none';
  const val = parseFloat(percentage);
  if (isNaN(val)) return 'grade-none';
  if (val >= 75) return 'grade-pass';
  if (val >= 60) return 'grade-warn';
  return 'grade-danger';
}

// Event Bus for reactivity
class EventBus {
  constructor() {
    this.listeners = {};
  }
  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
    return () => this.off(event, callback);
  }
  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }
  emit(event, payload) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(payload));
    }
    if (this.listeners['*']) {
      this.listeners['*'].forEach(cb => cb({ event, payload }));
    }
  }
}

export const events = new EventBus();`;

const newHeader = `import { supabase, getCurrentUser } from './supabase.js';
import { events } from './core/events.js';
import {
  YEAR_LEVELS,
  SEMESTERS,
  DEFAULT_COLOR_SWATCHES,
  GRADE_CATEGORIES,
  PHILIPPINE_GRADE_SCALE
} from './domain/scale-definitions.js';
import {
  getPhilippineGrade,
  getGradeStandingTier,
  getStandingColor,
  getStandingClass,
  calculateTermGradeBreakdown,
  calculateSubjectGradeBreakdown
} from './domain/grade-calculator.js';
import {
  calculateStreakStats,
  generateYearCalendarMatrix,
  calculateMilestoneData,
  calculateDistributionStats
} from './domain/tracker-calculator.js';

// Re-export domain constants & functions for full backward compatibility
export {
  events,
  YEAR_LEVELS,
  SEMESTERS,
  DEFAULT_COLOR_SWATCHES,
  GRADE_CATEGORIES,
  PHILIPPINE_GRADE_SCALE,
  getPhilippineGrade,
  getGradeStandingTier,
  getStandingColor,
  getStandingClass
};`;

code = code.replace(oldHeader, newHeader);

// 2. Delegate getStreakStats and getYearCalendarMatrix to domain calculators
const oldStreakAndMatrix = `  getStreakStats() {
    const sessions = this.getSessions();
    if (!sessions || sessions.length === 0) {
      return { currentStreak: 0, longestStreak: 0, totalHours: '0.0', totalSessions: 0 };
    }

    const dateMap = {};
    sessions.forEach(s => {
      dateMap[s.date] = (dateMap[s.date] || 0) + (s.duration || 0);
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
        } else {
          tempStreak = 1;
        }
      }
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
      prevDate = curr;
    });

    const totalMinutes = sessions.reduce((acc, s) => acc + (s.duration || 0), 0);
    const totalHours = (totalMinutes / 60).toFixed(1);

    return {
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak),
      totalHours,
      totalSessions: sessions.length
    };
  }`;

const newStreakAndMatrix = `  getStreakStats() {
    return calculateStreakStats(this.getSessions());
  }`;

code = code.replace(oldStreakAndMatrix, newStreakAndMatrix);

// 3. Delegate getYearCalendarMatrix
const oldYearCalMatrix = `  getYearCalendarMatrix(year) {
    const sessions = this.getSessions();
    const dateMap = {};
    const subjectsMap = {};

    sessions.forEach(s => {
      dateMap[s.date] = (dateMap[s.date] || 0) + (s.duration || 0);
      if (!subjectsMap[s.date]) subjectsMap[s.date] = [];
      const sub = s.subject_id ? this.getSubjectById(s.subject_id) : null;
      subjectsMap[s.date].push({
        subjectName: sub ? sub.name : 'General Study',
        subjectCode: sub ? sub.code : '',
        color: sub ? sub.color : '#94a3b8',
        duration: s.duration
      });
    });

    const today = new Date();
    const MONTH_NAMES = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const months = [];

    for (let m = 0; m < 12; m++) {
      const firstDay = new Date(year, m, 1);
      const lastDayNum = new Date(year, m + 1, 0).getDate();
      const startOffset = firstDay.getDay();

      const weeks = [];
      let currentWeek = new Array(startOffset).fill(null);

      for (let day = 1; day <= lastDayNum; day++) {
        const d = new Date(year, m, day);
        const dateStr = \`\${year}-\${String(m + 1).padStart(2, '0')}-\${String(day).padStart(2, '0')}\`;
        const minutes = dateMap[dateStr] || 0;
        const isFuture = d > today;

        let level = 0;
        if (!isFuture && minutes > 0) {
          if (minutes <= 30) level = 1;
          else if (minutes <= 60) level = 2;
          else if (minutes <= 120) level = 3;
          else level = 4;
        }

        currentWeek.push({ date: dateStr, dayOfWeek: d.getDay(), minutes, level, isFuture, subjects: subjectsMap[dateStr] || [] });

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
    const totalMins = yearSessions.reduce((a, s) => a + (s.duration || 0), 0);

    return {
      months,
      year,
      totalSessions: yearSessions.length,
      totalHours: (totalMins / 60).toFixed(1)
    };
  }`;

const newYearCalMatrix = `  getYearCalendarMatrix(year = new Date().getFullYear()) {
    return generateYearCalendarMatrix(this.getSessions(), year, id => this.getSubjectById(id));
  }`;

code = code.replace(oldYearCalMatrix, newYearCalMatrix);

// 4. Delegate calculateTermGrade & calculateSubjectGrade
const oldTermGradeCalc = `  calculateTermGrade(subjectId, term) {
    const categories = this.getSubjectGradeCategories(subjectId, term);
    if (categories.length === 0) {
      return { percentage: null, totalWeight: 0, weightedEarned: 0, categorySummaries: [] };
    }

    let totalWeight = 0;
    let weightedEarned = 0;
    const categorySummaries = [];

    categories.forEach(cat => {
      totalWeight += (cat.weight || 0);
      const entries = cat.entries || [];
      const totalScore = entries.reduce((acc, e) => acc + Number(e.score || 0), 0);
      const totalOutOf = entries.reduce((acc, e) => acc + Number(e.out_of || 0), 0);
      
      const rawPct = totalOutOf > 0 ? (totalScore / totalOutOf) * 100 : null;
      const catWeightedPts = rawPct !== null ? (rawPct * (cat.weight / 100)) : null;

      if (catWeightedPts !== null) {
        weightedEarned += catWeightedPts;
      }

      categorySummaries.push({
        id: cat.id,
        category: cat.category,
        weight: cat.weight,
        totalScore,
        totalOutOf,
        percentage: rawPct,
        weightedPoints: catWeightedPts,
        entriesCount: entries.length
      });
    });

    let termPercentage = null;
    if (totalWeight > 0) {
      termPercentage = Math.round(weightedEarned * 100) / 100;
    }

    return {
      percentage: termPercentage,
      totalWeight,
      weightedEarned,
      categorySummaries,
      philGrade: getPhilippineGrade(termPercentage)
    };
  }`;

const newTermGradeCalc = `  calculateTermGrade(subjectId, term) {
    const categories = this.getSubjectGradeCategories(subjectId, term);
    return calculateTermGradeBreakdown(categories, this.getGradingScale());
  }`;

code = code.replace(oldTermGradeCalc, newTermGradeCalc);

const oldSubjectGradeCalc = `  calculateSubjectGrade(subjectId) {
    const config = this.getSubjectGradeConfig(subjectId);
    const midterm = this.calculateTermGrade(subjectId, 'Midterm');
    const final = this.calculateTermGrade(subjectId, 'Final');

    const mWeight = config.midterm_weight / 100;
    const fWeight = config.final_weight / 100;

    let overallPct = null;

    if (midterm.percentage !== null && final.percentage !== null) {
      overallPct = (midterm.percentage * mWeight) + (final.percentage * fWeight);
    } else if (midterm.percentage !== null) {
      overallPct = midterm.percentage;
    } else if (final.percentage !== null) {
      overallPct = final.percentage;
    }

    if (overallPct !== null) {
      overallPct = Math.round(overallPct * 100) / 100;
    }

    const philGrade = getPhilippineGrade(overallPct);

    return {
      subjectId,
      midterm,
      final,
      config,
      overallPercentage: overallPct,
      philGrade,
      summaryLine: overallPct !== null ? \`\${overallPct.toFixed(1)}% · \${philGrade.grade}\` : 'No Grades'
    };
  }`;

const newSubjectGradeCalc = `  calculateSubjectGrade(subjectId) {
    const config = this.getSubjectGradeConfig(subjectId);
    const midterm = this.calculateTermGrade(subjectId, 'Midterm');
    const final = this.calculateTermGrade(subjectId, 'Final');
    const breakdown = calculateSubjectGradeBreakdown(midterm, final, config, this.getGradingScale());

    return {
      subjectId,
      midterm,
      final,
      config,
      overallPercentage: breakdown.overallPercentage,
      philGrade: breakdown.philGrade,
      summaryLine: breakdown.summaryLine
    };
  }`;

code = code.replace(oldSubjectGradeCalc, newSubjectGradeCalc);

fs.writeFileSync('js/store.js', code, 'utf-8');
console.log('Successfully refactored js/store.js to delegate to domain calculators!');
