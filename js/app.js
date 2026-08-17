/**
 * Aven - Main Application Router & Coordinator
 */

import { store, events } from './store.js';
import { renderSubjectsView } from './subjects.js';
import { renderTrackerView } from './tracker.js';
import { renderGradesView } from './grades.js';
import { renderPlansView } from './plans.js';
import { renderSettingsView } from './settings.js';

class AvenApp {
  constructor() {
    this.currentPage = 'subjects';
    this.pages = {
      subjects: {
        title: 'Subjects',
        subtitle: 'Track your enrolled courses, study progress, and academic standing at a glance.',
        renderer: renderSubjectsView
      },
      tracker: {
        title: 'Study Tracker',
        subtitle: 'Log study sessions with a stopwatch or Pomodoro timer, and keep your streak going.',
        renderer: renderTrackerView
      },
      grades: {
        title: 'Grades',
        subtitle: 'Calculate weighted grades by category, and see exactly what you need on the final.',
        renderer: renderGradesView
      },
      plans: {
        title: 'Study Plans',
        subtitle: 'Upload and view your syllabi, schedules, and study guides in one place.',
        renderer: renderPlansView
      },
      settings: {
        title: 'Settings',
        subtitle: 'Manage your theme, academic defaults, timer preferences, and account.',
        renderer: renderSettingsView
      }
    };

    this.init();
  }

  init() {
    // Set theme from store
    const theme = store.getTheme();
    document.documentElement.setAttribute('data-theme', theme);

    // Setup DOM references
    this.mainContainer = document.getElementById('view-content');
    this.pageTitleEl = document.getElementById('page-title');
    this.pageSubtitleEl = document.getElementById('page-subtitle');
    this.userProfileBtn = document.getElementById('user-profile-btn');
    this.userPopover = document.getElementById('user-popover');
    this.toastContainer = document.getElementById('toast-container');

    this.renderUser();
    this.setupNavigation();
    this.setupGlobalEvents();

    // Initial page load (check hash or default to subjects)
    const hash = window.location.hash.replace('#', '');
    if (this.pages[hash]) {
      this.navigateTo(hash);
    } else {
      this.navigateTo('subjects');
    }
  }

  renderUser() {
    const user = store.getUserProfile();
    const avatarEl = document.getElementById('user-avatar');
    const nameEl = document.getElementById('user-name');
    const emailEl = document.getElementById('user-email');

    if (avatarEl) {
      avatarEl.textContent = user.avatar || 'AR';
      avatarEl.style.backgroundColor = user.avatar_color || '#6366f1';
    }
    if (nameEl) nameEl.textContent = user.name || 'Alex Rivera';
    if (emailEl) emailEl.textContent = user.email || 'alex.rivera@university.edu';
  }


  navigateTo(pageKey, targetSection = null) {
    if (!this.pages[pageKey]) pageKey = 'subjects';
    this.currentPage = pageKey;
    window.location.hash = pageKey;

    // Update Header
    const pageConfig = this.pages[pageKey];
    if (this.pageTitleEl) this.pageTitleEl.textContent = pageConfig.title;
    if (this.pageSubtitleEl) this.pageSubtitleEl.textContent = pageConfig.subtitle || '';

    // Update Nav Sidebar links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.dataset.page === pageKey);
    });

    const settingsNavItem = document.getElementById('nav-item-settings');
    if (pageKey === 'settings') {
      settingsNavItem?.classList.add('expanded');
    } else {
      settingsNavItem?.classList.remove('expanded');
      document.querySelectorAll('.nav-sublink').forEach(sl => sl.classList.remove('active'));
    }

    // Render current view with fluid entrance animation
    if (this.mainContainer && pageConfig.renderer) {
      pageConfig.renderer(this.mainContainer);
      this.mainContainer.classList.remove('view-enter');
      void this.mainContainer.offsetWidth; // Trigger reflow for clean re-animation
      this.mainContainer.classList.add('view-enter');
      this.mainContainer.addEventListener('animationend', () => {
        this.mainContainer.classList.remove('view-enter');
      }, { once: true });
    }



    // Handle scroll to target section if in settings
    if (pageKey === 'settings') {
      const sectionToActivate = targetSection || 'settings-appearance';
      this.setActiveSettingsSublink(sectionToActivate);
      if (targetSection) {
        setTimeout(() => {
          const el = document.getElementById(targetSection);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 60);
      }
      this.initSettingsScrollSpy();
    }
  }

  setActiveSettingsSublink(sectionId) {
    document.querySelectorAll('.nav-sublink').forEach(sublink => {
      sublink.classList.toggle('active', sublink.dataset.section === sectionId);
    });
  }

  initSettingsScrollSpy() {
    if (this._settingsScrollCleanup) {
      this._settingsScrollCleanup();
    }

    const sections = Array.from(document.querySelectorAll('.settings-section[id]'));
    if (!sections.length) return;

    const viewport = document.querySelector('.main-viewport');

    const checkActive = () => {
      if (this.currentPage !== 'settings') return;
      const threshold = 180;
      let activeId = sections[0].id;

      for (const sec of sections) {
        const rect = sec.getBoundingClientRect();
        if (rect.top <= threshold) {
          activeId = sec.id;
        }
      }
      this.setActiveSettingsSublink(activeId);
    };

    const onScroll = () => requestAnimationFrame(checkActive);

    window.addEventListener('scroll', onScroll, { passive: true });
    viewport?.addEventListener('scroll', onScroll, { passive: true });

    this._settingsScrollCleanup = () => {
      window.removeEventListener('scroll', onScroll);
      viewport?.removeEventListener('scroll', onScroll);
    };

    // Initial check
    setTimeout(checkActive, 100);
  }


  setupNavigation() {
    // Top-level nav links
    // Mobile Navigation Drawer Toggle & Quick Actions
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileBackdrop = document.getElementById('mobile-drawer-backdrop');
    const sidebar = document.getElementById('sidebar');

    const closeMobileDrawer = () => {
      sidebar?.classList.remove('mobile-open');
      mobileBackdrop?.classList.remove('active');
      document.body.classList.remove('mobile-drawer-locked');
    };

    const openMobileDrawer = () => {
      sidebar?.classList.add('mobile-open');
      mobileBackdrop?.classList.add('active');
      document.body.classList.add('mobile-drawer-locked');
    };

    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (sidebar?.classList.contains('mobile-open')) {
          closeMobileDrawer();
        } else {
          openMobileDrawer();
        }
      });
    }

    if (mobileBackdrop) {
      mobileBackdrop.addEventListener('click', closeMobileDrawer);
    }

    // Quick mobile theme toggle button
    document.getElementById('mobile-theme-btn')?.addEventListener('click', () => {
      const current = store.getTheme();
      const next = current === 'dark' ? 'light' : 'dark';
      store.setTheme(next);
      this.showToast(`Theme switched to ${next} mode`, 'info');
    });

    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetPage = link.dataset.page;
        const settingsNavItem = document.getElementById('nav-item-settings');

        // Close mobile drawer on navigation
        if (window.innerWidth < 768) {
          closeMobileDrawer();
        }

        // Toggle sub-nav if clicking Settings while already on Settings
        if (targetPage === 'settings' && this.currentPage === 'settings') {
          settingsNavItem?.classList.toggle('expanded');
          return;
        }

        this.navigateTo(targetPage);
      });
    });

    // Sub-nav links for Settings
    document.querySelectorAll('.nav-sublink').forEach(sublink => {
      sublink.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const sectionId = sublink.dataset.section;

        if (window.innerWidth < 768) {
          closeMobileDrawer();
        }

        if (this.currentPage !== 'settings') {
          this.navigateTo('settings', sectionId);
        } else {
          this.setActiveSettingsSublink(sectionId);
          const el = document.getElementById(sectionId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      });
    });



    // User popover toggle
    if (this.userProfileBtn && this.userPopover) {
      this.userProfileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.userPopover.classList.toggle('open');
      });

      document.addEventListener('click', (e) => {
        if (!this.userPopover.contains(e.target) && e.target !== this.userProfileBtn) {
          this.userPopover.classList.remove('open');
        }
      });
    }

    // Popover items
    document.getElementById('toggle-theme-btn')?.addEventListener('click', () => {
      const current = store.getTheme();
      const next = current === 'dark' ? 'light' : 'dark';
      store.setTheme(next);
      this.showToast(`Theme switched to ${next} mode`, 'info');
      this.userPopover.classList.remove('open');
    });

    document.getElementById('reset-demo-btn')?.addEventListener('click', () => {
      localStorage.clear();
      store.init();
      this.showToast('Workspace reset to default demo dataset', 'info');
      this.userPopover.classList.remove('open');
      this.navigateTo(this.currentPage);
    });

    document.getElementById('logout-btn')?.addEventListener('click', () => {
      this.showToast('Session locked. Click anywhere to resume.', 'info');
      this.userPopover.classList.remove('open');
    });
  }

  setupGlobalEvents() {
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '');
      if (this.pages[hash] && hash !== this.currentPage) {
        this.navigateTo(hash);
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.open').forEach(modal => {
          modal.classList.remove('open');
        });
      }
    });

    events.on('user:updated', () => {
      this.renderUser();
    });

    events.on('store:changed', (data) => {
      if (data && data.type === 'user') {
        this.renderUser();
      }
      const pageConfig = this.pages[this.currentPage];
      if (this.mainContainer && pageConfig && pageConfig.renderer) {
        // If we are currently on settings page, avoid re-rendering view on input to preserve focus
        if (this.currentPage === 'settings' && data && (data.type === 'user' || data.type === 'settings')) {
          return;
        }
        pageConfig.renderer(this.mainContainer);
      }
    });
  }

  showToast(message, type = 'info') {
    if (!this.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.2s ease';
      setTimeout(() => toast.remove(), 200);
    }, 3000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.avenApp = new AvenApp();
});
