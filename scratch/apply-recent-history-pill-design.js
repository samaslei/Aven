import fs from 'fs';

let trackerJs = fs.readFileSync('js/tracker.js', 'utf-8');

// Ensure distColorMap is calculated in renderTrackerView
const oldRenderTrackerStart = `export function renderTrackerView(container) {
  const activeSubjects = store.getSubjects(false);
  const streakStats = store.getStreakStats();
  const sessions = store.getSessions().sort((a, b) => new Date(b.date + ' ' + (b.created_at || '')) - new Date(a.date + ' ' + (a.created_at || '')));
  const calendarData = store.getYearCalendarMatrix(heatmapYear);`;

const newRenderTrackerStart = `export function renderTrackerView(container) {
  const activeSubjects = store.getSubjects(false);
  const streakStats = store.getStreakStats();
  const sessions = store.getSessions().sort((a, b) => new Date(b.date + ' ' + (b.created_at || '')) - new Date(a.date + ' ' + (a.created_at || '')));
  const calendarData = store.getYearCalendarMatrix(heatmapYear);

  // Compute color mapping consistent with Donut Chart slices
  const allDist = calculateDistributionStats(sessions, 'all', id => store.getSubjectById(id));
  const distColorMap = {};
  allDist.slices.forEach(slice => {
    distColorMap[slice.id] = slice.color;
  });`;

trackerJs = trackerJs.replace(oldRenderTrackerStart, newRenderTrackerStart);

// Update Recent Study History table row rendering
const oldHistoryRow = `              \${sessions.length === 0 ? \`
                <tr>
                  <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 32px;">
                    No study sessions recorded yet. Use the manual study log above!
                  </td>
                </tr>
              \` : sessions.slice(0, 15).map(s => {
                const sub = s.subject_id ? store.getSubjectById(s.subject_id) : null;
                const subId = s.subject_id || 'general';
                const subColor = distColorMap[subId] || (sub && sub.color) || '#8A9A5B';
                const displayName = sub ? (sub.code ? \`\${sub.code} \${sub.name}\` : sub.name) : 'General Study';
                const hrs = Math.floor(s.duration / 60);
                const mins = s.duration % 60;
                const durText = hrs > 0 ? \`\${hrs}h \${mins > 0 ? \`\${mins}m\` : ''}\` : \`\${mins}m\`;

                return \`
                  <tr>
                    <td>
                      <span style="color: \${subColor}; font-weight: 600; font-size: 13px;">\${displayName}</span>
                    </td>
                    <td style="font-family: var(--font-numeric); font-variant-numeric: tabular-nums; font-weight: 600; color: var(--text-primary);">
                      \${durText}
                    </td>
                    <td style="color: var(--text-secondary); font-size: 12.5px;">
                      \${s.date}
                    </td>
                    <td style="color: var(--text-muted); font-size: 12.5px; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                      \${s.notes || '—'}
                    </td>
                    <td style="text-align: right;">
                      <button class="btn btn-ghost btn-sm btn-del-session" data-id="\${s.id}" style="color: var(--danger); padding: 3px 6px;">
                        Delete
                      </button>
                    </td>
                  </tr>
                \`;
              }).join('')}`;

const newHistoryRow = `              \${sessions.length === 0 ? \`
                <tr>
                  <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 32px;">
                    No study sessions recorded yet. Use the manual study log above!
                  </td>
                </tr>
              \` : sessions.slice(0, 15).map(s => {
                const sub = s.subject_id ? store.getSubjectById(s.subject_id) : null;
                const subId = s.subject_id || 'general';
                const subColor = distColorMap[subId] || (sub && sub.color) || '#8A9A5B';
                const pillText = sub ? (sub.code || sub.name) : 'General';
                const subjectName = sub && sub.code ? sub.name : '';
                const hrs = Math.floor(s.duration / 60);
                const mins = s.duration % 60;
                const durText = hrs > 0 ? \`\${hrs}h \${mins > 0 ? \`\${mins}m\` : ''}\` : \`\${mins}m\`;

                return \`
                  <tr>
                    <td>
                      <div class="dist-legend-left" style="display: flex; align-items: center; gap: 8px;">
                        <span class="dist-code-pill" style="background-color: \${subColor}1a; color: \${subColor}; border: 1.2px solid \${subColor}45;">
                          \${pillText}
                        </span>
                        \${subjectName ? \`<span class="dist-subject-name" title="\${sub.name}">\${subjectName}</span>\` : ''}
                      </div>
                    </td>
                    <td style="font-family: var(--font-numeric); font-variant-numeric: tabular-nums; font-weight: 600; color: var(--text-primary);">
                      \${durText}
                    </td>
                    <td style="color: var(--text-secondary); font-size: 12.5px;">
                      \${s.date}
                    </td>
                    <td style="color: var(--text-muted); font-size: 12.5px; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                      \${s.notes || '—'}
                    </td>
                    <td style="text-align: right;">
                      <button class="btn btn-ghost btn-sm btn-del-session" data-id="\${s.id}" style="color: var(--danger); padding: 3px 6px;">
                        Delete
                      </button>
                    </td>
                  </tr>
                \`;
              }).join('')}`;

trackerJs = trackerJs.replace(oldHistoryRow, newHistoryRow);
fs.writeFileSync('js/tracker.js', trackerJs, 'utf-8');

console.log('Successfully copied course code and subject name design from Donut Chart legend to Recent Study History table!');
