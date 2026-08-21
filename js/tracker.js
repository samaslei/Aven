/**
 * Aven - Study Tracker Controller
 * Features: LeetCode-style activity heatmap, Stopwatch & Pomodoro focus timer modes, Manual Hours+Minutes logger, Streaks.
 */

import { store, events } from './store.js';

// Timer State
let timerMode = null; // 'stopwatch' | 'pomodoro'
let selectedSubjectId = '';
let heatmapYear = new Date().getFullYear(); // Year-view navigation state
let pomoTargetCycles = 4; // Target Pomodoro cycles per session block (1-12)

// Stopwatch State
let stopwatchInterval = null;
let stopwatchSeconds = 0;
let stopwatchRunning = false;

// Pomodoro State
let pomoInterval = null;
let pomoPhase = 'work'; // 'work' | 'break'
let pomoSecondsLeft = 25 * 60;
let pomoRunning = false;
let pomoSessionsCompleted = 0;

// Distribution Scope State
let distributionScope = 'all'; // 'all' | 'week'

export function renderTrackerView(container) {
  const activeSubjects = store.getSubjects(false);
  const streakStats = store.getStreakStats();
  const sessions = store.getSessions().sort((a, b) => new Date(b.date + ' ' + (b.created_at || '')) - new Date(a.date + ' ' + (a.created_at || '')));
  const calendarData = store.getYearCalendarMatrix(heatmapYear);
  const settings = store.getSettings();

  // Initialize timer mode from settings if not set
  if (!timerMode) {
    timerMode = settings.default_timer_mode || 'stopwatch';
  }

  // Set default subject if not set
  if (!selectedSubjectId && activeSubjects.length > 0) {
    selectedSubjectId = activeSubjects[0].id;
  }

  const todayStr = new Date().toISOString().split('T')[0];

  // Build heatmap grid HTML: one block per month, month label inside
  function renderMonthBlock(month) {
    const weeksHtml = month.weeks.map(week => {
      const cellsHtml = week.map(day => {
        if (day === null) {
          return `<div class="cal-day-cell cal-day-empty"></div>`;
        }
        const futureClass = day.isFuture ? ' future' : '';
        return `<div class="cal-day-cell lvl-${day.level}${futureClass}"
          data-date="${day.date}"
          data-minutes="${day.minutes}"
          data-subjects='${JSON.stringify(day.subjects).replace(/'/g, "&apos;")}'>
        </div>`;
      }).join('');
      return `<div class="week-column">${cellsHtml}</div>`;
    }).join('');

    return `
      <div class="month-block">
        <div class="month-block-label">${month.name}</div>
        <div class="month-block-weeks">${weeksHtml}</div>
      </div>
    `;
  }

  // Calculate distribution data based on scope ('all' or 'week')
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
  }

  // Render SVG Donut Chart and Legend Card
  function renderDistributionCard(sessions) {
    const dist = getDistributionData(sessions, distributionScope);
    const totalHours = dist.totalHours;
    const slices = dist.slices;

    if (dist.totalMinutes === 0 || slices.length === 0) {
      return `
        <div class="distribution-container-card">
          <div class="distribution-header">
            <div style="display: flex; align-items: center; gap: 8px;">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
                <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
              </svg>
              <h3 style="font-size: 15px; font-weight: 600;">Study Time Distribution</h3>
            </div>
            <div class="segmented-control" id="dist-scope-switcher">
              <button class="seg-btn ${distributionScope === 'all' ? 'active' : ''}" data-scope="all">All Time</button>
              <button class="seg-btn ${distributionScope === 'week' ? 'active' : ''}" data-scope="week">This Week</button>
            </div>
          </div>
          <div class="distribution-empty-state">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" style="color: var(--text-muted); opacity: 0.5;">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <p style="font-size: 13.5px; font-weight: 500; color: var(--text-secondary); margin-top: 4px;">No study activity recorded ${distributionScope === 'week' ? 'this week' : 'yet'}</p>
            <p style="font-size: 12px; color: var(--text-muted);">Log a study session to see your time breakdown across subjects.</p>
          </div>
        </div>
      `;
    }

    // Calculate SVG donut paths
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    let accumulatedOffset = 0;

    const circlesHtml = slices.map((slice) => {
      const dashLength = (slice.percentage / 100) * circumference;
      const gapLength = circumference - dashLength;
      const offset = -accumulatedOffset;
      accumulatedOffset += dashLength;

      return `
        <circle class="donut-slice"
                cx="100" cy="100" r="${radius}"
                fill="transparent"
                stroke="${slice.color}"
                stroke-width="22"
                stroke-dasharray="${dashLength.toFixed(2)} ${gapLength.toFixed(2)}"
                stroke-dashoffset="${offset.toFixed(2)}"
                data-name="${slice.name}"
                data-code="${slice.code}"
                data-hours="${slice.hours}"
                data-pct="${slice.percentage.toFixed(1)}"
                data-color="${slice.color}"
                transform="rotate(-90 100 100)" />
      `;
    }).join('');

    const legendHtml = slices.map(slice => {
      return `
        <div class="dist-legend-item" data-id="${slice.id}">
          <div class="dist-legend-top">
            <div class="dist-legend-subject">
              <span class="dist-color-dot" style="background-color: ${slice.color};"></span>
              ${slice.code ? `<span class="subject-list-code" style="font-size: 10px; padding: 1px 5px;">${slice.code}</span>` : (!slice.code && slice.id === 'general' ? `<span class="tag-status-archived" style="font-size: 10px; padding: 1px 6px;">General</span>` : '')}
              <span class="dist-subject-name" title="${slice.name}">${slice.name}</span>
            </div>
            <div class="dist-legend-metric">
              <span class="dist-metric-hours">${slice.hours}h</span>
              <span class="dist-metric-pct">${slice.percentage.toFixed(1)}%</span>
            </div>
          </div>
          <div class="dist-progress-track">
            <div class="dist-progress-fill" style="width: ${slice.percentage}%; background-color: ${slice.color};"></div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="distribution-container-card">
        <div class="distribution-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
              <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
            </svg>
            <h3 style="font-size: 15px; font-weight: 600;">Study Time Distribution</h3>
          </div>
          <div class="segmented-control" id="dist-scope-switcher">
            <button class="seg-btn ${distributionScope === 'all' ? 'active' : ''}" data-scope="all">All Time</button>
            <button class="seg-btn ${distributionScope === 'week' ? 'active' : ''}" data-scope="week">This Week</button>
          </div>
        </div>

        <div class="distribution-content-grid">
          <!-- SVG Donut Chart with Center Total -->
          <div class="donut-chart-wrapper">
            <div class="donut-svg-box">
              <svg class="donut-svg" viewBox="0 0 200 200" width="190" height="190">
                <!-- Background Track Ring -->
                <circle cx="100" cy="100" r="${radius}" fill="transparent" stroke="var(--border-subtle)" stroke-width="22" opacity="0.35" />
                <!-- Colored Slices -->
                ${circlesHtml}
              </svg>
              <div class="donut-center-label">
                <span class="donut-center-num">${totalHours}h</span>
                <span class="donut-center-sub">${distributionScope === 'week' ? 'This Week' : 'Total Studied'}</span>
              </div>
            </div>
          </div>

          <!-- Detailed Breakdown Legend -->
          <div class="dist-legend-list">
            ${legendHtml}
          </div>
        </div>
      </div>
    `;
  }

  // Calculate Milestone Journey metrics
  function getMilestoneData(sessions) {
    const totalMinutes = sessions.reduce((acc, s) => acc + (s.duration || 0), 0);
    const totalHoursNum = totalMinutes / 60;
    const totalHours = totalHoursNum.toFixed(1);

    // Dynamic milestone progression: 100h -> 200h -> 300h -> 500h -> 750h -> 1000h...
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
      return `${val}h`;
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
  }

  // Render Journey to Next Milestone Card
  function renderMilestoneCard(sessions) {
    const data = getMilestoneData(sessions);

    return `
      <div class="tool-card journey-milestone-card">
        <div class="milestone-header">
          <div class="milestone-header-label">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
              <line x1="4" y1="22" x2="4" y2="15"></line>
            </svg>
            <span>JOURNEY TO NEXT MILESTONE</span>
          </div>
        </div>

        <div class="milestone-progress-block">
          <div class="milestone-track">
            <div class="milestone-fill" style="width: ${data.progressPct}%;"></div>
          </div>
          <div class="milestone-scale-markers">
            ${data.scaleMarkers.map(m => `<span class="milestone-scale-marker">${m}</span>`).join('')}
          </div>
        </div>

        <div class="milestone-progress-line">
          <strong>${data.totalHours}h</strong> of <strong>${data.target}h milestone</strong> <span class="milestone-dot">&middot;</span> <span class="milestone-remaining-text">${data.hoursRemaining}h to go</span>
        </div>

        <div class="milestone-stats-row">
          <div class="milestone-stat-col">
            <span class="milestone-stat-value">${data.bestDayHours}h</span>
            <span class="milestone-stat-label">Best Day</span>
          </div>
          <div class="milestone-stat-divider"></div>
          <div class="milestone-stat-col">
            <span class="milestone-stat-value">${data.allTimeHours}h</span>
            <span class="milestone-stat-label">All Time</span>
          </div>
          <div class="milestone-stat-divider"></div>
          <div class="milestone-stat-col">
            <span class="milestone-stat-value">${data.longestSessionHours}h</span>
            <span class="milestone-stat-label">Longest Session</span>
          </div>
        </div>
      </div>
    `;
  }

  // Generate 60 dial tick marks
  function generateDialTicks() {
    const ticks = [];
    for (let i = 0; i < 60; i++) {
      const isMajor = i % 5 === 0;
      const angle = i * 6;
      const y1 = 20;
      const y2 = isMajor ? 28 : 24;
      ticks.push(`<line x1="130" y1="${y1}" x2="130" y2="${y2}" transform="rotate(${angle} 130 130)" stroke="currentColor" stroke-width="${isMajor ? '2' : '1'}" opacity="${isMajor ? '0.45' : '0.18'}" stroke-linecap="round" />`);
    }
    return ticks.join('');
  }

  // Render Growing Plant Illustration based on Pomodoro progress percentage
  function renderPlantSvg(progressPct, isBreak) {
    if (isBreak) {
      return `
        <!-- Break Stage: Cozy Hot Cup -->
        <svg class="plant-svg" viewBox="0 0 70 60" width="58" height="50">
          <path d="M19 22 L51 22 C51 40 46 48 35 48 C24 48 19 40 19 22 Z" fill="var(--bg-surface)" stroke="#10b981" stroke-width="2.2" />
          <path d="M51 26 Q60 26 60 34 Q60 41 48 42" fill="none" stroke="#10b981" stroke-width="2.2" stroke-linecap="round" />
          <line x1="14" y1="52" x2="56" y2="52" stroke="#10b981" stroke-width="2.2" stroke-linecap="round" />
          <path d="M28 16 Q25 10 28 4" fill="none" stroke="#34d399" stroke-width="2" stroke-linecap="round" opacity="0.7" class="steam-line-1" />
          <path d="M35 14 Q38 8 35 2" fill="none" stroke="#34d399" stroke-width="2" stroke-linecap="round" opacity="0.9" class="steam-line-2" />
          <path d="M42 16 Q39 10 42 4" fill="none" stroke="#34d399" stroke-width="2" stroke-linecap="round" opacity="0.7" class="steam-line-3" />
        </svg>
      `;
    }

    const potSvg = `
      <g class="plant-pot">
        <path d="M20 38 L50 38 L47 53 L23 53 Z" fill="var(--bg-surface)" stroke="#f97316" stroke-width="2" stroke-linejoin="round" />
        <line x1="17" y1="38" x2="53" y2="38" stroke="#f97316" stroke-width="2.5" stroke-linecap="round" />
        <line x1="24" y1="42" x2="46" y2="42" stroke="#fb923c" stroke-width="1.2" opacity="0.6" />
      </g>
    `;

    if (progressPct < 25) {
      // Stage 0: Sprout (0% - 25%)
      return `
        <svg class="plant-svg" viewBox="0 0 70 60" width="58" height="50">
          ${potSvg}
          <path d="M35 38 Q35 28 33 24" fill="none" stroke="#10b981" stroke-width="2.4" stroke-linecap="round" />
          <path d="M33 24 Q25 21 27 16 Q32 18 33 24" fill="#10b981" />
          <path d="M33 24 Q41 20 40 15 Q35 18 33 24" fill="#34d399" />
        </svg>
      `;
    } else if (progressPct < 50) {
      // Stage 1: Seedling with 4 Leaves (25% - 50%)
      return `
        <svg class="plant-svg" viewBox="0 0 70 60" width="58" height="50">
          ${potSvg}
          <path d="M35 38 Q35 20 35 10" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" />
          <path d="M35 26 Q23 23 24 17 Q31 19 35 24" fill="#10b981" />
          <path d="M35 22 Q47 19 46 13 Q39 16 35 21" fill="#34d399" />
          <path d="M35 12 Q27 6 30 1 Q34 4 35 10" fill="#10b981" />
          <path d="M35 10 Q43 5 40 0 Q36 3 35 9" fill="#34d399" />
        </svg>
      `;
    } else if (progressPct < 75) {
      // Stage 2: Growing Plant with 6 Leaves + Bud (50% - 75%)
      return `
        <svg class="plant-svg" viewBox="0 0 70 60" width="58" height="50">
          ${potSvg}
          <path d="M35 38 Q35 15 35 6" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" />
          <path d="M35 28 Q19 25 21 17 Q29 19 35 25" fill="#059669" />
          <path d="M35 24 Q51 21 49 13 Q41 16 35 22" fill="#10b981" />
          <path d="M35 16 Q21 11 23 4 Q30 7 35 14" fill="#10b981" />
          <path d="M35 12 Q49 8 47 1 Q40 4 35 10" fill="#34d399" />
          <circle cx="35" cy="5" r="3.2" fill="#fbbf24" />
        </svg>
      `;
    } else {
      // Stage 3: Blooming Plant with Flower & Sparkles (75% - 100%)
      return `
        <svg class="plant-svg" viewBox="0 0 70 60" width="58" height="50">
          ${potSvg}
          <path d="M35 38 Q35 18 35 8" fill="none" stroke="#10b981" stroke-width="2.6" stroke-linecap="round" />
          <path d="M35 28 Q17 25 19 16 Q29 18 35 25" fill="#059669" />
          <path d="M35 23 Q53 20 51 11 Q41 14 35 21" fill="#10b981" />
          <path d="M35 15 Q19 9 22 1 Q30 4 35 12" fill="#10b981" />
          <path d="M35 11 Q51 6 48 -2 Q40 2 35 9" fill="#34d399" />
          <circle cx="35" cy="0" r="3.5" fill="#ec4899" opacity="0.9" />
          <circle cx="35" cy="12" r="3.5" fill="#ec4899" opacity="0.9" />
          <circle cx="29" cy="6" r="3.5" fill="#ec4899" opacity="0.9" />
          <circle cx="41" cy="6" r="3.5" fill="#ec4899" opacity="0.9" />
          <circle cx="35" cy="6" r="3.8" fill="#fbbf24" />
          <circle cx="35" cy="6" r="2" fill="#fef08a" />
          <polygon points="21,-3 23,-6 25,-3 23,0" fill="#fef08a" opacity="0.85" />
          <polygon points="47,-5 49,-8 51,-5 49,-2" fill="#fef08a" opacity="0.85" />
        </svg>
      `;
    }
  }

  // Render Stopwatch Center Icon SVG
  function renderStopwatchIconSvg() {
    return `
      <svg viewBox="0 0 48 48" width="42" height="42" class="stopwatch-center-svg">
        <circle cx="24" cy="26" r="16" fill="var(--bg-surface)" stroke="var(--accent)" stroke-width="2.2" />
        <circle cx="24" cy="26" r="3" fill="var(--accent)" />
        <line x1="24" y1="26" x2="24" y2="15" stroke="var(--accent)" stroke-width="2.2" stroke-linecap="round" />
        <line x1="24" y1="26" x2="31" y2="26" stroke="var(--accent)" stroke-width="2.2" stroke-linecap="round" />
        <line x1="20" y1="5" x2="28" y2="5" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" />
        <line x1="24" y1="5" x2="24" y2="10" stroke="var(--accent)" stroke-width="2.2" />
      </svg>
    `;
  }

  // Render Dial SVG Component (Ticks, Ring, Progress Arc)
  function renderTimerDialSvg({ mode, phase, secondsLeft, totalSeconds, stopwatchSecs, isRunning }) {
    const ticks = generateDialTicks();
    const radius = 96;
    const circumference = 2 * Math.PI * radius; // ~603.185

    let progressFraction = 0;
    let gradientId = 'timerGradFocus';

    if (mode === 'pomodoro') {
      progressFraction = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0;
      if (phase === 'break') {
        gradientId = 'timerGradBreak';
      }
    } else {
      progressFraction = (stopwatchSecs % 60) / 60;
      gradientId = 'timerGradFocus';
    }

    const dashOffset = (circumference * (1 - progressFraction)).toFixed(2);

    return `
      <svg class="timer-dial-svg" viewBox="0 0 260 260" width="250" height="250">
        <defs>
          <linearGradient id="timerGradFocus" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#6366f1" />
            <stop offset="50%" stop-color="#8b5cf6" />
            <stop offset="100%" stop-color="#a855f7" />
          </linearGradient>
          <linearGradient id="timerGradBreak" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#10b981" />
            <stop offset="50%" stop-color="#34d399" />
            <stop offset="100%" stop-color="#059669" />
          </linearGradient>
        </defs>

        <!-- Dial Clock Ticks -->
        <g class="timer-dial-ticks">
          ${ticks}
        </g>

        <!-- Track Ring -->
        <circle cx="130" cy="130" r="${radius}" fill="none" stroke="var(--border-subtle)" stroke-width="6" opacity="0.3" />

        <!-- Dynamic Progress Arc -->
        <circle class="timer-progress-arc ${isRunning ? 'is-active' : ''}"
                id="timer-progress-arc"
                cx="130" cy="130" r="${radius}"
                fill="none"
                stroke="url(#${gradientId})"
                stroke-width="7"
                stroke-linecap="round"
                stroke-dasharray="${circumference.toFixed(2)}"
                stroke-dashoffset="${dashOffset}"
                transform="rotate(-90 130 130)" />
      </svg>
    `;
  }

  container.innerHTML = `
    <div class="tracker-layout">
      <!-- 2-Column Analytics Top Row: Full-Year Activity Heatmap (Left) + Study Time Distribution (Right) -->
      <div class="tracker-analytics-row">
        <!-- Full-Year Activity Heatmap Card -->
        <div class="heatmap-container-card">
          <!-- Card Header: label left, year nav center, legend right -->
          <div class="heatmap-header">
            <div class="heatmap-header-label">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity:0.5;">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span>YEARLY HEATMAP</span>
            </div>

            <div class="heatmap-year-nav">
              <button class="year-nav-btn" id="btn-year-prev" title="Previous Year">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
              <span class="year-nav-label" id="heatmap-year-display">${heatmapYear}</span>
              <button class="year-nav-btn" id="btn-year-next" title="Next Year" ${heatmapYear >= new Date().getFullYear() ? 'disabled' : ''}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>

            <div class="heatmap-legend">
              <span>Less</span>
              <div class="legend-cell" style="background-color: var(--heat-empty); border: 1px solid var(--heat-border);"></div>
              <div class="legend-cell" style="background-color: var(--heat-level-1);"></div>
              <div class="legend-cell" style="background-color: var(--heat-level-2);"></div>
              <div class="legend-cell" style="background-color: var(--heat-level-3);"></div>
              <div class="legend-cell" style="background-color: var(--heat-level-4);"></div>
              <span>More</span>
            </div>
          </div>

          <!-- Stats subtitle -->
          <p class="heatmap-stats-line">
            ${calendarData.totalSessions} sessions &middot; ${calendarData.totalHours}h studied in ${heatmapYear}
          </p>

          <!-- Heatmap body: day labels + 12 month blocks -->
          <div class="heatmap-body-row">
            <!-- Day labels (alternating: blank, M, blank, W, blank, F, blank) -->
            <div class="day-labels-col">
              <div class="day-label-item"></div>
              <div class="day-label-item">M</div>
              <div class="day-label-item"></div>
              <div class="day-label-item">W</div>
              <div class="day-label-item"></div>
              <div class="day-label-item">F</div>
              <div class="day-label-item"></div>
            </div>
            <!-- Month blocks -->
            <div class="months-area">
              ${calendarData.months.map(m => renderMonthBlock(m)).join('')}
            </div>
          </div>

          <!-- Dynamic Hover Tooltip -->
          <div class="heatmap-tooltip" id="heatmap-tooltip"></div>
        </div>

        <!-- Study Time Distribution Pie/Donut Chart Card -->
        ${renderDistributionCard(sessions)}
      </div>

      <!-- Tracker Tools: Stopwatch/Pomodoro Timer + Manual Log Entry -->
      <div class="tracker-tools-grid">
        <!-- Focus Timer Card -->
        <div class="tool-card focus-timer-card">
          <div class="tool-card-title">
            <div style="display: flex; align-items: center; gap: 8px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>Focus Timer</span>
            </div>

            <div style="display: flex; align-items: center; gap: 8px;">
              <!-- Stopwatch vs Pomodoro Mode Toggle -->
              <div class="segmented-control" id="timer-mode-switcher">
                <button class="seg-btn ${timerMode === 'stopwatch' ? 'active' : ''}" data-mode="stopwatch">Stopwatch</button>
                <button class="seg-btn ${timerMode === 'pomodoro' ? 'active' : ''}" data-mode="pomodoro">Pomodoro</button>
              </div>

              <!-- Pomodoro Settings Dropdown Trigger -->
              <div class="pomo-settings-wrapper" id="pomo-settings-wrapper" style="${timerMode === 'pomodoro' ? '' : 'visibility: hidden; pointer-events: none;'}">
                <button type="button" class="pomo-settings-btn" id="btn-pomo-settings-toggle" title="Pomodoro Intervals" aria-label="Pomodoro Intervals" ${timerMode === 'pomodoro' ? '' : 'tabindex="-1"'}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                </button>
                <div class="pomo-settings-popover" id="pomo-settings-popover">
                  <div class="pomo-settings-popover-title">Pomodoro Intervals</div>
                  <div class="form-group" style="margin-bottom: 8px;">
                    <label class="form-label" for="pomo-work-input" style="font-size: 11px;">Work Duration (Mins)</label>
                    <input type="number" id="pomo-work-input" class="form-input" min="1" max="120" value="${settings.pomodoro_work_mins || 25}" ${pomoRunning ? 'disabled' : ''}>
                  </div>
                  <div class="form-group" style="margin-bottom: 8px;">
                    <label class="form-label" for="pomo-break-input" style="font-size: 11px;">Break Duration (Mins)</label>
                    <input type="number" id="pomo-break-input" class="form-input" min="1" max="60" value="${settings.pomodoro_break_mins || 5}" ${pomoRunning ? 'disabled' : ''}>
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="pomo-cycles-input" style="font-size: 11px;">Target Cycles</label>
                    <input type="number" id="pomo-cycles-input" class="form-input" min="1" max="12" value="${pomoTargetCycles}" ${pomoRunning ? 'disabled' : ''}>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Two-Column Internal Layout for Focus Timer -->
          <div class="focus-timer-content-grid" key="${timerMode}">
            <!-- Left Column: Context & Controls -->
            <div class="timer-context-col">
              <div class="timer-period-label">
                ${timerMode === 'pomodoro' 
                  ? `${pomoPhase === 'work' ? 'Focus' : 'Break'} period (${(pomoSessionsCompleted % pomoTargetCycles) + 1} of ${pomoTargetCycles})`
                  : 'Continuous focus session'
                }
              </div>

              <div class="form-group" style="margin-bottom: 0; width: 100%;">
                <label class="form-label" for="timer-subject-select">TARGET SUBJECT</label>
                <select id="timer-subject-select" class="form-select" ${(stopwatchRunning || pomoRunning) ? 'disabled' : ''}>
                  <option value="" ${!selectedSubjectId ? 'selected' : ''}>🌐 General / No Subject</option>
                  ${activeSubjects.map(s => `
                    <option value="${s.id}" ${s.id === selectedSubjectId ? 'selected' : ''}>
                      ${s.code ? `[${s.code}] ` : ''}${s.name}
                    </option>
                  `).join('')}
                </select>
              </div>

              <div class="timer-dial-controls">
                ${timerMode === 'stopwatch' ? `
                  <button type="button" class="btn-timer-circle-play ${stopwatchRunning ? 'is-running' : ''}" id="btn-toggle-stopwatch" title="${stopwatchRunning ? 'Pause' : (stopwatchSeconds > 0 ? 'Resume' : 'Start Focus')}">
                    ${stopwatchRunning ? `
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="4" width="4" height="16" rx="1.5"></rect>
                        <rect x="14" y="4" width="4" height="16" rx="1.5"></rect>
                      </svg>
                    ` : `
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style="margin-left: 3px;">
                        <polygon points="6 4 20 12 6 20 6 4"></polygon>
                      </svg>
                    `}
                  </button>

                  <div class="timer-more-wrapper">
                    <button type="button" class="btn-timer-circle-more" id="btn-stopwatch-more" title="More Options" aria-label="More Options">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="5" cy="12" r="2"></circle>
                        <circle cx="12" cy="12" r="2"></circle>
                        <circle cx="19" cy="12" r="2"></circle>
                      </svg>
                    </button>
                    <div class="timer-more-popover" id="stopwatch-more-popover">
                      <button type="button" class="timer-more-item" id="btn-save-stopwatch" ${stopwatchSeconds < 60 ? 'disabled title="Requires at least 1 minute to log"' : ''}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                          <polyline points="17 21 17 13 7 13 7 21"></polyline>
                          <polyline points="7 3 7 8 15 8"></polyline>
                        </svg>
                        <span>Save Session</span>
                      </button>
                      <button type="button" class="timer-more-item" id="btn-reset-stopwatch" ${stopwatchSeconds === 0 ? 'disabled' : ''}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M23 4v6h-6"></path>
                          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                        </svg>
                        <span>Reset</span>
                      </button>
                    </div>
                  </div>
                ` : `
                  <button type="button" class="btn-timer-circle-play ${pomoRunning ? 'is-running' : ''} ${pomoPhase === 'break' ? 'is-break' : ''}" id="btn-toggle-pomo" title="${pomoRunning ? 'Pause' : `Start ${pomoPhase === 'work' ? 'Focus' : 'Break'}`}">
                    ${pomoRunning ? `
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="4" width="4" height="16" rx="1.5"></rect>
                        <rect x="14" y="4" width="4" height="16" rx="1.5"></rect>
                      </svg>
                    ` : `
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style="margin-left: 3px;">
                        <polygon points="6 4 20 12 6 20 6 4"></polygon>
                      </svg>
                    `}
                  </button>

                  <div class="timer-more-wrapper">
                    <button type="button" class="btn-timer-circle-more" id="btn-pomo-more" title="More Options" aria-label="More Options">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="5" cy="12" r="2"></circle>
                        <circle cx="12" cy="12" r="2"></circle>
                        <circle cx="19" cy="12" r="2"></circle>
                      </svg>
                    </button>
                    <div class="timer-more-popover" id="pomo-more-popover">
                      <button type="button" class="timer-more-item" id="btn-skip-pomo">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polygon points="5 4 15 12 5 20 5 4"></polygon>
                          <line x1="19" y1="5" x2="19" y2="19"></line>
                        </svg>
                        <span>Skip to ${pomoPhase === 'work' ? 'Break' : 'Focus'}</span>
                      </button>
                      <button type="button" class="timer-more-item" id="btn-reset-pomo">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M23 4v6h-6"></path>
                          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                        </svg>
                        <span>Reset Timer</span>
                      </button>
                      <button type="button" class="timer-more-item" id="btn-reset-cycles">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 14 14"></polyline>
                        </svg>
                        <span>Reset Cycles Count</span>
                      </button>
                    </div>
                  </div>
                `}
              </div>

              <div class="timer-up-next-line">
                ${timerMode === 'pomodoro'
                  ? `Up next: <strong>${pomoPhase === 'work' ? `${settings.pomodoro_break_mins || 5} min break` : `${settings.pomodoro_work_mins || 25} min focus`}</strong>`
                  : 'Mode: <strong>Tracking continuously</strong>'
                }
              </div>
            </div>

            <!-- Right Column: Timer Display -->
            <div class="timer-dial-col">
              ${timerMode === 'stopwatch' ? `
                <div class="timer-dial-box ${stopwatchRunning ? 'is-running' : ''}">
                  ${renderTimerDialSvg({
                    mode: 'stopwatch',
                    phase: 'work',
                    secondsLeft: 0,
                    totalSeconds: 60,
                    stopwatchSecs: stopwatchSeconds,
                    isRunning: stopwatchRunning
                  })}
                  <div class="dial-center-content">
                    <div class="dial-center-illustration">
                      ${renderStopwatchIconSvg()}
                    </div>
                    <span class="dial-phase-pill stopwatch">
                      ${stopwatchRunning ? '● LIVE' : (stopwatchSeconds > 0 ? 'PAUSED' : 'READY')}
                    </span>
                    <div class="dial-time-digits" id="stopwatch-timer-display">
                      ${formatTime(stopwatchSeconds)}
                    </div>
                  </div>
                </div>
              ` : `
                <div class="timer-dial-box ${pomoRunning ? 'is-running' : ''} ${pomoPhase === 'break' ? 'is-break' : ''}">
                  ${renderTimerDialSvg({
                    mode: 'pomodoro',
                    phase: pomoPhase,
                    secondsLeft: pomoSecondsLeft,
                    totalSeconds: pomoPhase === 'work' ? (settings.pomodoro_work_mins || 25) * 60 : (settings.pomodoro_break_mins || 5) * 60,
                    stopwatchSecs: 0,
                    isRunning: pomoRunning
                  })}
                  <div class="dial-center-content">
                    <div class="dial-center-illustration" id="dial-plant-container">
                      ${renderPlantSvg(
                        pomoPhase === 'work' 
                          ? (((settings.pomodoro_work_mins || 25) * 60 - pomoSecondsLeft) / ((settings.pomodoro_work_mins || 25) * 60)) * 100
                          : 0,
                        pomoPhase === 'break'
                      )}
                    </div>
                    <span class="dial-phase-pill ${pomoPhase === 'break' ? 'break' : 'focus'}" id="pomo-phase-badge">
                      ${pomoPhase === 'work' ? 'FOCUS' : 'BREAK'}
                    </span>
                    <div class="dial-time-digits" id="pomo-timer-display">
                      ${formatMinutesSeconds(pomoSecondsLeft)}
                    </div>
                  </div>
                </div>
              `}
            </div>
          </div>
        </div>

        <!-- Right Column: Milestone Progress + Manual Study Log -->
        <div class="tracker-tools-right-col">
          <!-- Journey to Next Milestone Card -->
          ${renderMilestoneCard(sessions)}

          <!-- Manual Log Entry (Hours + Minutes Side-by-Side) -->
          <div class="tool-card manual-log-card">
            <div class="tool-card-title">
              <div style="display: flex; align-items: center; gap: 8px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                <span>Manual Study Log</span>
              </div>
            </div>

            <form id="manual-session-form">
              <!-- Paired Inputs: Subject & Date Side-by-Side -->
              <div class="form-row-paired">
                <div class="form-group">
                  <label class="form-label" for="manual-subject-select">Subject</label>
                  <select id="manual-subject-select" class="form-select">
                    <option value="">🌐 General / No Subject</option>
                    ${activeSubjects.map(s => `
                      <option value="${s.id}" ${s.id === selectedSubjectId ? 'selected' : ''}>
                        ${s.code ? `[${s.code}] ` : ''}${s.name}
                      </option>
                    `).join('')}
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label" for="manual-date">Date *</label>
                  <input type="date" id="manual-date" class="form-input" value="${todayStr}" max="${todayStr}" required>
                </div>
              </div>

              <!-- Paired Inputs: Hours & Minutes Side-by-Side -->
              <div class="form-row-paired">
                <div class="form-group">
                  <label class="form-label" for="manual-hours">Hours</label>
                  <input type="number" id="manual-hours" class="form-input" min="0" max="24" value="1" placeholder="0">
                </div>
                <div class="form-group">
                  <label class="form-label" for="manual-minutes">Minutes</label>
                  <input type="number" id="manual-minutes" class="form-input" min="0" max="59" value="30" placeholder="0">
                </div>
              </div>

              <button type="submit" class="btn btn-primary" id="btn-submit-manual-log">
                Log Study Session
              </button>
            </form>
          </div>
        </div>
      </div>

      <!-- Recent Sessions Log -->
      <div class="sessions-history-card">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <h3 style="font-size: 15px; font-weight: 600;">Recent Study History</h3>
          <span style="font-size: 12px; color: var(--text-muted);">${sessions.length} logged sessions</span>
        </div>

        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Duration</th>
                <th>Date</th>
                <th>Notes</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${sessions.length === 0 ? `
                <tr>
                  <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 32px;">
                    No study sessions recorded yet. Use the timer or manual log above!
                  </td>
                </tr>
              ` : sessions.slice(0, 15).map(s => {
                const sub = s.subject_id ? store.getSubjectById(s.subject_id) : null;
                const subName = sub ? sub.name : 'General Study';
                const subColor = sub ? sub.color : '#94a3b8';
                const hrs = Math.floor(s.duration / 60);
                const mins = s.duration % 60;
                const durText = hrs > 0 ? `${hrs}h ${mins > 0 ? `${mins}m` : ''}` : `${mins}m`;

                return `
                  <tr>
                    <td>
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="width: 7px; height: 7px; border-radius: 50%; background-color: ${subColor}; flex-shrink: 0;"></span>
                        ${sub && sub.code ? `<span class="subject-list-code" style="font-size: 10px; padding: 1px 5px;">${sub.code}</span>` : (!sub ? `<span class="tag-status-archived" style="font-size: 10px; padding: 1px 6px;">General</span>` : '')}
                        <strong style="color: var(--text-primary); font-size: 13px;">${subName}</strong>
                      </div>
                    </td>
                    <td style="font-family: var(--font-numeric); font-variant-numeric: tabular-nums; font-weight: 600; color: var(--text-primary);">
                      ${durText}
                    </td>
                    <td style="color: var(--text-secondary); font-size: 12.5px;">
                      ${s.date}
                    </td>
                    <td style="color: var(--text-muted); font-size: 12.5px; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                      ${s.notes || '—'}
                    </td>
                    <td style="text-align: right;">
                      <button class="btn btn-ghost btn-sm btn-del-session" data-id="${s.id}" style="color: var(--danger); padding: 3px 6px;">
                        Delete
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  attachTrackerEvents(container);
}

function formatTime(totalSecs) {
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatMinutesSeconds(totalSecs) {
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Gentle Web Audio API Chime
function playChime() {
  try {
    if (store.getSettings().sound_notifications === false) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.8);
  } catch (e) {
    // Web audio unavailable or muted
  }
}


function attachTrackerEvents(container) {
  // LeetCode Tooltip
  const tooltip = container.querySelector('#heatmap-tooltip');
  container.querySelectorAll('.cal-day-cell').forEach(cell => {
    cell.addEventListener('mouseenter', () => {
      const date = cell.dataset.date;
      if (!date) return; // skip empty padding cells
      const mins = Number(cell.dataset.minutes) || 0;
      let subjects = [];
      try {
        subjects = JSON.parse(cell.dataset.subjects || '[]');
      } catch (err) {}


      let subListHtml = '';
      if (subjects.length > 0) {
        subListHtml = `
          <div style="margin-top: 4px; border-top: 1px solid var(--border-subtle); padding-top: 4px;">
            ${subjects.map(s => `
              <div style="display: flex; align-items: center; gap: 6px; font-size: 11px; margin-top: 2px;">
                <span style="width: 6px; height: 6px; border-radius: 50%; background: ${s.color};"></span>
                <span>${s.subjectCode || s.subjectName}: <strong>${s.duration}m</strong></span>
              </div>
            `).join('')}
          </div>
        `;
      }

      tooltip.innerHTML = `
        <div style="font-weight: 600; color: var(--text-primary);">${date}</div>
        <div style="color: var(--text-secondary);">${mins > 0 ? `${mins} minutes studied` : 'No study activity'}</div>
        ${subListHtml}
      `;

      const rect = cell.getBoundingClientRect();
      tooltip.style.left = `${rect.left + window.scrollX - 40}px`;
      tooltip.style.top = `${rect.top + window.scrollY - tooltip.offsetHeight - 8}px`;
      tooltip.style.display = 'flex';
    });

    cell.addEventListener('mouseleave', () => {
      tooltip.style.display = 'none';
    });
  });

  // Year navigation
  const prevYearBtn = container.querySelector('#btn-year-prev');
  const nextYearBtn = container.querySelector('#btn-year-next');
  if (prevYearBtn) {
    prevYearBtn.addEventListener('click', () => {
      heatmapYear--;
      renderTrackerView(container);
    });
  }
  if (nextYearBtn) {
    nextYearBtn.addEventListener('click', () => {
      if (heatmapYear < new Date().getFullYear()) {
        heatmapYear++;
        renderTrackerView(container);
      }
    });
  }

  // Switcher between Stopwatch and Pomodoro
  container.querySelectorAll('#timer-mode-switcher .seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      timerMode = btn.dataset.mode;
      renderTrackerView(container);
    });
  });

  // Pomodoro Settings Popover Toggle
  const pomoSettingsBtn = container.querySelector('#btn-pomo-settings-toggle');
  const pomoSettingsPopover = container.querySelector('#pomo-settings-popover');
  if (pomoSettingsBtn && pomoSettingsPopover) {
    pomoSettingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      pomoSettingsPopover.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (pomoSettingsPopover && !pomoSettingsPopover.contains(e.target) && !pomoSettingsBtn.contains(e.target)) {
        pomoSettingsPopover.classList.remove('open');
      }
    });

    // Update settings live when inputs change in popover
    container.querySelector('#pomo-work-input')?.addEventListener('change', (e) => {
      const val = Math.max(1, Math.min(120, parseInt(e.target.value, 10) || 25));
      store.saveSettings({ pomodoro_work_mins: val });
      if (!pomoRunning && pomoPhase === 'work') {
        pomoSecondsLeft = val * 60;
        const display = container.querySelector('#pomo-timer-display');
        if (display) display.textContent = formatMinutesSeconds(pomoSecondsLeft);
      }
    });

    container.querySelector('#pomo-break-input')?.addEventListener('change', (e) => {
      const val = Math.max(1, Math.min(60, parseInt(e.target.value, 10) || 5));
      store.saveSettings({ pomodoro_break_mins: val });
      if (!pomoRunning && pomoPhase === 'break') {
        pomoSecondsLeft = val * 60;
        const display = container.querySelector('#pomo-timer-display');
        if (display) display.textContent = formatMinutesSeconds(pomoSecondsLeft);
      }
    });
    // Target cycles input change
    container.querySelector('#pomo-cycles-input')?.addEventListener('change', (e) => {
      const val = Math.max(1, Math.min(12, parseInt(e.target.value, 10) || 4));
      pomoTargetCycles = val;
      renderTrackerView(container);
    });
  }

  // Close more popovers on outside click
  const pomoMoreBtn = container.querySelector('#btn-pomo-more');
  const pomoMorePopover = container.querySelector('#pomo-more-popover');
  if (pomoMoreBtn && pomoMorePopover) {
    pomoMoreBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      pomoMorePopover.classList.toggle('open');
    });
  }

  const stopwatchMoreBtn = container.querySelector('#btn-stopwatch-more');
  const stopwatchMorePopover = container.querySelector('#stopwatch-more-popover');
  if (stopwatchMoreBtn && stopwatchMorePopover) {
    stopwatchMoreBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      stopwatchMorePopover.classList.toggle('open');
    });
  }

  document.addEventListener('click', (e) => {
    if (pomoMorePopover && !pomoMorePopover.contains(e.target) && pomoMoreBtn && !pomoMoreBtn.contains(e.target)) {
      pomoMorePopover.classList.remove('open');
    }
    if (stopwatchMorePopover && !stopwatchMorePopover.contains(e.target) && stopwatchMoreBtn && !stopwatchMoreBtn.contains(e.target)) {
      stopwatchMorePopover.classList.remove('open');
    }
  });

  // Target Subject select
  const timerSelect = container.querySelector('#timer-subject-select');
  if (timerSelect) {
    timerSelect.addEventListener('change', (e) => {
      selectedSubjectId = e.target.value;
    });
  }

  // --- STOPWATCH LOGIC ---
  const toggleStopwatchBtn = container.querySelector('#btn-toggle-stopwatch');
  const resetStopwatchBtn = container.querySelector('#btn-reset-stopwatch');
  const saveStopwatchBtn = container.querySelector('#btn-save-stopwatch');

  if (toggleStopwatchBtn) {
    toggleStopwatchBtn.addEventListener('click', () => {
      if (stopwatchRunning) {
        // Pause
        stopwatchRunning = false;
        clearInterval(stopwatchInterval);
        renderTrackerView(container);
      } else {
        // Start / Resume
        stopwatchRunning = true;
        clearInterval(stopwatchInterval);
        stopwatchInterval = setInterval(() => {
          stopwatchSeconds++;
          const display = container.querySelector('#stopwatch-timer-display');
          if (display) display.textContent = formatTime(stopwatchSeconds);
          const arc = container.querySelector('#timer-progress-arc');
          if (arc) {
            const fraction = (stopwatchSeconds % 60) / 60;
            arc.style.strokeDashoffset = (603.19 * (1 - fraction)).toFixed(2);
          }
        }, 1000);
        renderTrackerView(container);
      }
    });
  }

  if (resetStopwatchBtn) {
    resetStopwatchBtn.addEventListener('click', () => {
      stopwatchRunning = false;
      clearInterval(stopwatchInterval);
      stopwatchSeconds = 0;
      renderTrackerView(container);
    });
  }

  if (saveStopwatchBtn) {
    saveStopwatchBtn.addEventListener('click', () => {
      const minutes = Math.round(stopwatchSeconds / 60);
      if (minutes < 1) {
        window.avenApp?.showToast('Session is less than 1 minute', 'info');
        return;
      }

      store.saveSession({
        subject_id: selectedSubjectId || null,
        duration: minutes,
        date: new Date().toISOString().split('T')[0]
      });

      stopwatchRunning = false;
      clearInterval(stopwatchInterval);
      stopwatchSeconds = 0;

      const sub = selectedSubjectId ? store.getSubjectById(selectedSubjectId) : null;
      window.avenApp?.showToast(`Logged ${minutes} min session${sub ? ` for ${sub.name}` : ' (General Study)'}!`, 'success');
      renderTrackerView(container);
    });
  }

  // --- POMODORO LOGIC ---
  const togglePomoBtn = container.querySelector('#btn-toggle-pomo');
  const skipPomoBtn = container.querySelector('#btn-skip-pomo');
  const resetPomoBtn = container.querySelector('#btn-reset-pomo');
  const resetCyclesBtn = container.querySelector('#btn-reset-cycles');

  if (togglePomoBtn) {
    togglePomoBtn.addEventListener('click', () => {
      const workMins = Number(container.querySelector('#pomo-work-input')?.value) || (store.getSettings().pomodoro_work_mins || 25);
      const breakMins = Number(container.querySelector('#pomo-break-input')?.value) || (store.getSettings().pomodoro_break_mins || 5);

      if (pomoRunning) {
        // Pause
        pomoRunning = false;
        clearInterval(pomoInterval);
        renderTrackerView(container);
      } else {
        // Start / Resume
        if (pomoSecondsLeft === 25 * 60 || pomoSecondsLeft === 0) {
          pomoSecondsLeft = pomoPhase === 'work' ? workMins * 60 : breakMins * 60;
        }

        pomoRunning = true;
        clearInterval(pomoInterval);

        pomoInterval = setInterval(() => {
          if (pomoSecondsLeft > 0) {
            pomoSecondsLeft--;
            const display = container.querySelector('#pomo-timer-display');
            if (display) display.textContent = formatMinutesSeconds(pomoSecondsLeft);

            const totalSecs = pomoPhase === 'work' ? workMins * 60 : breakMins * 60;
            const fraction = totalSecs > 0 ? (totalSecs - pomoSecondsLeft) / totalSecs : 0;
            const arc = container.querySelector('#timer-progress-arc');
            if (arc) {
              arc.style.strokeDashoffset = (603.19 * (1 - fraction)).toFixed(2);
            }

            const plantContainer = container.querySelector('#dial-plant-container');
            if (plantContainer) {
              plantContainer.innerHTML = renderPlantSvg(fraction * 100, pomoPhase === 'break');
            }
          } else {
            // Interval completed!
            clearInterval(pomoInterval);
            pomoRunning = false;
            playChime();

            if (pomoPhase === 'work') {
              pomoSessionsCompleted++;
              // Auto log study session (supports null subject_id)
              store.saveSession({
                subject_id: selectedSubjectId || null,
                duration: workMins,
                date: new Date().toISOString().split('T')[0]
              });

              const sub = selectedSubjectId ? store.getSubjectById(selectedSubjectId) : null;
              window.avenApp?.showToast(`🎉 Focus block complete! Logged ${workMins}m${sub ? ` (${sub.name})` : ''}. Time for a ${breakMins}m break.`, 'success');
              pomoPhase = 'break';
              pomoSecondsLeft = breakMins * 60;
            } else {
              window.avenApp?.showToast(`☕ Break complete! Ready for your next focus session.`, 'info');
              pomoPhase = 'work';
              pomoSecondsLeft = workMins * 60;
            }
            renderTrackerView(container);
          }
        }, 1000);

        renderTrackerView(container);
      }
    });
  }

  if (skipPomoBtn) {
    skipPomoBtn.addEventListener('click', () => {
      pomoRunning = false;
      clearInterval(pomoInterval);
      const workMins = Number(container.querySelector('#pomo-work-input')?.value) || (store.getSettings().pomodoro_work_mins || 25);
      const breakMins = Number(container.querySelector('#pomo-break-input')?.value) || (store.getSettings().pomodoro_break_mins || 5);

      if (pomoPhase === 'work') {
        pomoPhase = 'break';
        pomoSecondsLeft = breakMins * 60;
      } else {
        pomoPhase = 'work';
        pomoSecondsLeft = workMins * 60;
      }
      renderTrackerView(container);
    });
  }

  if (resetPomoBtn) {
    resetPomoBtn.addEventListener('click', () => {
      pomoRunning = false;
      clearInterval(pomoInterval);
      const workMins = Number(container.querySelector('#pomo-work-input')?.value) || (store.getSettings().pomodoro_work_mins || 25);
      pomoPhase = 'work';
      pomoSecondsLeft = workMins * 60;
      renderTrackerView(container);
    });
  }

  if (resetCyclesBtn) {
    resetCyclesBtn.addEventListener('click', () => {
      pomoSessionsCompleted = 0;
      window.avenApp?.showToast('Pomodoro cycle counter reset', 'info');
      renderTrackerView(container);
    });
  }

  // Manual Log Submission
  const manualForm = container.querySelector('#manual-session-form');
  if (manualForm) {
    manualForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const subject_id = container.querySelector('#manual-subject-select').value || null;
      const hours = Number(container.querySelector('#manual-hours').value) || 0;
      const mins = Number(container.querySelector('#manual-minutes').value) || 0;
      const date = container.querySelector('#manual-date').value;

      const totalMins = (hours * 60) + mins;
      if (totalMins <= 0) {
        window.avenApp?.showToast('Please enter a duration greater than 0', 'danger');
        return;
      }

      store.saveSession({
        subject_id,
        duration: totalMins,
        date
      });

      const sub = subject_id ? store.getSubjectById(subject_id) : null;
      window.avenApp?.showToast(`Logged ${totalMins} min session${sub ? ` for ${sub.name}` : ' (General Study)'}!`, 'success');
      renderTrackerView(container);
    });
  }

  // Delete Session
  container.querySelectorAll('.btn-del-session').forEach(btn => {
    btn.addEventListener('click', () => {
      store.deleteSession(btn.dataset.id);
      window.avenApp?.showToast('Session deleted', 'info');
      renderTrackerView(container);
    });
  });

  // Distribution Scope Switcher (All Time vs This Week)
  const distSwitcher = container.querySelector('#dist-scope-switcher');
  if (distSwitcher) {
    distSwitcher.querySelectorAll('.seg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        distributionScope = btn.dataset.scope || 'all';
        renderTrackerView(container);
      });
    });
  }

  // Interactive Donut Slices Tooltip
  container.querySelectorAll('.donut-slice').forEach(slice => {
    slice.addEventListener('mouseenter', () => {
      const name = slice.dataset.name;
      const code = slice.dataset.code;
      const hours = slice.dataset.hours;
      const pct = slice.dataset.pct;
      const color = slice.dataset.color;

      tooltip.innerHTML = `
        <div style="display: flex; align-items: center; gap: 6px; font-weight: 600; color: var(--text-primary);">
          <span style="width: 7px; height: 7px; border-radius: 50%; background: ${color};"></span>
          <span>${code ? `[${code}] ` : ''}${name}</span>
        </div>
        <div style="color: var(--text-secondary); margin-top: 2px;">
          <strong>${hours}h</strong> studied (${pct}% of total)
        </div>
      `;

      const rect = slice.getBoundingClientRect();
      tooltip.style.left = `${rect.left + window.scrollX - 20}px`;
      tooltip.style.top = `${rect.top + window.scrollY - tooltip.offsetHeight - 10}px`;
      tooltip.style.display = 'flex';
    });

    slice.addEventListener('mouseleave', () => {
      tooltip.style.display = 'none';
    });
  });
}
