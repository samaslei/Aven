import fs from 'fs';

// 1. Update js/grades.js
let gradesJs = fs.readFileSync('js/grades.js', 'utf-8');

const oldSummaryGrid = `      <!-- Overall Standing & Target Solver Grid -->
      <div class="grade-summary-grid">
        <div class="grade-summary-box" style="--standing-color: \${getStandingColor(gradeStats.overallPercentage)};">
          <span class="stat-card-title">Overall Composite Standing</span>
          <div class="phil-grade-display">
            <span class="phil-grade-big" style="color: \${getStandingColor(gradeStats.overallPercentage)};">\${gradeStats.overallPercentage !== null ? \`\${gradeStats.overallPercentage.toFixed(1)}%\` : '—'}</span>
            <span class="phil-grade-desc">· Grade \${gradeStats.philGrade.grade} (\${gradeStats.philGrade.desc})</span>
          </div>
          <div style="margin-top: 8px; font-size: 12.5px; color: var(--text-secondary); display: flex; flex-direction: column; gap: 4px;">
            <div>Midterm (\${config.midterm_weight}%): <strong style="color: \${getStandingColor(midtermPct)};">\${midtermPct !== null ? \`\${midtermPct.toFixed(1)}%\` : 'No Data'}</strong></div>
            <div>Final (\${config.final_weight}%): <strong style="color: \${getStandingColor(finalPct)};">\${finalPct !== null ? \`\${finalPct.toFixed(1)}%\` : 'No Data'}</strong></div>
          </div>
        </div>

        <!-- Target Grade Solver -->
        <div class="grade-summary-box" style="--standing-color: var(--accent);">
          <span class="stat-card-title">Target Grade Solver</span>
          <p style="font-size: 12px; color: var(--text-secondary);">
            Calculate the required Final term score to achieve your desired target subject grade.
          </p>

          <div style="display: flex; align-items: center; gap: 10px; margin-top: 4px;">
            <input type="number" id="target-grade-input" class="form-input" step="0.1" min="0" max="100" value="91.0" placeholder="e.g. 91.0%">
            <button class="btn btn-primary btn-sm" id="btn-solve-target">Solve Target</button>
          </div>

          <div id="target-solver-result" style="margin-top: 8px; font-size: 13px; font-weight: 500;">
            \${calculateTargetScore(midtermPct, config.midterm_weight, config.final_weight, 91.0)}
          </div>
        </div>
      </div>`;

const newSummaryGrid = `      <!-- Overall Standing & Target Solver Grid (Pulse Ring & Minimalist Layout) -->
      <div class="grade-summary-grid">
        <div class="grade-summary-box pulse-card">
          <div class="pulse-card-header">
            <span class="stat-card-title">Academic Standing Pulse</span>
            <span class="stat-pill success">\${gradeStats.philGrade.desc || 'Standing'}</span>
          </div>

          <div class="pulse-main-row">
            <!-- Large Center Pulse Ring (Reference FeedBacker Style) -->
            <div class="pulse-ring-container">
              <div class="pulse-ring-outer">
                <span class="pulse-ring-score">\${gradeStats.overallPercentage !== null ? gradeStats.overallPercentage.toFixed(1) : '—'}</span>
                <span class="pulse-ring-sub">Grade \${gradeStats.philGrade.grade}</span>
              </div>
            </div>

            <!-- Metric Breakdown List with Circular Icon Badges -->
            <div class="pulse-metrics-list">
              <div class="pulse-metric-item">
                <div class="pulse-metric-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path></svg>
                </div>
                <div class="pulse-metric-text">
                  <span class="pulse-metric-val" style="color: \${getStandingColor(midtermPct)};">\${midtermPct !== null ? \`\${midtermPct.toFixed(1)}%\` : '—'}</span>
                  <span class="pulse-metric-lbl">Midterm (\${config.midterm_weight}%)</span>
                </div>
              </div>

              <div class="pulse-metric-item">
                <div class="pulse-metric-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline></svg>
                </div>
                <div class="pulse-metric-text">
                  <span class="pulse-metric-val" style="color: \${getStandingColor(finalPct)};">\${finalPct !== null ? \`\${finalPct.toFixed(1)}%\` : '—'}</span>
                  <span class="pulse-metric-lbl">Final (\${config.final_weight}%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Target Grade Solver -->
        <div class="grade-summary-box">
          <div class="pulse-card-header">
            <span class="stat-card-title">Target Grade Solver</span>
            <span class="stat-pill" style="background: var(--accent-surface); color: var(--accent);">Target 91.0%</span>
          </div>
          <p style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.45;">
            Calculate the required Final term score to achieve your desired target subject grade.
          </p>

          <div style="display: flex; align-items: center; gap: 10px; margin-top: 4px;">
            <input type="number" id="target-grade-input" class="form-input" step="0.1" min="0" max="100" value="91.0" placeholder="e.g. 91.0%">
            <button class="btn btn-primary btn-sm" id="btn-solve-target">Solve Target</button>
          </div>

          <div id="target-solver-result" style="margin-top: 8px; font-size: 13px; font-weight: 500;">
            \${calculateTargetScore(midtermPct, config.midterm_weight, config.final_weight, 91.0)}
          </div>
        </div>
      </div>`;

gradesJs = gradesJs.replace(oldSummaryGrid, newSummaryGrid);
fs.writeFileSync('js/grades.js', gradesJs, 'utf-8');

// 2. Update css/style.css for Pulse Ring & Segmented Progress Bars
let css = fs.readFileSync('css/style.css', 'utf-8');

const oldGradeSummaryCss = `.grade-summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.grade-summary-box {
  background: linear-gradient(145deg, color-mix(in srgb, var(--standing-color, var(--accent)) 16%, var(--bg-surface-elevated)) 0%, color-mix(in srgb, var(--standing-color, var(--accent)) 5%, var(--bg-surface)) 60%, var(--bg-surface) 100%);
  border: none;
  border-radius: var(--radius-lg);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.40), 0 2px 6px -1px rgba(0, 0, 0, 0.28), inset 0 1px 0 color-mix(in srgb, var(--standing-color, var(--accent)) 15%, rgba(255, 255, 255, 0.05));
  transition: all 0.24s cubic-bezier(0.16, 1, 0.3, 1);
}

[data-theme="light"] .grade-summary-box {
  background: linear-gradient(145deg, color-mix(in srgb, var(--standing-color, var(--accent)) 10%, #ffffff) 0%, color-mix(in srgb, var(--standing-color, var(--accent)) 3%, #ffffff) 60%, #ffffff 100%);
  box-shadow: 0 2px 8px -1px rgba(15, 23, 42, 0.05), 0 1px 3px 0 rgba(15, 23, 42, 0.02), inset 0 1px 0 rgba(255, 255, 255, 0.40);
}`;

const newGradeSummaryCss = `.grade-summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

@media (max-width: 800px) {
  .grade-summary-grid {
    grid-template-columns: 1fr;
  }
}

.grade-summary-box {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: 22px 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 14px;
  box-shadow: var(--shadow-sm);
  box-sizing: border-box;
}

.pulse-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.pulse-main-row {
  display: flex;
  align-items: center;
  gap: 22px;
}

/* Company Pulse Circular Progress Ring (Reference Style) */
.pulse-ring-container {
  flex-shrink: 0;
}

.pulse-ring-outer {
  width: 92px;
  height: 92px;
  border-radius: var(--radius-full);
  background: radial-gradient(circle, rgba(134, 138, 103, 0.22) 0%, rgba(134, 138, 103, 0.10) 65%, transparent 70%);
  border: 2px solid rgba(80, 85, 55, 0.25);
  box-shadow: inset 0 0 0 5px var(--bg-surface), 0 2px 8px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  transition: transform 0.2s ease;
}

[data-theme="dark"] .pulse-ring-outer {
  background: radial-gradient(circle, rgba(168, 176, 130, 0.25) 0%, rgba(168, 176, 130, 0.12) 65%, transparent 70%);
  border-color: rgba(168, 176, 130, 0.35);
  box-shadow: inset 0 0 0 5px var(--bg-surface), 0 2px 8px rgba(0, 0, 0, 0.25);
}

.pulse-ring-outer:hover {
  transform: scale(1.04);
}

.pulse-ring-score {
  font-family: var(--font-numeric);
  font-size: 22px;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1;
  letter-spacing: -0.02em;
}

.pulse-ring-sub {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-top: 2px;
  letter-spacing: 0.03em;
}

.pulse-metrics-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.pulse-metric-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pulse-metric-icon {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  background: var(--bg-surface-hover);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pulse-metric-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.pulse-metric-val {
  font-family: var(--font-numeric);
  font-size: 13.5px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.pulse-metric-lbl {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 500;
  line-height: 1.2;
}`;

css = css.replace(oldGradeSummaryCss, newGradeSummaryCss);

// Replace milestone and pomodoro solid purple progress bars with segmented olive tones
const oldMilestoneFill = `.milestone-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
  border-radius: var(--radius-full);
  transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
}`;

const newMilestoneFill = `.milestone-fill {
  height: 100%;
  background: linear-gradient(90deg, #505537 0%, #868a67 55%, #c2c7a4 100%);
  border-radius: var(--radius-full);
  transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
}`;

css = css.replace(oldMilestoneFill, newMilestoneFill);

const oldPomoFill = `.pomo-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
}`;

const newPomoFill = `.pomo-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #505537 0%, #868a67 100%);
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
}`;

css = css.replace(oldPomoFill, newPomoFill);

fs.writeFileSync('css/style.css', css, 'utf-8');
console.log('Successfully applied circular pulse ring and segmented progress bar styling!');
