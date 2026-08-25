import fs from 'fs';

let trackerJs = fs.readFileSync('js/tracker.js', 'utf-8');

const oldHtml = `    <div class="tracker-layout">
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
              <span class="year-nav-label" id="heatmap-year-display">\${heatmapYear}</span>
              <button class="year-nav-btn" id="btn-year-next" title="Next Year" \${heatmapYear >= new Date().getFullYear() ? 'disabled' : ''}>
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
            \${calendarData.totalSessions} sessions &middot; \${calendarData.totalHours}h studied in \${heatmapYear}
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
              \${calendarData.months.map(m => renderMonthBlock(m)).join('')}
            </div>
          </div>

          <!-- Dynamic Hover Tooltip -->
          <div class="heatmap-tooltip" id="heatmap-tooltip"></div>
        </div>

        <!-- Study Time Distribution Pie/Donut Chart Card -->
        \${renderDistributionCard(sessions)}
      </div>

      <!-- Tracker Action Row: Pomodoro Timer + Milestone Progress + Manual Study Log (3-Column Grid) -->
      <div class="tracker-tools-grid">
        <!-- Simple Pomodoro Timer Card (Left) -->
        \${renderPomodoroCard(activeSubjects)}

        <!-- Journey to Next Milestone Card (Middle) -->
        \${renderMilestoneCard(sessions)}

        <!-- Manual Log Entry (Hours + Minutes Side-by-Side) -->
        <div class="tool-card manual-log-card">
          <div class="card-header-label manual-log-header-label">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            <span>MANUAL STUDY LOG</span>
          </div>

          <form id="manual-session-form">
            <!-- Paired Inputs: Subject & Date Side-by-Side -->
            <div class="form-row-paired">
              <div class="form-group">
                <label class="form-label" for="manual-subject-select">Subject</label>
                <select id="manual-subject-select" class="form-select">
                  \${renderSubjectSelectOptions(activeSubjects, selectedSubjectId, true)}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="manual-date">Date *</label>
                <input type="date" id="manual-date" class="form-input" value="\${todayStr}" max="\${todayStr}" required>
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
      </div>`;

const newHtml = `    <div class="tracker-layout">
      <!-- Tracker Action Top Row: Bentodoro Timer + Milestone Progress + Manual Study Log (3-Column Grid) -->
      <div class="tracker-tools-grid">
        <!-- Bentodoro Timer Card (Left) -->
        \${renderPomodoroCard(activeSubjects)}

        <!-- Journey to Next Milestone Card (Middle) -->
        \${renderMilestoneCard(sessions)}

        <!-- Manual Log Entry (Hours + Minutes Side-by-Side) -->
        <div class="tool-card manual-log-card">
          <div class="card-header-label manual-log-header-label">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            <span>MANUAL STUDY LOG</span>
          </div>

          <form id="manual-session-form">
            <!-- Paired Inputs: Subject & Date Side-by-Side -->
            <div class="form-row-paired">
              <div class="form-group">
                <label class="form-label" for="manual-subject-select">Subject</label>
                <select id="manual-subject-select" class="form-select">
                  \${renderSubjectSelectOptions(activeSubjects, selectedSubjectId, true)}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="manual-date">Date *</label>
                <input type="date" id="manual-date" class="form-input" value="\${todayStr}" max="\${todayStr}" required>
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

      <!-- 2-Column Analytics Bottom Row: Full-Year Activity Heatmap (Left) + Study Time Distribution (Right) -->
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
              <span class="year-nav-label" id="heatmap-year-display">\${heatmapYear}</span>
              <button class="year-nav-btn" id="btn-year-next" title="Next Year" \${heatmapYear >= new Date().getFullYear() ? 'disabled' : ''}>
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
            \${calendarData.totalSessions} sessions &middot; \${calendarData.totalHours}h studied in \${heatmapYear}
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
              \${calendarData.months.map(m => renderMonthBlock(m)).join('')}
            </div>
          </div>

          <!-- Dynamic Hover Tooltip -->
          <div class="heatmap-tooltip" id="heatmap-tooltip"></div>
        </div>

        <!-- Study Time Distribution Pie/Donut Chart Card -->
        \${renderDistributionCard(sessions)}
      </div>`;

trackerJs = trackerJs.replace(oldHtml, newHtml);
fs.writeFileSync('js/tracker.js', trackerJs, 'utf-8');

console.log('Successfully swapped Study Tracker rows: operational tools at the top, analytics at the bottom!');
