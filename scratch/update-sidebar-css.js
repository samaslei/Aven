import fs from 'fs';

let css = fs.readFileSync('css/style.css', 'utf-8');

const oldSidebarSection = `/* ==========================================================================
   Left Navigation Sidebar (Fixed & Pinned)
   ========================================================================== */
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: var(--sidebar-width);
  height: 100vh;
  background-color: var(--bg-glass-sidebar);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-right: 1px solid var(--glass-border);
  box-shadow: var(--glass-specular);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 20px 14px;
  z-index: 100;
  user-select: none;
  overflow-y: hidden;
}

.sidebar-top {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Brand Logo */
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 8px;
  text-decoration: none;
  color: var(--text-primary);
}

.brand-icon {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  display: block;
  object-fit: contain;
  box-shadow: 0 2px 10px rgba(99, 102, 241, 0.35);
  flex-shrink: 0;
}

.brand-text {
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--text-primary);
}

.brand-tag {
  font-size: 10px;
  padding: 2px 7px;
  border-radius: var(--radius-full);
  background: var(--accent-surface);
  color: var(--accent);
  font-weight: 600;
  margin-left: auto;
}

/* Nav Menu */
.nav-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  width: 100%;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 14px;
  border-radius: var(--radius-full);
  color: var(--text-secondary);
  font-weight: 500;
  font-size: 13.5px;
  text-decoration: none;
  transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: pointer;
  border: 1px solid transparent;
}

.nav-link:hover {
  background-color: var(--bg-surface-hover);
  color: var(--text-primary);
}

.nav-link.active {
  background: var(--accent);
  color: var(--text-inverse) !important;
  border-color: transparent;
  box-shadow: var(--shadow-sm);
  font-weight: 600;
}

.nav-link.active .nav-icon,
.nav-link.active span,
.nav-link.active svg,
.nav-link.active .nav-chevron {
  color: var(--text-inverse) !important;
}

.nav-icon {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  transition: var(--transition);
  flex-shrink: 0;
}

.nav-chevron {
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  transition: transform 0.2s ease;
}

.nav-link.active .nav-chevron {
  color: #ffffff;
}

.has-submenu.expanded .nav-chevron {
  transform: rotate(180deg);
}

.nav-submenu {
  list-style: none;
  display: none;
  flex-direction: column;
  gap: 2px;
  margin-top: 6px;
  margin-left: 20px;
  padding-left: 10px;
  border-left: 1px solid var(--border-subtle);
  animation: fadeIn 0.15s ease-out;
}

.has-submenu.expanded .nav-submenu {
  display: flex;
}

.nav-sublink {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--text-muted);
  text-decoration: none;
  border-radius: var(--radius-full);
  transition: var(--transition);
  cursor: pointer;
  position: relative;
}

.nav-sublink:hover {
  color: var(--text-primary);
  background-color: var(--bg-surface-hover);
}

.nav-sublink.active {
  color: var(--accent);
  font-weight: 600;
  background-color: var(--bg-surface-hover);
}

.nav-sublink.active::before {
  content: "";
  position: absolute;
  left: -11px;
  top: 4px;
  bottom: 4px;
  width: 2.5px;
  background-color: var(--accent);
  border-radius: 2px;
}

/* ==========================================================================
   Sidebar Top Gradient User Profile Block
   ========================================================================== */
.sidebar-user-block {
  position: relative;
  margin: 12px 0 18px 0;
}

.sidebar-user-block .user-profile-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--radius-lg);
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: var(--transition);
}

.sidebar-user-block .user-profile-btn:hover {
  transform: translateY(-1px);
  filter: brightness(1.05);
  box-shadow: 0 6px 18px rgba(79, 70, 229, 0.36), inset 0 1px 0 rgba(255, 255, 255, 0.28);
}

.sidebar-user-block .user-avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  background-color: rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(4px);
  border: 1.5px solid rgba(255, 255, 255, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 12px;
  color: #ffffff;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.sidebar-user-block .user-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  line-height: 1.25;
  flex: 1;
  min-width: 0;
}

.sidebar-user-block .user-name {
  font-size: 13px;
  font-weight: 700;
  color: #ffffff;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  letter-spacing: -0.01em;
}

.sidebar-user-block .user-role {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.82);
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  font-weight: 500;
}

.sidebar-user-block .user-chevron {
  color: rgba(255, 255, 255, 0.75);
  flex-shrink: 0;
  margin-left: auto;
  transition: transform 0.2s ease;
}

.sidebar-user-block:has(.user-popover.open) .user-chevron {
  transform: rotate(180deg);
}`;

const newSidebarSection = `/* ==========================================================================
   Left Navigation Sidebar (FeedBacker Clean Reference Design)
   ========================================================================== */
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: var(--sidebar-width);
  height: 100vh;
  background-color: var(--bg-sidebar);
  border-right: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 24px 14px 18px 14px;
  z-index: 100;
  user-select: none;
  overflow-y: hidden;
}

.sidebar-top {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Brand Logo */
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 10px;
  text-decoration: none;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.brand-icon {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  display: block;
  object-fit: contain;
  box-shadow: var(--shadow-sm);
  flex-shrink: 0;
}

.brand-text {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--text-primary);
}

/* Nav Menu */
.sidebar-nav {
  display: flex;
  flex-direction: column;
}

.nav-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  width: 100%;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 14px;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-weight: 500;
  font-size: 13.5px;
  text-decoration: none;
  transition: all 0.16s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: pointer;
  border: 1px solid transparent;
  width: 100%;
  background: transparent;
  text-align: left;
}

.nav-link:hover {
  background-color: var(--bg-surface-hover);
  color: var(--text-primary);
}

/* Solid Black Active Nav Pill (Reference Style) */
.nav-link.active {
  background: var(--accent) !important;
  color: var(--text-inverse) !important;
  border-color: transparent;
  box-shadow: var(--shadow-sm);
  font-weight: 600;
}

.nav-link.active .nav-icon,
.nav-link.active span,
.nav-link.active svg {
  color: var(--text-inverse) !important;
  stroke: var(--text-inverse) !important;
}

.nav-icon {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  transition: var(--transition);
  flex-shrink: 0;
}

/* ==========================================================================
   Bottom-Pinned Section (User Profile Pill, Settings, Log out)
   ========================================================================== */
.sidebar-bottom {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: auto;
  padding-top: 14px;
}

/* Compact User Profile Row (Reference Style) */
.sidebar-user-block {
  position: relative;
  margin-bottom: 4px;
}

.sidebar-user-block .user-profile-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--radius-lg);
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: var(--transition);
}

.sidebar-user-block .user-profile-btn:hover {
  background: var(--bg-surface-hover);
  border-color: var(--border-strong);
}

.sidebar-user-block .user-avatar {
  width: 30px;
  height: 30px;
  border-radius: var(--radius-full);
  background-color: var(--olive-mid);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 11px;
  color: #ffffff;
  flex-shrink: 0;
}

.sidebar-user-block .user-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  line-height: 1.25;
  flex: 1;
  min-width: 0;
}

.sidebar-user-block .user-name {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  letter-spacing: -0.01em;
}

.sidebar-user-block .user-email {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  font-weight: 400;
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

/* User Popover anchored upwards from bottom */
.sidebar-user-block .user-popover {
  bottom: calc(100% + 8px);
  top: auto;
  left: 0;
  width: 100%;
  z-index: 600;
}

/* Footer Navigation Links */
.sidebar-footer-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.footer-nav-link {
  padding: 8px 12px;
  font-size: 13px;
}

.sidebar-logout-btn {
  border: none;
  background: transparent;
  font-family: inherit;
}

.sidebar-logout-btn:hover {
  color: var(--danger) !important;
  background: var(--danger-surface) !important;
}

.sidebar-logout-btn:hover .nav-icon,
.sidebar-logout-btn:hover svg {
  color: var(--danger) !important;
  stroke: var(--danger) !important;
}`;

css = css.replace(oldSidebarSection, newSidebarSection);

fs.writeFileSync('css/style.css', css, 'utf-8');
console.log('Successfully updated sidebar styling in css/style.css!');
