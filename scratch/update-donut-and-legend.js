import fs from 'fs';

// 1. UPDATE js/domain/tracker-calculator.js
let calcJs = fs.readFileSync('js/domain/tracker-calculator.js', 'utf-8');

// Define the fixed warm, muted palette in tracker-calculator.js
const oldCalcDist = `export function calculateDistributionStats(sessions = [], scope = 'all', getSubjectById = null) {
  let filtered = sessions;
  if (scope === 'week') {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000);
    sunday.setHours(23, 59, 59, 999);

    const monStr = monday.toISOString().split('T')[0];
    const sunStr = sunday.toISOString().split('T')[0];

    filtered = sessions.filter(s => s.date >= monStr && s.date <= sunStr);
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
          color: '#94a3b8',
          minutes: 0
        };
      } else {
        const sub = getSubjectById ? getSubjectById(subId) : null;
        subjectMap[subId] = {
          id: subId,
          name: sub ? sub.name : 'Unknown Subject',
          code: sub ? sub.code : '',
          color: sub && sub.color ? sub.color : '#6366f1',
          minutes: 0
        };
      }
    }
    const mins = Number(s.duration || 0);
    subjectMap[subId].minutes += mins;
    totalMinutes += mins;
  });

  const slices = Object.values(subjectMap)
    .filter(s => s.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes)
    .map(s => ({
      ...s,
      percentage: totalMinutes > 0 ? (s.minutes / totalMinutes) * 100 : 0,
      hours: (s.minutes / 60).toFixed(1)
    }));

  return {
    totalMinutes,
    totalHours: (totalMinutes / 60).toFixed(1),
    slices
  };
}`;

const newCalcDist = `// Warm, muted desaturated palette (Reference Style: Olive, Warm Gold, Taupe/Brown, Sage, Rust, Khaki)
export const DONUT_PALETTE = [
  '#505537', // 1. Deep Olive Moss
  '#8c8250', // 2. Warm Muted Gold / Olive Amber
  '#68594b', // 3. Dark Earthy Taupe / Warm Brown
  '#78825c', // 4. Muted Sage / Forest Moss
  '#9a604f', // 5. Muted Rust / Terracotta
  '#b0a886'  // 6. Soft Warm Khaki / Tan
];
export const DONUT_OTHER_COLOR = '#8a8c82'; // 7. Neutral Muted Gray for 'Other'

export function calculateDistributionStats(sessions = [], scope = 'all', getSubjectById = null) {
  let filtered = sessions;
  if (scope === 'week') {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000);
    sunday.setHours(23, 59, 59, 999);

    const monStr = monday.toISOString().split('T')[0];
    const sunStr = sunday.toISOString().split('T')[0];

    filtered = sessions.filter(s => s.date >= monStr && s.date <= sunStr);
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

calcJs = calcJs.replace(oldCalcDist, newCalcDist);
fs.writeFileSync('js/domain/tracker-calculator.js', calcJs, 'utf-8');

// 2. UPDATE js/tracker.js for renderDistributionCard
let trackerJs = fs.readFileSync('js/tracker.js', 'utf-8');

const oldLegendHtml = `    const legendHtml = slices.map(slice => {
      return \`
        <div class="dist-legend-item" data-id="\${slice.id}">
          <div class="dist-legend-top">
            <div class="dist-legend-subject">
              <span class="dist-color-dot" style="background-color: \${slice.color};"></span>
              \${slice.code ? \`<span class="subject-list-code" style="font-size: 10px; padding: 1px 5px;">\${slice.code}</span>\` : (!slice.code && slice.id === 'general' ? \`<span class="tag-status-archived" style="font-size: 10px; padding: 1px 6px;">General</span>\` : '')}
              <span class="dist-subject-name" title="\${slice.name}">\${slice.name}</span>
            </div>
            <div class="dist-legend-metric">
              <span class="dist-metric-hours">\${slice.hours}h</span>
              <span class="dist-metric-pct">\${slice.percentage.toFixed(1)}%</span>
            </div>
          </div>
          <div class="dist-progress-track">
            <div class="dist-progress-fill" style="width: \${slice.percentage}%; background-color: \${slice.color};"></div>
          </div>
        </div>
      \`;
    }).join('');`;

const newLegendHtml = `    const legendHtml = slices.map(slice => {
      const isOther = slice.id === 'other';
      const isGeneral = slice.id === 'general';
      return \`
        <div class="dist-legend-row" data-id="\${slice.id}">
          <div class="dist-legend-left">
            <span class="dist-circle-badge" style="background-color: \${slice.color}1c; color: \${slice.color}; border: 1px solid \${slice.color}30;">
              <span class="dist-circle-core" style="background-color: \${slice.color};"></span>
            </span>
            <div class="dist-legend-names">
              <div class="dist-legend-title-line">
                \${slice.code ? \`<span class="subject-list-code" style="font-size: 10px; padding: 1px 5px;">\${slice.code}</span>\` : (isOther ? \`<span class="tag-status-archived" style="font-size: 10px; padding: 1px 6px;">Aggregate</span>\` : (isGeneral ? \`<span class="tag-status-archived" style="font-size: 10px; padding: 1px 6px;">General</span>\` : ''))}
                <span class="dist-subject-name" title="\${slice.name}">\${slice.name}</span>
              </div>
            </div>
          </div>
          <div class="dist-legend-right">
            <strong class="dist-hours-val">\${slice.hours}h</strong>
            <span class="dist-pct-val">\${slice.percentage.toFixed(1)}%</span>
          </div>
        </div>
      \`;
    }).join('');`;

trackerJs = trackerJs.replace(oldLegendHtml, newLegendHtml);
fs.writeFileSync('js/tracker.js', trackerJs, 'utf-8');

// 3. UPDATE css/style.css for modern single-line clean legend rows matching reference
let css = fs.readFileSync('css/style.css', 'utf-8');

const oldLegendCss = `.dist-legend-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 220px;
  overflow-y: auto;
  padding-right: 4px;
}

.dist-legend-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 6px 10px;
  border-radius: var(--radius-md);
  transition: background-color 0.14s ease, transform 0.14s ease;
  cursor: default;
}

.dist-legend-item:hover {
  background: var(--bg-surface-hover);
  transform: translateX(2px);
}

.dist-legend-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.dist-legend-subject {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.dist-color-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dist-subject-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dist-legend-metric {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-numeric);
  font-variant-numeric: tabular-nums;
  font-size: 12.5px;
  font-weight: 600;
  flex-shrink: 0;
}

.dist-metric-hours {
  color: var(--text-primary);
}

.dist-metric-pct {
  color: var(--text-muted);
  font-size: 11.5px;
  min-width: 40px;
  text-align: right;
}

.dist-progress-track {
  height: 4px;
  border-radius: 2px;
  background: rgba(148, 163, 184, 0.15);
  overflow: hidden;
  width: 100%;
}

.dist-progress-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}`;

const newLegendCss = `.dist-legend-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 250px;
  overflow-y: auto;
  padding-right: 4px;
}

/* Reference Single-Line Legend Row */
.dist-legend-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 7px 10px;
  border-radius: var(--radius-md);
  transition: background-color 0.14s ease, transform 0.14s ease;
  cursor: default;
}

.dist-legend-row:hover {
  background: var(--bg-surface-hover);
  transform: translateX(2px);
}

.dist-legend-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

/* Small Colored Circular Badge (Reference Style) */
.dist-circle-badge {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.dist-circle-core {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

.dist-legend-names {
  min-width: 0;
  flex: 1;
}

.dist-legend-title-line {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.dist-subject-name {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dist-legend-right {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-family: var(--font-numeric);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
  text-align: right;
}

.dist-hours-val {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
}

.dist-pct-val {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 500;
}`;

css = css.replace(oldLegendCss, newLegendCss);
fs.writeFileSync('css/style.css', css, 'utf-8');

console.log('Successfully recolored donut chart with warm muted palette and added reference-style legend list!');
