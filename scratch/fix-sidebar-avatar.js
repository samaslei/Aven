import fs from 'fs';

let css = fs.readFileSync('css/style.css', 'utf-8');

const oldUserBlockCss = `.sidebar-user-block {
  position: relative;
  margin-bottom: 4px;
}

.sidebar-user-block .user-profile-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--radius-md);
  background: transparent;
  border: none;
  box-shadow: none;
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: var(--transition);
}

.sidebar-user-block .user-profile-btn:hover {
  background: rgba(0, 0, 0, 0.04);
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
}`;

const newUserBlockCss = `.sidebar-user-block {
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
}`;

css = css.replace(oldUserBlockCss, newUserBlockCss);

fs.writeFileSync('css/style.css', css, 'utf-8');
console.log('Successfully polished sidebar profile avatar shape, sizing, ring, and alignment!');
