import fs from 'fs';

let code = fs.readFileSync('js/tracker.js', 'utf-8');

// 1. Replace header with imports from domain and utils
const oldTop = `import { store, events } from './store.js';

let selectedSubjectId = '';
let heatmapYear = new Date().getFullYear(); // Year-view navigation state
let distributionScope = 'all'; // 'all' | 'week'

// Pomodoro Timer State (Persists across view switches)
let pomoPhase = 'focus'; // 'focus' (25m) | 'break' (5m)
let pomoTimeRemaining = 25 * 60; // seconds
let pomoIsRunning = false;
let pomoInterval = null;
let pomoSubjectId = '';

function playPomoChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Note 1: 587.33Hz (D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Note 2: 880Hz (A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.16);
    gain2.gain.setValueAtTime(0.22, now + 0.16);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.16);
    osc2.stop(now + 0.7);
  } catch (e) {}
}

function formatPomoTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return \`\${String(m).padStart(2, '0')}:\${String(s).padStart(2, '0')}\`;
}`;

const newTop = `import { store, events } from './store.js';
import { calculateDistributionStats, calculateMilestoneData } from './domain/tracker-calculator.js';
import { playDualToneChime } from './utils/audio.js';
import { formatMinutesAndSeconds, getTodayISO } from './utils/date-utils.js';
import { renderSubjectSelectOptions } from './ui/dropdown.js';

let selectedSubjectId = '';
let heatmapYear = new Date().getFullYear(); // Year-view navigation state
let distributionScope = 'all'; // 'all' | 'week'

// Pomodoro Timer State (Persists across view switches)
let pomoPhase = 'focus'; // 'focus' (25m) | 'break' (5m)
let pomoTimeRemaining = 25 * 60; // seconds
let pomoIsRunning = false;
let pomoInterval = null;
let pomoSubjectId = '';`;

code = code.replace(oldTop, newTop);

// 2. Replace getDistributionData with calculateDistributionStats
const oldGetDistData = `  // Calculate distribution data based on scope ('all' or 'week')
  function getDistributionData(sessions, scope = 'all') {
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
            color: '#94a3b8',
            minutes: 0
          };
        } else {
          const sub = store.getSubjectById(subId);
          subjectMap[subId] = {
            id: subId,
            name: sub ? sub.name : 'Unknown Subject',
            code: sub ? sub.code : '',
            color: sub && sub.color ? sub.color : '#6366f1',
            minutes: 0
          };
        }
      }
      subjectMap[subId].minutes += s.duration;
      totalMinutes += s.duration;
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

code = code.replace(oldGetDistData, '');

// Replace getDistributionData(sessions, distributionScope) with calculateDistributionStats
code = code.replace(
  'const dist = getDistributionData(sessions, distributionScope);',
  'const dist = calculateDistributionStats(sessions, distributionScope, id => store.getSubjectById(id));'
);

// 3. Replace getMilestoneData with calculateMilestoneData
const oldGetMilestoneData = `  // Calculate milestone progress metrics
  function getMilestoneData(sessions) {
    const totalMinutes = sessions.reduce((acc, s) => acc + (s.duration || 0), 0);
    const totalHoursNum = totalMinutes / 60;
    const totalHours = totalHoursNum.toFixed(1);

    const milestones = [100, 200, 300, 500, 750, 1000, 1500, 2000, 3000, 5000, 10000];
    let target = milestones.find(m => m > totalHoursNum);
    if (!target) {
      target = Math.ceil((totalHoursNum + 1) / 1000) * 1000;
    }

    const progressPct = Math.min(100, Math.max(0, (totalHoursNum / target) * 100));
    const hoursRemaining = Math.max(0, target - totalHoursNum).toFixed(1);

    // 5 scale markers: 0h, 25h, 50h, 75h, 100h (scaled to target)
    const scaleMarkers = [0, 0.25, 0.5, 0.75, 1].map(fraction => {
      const val = Math.round(target * fraction);
      return \`\${val}h\`;
    });

    // Best Day calculation (date with highest cumulative minutes)
    const dayMap = {};
    sessions.forEach(s => {
      dayMap[s.date] = (dayMap[s.date] || 0) + (s.duration || 0);
    });
    const maxDayMinutes = Math.max(0, ...Object.values(dayMap));
    const bestDayHours = (maxDayMinutes / 60).toFixed(1);

    // Longest single session calculation
    const maxSessionMinutes = Math.max(0, ...sessions.map(s => s.duration || 0));
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
  }`;

code = code.replace(oldGetMilestoneData, '');

code = code.replace(
  'const data = getMilestoneData(sessions);',
  'const data = calculateMilestoneData(sessions);'
);

// 4. Replace formatPomoTime and playPomoChime references
code = code.replaceAll('formatPomoTime', 'formatMinutesAndSeconds');
code = code.replaceAll('playPomoChime', 'playDualToneChime');

// 5. Replace subject dropdown templates in Pomodoro and Manual Log with renderSubjectSelectOptions
code = code.replace(
  `<select id="pomo-subject-select" class="form-select pomo-subject-select">
            <option value="">🌐 General Study</option>
            \${activeSubjects.map(s => \`
              <option value="\${s.id}" \${s.id === pomoSubjectId ? 'selected' : ''}>
                \${s.code ? \`[\${s.code}] \` : ''}\${s.name}
              </option>
            \`).join('')}
          </select>`,
  `<select id="pomo-subject-select" class="form-select pomo-subject-select">
            \${renderSubjectSelectOptions(activeSubjects, pomoSubjectId, true)}
          </select>`
);

code = code.replace(
  `<select id="manual-subject-select" class="form-select">
                  <option value="">🌐 General / No Subject</option>
                  \${activeSubjects.map(s => \`
                    <option value="\${s.id}" \${s.id === selectedSubjectId ? 'selected' : ''}>
                      \${s.code ? \`[\${s.code}] \` : ''}\${s.name}
                    </option>
                  \`).join('')}
                </select>`,
  `<select id="manual-subject-select" class="form-select">
                  \${renderSubjectSelectOptions(activeSubjects, selectedSubjectId, true)}
                </select>`
);

fs.writeFileSync('js/tracker.js', code, 'utf-8');
console.log('Successfully streamlined js/tracker.js!');
