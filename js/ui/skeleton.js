/**
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
    subjects: `
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
          <div class="sk-card">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div class="sk-block" style="width:130px;height:18px;border-radius:4px;"></div>
              <div class="sk-block" style="width:45px;height:18px;border-radius:12px;"></div>
            </div>
            <div class="sk-block" style="width:65%;height:12px;border-radius:4px;margin-top:6px;"></div>
            <div class="sk-block" style="width:100%;height:8px;border-radius:4px;margin-top:16px;"></div>
            <div style="display:flex;justify-content:space-between;margin-top:auto;">
              <div class="sk-block" style="width:60px;height:12px;border-radius:4px;"></div>
              <div class="sk-block" style="width:60px;height:12px;border-radius:4px;"></div>
            </div>
          </div>
          <div class="sk-card">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div class="sk-block" style="width:140px;height:18px;border-radius:4px;"></div>
              <div class="sk-block" style="width:45px;height:18px;border-radius:12px;"></div>
            </div>
            <div class="sk-block" style="width:60%;height:12px;border-radius:4px;margin-top:6px;"></div>
            <div class="sk-block" style="width:100%;height:8px;border-radius:4px;margin-top:16px;"></div>
            <div style="display:flex;justify-content:space-between;margin-top:auto;">
              <div class="sk-block" style="width:60px;height:12px;border-radius:4px;"></div>
              <div class="sk-block" style="width:60px;height:12px;border-radius:4px;"></div>
            </div>
          </div>
          <div class="sk-card">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div class="sk-block" style="width:110px;height:18px;border-radius:4px;"></div>
              <div class="sk-block" style="width:45px;height:18px;border-radius:12px;"></div>
            </div>
            <div class="sk-block" style="width:75%;height:12px;border-radius:4px;margin-top:6px;"></div>
            <div class="sk-block" style="width:100%;height:8px;border-radius:4px;margin-top:16px;"></div>
            <div style="display:flex;justify-content:space-between;margin-top:auto;">
              <div class="sk-block" style="width:60px;height:12px;border-radius:4px;"></div>
              <div class="sk-block" style="width:60px;height:12px;border-radius:4px;"></div>
            </div>
          </div>
        </div>
      </div>
    `,
    tracker: `
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
        <div class="sk-block sk-heatmap-block">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
            <div class="sk-block" style="width:140px;height:14px;border-radius:4px;"></div>
            <div class="sk-block" style="width:110px;height:24px;border-radius:6px;"></div>
            <div class="sk-block" style="width:120px;height:14px;border-radius:4px;"></div>
          </div>
          <div class="sk-block" style="width:100%;height:95px;border-radius:6px;opacity:0.6;"></div>
        </div>
        <div class="sk-tracker-tools-row">
          <div class="sk-card" style="height: 240px;">
            <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:12px;border-bottom:1px solid var(--border-subtle);">
              <div class="sk-block" style="width:120px;height:16px;border-radius:4px;"></div>
              <div class="sk-block" style="width:130px;height:26px;border-radius:6px;"></div>
            </div>
            <div class="sk-block" style="width:100%;height:32px;border-radius:6px;margin:8px 0 4px 0;"></div>
            <div class="sk-block" style="width:100%;height:75px;border-radius:8px;opacity:0.7;"></div>
          </div>
          <div class="sk-card" style="height: 240px;">
            <div style="display:flex;align-items:center;padding-bottom:12px;border-bottom:1px solid var(--border-subtle);">
              <div class="sk-block" style="width:140px;height:16px;border-radius:4px;"></div>
            </div>
            <div class="sk-block" style="width:100%;height:32px;border-radius:6px;margin:8px 0;"></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div class="sk-block" style="height:32px;border-radius:6px;"></div>
              <div class="sk-block" style="height:32px;border-radius:6px;"></div>
            </div>
            <div class="sk-block" style="width:100%;height:34px;border-radius:6px;margin-top:auto;"></div>
          </div>
        </div>
      </div>
    `,
    grades: `
      <div class="sk-header">
        <div class="sk-header-titles">
          <div class="sk-block sk-title" style="width: 130px;"></div>
          <div class="sk-block sk-subtitle" style="width: 440px;"></div>
        </div>
        <div class="sk-header-actions">
          <div class="sk-block sk-badge" style="width: 140px; height: 30px;"></div>
        </div>
      </div>
      <div class="sk-body">
        <div class="sk-grades-layout">
          <div class="sk-card" style="height: 380px; gap: 10px;">
            <div class="sk-block" style="width:100px;height:16px;border-radius:4px;margin-bottom:6px;"></div>
            <div class="sk-block" style="width:100%;height:44px;border-radius:6px;opacity:0.9;"></div>
            <div class="sk-block" style="width:100%;height:44px;border-radius:6px;opacity:0.6;"></div>
          </div>
          <div style="display:flex;flex-direction:column;gap:18px;">
            <div class="sk-card" style="height: 120px; display:flex; justify-content:space-between; align-items:center;">
              <div style="display:flex;flex-direction:column;gap:8px;">
                <div class="sk-block" style="width:140px;height:18px;border-radius:4px;"></div>
                <div class="sk-block" style="width:220px;height:12px;border-radius:4px;"></div>
              </div>
              <div class="sk-block" style="width:80px;height:48px;border-radius:8px;"></div>
            </div>
            <div class="sk-card" style="height: 240px;">
              <div class="sk-block" style="width:100%;height:36px;border-radius:6px;margin-top:8px;"></div>
              <div class="sk-block" style="width:100%;height:36px;border-radius:6px;"></div>
            </div>
          </div>
        </div>
      </div>
    `,
    plans: `
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
    `,
    settings: `
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
    `
  };

  mainEl.innerHTML = skeletonTemplates[activeRoute] || skeletonTemplates.subjects;
}
