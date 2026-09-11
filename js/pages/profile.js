/**
 * Aven - Profile Page Controller
 * Displays user identity, academic summary, 6-month study trend, subject grade standings, and recent activity.
 */

import { store, events, getStandingColor } from '../core/store.js';
import { formatRelativeTime } from '../utils/date-utils.js';

// Helper to determine standing badge for overall GWA
function getOverallStandingBadge(rawAvgPct) {
  if (rawAvgPct === null || rawAvgPct === undefined || isNaN(rawAvgPct)) {
    return { label: 'No Graded Subjects', standingClass: 'grade-none', color: 'var(--text-muted)' };
  }
  const pct = Number(rawAvgPct);
  if (pct >= 91.0) {
    return { label: "Dean's Lister", standingClass: 'grade-pass', color: 'var(--success)' };
  }
  if (pct >= 75.0) {
    return { label: 'Good Standing', standingClass: 'grade-pass', color: 'var(--accent)' };
  }
  if (pct >= 60.0) {
    return { label: 'At Risk', standingClass: 'grade-warn', color: 'var(--warning)' };
  }
  return { label: 'Failing', standingClass: 'grade-danger', color: 'var(--danger)' };
}

// Helper to calculate 6-month study time trend
function calculateSixMonthStudyTrend(sessions = []) {
  const now = new Date();
  const months = [];
  const dateMap = {};

  sessions.forEach(s => {
    if (s.date) {
      dateMap[s.date] = (dateMap[s.date] || 0) + Number(s.duration || 0);
    }
  });

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const monthIndex = d.getMonth();
    const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
    const monthName = d.toLocaleDateString('en-US', { month: 'short' });
    const monthFullName = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    let monthMinutes = 0;
    Object.keys(dateMap).forEach(dateStr => {
      if (dateStr.startsWith(monthKey)) {
        monthMinutes += dateMap[dateStr];
      }
    });

    const hours = monthMinutes / 60;

    months.push({
      monthName,
      monthFullName,
      dateKey: monthKey,
      minutes: monthMinutes,
      hours: Number(hours.toFixed(1)),
      hoursFormatted: `${hours.toFixed(1)}h`,
      isCurrentMonth: i === 0
    });
  }

  const maxHours = Math.max(...months.map(m => m.hours));
  const effectiveMax = maxHours > 0 ? maxHours : 1;

  months.forEach(m => {
    m.isMax = m.hours > 0 && m.hours === maxHours;
    m.heightPct = m.hours > 0 ? Math.max(16, Math.min(100, Math.round((m.hours / effectiveMax) * 100))) : 8;
  });

  const totalMinutes = months.reduce((sum, m) => sum + m.minutes, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  return {
    months,
    totalHours
  };
}

// Helper to render sleek, un-distorted responsive line graph for 6-month study time trend
function renderStudyTrendLineGraph(monthlyTrend) {
  const months = monthlyTrend.months;
  const maxHours = Math.max(...months.map(m => m.hours), 0);

  // Compute a clean, even effectiveMax
  let effectiveMax = 4;
  if (maxHours > 0) {
    if (maxHours <= 2) effectiveMax = 2;
    else if (maxHours <= 4) effectiveMax = 4;
    else if (maxHours <= 6) effectiveMax = 6;
    else if (maxHours <= 8) effectiveMax = 8;
    else if (maxHours <= 10) effectiveMax = 10;
    else if (maxHours <= 16) effectiveMax = 16;
    else effectiveMax = Math.ceil(maxHours / 4) * 4;
  }

  const midVal = effectiveMax / 2;
  const midLabel = `${midVal}h`;

  // Pre-calculate percentage coordinates for points (0 to 100)
  const n = months.length;
  const points = months.map((m, idx) => {
    const x = (idx / (n - 1)) * 100;
    const yRatio = effectiveMax > 0 ? (m.hours / effectiveMax) : 0;
    const y = 100 - (yRatio * 100);
    return {
      x,
      y,
      xPct: x.toFixed(2),
      yPct: y.toFixed(2),
      ...m
    };
  });

  // Fritsch-Carlson Monotone Cubic Spline (prevents dipping below 0 and prevents overshoot)
  const dx = [];
  const dy = [];
  const m = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(points[i + 1].x - points[i].x);
    dy.push(points[i + 1].y - points[i].y);
    m.push(dy[i] / dx[i]);
  }

  const d = new Array(n);
  d[0] = m[0];
  d[n - 1] = m[n - 2];

  for (let i = 1; i < n - 1; i++) {
    if (m[i - 1] * m[i] <= 0) {
      d[i] = 0; // Local extremum or flat
    } else {
      d[i] = (m[i - 1] + m[i]) / 2;
    }
  }

  for (let i = 0; i < n - 1; i++) {
    if (dy[i] === 0) {
      d[i] = 0;
      d[i + 1] = 0;
    } else {
      const alpha = d[i] / m[i];
      const beta = d[i + 1] / m[i];
      const h = Math.hypot(alpha, beta);
      if (h > 3) {
        const tau = 3 / h;
        d[i] = tau * alpha * m[i];
        d[i + 1] = tau * beta * m[i];
      }
    }
  }

  let linePath = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < n - 1; i++) {
    const cp1x = points[i].x + dx[i] / 3;
    const cp1y = Math.min(100, Math.max(0, points[i].y + d[i] * dx[i] / 3));
    const cp2x = points[i + 1].x - dx[i] / 3;
    const cp2y = Math.min(100, Math.max(0, points[i + 1].y - d[i + 1] * dx[i] / 3));

    linePath += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${points[i + 1].x.toFixed(2)} ${points[i + 1].y.toFixed(2)}`;
  }

  const areaPath = `${linePath} L 100 100 L 0 100 Z`;
  const hasAnyData = maxHours > 0;

  return `
    <div class="profile-trend-wrapper">
      <!-- Y-Axis Scale Reference Lines & Labels -->
      <div class="profile-trend-grid">
        <div class="profile-trend-grid-row" style="top: 0%;">
          <span class="profile-trend-y-label">${effectiveMax}h</span>
          <div class="profile-trend-grid-line"></div>
        </div>
        <div class="profile-trend-grid-row" style="top: 50%;">
          <span class="profile-trend-y-label">${midLabel}</span>
          <div class="profile-trend-grid-line"></div>
        </div>
        <div class="profile-trend-grid-row" style="top: 100%;">
          <span class="profile-trend-y-label">0h</span>
          <div class="profile-trend-grid-line"></div>
        </div>
      </div>

      <!-- Main Plotting Canvas (SVG path + HTML un-distorted point markers) -->
      <div class="profile-trend-plot">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="profile-trend-svg-path">
          <defs>
            <linearGradient id="profileTrendAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="var(--olive-deep, #505537)" stop-opacity="0.22" />
              <stop offset="80%" stop-color="var(--olive-deep, #505537)" stop-opacity="0.04" />
              <stop offset="100%" stop-color="var(--olive-deep, #505537)" stop-opacity="0.00" />
            </linearGradient>
          </defs>

          <!-- Gradient Area Under Curve -->
          <path d="${areaPath}" fill="url(#profileTrendAreaGrad)" />

          <!-- Main Spline Line (vector-effect prevents stroke distortion) -->
          <path d="${linePath}" fill="none" stroke="var(--olive-deep, #505537)" stroke-width="2.5" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round" />
        </svg>

        <!-- Zero-hours empty hint -->
        ${!hasAnyData ? `
          <div class="profile-trend-empty-hint">No study sessions logged in the last 6 months</div>
        ` : ''}

        <!-- Interactive Point Anchors (Pure HTML/CSS - Never stretched/ovalized) -->
        ${points.map(pt => `
          <div class="profile-trend-point-anchor" style="left: ${pt.xPct}%; top: ${pt.yPct}%;" title="${pt.monthFullName}: ${pt.hoursFormatted}">
            <!-- Vertical Drop Line to Baseline -->
            <div class="profile-trend-drop-line" style="height: calc(${100 - Number(pt.yPct)}% + 2px);"></div>
            
            <!-- Value Label Above Point -->
            ${pt.hours > 0 ? `
              <span class="profile-trend-val-pill ${pt.isCurrentMonth || pt.isMax ? 'is-highlight' : ''}">
                ${pt.hoursFormatted}
              </span>
            ` : ''}

            <!-- Point Dot Circle (guaranteed 100% round) -->
            <div class="profile-trend-dot ${pt.isCurrentMonth ? 'is-current' : ''} ${pt.isMax && pt.hours > 0 ? 'is-peak' : ''}"></div>
          </div>
        `).join('')}
      </div>

      <!-- X-Axis Month Labels Row (Aligned under each point) -->
      <div class="profile-trend-x-axis">
        ${points.map(pt => `
          <div class="profile-trend-x-col" style="left: ${pt.xPct}%;">
            <span class="profile-trend-x-text ${pt.isCurrentMonth ? 'is-current' : ''}">${pt.monthName}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// Helper to get merged, timestamp-sorted activity feed
function getMergedRecentActivity(limit = 8) {
  const rawSessions = store.getSessions();
  const recentGrades = store.getRecentGradeEntries(limit);

  const activities = [];

  // 1. Study Sessions
  rawSessions.forEach(s => {
    const duration = Number(s.duration) || 0;
    const sub = s.subject_id ? store.getSubjectById(s.subject_id) : null;
    const durFormatted = duration >= 60 
      ? `${Math.floor(duration / 60)}h ${duration % 60 > 0 ? `${duration % 60}m` : ''}`.trim()
      : `${duration}m`;

    const noteText = (s.notes && s.notes.trim()) ? s.notes.trim() : 'Logged study session';
    const timestamp = s.created_at || (s.date ? `${s.date}T12:00:00.000Z` : new Date().toISOString());

    activities.push({
      id: `session-${s.id}`,
      type: 'study',
      title: sub ? (sub.code || sub.name) : 'General Study',
      subtext: `${durFormatted} · ${noteText}`,
      subjectColor: sub?.color || 'var(--accent)',
      timestamp,
      targetRoute: 'tracker'
    });
  });

  // 2. Grade Entries
  recentGrades.forEach(g => {
    const timestamp = g.created_at || new Date().toISOString();
    const scorePct = g.percentage.toFixed(1);
    const color = getStandingColor(g.percentage);

    activities.push({
      id: `grade-${g.id}`,
      type: 'grade',
      title: `${g.name} · ${g.subjectCode}`,
      subtext: `Scored ${g.score}/${g.out_of} (${scorePct}%) in ${g.categoryName}`,
      subjectColor: color,
      timestamp,
      targetRoute: `grades?subjectId=${g.subjectId}`
    });
  });

  // Sort by timestamp descending
  activities.sort((a, b) => {
    const tA = new Date(a.timestamp).getTime() || 0;
    const tB = new Date(b.timestamp).getTime() || 0;
    return tB - tA;
  });

  return activities.slice(0, limit);
}

export function renderProfileView(container) {
  const user = store.getUserProfile();
  const activeSubjects = store.getSubjects(false);
  const allSubjects = store.getSubjects(true);
  const academicStanding = store.calculateOverallAcademicStanding();
  const standingInfo = getOverallStandingBadge(academicStanding.rawAvgPct);
  const streakStats = store.getStreakStats();
  const sessions = store.getSessions();
  const monthlyTrend = calculateSixMonthStudyTrend(sessions);
  const recentActivities = getMergedRecentActivity(8);

  // Format "Member since [Month Year]"
  let memberSinceText = 'Student';
  try {
    const createdDate = user.created_at ? new Date(user.created_at) : new Date();
    if (!isNaN(createdDate.getTime())) {
      memberSinceText = `Member since ${createdDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
    }
  } catch (e) {
    memberSinceText = 'Member since 2024';
  }

  const programYearText = `${user.year_level || '1st Year'}${user.program ? ` · ${user.program}` : ''}`;

  container.innerHTML = `
    <div class="profile-page-view" style="display: flex; flex-direction: column; gap: 20px;">

      <!-- 1. Profile Header Hero Card -->
      <div class="profile-header-card tool-card" style="padding: 24px; border-radius: var(--radius-xl); border: var(--border-card); background: var(--bg-surface);">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap;">
          
          <div style="display: flex; align-items: center; gap: 20px; min-width: 0;">
            <!-- Avatar Circle -->
            <div class="profile-avatar-wrapper" style="width: 76px; height: 76px; border-radius: 50%; overflow: hidden; flex-shrink: 0; box-shadow: 0 4px 14px rgba(0,0,0,0.12); display: flex; align-items: center; justify-content: center; background-color: ${user.avatar_url ? 'transparent' : (user.avatar_color && !['#6366f1', '#3b82f6', '#a855f7'].includes(user.avatar_color.toLowerCase()) ? user.avatar_color : 'var(--olive-deep, #505537)')};">
              ${user.avatar_url 
                ? `<img src="${user.avatar_url}" alt="${user.name || 'User'}" class="user-avatar-img" style="width: 100%; height: 100%; object-fit: cover;">`
                : `<span style="font-size: 26px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px;">${user.avatar || 'ST'}</span>`
              }
            </div>

            <!-- Identity Info -->
            <div style="display: flex; flex-direction: column; gap: 6px; min-width: 0;">
              <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                <h2 style="font-size: 22px; font-weight: 700; color: var(--text-primary); margin: 0; letter-spacing: -0.02em;">
                  ${user.name || 'Student'}
                </h2>
              </div>
              <span style="font-size: 13.5px; color: var(--text-secondary);">
                ${user.email || 'student@university.edu'}
              </span>
              <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 4px;">
                <span class="profile-meta-pill">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                    <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                  </svg>
                  ${programYearText}
                </span>
                <span class="profile-meta-pill">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  ${memberSinceText}
                </span>
              </div>
            </div>
          </div>

          <!-- Edit Profile Button -->
          <div style="display: flex; align-items: center; gap: 10px;">
            <button type="button" class="btn btn-secondary" id="btn-edit-profile-action" style="font-size: 13px; font-weight: 550; gap: 6px; padding: 8px 16px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              <span>Edit Profile</span>
            </button>
          </div>

        </div>
      </div>


      <!-- 2. Stat Cards Row (4 cards matching Subjects & Grades pattern) -->
      <div class="stats-banner">
        <!-- Card 1: GWA + Standing Badge -->
        <div class="stat-card">
          <div class="stat-icon-circle stat-icon-gwa">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
              <polyline points="16 7 22 7 22 13"></polyline>
            </svg>
          </div>
          <div class="stat-card-body">
            <span class="stat-card-title">Cumulative GWA</span>
            <div class="stat-card-value" style="display: flex; align-items: baseline; gap: 8px;">
              <span>${academicStanding.gpa !== '—' ? academicStanding.gpa : '—'}</span>
              <span class="subject-standing-pill ${standingInfo.standingClass}" style="font-size: 11px; padding: 2px 7px; font-weight: 550;">
                ${standingInfo.label}
              </span>
            </div>
            <span class="stat-card-subtitle">
              ${academicStanding.gradedSubjects > 0 ? `${academicStanding.gradedSubjects} of ${academicStanding.totalSubjects} subjects graded (${academicStanding.avgPct})` : 'No subject grades calculated yet'}
            </span>
          </div>
        </div>

        <!-- Card 2: Total Study Time -->
        <div class="stat-card">
          <div class="stat-icon-circle stat-icon-study-time">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div class="stat-card-body">
            <span class="stat-card-title">Total Study Time</span>
            <div class="stat-card-value">${streakStats.totalHours}h</div>
            <span class="stat-card-subtitle">${streakStats.totalSessions} sessions logged all-time</span>
          </div>
        </div>

        <!-- Card 3: Enrolled Subjects -->
        <div class="stat-card">
          <div class="stat-icon-circle stat-icon-subjects">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
          </div>
          <div class="stat-card-body">
            <span class="stat-card-title">Enrolled Subjects</span>
            <div class="stat-card-value">${activeSubjects.length} Active</div>
            <span class="stat-card-subtitle">${allSubjects.length} total courses in record</span>
          </div>
        </div>

        <!-- Card 4: Study Streak -->
        <div class="stat-card">
          <div class="stat-icon-circle stat-icon-streak">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
            </svg>
          </div>
          <div class="stat-card-body">
            <span class="stat-card-title">Study Streak</span>
            <div class="stat-card-value">${streakStats.currentStreak} ${streakStats.currentStreak === 1 ? 'day' : 'days'}</div>
            <span class="stat-card-subtitle">Personal best: ${streakStats.longestStreak} days streak</span>
          </div>
        </div>
      </div>


      <!-- 3. Two-Column Analytics Layout -->
      <div class="profile-dashboard-grid" style="display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: 16px; align-items: start;">

        <!-- Left Column: Study Trend + Recent Activity -->
        <div style="display: flex; flex-direction: column; gap: 16px; min-width: 0;">

          <!-- Card: 6-Month Study Time Trend (SVG Line Graph) -->
          <div class="tool-card weekly-hours-card" style="padding: 20px 22px; border-radius: var(--radius-xl); border: var(--border-card); background: var(--bg-surface);">
            <div class="weekly-hours-header">
              <div class="card-header-label" style="margin-bottom: 0;">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                  <polyline points="16 7 22 7 22 13"></polyline>
                </svg>
                <span>STUDY TIME TREND</span>
              </div>
              <span class="weekly-hours-total-badge">${monthlyTrend.totalHours}h total &middot; last 6 months</span>
            </div>

            <div class="profile-trend-chart-container">
              ${renderStudyTrendLineGraph(monthlyTrend)}
            </div>
          </div>

          <!-- Card: Recent Activity (Merged Study Logs + Graded Entries) -->
          <div class="tool-card" style="padding: 20px 22px; border-radius: var(--radius-xl); border: var(--border-card); background: var(--bg-surface);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
              <div class="card-header-label" style="margin-bottom: 0;">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
                <span>RECENT ACTIVITY</span>
              </div>
              <span style="font-size: 11.5px; color: var(--text-muted); font-weight: 550;">Latest ${recentActivities.length} actions</span>
            </div>

            <div class="profile-activity-list" style="display: flex; flex-direction: column; gap: 8px;">
              ${recentActivities.length === 0 ? `
                <div style="text-align: center; padding: 28px 16px; color: var(--text-muted); font-size: 13px;">
                  No study sessions or grade entries recorded yet.
                </div>
              ` : recentActivities.map(act => {
                const relTime = formatRelativeTime(act.timestamp) || 'Recent';
                const isStudy = act.type === 'study';

                return `
                  <div class="profile-activity-item" data-route="${act.targetRoute}" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 12px; border-radius: var(--radius-md); cursor: pointer; transition: var(--transition);">
                    <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">
                      <!-- Type Icon (No blue/purple - warm olive/sage/green) -->
                      <div style="width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background-color: ${isStudy ? 'rgba(80, 85, 55, 0.12)' : 'rgba(71, 104, 59, 0.12)'}; color: ${isStudy ? 'var(--olive-deep, #505537)' : 'var(--success, #47683b)'};">
                        ${isStudy ? `
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                        ` : `
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <polyline points="9 15 11 17 15 13"></polyline>
                          </svg>
                        `}
                      </div>
                      
                      <!-- Activity Details -->
                      <div style="display: flex; flex-direction: column; gap: 2px; min-width: 0;">
                        <span style="font-size: 13px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                          ${act.title}
                        </span>
                        <span style="font-size: 11.5px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                          ${act.subtext}
                        </span>
                      </div>
                    </div>

                    <!-- Timestamp Badge -->
                    <span style="font-size: 11px; color: var(--text-muted); font-family: var(--font-numeric); white-space: nowrap; flex-shrink: 0;">
                      ${relTime}
                    </span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

        </div>


        <!-- Right Column: Grade Standing by Subject -->
        <div style="display: flex; flex-direction: column; gap: 16px; min-width: 0;">

          <div class="tool-card" style="padding: 20px 22px; border-radius: var(--radius-xl); border: var(--border-card); background: var(--bg-surface);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
              <div class="card-header-label" style="margin-bottom: 0;">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
                <span>SUBJECT GRADE STANDINGS</span>
              </div>
              <span class="overview-count-badge" style="font-size: 11px; font-weight: 600; padding: 2px 7px; border-radius: 999px; background: var(--bg-app); border: 1px solid var(--border-subtle); color: var(--text-secondary);">
                ${activeSubjects.length}
              </span>
            </div>

            <div class="profile-subject-list" style="display: flex; flex-direction: column; gap: 8px;">
              ${activeSubjects.length === 0 ? `
                <div style="text-align: center; padding: 32px 16px; color: var(--text-muted); font-size: 13px;">
                  No active subjects found. Enroll courses to see grade standings.
                </div>
              ` : activeSubjects.map(sub => {
                const subStats = store.calculateSubjectGrade(sub.id);
                const pct = subStats.overallPercentage;
                const standingColor = pct !== null ? getStandingColor(pct) : 'var(--text-muted)';
                const philGrade = (subStats.philGrade && subStats.philGrade.grade !== '—') ? subStats.philGrade.grade : null;
                // Sage green per-subject color coding (no blue/purple)
                const dotColor = (sub.color && !['#6366f1', '#3b82f6', '#a855f7', '#06b6d4'].includes(sub.color.toLowerCase())) ? sub.color : 'var(--olive-mid, #8A9A5B)';

                return `
                  <div class="profile-subject-row" data-subject-id="${sub.id}" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 11px 14px; border-radius: var(--radius-md); cursor: pointer; transition: var(--transition);">
                    <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">
                      <span style="width: 8px; height: 8px; border-radius: 50%; background-color: ${dotColor}; flex-shrink: 0;"></span>
                      <div style="display: flex; flex-direction: column; gap: 1px; min-width: 0;">
                        <span style="font-size: 13px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                          ${sub.code || sub.name}
                        </span>
                        ${sub.code ? `<span style="font-size: 11px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${sub.name}</span>` : ''}
                      </div>
                    </div>

                    <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
                      ${philGrade ? `
                        <span style="font-size: 11px; font-weight: 600; padding: 1px 6px; border-radius: 4px; background: var(--bg-surface); border: 1px solid var(--border-subtle); color: var(--text-secondary);">
                          ${philGrade}
                        </span>
                      ` : ''}
                      <span style="font-size: 13px; font-weight: 600; color: ${standingColor}; font-family: var(--font-numeric);">
                        ${pct !== null ? `${pct.toFixed(1)}%` : '—'}
                      </span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

        </div>

      </div>

    </div>
  `;

  // Attach DOM Event Listeners
  const editBtn = container.querySelector('#btn-edit-profile-action');
  editBtn?.addEventListener('click', () => {
    window.location.hash = 'settings';
  });

  // Navigate to Grades when clicking a subject in standings
  container.querySelectorAll('.profile-subject-row').forEach(row => {
    row.addEventListener('click', () => {
      const subjectId = row.dataset.subjectId;
      if (subjectId) {
        window.location.hash = `grades?subjectId=${subjectId}`;
      }
    });
  });

  // Navigate to target route on activity click
  container.querySelectorAll('.profile-activity-item').forEach(item => {
    item.addEventListener('click', () => {
      const route = item.dataset.route;
      if (route) {
        window.location.hash = route;
      }
    });
  });
}
