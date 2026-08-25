import fs from 'fs';

// 1. Update index.html to add the sidebar-divider
let html = fs.readFileSync('index.html', 'utf-8');

const oldProfileHtml = `        <!-- Compact User Profile Pill Row (Reference Style) -->
        <div class="sidebar-user-block" id="sidebar-user-block">
          <button class="user-profile-btn" id="user-profile-btn" aria-label="Open User Menu" aria-haspopup="true">
            <div class="user-avatar" id="user-avatar">AR</div>
            <div class="user-info">
              <span class="user-name" id="user-name">Alex Rivera</span>
              <span class="user-email" id="user-email">student@university.edu</span>
            </div>
            <svg class="user-chevron" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          <!-- User Popover Menu -->
          <div class="user-popover" id="user-popover">
            <button class="popover-item" id="sync-cloud-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="1 4 1 10 7 10"></polyline>
                <polyline points="23 20 23 14 17 14"></polyline>
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
              </svg>
              Sync Cloud Data
            </button>
            <div style="height: 1px; background: var(--border-subtle); margin: 2px 0;"></div>
            <button class="popover-item danger" id="logout-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Log Out
            </button>
          </div>
        </div>

        <!-- Footer Navigation Links -->`;

const newProfileHtml = `        <!-- Subtle Rounded Profile Card (Reference Style) -->
        <div class="sidebar-user-block" id="sidebar-user-block">
          <button class="user-profile-btn" id="user-profile-btn" aria-label="Open User Menu" aria-haspopup="true">
            <div class="user-avatar" id="user-avatar">AR</div>
            <div class="user-info">
              <span class="user-name" id="user-name">Alex Rivera</span>
              <span class="user-email" id="user-email">student@university.edu</span>
            </div>
            <svg class="user-chevron" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          <!-- User Popover Menu -->
          <div class="user-popover" id="user-popover">
            <button class="popover-item" id="sync-cloud-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="1 4 1 10 7 10"></polyline>
                <polyline points="23 20 23 14 17 14"></polyline>
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
              </svg>
              Sync Cloud Data
            </button>
            <div style="height: 1px; background: var(--border-subtle); margin: 2px 0;"></div>
            <button class="popover-item danger" id="logout-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Log Out
            </button>
          </div>
        </div>

        <!-- Thin Divider Separating Profile Card from Footer Actions -->
        <div class="sidebar-divider"></div>

        <!-- Footer Navigation Links -->`;

html = html.replace(oldProfileHtml, newProfileHtml);
fs.writeFileSync('index.html', html, 'utf-8');

// 2. Update css/style.css for profile card, avatar, and divider
let css = fs.readFileSync('css/style.css', 'utf-8');

const oldUserBlockCss = `/* Compact User Profile Row (Reference Style) */
.sidebar-user-block {
  position: relative;
  margin-bottom: 4px;
}

.sidebar-user-block .user-profile-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border-radius: var(--radius-md);
  background: transparent;
  border: none;
  box-shadow: none;
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: background-color 0.16s ease;
}

.sidebar-user-block .user-profile-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.sidebar-user-block .user-avatar {
  width: 34px;
  height: 34px;
  min-width: 34px;
  border-radius: var(--radius-full);
  background-color: var(--olive-mid);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 12px;
  letter-spacing: -0.01em;
  color: #ffffff;
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), inset 0 0 0 1px rgba(255, 255, 255, 0.25);
  transition: transform 0.18s ease;
}

.sidebar-user-block .user-profile-btn:hover .user-avatar {
  transform: scale(1.04);
}

.sidebar-user-block .user-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  line-height: 1.25;
  flex: 1;
  min-width: 0;
  gap: 1px;
}

.sidebar-user-block .user-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  letter-spacing: -0.015em;
  line-height: 1.2;
}

.sidebar-user-block .user-email {
  font-size: 11.5px;
  color: var(--text-secondary);
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  font-weight: 400;
  line-height: 1.2;
  text-decoration: underline;
  text-decoration-color: rgba(86, 89, 77, 0.35);
  text-underline-offset: 2px;
}

.sidebar-user-block .user-chevron {
  color: var(--text-muted);
  flex-shrink: 0;
  margin-left: auto;
  transition: transform 0.2s ease;
}

.sidebar-user-block:has(.user-popover.open) .user-chevron {
  transform: rotate(180deg);
}`;

const newUserBlockCss = `/* Subtle Rounded Profile Card (Reference Style) */
.sidebar-user-block {
  position: relative;
  margin-bottom: 2px;
}

.sidebar-user-block .user-profile-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius-lg);
  background: rgba(80, 85, 55, 0.08);
  border: 1px solid var(--border-subtle);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  cursor: pointer;
  width: 100%;
  text-align: left;
  box-sizing: border-box;
  transition: all 0.16s cubic-bezier(0.16, 1, 0.3, 1);
}

[data-theme="dark"] .sidebar-user-block .user-profile-btn {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.06);
}

.sidebar-user-block .user-profile-btn:hover {
  background: rgba(80, 85, 55, 0.13);
  border-color: var(--border-default);
  transform: translateY(-1px);
}

[data-theme="dark"] .sidebar-user-block .user-profile-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.12);
}

.sidebar-user-block .user-avatar {
  width: 36px;
  height: 36px;
  min-width: 36px;
  border-radius: var(--radius-full);
  background-color: var(--olive-mid);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 12.5px;
  letter-spacing: -0.01em;
  color: #ffffff;
  flex-shrink: 0;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.14), inset 0 0 0 1px rgba(255, 255, 255, 0.30);
  transition: transform 0.18s ease;
}

.sidebar-user-block .user-profile-btn:hover .user-avatar {
  transform: scale(1.04);
}

.sidebar-user-block .user-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  line-height: 1.25;
  flex: 1;
  min-width: 0;
  gap: 2px;
}

.sidebar-user-block .user-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  letter-spacing: -0.015em;
  line-height: 1.2;
}

.sidebar-user-block .user-email {
  font-size: 11.5px;
  color: var(--text-secondary);
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  font-weight: 400;
  line-height: 1.2;
  text-decoration: underline;
  text-decoration-color: rgba(86, 89, 77, 0.35);
  text-underline-offset: 2px;
}

.sidebar-user-block .user-chevron {
  color: var(--text-muted);
  flex-shrink: 0;
  margin-left: auto;
  transition: transform 0.2s ease;
}

.sidebar-user-block:has(.user-popover.open) .user-chevron {
  transform: rotate(180deg);
}

/* Thin Divider Separating Profile Card from Footer Links */
.sidebar-divider {
  height: 1px;
  background: var(--border-default);
  margin: 6px 4px 8px 4px;
}`;

css = css.replace(oldUserBlockCss, newUserBlockCss);
fs.writeFileSync('css/style.css', css, 'utf-8');

console.log('Successfully wrapped profile section in rounded card, polished circular avatar, and added divider below!');
