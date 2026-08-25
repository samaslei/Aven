import fs from 'fs';

// 1. UPDATE js/ui/skeleton.js
const updatedSkeletonJs = `/**
 * Aven - Route-Aware Startup Skeleton Generator
 * Renders clean, data-driven skeleton placeholders during initial workspace bootstrap.
 */

export function renderStartupSkeleton(targetRoute) {
  const hashRoute = window.location.hash.replace('#', '') || 'subjects';
  const route = targetRoute || hashRoute;
  const validRoutes = ['subjects', 'tracker', 'grades', 'plans', 'settings'];
  const activeRoute = validRoutes.includes(route) ? route : 'subjects';

  // Highlight active nav item in skeleton sidebar
  const navItems = document.querySelectorAll('#sk-nav-list .sk-nav-item');
  const navIndices = { subjects: 0, tracker: 1, grades: 2, plans: 3, settings: 4 };
  const activeIdx = navIndices[activeRoute] !== undefined ? navIndices[activeRoute] : 0;
  navItems.forEach((item, idx) => {
    item.classList.toggle('active', idx === activeIdx);
  });

  const mainEl = document.getElementById('startup-skeleton-main');
  if (!mainEl) return;

  const skeletonTemplates = {
    subjects: \`
      <div class="sk-header">
        <div class="sk-header-titles">
          <div class="sk-block sk-title" style="width: 140px;"></div>
          <div class="sk-block sk-subtitle" style="width: 380px;"></div>
        </div>
        <div class="sk-header-actions">
          <div class="sk-block sk-badge" style="width: 110px;"></div>
          <div class="sk-block sk-btn" style="width: 120px;"></div>
        </div>
      </div>
      <div class="sk-body">
        <div class="sk-stats-row">
          <div class="sk-block sk-stat-card"></div>
          <div class="sk-block sk-stat-card"></div>
          <div class="sk-block sk-stat-card"></div>
          <div class="sk-block sk-stat-card"></div>
        </div>
        <div class="sk-cards-grid">
          <div class="sk-card" style="min-height: 290px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div class="sk-block" style="width:60px;height:20px;border-radius:12px;"></div>
              <div class="sk-block" style="width:70px;height:18px;border-radius:12px;"></div>
            </div>
            <div class="sk-block" style="width:85%;height:16px;border-radius:4px;margin-top:12px;"></div>
            <div class="sk-block" style="width:55%;height:14px;border-radius:4px;margin-top:6px;"></div>
            <div class="sk-block" style="width:100%;height:6px;border-radius:4px;margin-top:18px;"></div>
            <div style="display:flex;justify-content:space-between;margin-top:auto;padding-top:14px;border-top:1px solid var(--border-subtle);">
              <div class="sk-block" style="width:70px;height:14px;border-radius:4px;"></div>
              <div class="sk-block" style="width:50px;height:14px;border-radius:4px;"></div>
            </div>
          </div>
          <div class="sk-card" style="min-height: 290px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div class="sk-block" style="width:60px;height:20px;border-radius:12px;"></div>
              <div class="sk-block" style="width:70px;height:18px;border-radius:12px;"></div>
            </div>
            <div class="sk-block" style="width:80%;height:16px;border-radius:4px;margin-top:12px;"></div>
            <div class="sk-block" style="width:60%;height:14px;border-radius:4px;margin-top:6px;"></div>
            <div class="sk-block" style="width:100%;height:6px;border-radius:4px;margin-top:18px;"></div>
            <div style="display:flex;justify-content:space-between;margin-top:auto;padding-top:14px;border-top:1px solid var(--border-subtle);">
              <div class="sk-block" style="width:70px;height:14px;border-radius:4px;"></div>
              <div class="sk-block" style="width:50px;height:14px;border-radius:4px;"></div>
            </div>
          </div>
          <div class="sk-card" style="min-height: 290px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div class="sk-block" style="width:60px;height:20px;border-radius:12px;"></div>
              <div class="sk-block" style="width:70px;height:18px;border-radius:12px;"></div>
            </div>
            <div class="sk-block" style="width:75%;height:16px;border-radius:4px;margin-top:12px;"></div>
            <div class="sk-block" style="width:45%;height:14px;border-radius:4px;margin-top:6px;"></div>
            <div class="sk-block" style="width:100%;height:6px;border-radius:4px;margin-top:18px;"></div>
            <div style="display:flex;justify-content:space-between;margin-top:auto;padding-top:14px;border-top:1px solid var(--border-subtle);">
              <div class="sk-block" style="width:70px;height:14px;border-radius:4px;"></div>
              <div class="sk-block" style="width:50px;height:14px;border-radius:4px;"></div>
            </div>
          </div>
        </div>
      </div>
    \`,
    tracker: \`
      <div class="sk-header">
        <div class="sk-header-titles">
          <div class="sk-block sk-title" style="width: 170px;"></div>
          <div class="sk-block sk-subtitle" style="width: 420px;"></div>
        </div>
        <div class="sk-header-actions">
          <div class="sk-block sk-badge" style="width: 90px;"></div>
        </div>
      </div>
      <div class="sk-body">
        <!-- Top Operational Tools Row (Bentodoro + Milestone + Manual Log) -->
        <div class="sk-tracker-tools-row">
          <!-- Bentodoro Tile -->
          <div class="sk-card" style="height: 250px;">
            <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:12px;border-bottom:1px solid var(--border-subtle);">
              <div class="sk-block" style="width:110px;height:14px;border-radius:4px;"></div>
              <div class="sk-block" style="width:120px;height:24px;border-radius:12px;"></div>
            </div>
            <div style="display:flex;justify-content:center;align-items:center;margin:16px 0;">
              <div class="sk-block" style="width:140px;height:46px;border-radius:8px;"></div>
            </div>
            <div style="display:flex;gap:10px;margin-top:auto;">
              <div class="sk-block" style="flex:1;height:34px;border-radius:18px;"></div>
              <div class="sk-block" style="width:60px;height:34px;border-radius:18px;"></div>
            </div>
          </div>

          <!-- Journey to Milestone Card -->
          <div class="sk-card" style="height: 250px;">
            <div style="display:flex;align-items:center;padding-bottom:12px;border-bottom:1px solid var(--border-subtle);">
              <div class="sk-block" style="width:150px;height:14px;border-radius:4px;"></div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:16px;">
              <div class="sk-block" style="width:90px;height:28px;border-radius:4px;"></div>
              <div class="sk-block" style="width:70px;height:14px;border-radius:4px;"></div>
            </div>
            <div class="sk-block" style="width:100%;height:8px;border-radius:4px;margin-top:12px;"></div>
            <div class="sk-block" style="width:80%;height:12px;border-radius:4px;margin-top:auto;"></div>
          </div>

          <!-- Manual Study Log Card -->
          <div class="sk-card" style="height: 250px;">
            <div style="display:flex;align-items:center;padding-bottom:12px;border-bottom:1px solid var(--border-subtle);">
              <div class="sk-block" style="width:130px;height:14px;border-radius:4px;"></div>
            </div>
            <div class="sk-block" style="width:100%;height:30px;border-radius:6px;margin:10px 0 6px 0;"></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
              <div class="sk-block" style="height:30px;border-radius:6px;"></div>
              <div class="sk-block" style="height:30px;border-radius:6px;"></div>
            </div>
            <div class="sk-block" style="width:100%;height:34px;border-radius:18px;margin-top:auto;"></div>
          </div>
        </div>

        <!-- Analytics Row (Yearly Heatmap + Distribution) -->
        <div class="sk-tracker-analytics-row">
          <div class="sk-block sk-heatmap-block" style="flex:1.4; min-height: 190px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
              <div class="sk-block" style="width:130px;height:14px;border-radius:4px;"></div>
              <div class="sk-block" style="width:100px;height:22px;border-radius:6px;"></div>
            </div>
            <div class="sk-block" style="width:100%;height:110px;border-radius:6px;opacity:0.6;"></div>
          </div>
          <div class="sk-card" style="flex:1; min-height: 190px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
              <div class="sk-block" style="width:140px;height:14px;border-radius:4px;"></div>
              <div class="sk-block" style="width:90px;height:22px;border-radius:6px;"></div>
            </div>
            <div style="display:flex;align-items:center;gap:16px;">
              <div class="sk-block" style="width:100px;height:100px;border-radius:50%;flex-shrink:0;"></div>
              <div style="display:flex;flex-direction:column;gap:8px;flex:1;">
                <div class="sk-block" style="width:100%;height:16px;border-radius:4px;"></div>
                <div class="sk-block" style="width:80%;height:16px;border-radius:4px;"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    \`,
    grades: \`
      <div class="sk-header">
        <div class="sk-header-titles">
          <div class="sk-block sk-title" style="width: 130px;"></div>
          <div class="sk-block sk-subtitle" style="width: 440px;"></div>
        </div>
        <div class="sk-header-actions">
          <div class="sk-block sk-badge" style="width: 90px; height: 30px;"></div>
          <div class="sk-block sk-btn" style="width: 120px; height: 30px;"></div>
        </div>
      </div>
      <div class="sk-body">
        <div class="sk-grades-layout">
          <!-- Left Sidebar Subjects -->
          <div class="sk-card" style="height: 480px; gap: 10px; padding: 16px;">
            <div class="sk-block" style="width:120px;height:14px;border-radius:4px;margin-bottom:8px;"></div>
            <div class="sk-block" style="width:100%;height:48px;border-radius:8px;opacity:0.9;"></div>
            <div class="sk-block" style="width:100%;height:48px;border-radius:8px;opacity:0.7;"></div>
            <div class="sk-block" style="width:100%;height:48px;border-radius:8px;opacity:0.5;"></div>
          </div>

          <!-- Right Grade Breakdown Pane -->
          <div style="display:flex;flex-direction:column;gap:14px;">
            <!-- Browser Tab Strip -->
            <div style="display:flex;gap:6px;">
              <div class="sk-block" style="width:140px;height:34px;border-radius:8px 8px 0 0;opacity:0.95;"></div>
              <div class="sk-block" style="width:130px;height:34px;border-radius:8px 8px 0 0;opacity:0.5;"></div>
              <div class="sk-block" style="width:150px;height:34px;border-radius:8px 8px 0 0;opacity:0.5;"></div>
            </div>

            <!-- Panel Content Box -->
            <div class="sk-card" style="padding: 24px; gap: 16px; min-height: 430px;">
              <!-- Breakdown Header -->
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <div class="sk-block" style="width:260px;height:20px;border-radius:4px;"></div>
                <div class="sk-block" style="width:130px;height:16px;border-radius:4px;"></div>
              </div>

              <!-- Category Section 1 (Expanded with Entries) -->
              <div class="sk-block" style="width:100%;border-radius:8px;padding:12px;background:var(--bg-surface-hover);display:flex;flex-direction:column;gap:10px;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <div style="display:flex;align-items:center;gap:8px;">
                    <div class="sk-block" style="width:14px;height:14px;border-radius:2px;"></div>
                    <div class="sk-block" style="width:140px;height:16px;border-radius:4px;"></div>
                  </div>
                  <div class="sk-block" style="width:60px;height:18px;border-radius:10px;"></div>
                </div>
                <div class="sk-block" style="width:100%;height:28px;border-radius:4px;opacity:0.6;"></div>
                <div class="sk-block" style="width:100%;height:28px;border-radius:4px;opacity:0.6;"></div>
              </div>

              <!-- Category Section 2 (Collapsed) -->
              <div class="sk-block" style="width:100%;height:44px;border-radius:8px;background:var(--bg-surface-hover);"></div>

              <!-- Bottom Summary Card -->
              <div class="sk-block" style="width:100%;height:68px;border-radius:10px;margin-top:auto;opacity:0.85;"></div>
            </div>
          </div>
        </div>
      </div>
    \`,
    plans: \`
      <div class="sk-header">
        <div class="sk-header-titles">
          <div class="sk-block sk-title" style="width: 150px;"></div>
          <div class="sk-block sk-subtitle" style="width: 400px;"></div>
        </div>
        <div class="sk-header-actions">
          <div class="sk-block sk-btn" style="width: 130px;"></div>
        </div>
      </div>
      <div class="sk-body">
        <div class="sk-plans-layout">
          <div class="sk-card" style="height: 380px; gap: 10px;">
            <div class="sk-block" style="width:110px;height:16px;border-radius:4px;margin-bottom:6px;"></div>
            <div class="sk-block" style="width:100%;height:46px;border-radius:6px;opacity:0.9;"></div>
            <div class="sk-block" style="width:100%;height:46px;border-radius:6px;opacity:0.6;"></div>
          </div>
          <div class="sk-card" style="height: 380px; padding: 24px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
              <div class="sk-block" style="width:180px;height:20px;border-radius:4px;"></div>
              <div class="sk-block" style="width:90px;height:28px;border-radius:6px;"></div>
            </div>
            <div class="sk-block" style="width:100%;height:180px;border-radius:8px;opacity:0.7;margin-bottom:16px;"></div>
          </div>
        </div>
      </div>
    \`,
    settings: \`
      <div class="sk-header">
        <div class="sk-header-titles">
          <div class="sk-block sk-title" style="width: 120px;"></div>
          <div class="sk-block sk-subtitle" style="width: 360px;"></div>
        </div>
      </div>
      <div class="sk-body">
        <div class="sk-settings-layout">
          <div class="sk-card" style="height: 140px;">
            <div class="sk-block" style="width:160px;height:18px;border-radius:4px;margin-bottom:8px;"></div>
            <div class="sk-block" style="width:240px;height:12px;border-radius:4px;margin-bottom:16px;"></div>
            <div style="display:flex;gap:12px;">
              <div class="sk-block" style="width:100px;height:36px;border-radius:6px;"></div>
              <div class="sk-block" style="width:100px;height:36px;border-radius:6px;"></div>
            </div>
          </div>
        </div>
      </div>
    \`
  };

  mainEl.innerHTML = skeletonTemplates[activeRoute] || skeletonTemplates.subjects;
}
`;

fs.writeFileSync('js/ui/skeleton.js', updatedSkeletonJs, 'utf-8');

// 2. UPDATE css/style.css skeleton styles
let css = fs.readFileSync('css/style.css', 'utf-8');

css = css.replace(
  `background: rgba(99, 102, 241, 0.18);\n  border: 1px solid rgba(99, 102, 241, 0.25);`,
  `background: var(--accent-surface);\n  border: 1px solid var(--border-default);`
);

if (!css.includes('.sk-tracker-analytics-row')) {
  css += `
/* Skeleton Grid Helpers */
.sk-tracker-analytics-row {
  display: flex;
  gap: 20px;
  width: 100%;
}

@media (max-width: 900px) {
  .sk-tracker-analytics-row {
    flex-direction: column;
  }
}
`;
}

fs.writeFileSync('css/style.css', css, 'utf-8');

console.log('Successfully updated site startup loading skeletons!');
