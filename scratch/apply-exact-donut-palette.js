import fs from 'fs';

let calcJs = fs.readFileSync('js/domain/tracker-calculator.js', 'utf-8');

const exactPaletteCode = `// Exact warm, muted desaturated palette
export const DONUT_PALETTE = [
  '#8A9A5B', // 1. olive green
  '#C9A84C', // 2. warm gold
  '#6B5B4D', // 3. dark taupe/brown
  '#B5654A', // 4. muted rust/terracotta
  '#7A8471', // 5. sage gray-green
  '#9C8560'  // 6. warm khaki
];
export const DONUT_OTHER_COLOR = '#A8A29E'; // "Other" (neutral gray)

/**
 * Calculates study time distribution by subject.
 * @param {Array} sessions 
 * @param {'all'|'week'} scope 
 * @param {Function} [getSubjectById]
 */
export function calculateDistributionStats(sessions = [], scope = 'all', getSubjectById = null) {
  let filtered = sessions;
  if (scope === 'week') {
    const now = new Date();
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    filtered = sessions.filter(s => new Date(s.date) >= startOfWeek);
  }

  const subjectMap = {};
  let totalMinutes = 0;

  filtered.forEach(s => {
    const subId = s.subject_id || 'general';
    if (!subjectMap[subId]) {
      if (subId === 'general') {
        subjectMap[subId] = {
          id: 'general',
          name: 'General Study',
          code: '',
          minutes: 0
        };
      } else {
        const sub = getSubjectById ? getSubjectById(subId) : null;
        subjectMap[subId] = {
          id: subId,
          name: sub ? sub.name : 'Unknown Subject',
          code: sub ? sub.code : '',
          minutes: 0
        };
      }
    }
    const mins = Number(s.duration || 0);
    subjectMap[subId].minutes += mins;
    totalMinutes += mins;
  });

  const sortedList = Object.values(subjectMap)
    .filter(s => s.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes);

  let slices = [];
  if (sortedList.length <= 6) {
    slices = sortedList.map((s, idx) => ({
      ...s,
      color: DONUT_PALETTE[idx % DONUT_PALETTE.length],
      percentage: totalMinutes > 0 ? (s.minutes / totalMinutes) * 100 : 0,
      hours: (s.minutes / 60).toFixed(1)
    }));
  } else {
    // Top 6 subjects
    const top6 = sortedList.slice(0, 6).map((s, idx) => ({
      ...s,
      color: DONUT_PALETTE[idx],
      percentage: totalMinutes > 0 ? (s.minutes / totalMinutes) * 100 : 0,
      hours: (s.minutes / 60).toFixed(1)
    }));

    // Group remaining subjects into 'Other'
    const otherMinutes = sortedList.slice(6).reduce((acc, s) => acc + s.minutes, 0);
    const otherSlice = {
      id: 'other',
      name: 'Other Subjects',
      code: '',
      color: DONUT_OTHER_COLOR,
      minutes: otherMinutes,
      percentage: totalMinutes > 0 ? (otherMinutes / totalMinutes) * 100 : 0,
      hours: (otherMinutes / 60).toFixed(1)
    };

    slices = [...top6, otherSlice];
  }

  return {
    totalMinutes,
    totalHours: (totalMinutes / 60).toFixed(1),
    slices
  };
}`;

const calcDistIndex = calcJs.indexOf('export function calculateDistributionStats');
if (calcDistIndex !== -1) {
  // Keep everything before calculateDistributionStats
  const prevCode = calcJs.substring(0, calcDistIndex);
  calcJs = prevCode + exactPaletteCode;
  fs.writeFileSync('js/domain/tracker-calculator.js', calcJs, 'utf-8');
  console.log('Successfully updated js/domain/tracker-calculator.js with exact 6-color palette + neutral gray Other!');
} else {
  console.error('Could not find calculateDistributionStats in tracker-calculator.js');
}
