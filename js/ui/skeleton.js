/**
 * Aven - Route-Aware Startup Skeleton Generator
 * Renders clean, data-driven skeleton placeholders mirroring current card geometry during initial workspace bootstrap.
 */

export function renderStartupSkeleton(targetRoute) {
  const hashRoute = window.location.hash.replace('#', '') || 'subjects';
  const route = targetRoute || hashRoute;
  const validRoutes = ['subjects', 'tracker', 'grades', 'schedule', 'plans', 'settings'];
  const activeRoute = validRoutes.includes(route) ? route : 'subjects';

  // Highlight active nav item in skeleton top nav bar
  const navItems = document.querySelectorAll('#sk-nav-list .sk-nav-pill');
  const navIndices = { subjects: 0, tracker: 1, grades: 2, schedule: 3, plans: 3, settings: -1 };
  const activeIdx = navIndices[activeRoute] !== undefined ? navIndices[activeRoute] : 0;
  navItems.forEach((item, idx) => {
    item.classList.toggle('active', idx === activeIdx);
  });

  const mainEl = document.getElementById('startup-skeleton-main');
  if (!mainEl) return;

  const skeletonTemplates = {
    subjects: `
      <!-- Header -->
      <div class="sk-header">
        <div class="sk-header-titles">
          <div class="sk-block sk-title" style="width: 130px; height: 28px; border-radius: 6px;"></div>
          <div class="sk-block sk-subtitle" style="width: 340px; height: 14px; border-radius: 4px;"></div>
        </div>
        <div class="sk-header-actions">
          <div class="sk-block" style="width: 140px; height: 34px; border-radius: 999px;"></div>
          <div class="sk-block" style="width: 125px; height: 34px; border-radius: 999px;"></div>
        </div>
      </div>

      <div class="sk-body">
        <!-- 4 Stat Cards Row: Exact Geometry (circular icon badge + label + big number + subtitle) -->
        <div class="stats-banner">
          <div class="stat-card">
            <div class="sk-block" style="width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;"></div>
            <div class="stat-card-body">
              <div class="sk-block" style="width: 95px; height: 12px; border-radius: 4px;"></div>
              <div class="sk-block" style="width: 75px; height: 24px; border-radius: 6px; margin: 3px 0;"></div>
              <div class="sk-block" style="width: 130px; height: 11px; border-radius: 4px; opacity: 0.7;"></div>
            </div>
          </div>
          <div class="stat-card">
            <div class="sk-block" style="width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;"></div>
            <div class="stat-card-body">
              <div class="sk-block" style="width: 105px; height: 12px; border-radius: 4px;"></div>
              <div class="sk-block" style="width: 65px; height: 24px; border-radius: 6px; margin: 3px 0;"></div>
              <div class="sk-block" style="width: 140px; height: 11px; border-radius: 4px; opacity: 0.7;"></div>
            </div>
          </div>
          <div class="stat-card">
            <div class="sk-block" style="width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;"></div>
            <div class="stat-card-body">
              <div class="sk-block" style="width: 110px; height: 12px; border-radius: 4px;"></div>
              <div class="sk-block" style="width: 70px; height: 24px; border-radius: 6px; margin: 3px 0;"></div>
              <div class="sk-block" style="width: 120px; height: 11px; border-radius: 4px; opacity: 0.7;"></div>
            </div>
          </div>
          <div class="stat-card">
            <div class="sk-block" style="width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;"></div>
            <div class="stat-card-body">
              <div class="sk-block" style="width: 90px; height: 12px; border-radius: 4px;"></div>
              <div class="sk-block" style="width: 80px; height: 24px; border-radius: 6px; margin: 3px 0;"></div>
              <div class="sk-block" style="width: 135px; height: 11px; border-radius: 4px; opacity: 0.7;"></div>
            </div>
          </div>
        </div>

        <!-- Subject Cards Grid: 3 Subject Cards matching exact geometry -->
        <div class="subjects-grid">
          <div class="subject-card">
            <div class="subject-card-header-row">
              <div class="sk-block" style="width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;"></div>
              <div class="subject-title-area" style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
                <div class="sk-block" style="width: 50px; height: 14px; border-radius: 4px;"></div>
                <div class="sk-block" style="width: 75%; height: 18px; border-radius: 4px;"></div>
                <div class="sk-block" style="width: 45%; height: 12px; border-radius: 4px; opacity: 0.6;"></div>
              </div>
            </div>
            <div class="subject-meta-pills" style="margin: 12px 0;">
              <div class="sk-block" style="width: 120px; height: 22px; border-radius: 999px;"></div>
            </div>
            <div class="subject-metrics-strip">
              <div class="subject-metric-col" style="display: flex; flex-direction: column; gap: 4px;">
                <div class="sk-block" style="width: 58px; height: 10px; border-radius: 3px;"></div>
                <div class="sk-block" style="width: 40px; height: 16px; border-radius: 4px;"></div>
              </div>
              <div class="subject-metric-col" style="display: flex; flex-direction: column; gap: 4px;">
                <div class="sk-block" style="width: 54px; height: 10px; border-radius: 3px;"></div>
                <div class="sk-block" style="width: 60px; height: 16px; border-radius: 4px;"></div>
              </div>
              <div class="subject-metric-col" style="display: flex; flex-direction: column; gap: 4px;">
                <div class="sk-block" style="width: 36px; height: 10px; border-radius: 3px;"></div>
                <div class="sk-block" style="width: 48px; height: 16px; border-radius: 4px;"></div>
              </div>
            </div>
            <div class="subject-card-actions" style="margin-top: auto; padding-top: 14px; display: flex; gap: 8px;">
              <div class="sk-block" style="width: 56px; height: 28px; border-radius: 999px;"></div>
              <div class="sk-block" style="width: 66px; height: 28px; border-radius: 999px;"></div>
              <div class="sk-block" style="width: 60px; height: 28px; border-radius: 999px;"></div>
            </div>
          </div>

          <div class="subject-card">
            <div class="subject-card-header-row">
              <div class="sk-block" style="width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;"></div>
              <div class="subject-title-area" style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
                <div class="sk-block" style="width: 55px; height: 14px; border-radius: 4px;"></div>
                <div class="sk-block" style="width: 82%; height: 18px; border-radius: 4px;"></div>
                <div class="sk-block" style="width: 50%; height: 12px; border-radius: 4px; opacity: 0.6;"></div>
              </div>
            </div>
            <div class="subject-meta-pills" style="margin: 12px 0;">
              <div class="sk-block" style="width: 120px; height: 22px; border-radius: 999px;"></div>
            </div>
            <div class="subject-metrics-strip">
              <div class="subject-metric-col" style="display: flex; flex-direction: column; gap: 4px;">
                <div class="sk-block" style="width: 58px; height: 10px; border-radius: 3px;"></div>
                <div class="sk-block" style="width: 44px; height: 16px; border-radius: 4px;"></div>
              </div>
              <div class="subject-metric-col" style="display: flex; flex-direction: column; gap: 4px;">
                <div class="sk-block" style="width: 54px; height: 10px; border-radius: 3px;"></div>
                <div class="sk-block" style="width: 56px; height: 16px; border-radius: 4px;"></div>
              </div>
              <div class="subject-metric-col" style="display: flex; flex-direction: column; gap: 4px;">
                <div class="sk-block" style="width: 36px; height: 10px; border-radius: 3px;"></div>
                <div class="sk-block" style="width: 42px; height: 16px; border-radius: 4px;"></div>
              </div>
            </div>
            <div class="subject-card-actions" style="margin-top: auto; padding-top: 14px; display: flex; gap: 8px;">
              <div class="sk-block" style="width: 56px; height: 28px; border-radius: 999px;"></div>
              <div class="sk-block" style="width: 66px; height: 28px; border-radius: 999px;"></div>
              <div class="sk-block" style="width: 60px; height: 28px; border-radius: 999px;"></div>
            </div>
          </div>

          <div class="subject-card">
            <div class="subject-card-header-row">
              <div class="sk-block" style="width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;"></div>
              <div class="subject-title-area" style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
                <div class="sk-block" style="width: 45px; height: 14px; border-radius: 4px;"></div>
                <div class="sk-block" style="width: 68%; height: 18px; border-radius: 4px;"></div>
                <div class="sk-block" style="width: 40%; height: 12px; border-radius: 4px; opacity: 0.6;"></div>
              </div>
            </div>
            <div class="subject-meta-pills" style="margin: 12px 0;">
              <div class="sk-block" style="width: 120px; height: 22px; border-radius: 999px;"></div>
            </div>
            <div class="subject-metrics-strip">
              <div class="subject-metric-col" style="display: flex; flex-direction: column; gap: 4px;">
                <div class="sk-block" style="width: 58px; height: 10px; border-radius: 3px;"></div>
                <div class="sk-block" style="width: 38px; height: 16px; border-radius: 4px;"></div>
              </div>
              <div class="subject-metric-col" style="display: flex; flex-direction: column; gap: 4px;">
                <div class="sk-block" style="width: 54px; height: 10px; border-radius: 3px;"></div>
                <div class="sk-block" style="width: 50px; height: 16px; border-radius: 4px;"></div>
              </div>
              <div class="subject-metric-col" style="display: flex; flex-direction: column; gap: 4px;">
                <div class="sk-block" style="width: 36px; height: 10px; border-radius: 3px;"></div>
                <div class="sk-block" style="width: 46px; height: 16px; border-radius: 4px;"></div>
              </div>
            </div>
            <div class="subject-card-actions" style="margin-top: auto; padding-top: 14px; display: flex; gap: 8px;">
              <div class="sk-block" style="width: 56px; height: 28px; border-radius: 999px;"></div>
              <div class="sk-block" style="width: 66px; height: 28px; border-radius: 999px;"></div>
              <div class="sk-block" style="width: 60px; height: 28px; border-radius: 999px;"></div>
            </div>
          </div>
        </div>
      </div>
    `,
    tracker: `
      <!-- Header -->
      <div class="sk-header">
        <div class="sk-header-titles">
          <div class="sk-block sk-title" style="width: 160px; height: 28px; border-radius: 6px;"></div>
          <div class="sk-block sk-subtitle" style="width: 380px; height: 14px; border-radius: 4px;"></div>
        </div>
        <div class="sk-header-actions">
          <div class="sk-block" style="width: 130px; height: 34px; border-radius: 999px;"></div>
        </div>
      </div>

      <div class="sk-body">
        <!-- 3-Column Tools Row (Bentodoro + Milestone + Manual Log) -->
        <div class="sk-tracker-tools-row">
          <!-- Card 1: Bentodoro Timer -->
          <div class="sk-card" style="min-height: 250px;">
            <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:12px;border-bottom:1px solid var(--border-subtle);">
              <div class="sk-block" style="width:90px;height:16px;border-radius:4px;"></div>
              <div class="sk-block" style="width:130px;height:26px;border-radius:999px;"></div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;margin:auto 0;gap:8px;">
              <div class="sk-block" style="width:150px;height:48px;border-radius:8px;"></div>
              <div class="sk-block" style="width:85px;height:18px;border-radius:999px;"></div>
            </div>
            <div style="display:flex;gap:10px;margin-top:auto;">
              <div class="sk-block" style="flex:1;height:36px;border-radius:999px;"></div>
              <div class="sk-block" style="width:36px;height:36px;border-radius:50%;flex-shrink:0;"></div>
            </div>
          </div>

          <!-- Card 2: Milestone Journey -->
          <div class="sk-card" style="min-height: 250px;">
            <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:12px;border-bottom:1px solid var(--border-subtle);">
              <div class="sk-block" style="width:130px;height:16px;border-radius:4px;"></div>
              <div class="sk-block" style="width:65px;height:20px;border-radius:999px;"></div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:16px;">
              <div class="sk-block" style="width:80px;height:30px;border-radius:6px;"></div>
              <div class="sk-block" style="width:50px;height:16px;border-radius:4px;"></div>
            </div>
            <div class="sk-block" style="width:100%;height:8px;border-radius:999px;margin-top:12px;"></div>
            <div class="sk-block" style="width:170px;height:12px;border-radius:4px;margin-top:auto;"></div>
          </div>

          <!-- Card 3: Manual Study Log -->
          <div class="sk-card" style="min-height: 250px;">
            <div style="display:flex;align-items:center;padding-bottom:12px;border-bottom:1px solid var(--border-subtle);">
              <div class="sk-block" style="width:125px;height:16px;border-radius:4px;"></div>
            </div>
            <div class="sk-block" style="width:100%;height:34px;border-radius:8px;margin:10px 0 6px 0;"></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
              <div class="sk-block" style="height:34px;border-radius:8px;"></div>
              <div class="sk-block" style="height:34px;border-radius:8px;"></div>
            </div>
            <div class="sk-block" style="width:100%;height:36px;border-radius:999px;margin-top:auto;"></div>
          </div>
        </div>

        <!-- Analytics Row (Yearly Heatmap + Distribution Bar Chart) -->
        <div class="sk-tracker-analytics-row">
          <div class="sk-card" style="flex:1.4; min-height: 200px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
              <div class="sk-block" style="width:150px;height:16px;border-radius:4px;"></div>
              <div class="sk-block" style="width:110px;height:24px;border-radius:6px;"></div>
            </div>
            <div class="sk-block" style="width:100%;height:120px;border-radius:8px;opacity:0.65;"></div>
          </div>
          <div class="sk-card" style="flex:1; min-height: 200px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
              <div class="sk-block" style="width:130px;height:16px;border-radius:4px;"></div>
            </div>
            <!-- Vertical Bar Chart Skeleton (5 bars + baseline) -->
            <div style="display:flex;align-items:flex-end;justify-content:space-around;height:110px;padding-top:10px;border-bottom:1px solid var(--border-subtle);">
              <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
                <div class="sk-block" style="width:24px;height:75px;border-radius:4px 4px 0 0;"></div>
                <div class="sk-block" style="width:30px;height:10px;border-radius:2px;"></div>
              </div>
              <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
                <div class="sk-block" style="width:24px;height:45px;border-radius:4px 4px 0 0;"></div>
                <div class="sk-block" style="width:30px;height:10px;border-radius:2px;"></div>
              </div>
              <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
                <div class="sk-block" style="width:24px;height:95px;border-radius:4px 4px 0 0;"></div>
                <div class="sk-block" style="width:30px;height:10px;border-radius:2px;"></div>
              </div>
              <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
                <div class="sk-block" style="width:24px;height:55px;border-radius:4px 4px 0 0;"></div>
                <div class="sk-block" style="width:30px;height:10px;border-radius:2px;"></div>
              </div>
              <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
                <div class="sk-block" style="width:24px;height:30px;border-radius:4px 4px 0 0;"></div>
                <div class="sk-block" style="width:30px;height:10px;border-radius:2px;"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
    grades: `
      <!-- Header -->
      <div class="sk-header">
        <div class="sk-header-titles">
          <div class="sk-block sk-title" style="width: 120px; height: 28px; border-radius: 6px;"></div>
          <div class="sk-block sk-subtitle" style="width: 360px; height: 14px; border-radius: 4px;"></div>
        </div>
        <div class="sk-header-actions">
          <div class="sk-block" style="width: 90px; height: 28px; border-radius: 999px;"></div>
          <div class="sk-block" style="width: 125px; height: 34px; border-radius: 999px;"></div>
        </div>
      </div>

      <div class="sk-body">
        <div class="sk-grades-layout">
          <!-- Left: Main Breakdown Area with Folder Tabs & Category Cards -->
          <div style="display: flex; flex-direction: column;">
            <!-- Folder Tab Strip with Actions -->
            <div style="display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; padding: 0 12px 0 8px;">
              <div style="display: flex; align-items: flex-end; gap: 4px;">
                <!-- Active Folder Tab (Taller, seamless merge) -->
                <div class="sk-block" style="width: 150px; height: 40px; border-radius: 10px 10px 0 0; opacity: 0.95; display: flex; align-items: center; justify-content: space-between; padding: 0 14px;">
                  <div class="sk-block" style="width: 65px; height: 12px; border-radius: 3px; background: rgba(0,0,0,0.15);"></div>
                  <div class="sk-block" style="width: 35px; height: 16px; border-radius: 999px; background: rgba(0,0,0,0.2);"></div>
                </div>
                <!-- Inactive Tabs -->
                <div class="sk-block" style="width: 135px; height: 33px; border-radius: 8px 8px 0 0; opacity: 0.5;"></div>
                <div class="sk-block" style="width: 155px; height: 33px; border-radius: 8px 8px 0 0; opacity: 0.5;"></div>
              </div>

              <!-- Right Actions Skeleton -->
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                <div class="sk-block" style="width: 78px; height: 28px; border-radius: 999px;"></div>
                <div class="sk-block" style="width: 110px; height: 28px; border-radius: 999px;"></div>
              </div>
            </div>

            <!-- Panel Content Box -->
            <div class="sk-card" style="border-radius: 0 12px 12px 12px; padding: 22px; gap: 16px; min-height: 480px;">
              <!-- Breakdown Header -->
              <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:12px;border-bottom:1px solid var(--border-subtle);">
                <div class="sk-block" style="width:230px;height:20px;border-radius:4px;"></div>
                <div class="sk-block" style="width:140px;height:20px;border-radius:999px;"></div>
              </div>

              <!-- Category Card 1 (Expanded with assessment entries) -->
              <div class="sk-card" style="padding: 14px; gap: 12px; background: var(--bg-surface-elevated);">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <div style="display:flex;align-items:center;gap:10px;">
                    <div class="sk-block" style="width:14px;height:14px;border-radius:3px;"></div>
                    <div class="sk-block" style="width:105px;height:16px;border-radius:4px;"></div>
                    <div class="sk-block" style="width:50px;height:20px;border-radius:999px;"></div>
                  </div>
                  <div class="sk-block" style="width:80px;height:12px;border-radius:3px;"></div>
                </div>
                <!-- Entry Rows -->
                <div style="display:flex;flex-direction:column;gap:8px;padding-top:4px;">
                  <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:var(--bg-surface);border-radius:8px;">
                    <div style="display:flex;align-items:center;gap:8px;">
                      <div class="sk-block" style="width:8px;height:8px;border-radius:50%;"></div>
                      <div class="sk-block" style="width:130px;height:14px;border-radius:4px;"></div>
                    </div>
                    <div class="sk-block" style="width:60px;height:22px;border-radius:999px;"></div>
                  </div>
                  <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:var(--bg-surface);border-radius:8px;">
                    <div style="display:flex;align-items:center;gap:8px;">
                      <div class="sk-block" style="width:8px;height:8px;border-radius:50%;"></div>
                      <div class="sk-block" style="width:110px;height:14px;border-radius:4px;"></div>
                    </div>
                    <div class="sk-block" style="width:60px;height:22px;border-radius:999px;"></div>
                  </div>
                </div>
              </div>

              <!-- Category Card 2 (Collapsed) -->
              <div class="sk-card" style="padding: 14px; background: var(--bg-surface-elevated);">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <div style="display:flex;align-items:center;gap:10px;">
                    <div class="sk-block" style="width:14px;height:14px;border-radius:3px;"></div>
                    <div class="sk-block" style="width:95px;height:16px;border-radius:4px;"></div>
                    <div class="sk-block" style="width:50px;height:20px;border-radius:999px;"></div>
                  </div>
                  <div class="sk-block" style="width:80px;height:12px;border-radius:3px;"></div>
                </div>
              </div>

              <!-- Category Card 3 (Collapsed) -->
              <div class="sk-card" style="padding: 14px; background: var(--bg-surface-elevated);">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <div style="display:flex;align-items:center;gap:10px;">
                    <div class="sk-block" style="width:14px;height:14px;border-radius:3px;"></div>
                    <div class="sk-block" style="width:115px;height:16px;border-radius:4px;"></div>
                    <div class="sk-block" style="width:50px;height:20px;border-radius:999px;"></div>
                  </div>
                  <div class="sk-block" style="width:80px;height:12px;border-radius:3px;"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right: Grades Summary Panel -->
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <!-- GWA Card -->
            <div class="sk-card" style="padding: 20px; gap: 10px;">
              <div class="sk-block" style="width:90px;height:14px;border-radius:4px;"></div>
              <div class="sk-block" style="width:85px;height:38px;border-radius:8px;margin:4px 0;"></div>
              <div class="sk-block" style="width:115px;height:22px;border-radius:999px;"></div>
              <div class="sk-block" style="width:140px;height:11px;border-radius:3px;opacity:0.6;"></div>
            </div>

            <!-- Subjects Overview Card -->
            <div class="sk-card" style="padding: 20px; gap: 12px; flex: 1;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <div class="sk-block" style="width:120px;height:14px;border-radius:4px;"></div>
                <div class="sk-block" style="width:24px;height:20px;border-radius:999px;"></div>
              </div>
              <div style="display:flex;flex-direction:column;gap:10px;padding-top:4px;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <div style="display:flex;align-items:center;gap:8px;">
                    <div class="sk-block" style="width:8px;height:8px;border-radius:50%;"></div>
                    <div class="sk-block" style="width:65px;height:14px;border-radius:4px;"></div>
                  </div>
                  <div class="sk-block" style="width:40px;height:14px;border-radius:4px;"></div>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <div style="display:flex;align-items:center;gap:8px;">
                    <div class="sk-block" style="width:8px;height:8px;border-radius:50%;"></div>
                    <div class="sk-block" style="width:75px;height:14px;border-radius:4px;"></div>
                  </div>
                  <div class="sk-block" style="width:40px;height:14px;border-radius:4px;"></div>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <div style="display:flex;align-items:center;gap:8px;">
                    <div class="sk-block" style="width:8px;height:8px;border-radius:50%;"></div>
                    <div class="sk-block" style="width:60px;height:14px;border-radius:4px;"></div>
                  </div>
                  <div class="sk-block" style="width:40px;height:14px;border-radius:4px;"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
    schedule: `
      <!-- Header -->
      <div class="sk-header">
        <div class="sk-header-titles">
          <div class="sk-block sk-title" style="width: 150px; height: 28px; border-radius: 6px;"></div>
          <div class="sk-block sk-subtitle" style="width: 380px; height: 14px; border-radius: 4px;"></div>
        </div>
        <div class="sk-header-actions">
          <div class="sk-block" style="width: 135px; height: 34px; border-radius: 999px;"></div>
        </div>
      </div>
      <div class="sk-body">
        <div class="sk-plans-layout">
          <div class="sk-card" style="height: 420px; gap: 12px; padding: 20px;">
            <div class="sk-block" style="width:120px;height:16px;border-radius:4px;margin-bottom:6px;"></div>
            <div class="sk-block" style="width:100%;height:44px;border-radius:8px;opacity:0.9;"></div>
            <div class="sk-block" style="width:100%;height:44px;border-radius:8px;opacity:0.75;"></div>
            <div class="sk-block" style="width:100%;height:44px;border-radius:8px;opacity:0.6;"></div>
            <div class="sk-block" style="width:100%;height:44px;border-radius:8px;opacity:0.45;"></div>
          </div>
          <div class="sk-card" style="min-height: 420px; padding: 24px; gap: 16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div class="sk-block" style="width:190px;height:20px;border-radius:4px;"></div>
              <div class="sk-block" style="width:85px;height:24px;border-radius:999px;"></div>
            </div>
            <div class="sk-block" style="width:100%;height:90px;border-radius:8px;opacity:0.75;"></div>
            <div style="display:flex;flex-direction:column;gap:12px;margin-top:8px;">
              <div style="display:flex;align-items:center;gap:12px;">
                <div class="sk-block" style="width:28px;height:28px;border-radius:50%;"></div>
                <div class="sk-block" style="flex:1;height:38px;border-radius:8px;"></div>
              </div>
              <div style="display:flex;align-items:center;gap:12px;">
                <div class="sk-block" style="width:28px;height:28px;border-radius:50%;"></div>
                <div class="sk-block" style="flex:1;height:38px;border-radius:8px;"></div>
              </div>
              <div style="display:flex;align-items:center;gap:12px;">
                <div class="sk-block" style="width:28px;height:28px;border-radius:50%;"></div>
                <div class="sk-block" style="flex:1;height:38px;border-radius:8px;"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
    plans: `
      <!-- Alias for schedule -->
      <div class="sk-header">
        <div class="sk-header-titles">
          <div class="sk-block sk-title" style="width: 150px; height: 28px; border-radius: 6px;"></div>
          <div class="sk-block sk-subtitle" style="width: 380px; height: 14px; border-radius: 4px;"></div>
        </div>
        <div class="sk-header-actions">
          <div class="sk-block" style="width: 135px; height: 34px; border-radius: 999px;"></div>
        </div>
      </div>
      <div class="sk-body">
        <div class="sk-plans-layout">
          <div class="sk-card" style="height: 420px; gap: 12px; padding: 20px;">
            <div class="sk-block" style="width:120px;height:16px;border-radius:4px;margin-bottom:6px;"></div>
            <div class="sk-block" style="width:100%;height:44px;border-radius:8px;opacity:0.9;"></div>
            <div class="sk-block" style="width:100%;height:44px;border-radius:8px;opacity:0.75;"></div>
            <div class="sk-block" style="width:100%;height:44px;border-radius:8px;opacity:0.6;"></div>
          </div>
          <div class="sk-card" style="min-height: 420px; padding: 24px; gap: 16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div class="sk-block" style="width:190px;height:20px;border-radius:4px;"></div>
              <div class="sk-block" style="width:85px;height:24px;border-radius:999px;"></div>
            </div>
            <div class="sk-block" style="width:100%;height:90px;border-radius:8px;opacity:0.75;"></div>
            <div style="display:flex;flex-direction:column;gap:12px;margin-top:8px;">
              <div style="display:flex;align-items:center;gap:12px;">
                <div class="sk-block" style="width:28px;height:28px;border-radius:50%;"></div>
                <div class="sk-block" style="flex:1;height:38px;border-radius:8px;"></div>
              </div>
              <div style="display:flex;align-items:center;gap:12px;">
                <div class="sk-block" style="width:28px;height:28px;border-radius:50%;"></div>
                <div class="sk-block" style="flex:1;height:38px;border-radius:8px;"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
    settings: `
      <!-- Header -->
      <div class="sk-header">
        <div class="sk-header-titles">
          <div class="sk-block sk-title" style="width: 120px; height: 28px; border-radius: 6px;"></div>
          <div class="sk-block sk-subtitle" style="width: 320px; height: 14px; border-radius: 4px;"></div>
        </div>
      </div>
      <div class="sk-body">
        <div class="sk-settings-layout">
          <!-- Appearance & Themes Card -->
          <div class="sk-card" style="padding: 22px; gap: 16px;">
            <div class="sk-block" style="width:160px;height:18px;border-radius:4px;"></div>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;">
              <div class="sk-block" style="height:90px;border-radius:10px;"></div>
              <div class="sk-block" style="height:90px;border-radius:10px;"></div>
              <div class="sk-block" style="height:90px;border-radius:10px;"></div>
              <div class="sk-block" style="height:90px;border-radius:10px;"></div>
            </div>
          </div>

          <!-- Account Card -->
          <div class="sk-card" style="padding: 22px; gap: 16px;">
            <div style="display:flex;align-items:center;gap:14px;padding-bottom:14px;border-bottom:1px solid var(--border-subtle);">
              <div class="sk-block" style="width:48px;height:48px;border-radius:50%;"></div>
              <div style="display:flex;flex-direction:column;gap:6px;">
                <div class="sk-block" style="width:120px;height:16px;border-radius:4px;"></div>
                <div class="sk-block" style="width:170px;height:12px;border-radius:4px;opacity:0.65;"></div>
              </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:12px;">
              <div class="sk-block" style="width:100%;height:38px;border-radius:8px;"></div>
              <div class="sk-block" style="width:100%;height:38px;border-radius:8px;"></div>
            </div>
          </div>
        </div>
      </div>
    `
  };

  mainEl.innerHTML = skeletonTemplates[activeRoute] || skeletonTemplates.subjects;
}
