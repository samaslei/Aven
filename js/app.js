/**
 * Aven - Main Application Router & Coordinator
 * Integrated with Supabase Auth, Cloud Sync, and Local Data Migration
 */

import { store, events } from './store.js';
import { supabase, getCurrentSession, signOut, onAuthStateChange } from './supabase.js';
import { renderStartupSkeleton } from './ui/skeleton.js';

class AvenApp {
  constructor() {
    this.currentPage = 'subjects';
    this.currentUser = null;
    this.authController = null;
    this.landingPage = null;

    this.pages = {
      subjects: {
        title: 'Subjects',
        subtitle: 'Track your enrolled courses, study progress, and academic standing at a glance.',
        load: () => import('./subjects.js').then(m => m.renderSubjectsView)
      },
      tracker: {
        title: 'Study Tracker',
        subtitle: 'Log study sessions, track your activity heatmap, and keep your streak going.',
        load: () => import('./tracker.js').then(m => m.renderTrackerView)
      },
      grades: {
        title: 'Grades',
        subtitle: 'Calculate weighted grades by category, and see exactly what you need on the final.',
        load: () => import('./grades.js').then(m => m.renderGradesView)
      },
      plans: {
        title: 'Study Plans',
        subtitle: 'Upload and view your syllabi, schedules, and study guides in one place.',
        load: () => import('./plans.js').then(m => m.renderPlansView)
      },
      settings: {
        title: 'Settings',
        subtitle: 'Manage your academic defaults, grading scale, account, and data.',
        load: () => import('./settings.js').then(m => m.renderSettingsView)
      }
    };

    this.init();
  }

  async init() {
    this.startupLoader = document.getElementById('startup-loader');
    this.startupStatusEl = document.getElementById('startup-status-text');
    this.setStartupStatus('Checking credentials...');

    // Render route-aware skeleton immediately
    try {
      renderStartupSkeleton();
    } catch (e) {}

    // Set theme from store
    const theme = store.getTheme();
    document.documentElement.setAttribute('data-theme', theme);

    // Setup DOM references
    this.appContainer = document.getElementById('app');
    this.landingScreen = document.getElementById('landing-screen');
    this.authScreen = document.getElementById('auth-screen');
    this.mainContainer = document.getElementById('view-content');
    this.pageTitleEl = document.getElementById('page-title');
    this.pageSubtitleEl = document.getElementById('page-subtitle');
    this.userProfileBtn = document.getElementById('user-profile-btn');
    this.userPopover = document.getElementById('user-popover');
    this.toastContainer = document.getElementById('toast-container');

    this.setupNavigation();
    this.setupGlobalEvents();
    this.setupSyncIndicator();
    this.setupAuthListener();

    // Check active session on startup
    try {
      const session = await getCurrentSession();
      if (session && session.user) {
        this.setStartupStatus('Loading academic workspace...');
        await this.handleAuthenticated(session);
      } else {
        this.handleUnauthenticated();
      }
    } catch (err) {
      console.error('App init session check error:', err);
      this.handleUnauthenticated();
    } finally {
      this.dismissStartupLoader();
    }
  }

  setStartupStatus(text) {
    if (this.startupStatusEl) {
      this.startupStatusEl.textContent = text;
    }
  }

  showStartupLoader(text = 'Loading...', targetRoute = null) {
    this.setStartupStatus(text);
    if (typeof window.renderStartupSkeleton === 'function') {
      const currentRoute = targetRoute || window.location.hash.replace('#', '') || 'subjects';
      window.renderStartupSkeleton(currentRoute);
    }
    if (this.startupLoader) {
      this.startupLoader.style.display = 'flex';
      void this.startupLoader.offsetWidth; // Reflow
      this.startupLoader.classList.remove('fade-out');
    }
  }

  dismissStartupLoader() {
    if (this.appContainer) {
      this.appContainer.classList.remove('app-shell-loading');
    }
    if (!this.startupLoader) return;
    this.startupLoader.classList.add('fade-out');
    setTimeout(() => {
      if (this.startupLoader && this.startupLoader.classList.contains('fade-out')) {
        this.startupLoader.style.display = 'none';
      }
    }, 380);
  }

  setupAuthListener() {
    onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // If this is a new sign-in or different user, perform full initial authentication setup
        if (!this.currentUser || this.currentUser.id !== session.user.id) {
          const isFreshLogin = !this.authScreen?.classList.contains('hidden') || !this.landingScreen?.classList.contains('hidden');
          await this.handleAuthenticated(session, isFreshLogin);
        } else {
          // Returning to tab / token refreshed for already logged-in user:
          // Do NOT trigger full blocking loading overlay or page navigation.
          // Silently update user and let the top-right sync indicator handle cloud sync in the background.
          this.currentUser = session.user;
          this.renderUser();
          store.syncFromCloud(session.user.id, false).catch(err => console.warn('Background sync on refocus error:', err));
        }
      } else if (event === 'TOKEN_REFRESHED' && session) {
        this.currentUser = session.user;
        this.renderUser();
      } else if (event === 'SIGNED_OUT') {
        this.handleUnauthenticated();
        this.dismissStartupLoader();
      }
    });
  }

  async handleAuthenticated(session, isFreshLogin = false) {
    this.currentUser = session.user;

    // Show App, Hide Landing and Auth Screens
    if (this.landingScreen) this.landingScreen.classList.add('hidden');
    if (this.authScreen) this.authScreen.classList.add('hidden');
    if (this.appContainer) {
      this.appContainer.style.display = 'flex';
    }

    // 1. Initial local profile render
    this.renderUser();

    // 2. Sync directly from Supabase Cloud (carrying over landing theme on fresh login)
    await store.syncFromCloud(session.user.id, isFreshLogin);
    this.renderUser();

    // 3. Initial page load (check hash or default to subjects)
    const hash = window.location.hash.replace('#', '');
    const targetRoute = this.pages[hash] ? hash : 'subjects';
    if (typeof window.renderStartupSkeleton === 'function') {
      window.renderStartupSkeleton(targetRoute);
    }
    this.navigateTo(targetRoute);

    // Smoothly reveal sharp, interactive content
    this.dismissStartupLoader();
  }

  handleUnauthenticated() {
    this.currentUser = null;
    store.resetState();

    // Hide App, show appropriate public page based on hash
    if (this.appContainer) this.appContainer.style.display = 'none';

    const hash = window.location.hash.replace('#', '');
    if (hash === 'signin' || hash === 'auth') {
      this.showAuthView(false);
    } else if (hash === 'signup') {
      this.showAuthView(true);
    } else {
      this.showLandingView();
    }
  }

  async showLandingView() {
    if (this.authScreen) this.authScreen.classList.add('hidden');
    if (this.landingScreen) {
      this.landingScreen.classList.remove('hidden');
      if (!this.landingPage) {
        const { LandingPage } = await import('./landing.js');
        this.landingPage = new LandingPage(
          (isSignUp) => {
            window.location.hash = isSignUp ? 'signup' : 'signin';
            this.showAuthView(isSignUp);
          },
          () => {
            const current = store.getTheme();
            const next = current === 'dark' ? 'light' : 'dark';
            store.setTheme(next);
          }
        );
      }
      this.landingPage.render(this.landingScreen);
    }
  }

  async showAuthView(isSignUp = false) {
    if (this.landingScreen) this.landingScreen.classList.add('hidden');
    if (this.authScreen) {
      this.authScreen.classList.remove('hidden');
      if (!this.authController) {
        const { AuthController } = await import('./auth.js');
        this.authController = new AuthController(
          async (session) => {
            this.setStartupStatus('Connecting to cloud...');
            await this.handleAuthenticated(session, true);
          },
          () => {
            window.location.hash = '';
            this.showLandingView();
          }
        );
      }
      this.authController.renderAuthScreen(this.authScreen, isSignUp);
    }
  }

  renderUser() {
    const user = store.getUserProfile();
    const avatarEl = document.getElementById('user-avatar');
    const nameEl = document.getElementById('user-name');
    const roleEl = document.getElementById('user-role');
    const emailEl = document.getElementById('user-email');

    const email = (this.currentUser && this.currentUser.email) || user.email || 'student@university.edu';
    const name = user.name || (email ? email.split('@')[0] : 'Student');
    const roleText = `${user.year_level || '1st Year'}${user.program ? ` · ${user.program}` : ' · Student'}`;

    if (avatarEl) {
      avatarEl.textContent = user.avatar || 'ST';
      avatarEl.style.backgroundColor = user.avatar_color || '#6366f1';
    }
    if (nameEl) nameEl.textContent = name;
    if (roleEl) roleEl.textContent = roleText;
    if (emailEl) emailEl.textContent = email;
  }

  async navigateTo(pageKey, targetSection = null) {
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
    if (this.mainContainer && pageConfig.load) {
      const renderer = await pageConfig.load();
      renderer(this.mainContainer);
      this.mainContainer.classList.remove('view-enter');
      void this.mainContainer.offsetWidth; // Trigger reflow for clean re-animation
      this.mainContainer.classList.add('view-enter');
      this.mainContainer.addEventListener('animationend', () => {
        this.mainContainer.classList.remove('view-enter');
      }, { once: true });
    }

    // Handle scroll to target section if in settings
    if (pageKey === 'settings') {
      const sectionToActivate = targetSection || 'settings-academic';
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

        if (window.innerWidth < 768) {
          closeMobileDrawer();
        }

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
        if (this.userPopover && !this.userPopover.contains(e.target) && !this.userProfileBtn.contains(e.target)) {
          this.userPopover.classList.remove('open');
        }
      });
    }

    // Top-bar app-wide theme toggle button
    document.getElementById('app-theme-btn')?.addEventListener('click', () => {
      const current = store.getTheme();
      let next = 'light';
      if (current === 'pure-black') next = 'pure-white';
      else if (current === 'pure-white') next = 'pure-black';
      else if (current === 'light') next = 'dark';
      else next = 'light';
      store.setTheme(next);
      this.showToast(`Theme switched to ${next} mode`, 'info');
    });

    document.getElementById('sync-cloud-btn')?.addEventListener('click', async () => {
      this.userPopover.classList.remove('open');
      if (this.currentUser) {
        this.showToast('Synchronizing with Supabase Cloud...', 'info');
        await store.syncFromCloud(this.currentUser.id);
        this.renderUser();
        this.navigateTo(this.currentPage);
        this.showToast('Cloud workspace up to date', 'success');
      }
    });

    // Wire the existing sidebar sign-out button
    document.getElementById('logout-btn')?.addEventListener('click', async () => {
      this.userPopover?.classList.remove('open');
      this.showToast('Signing out...', 'info');
      await signOut();
      this.handleUnauthenticated();
    });

    document.getElementById('sidebar-quick-logout')?.addEventListener('click', async (e) => {
      e.preventDefault();
      this.userPopover?.classList.remove('open');
      this.showToast('Signing out...', 'info');
      await signOut();
      this.handleUnauthenticated();
    });
  }

  setupGlobalEvents() {
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '');
      if (this.currentUser) {
        if (this.pages[hash] && hash !== this.currentPage) {
          this.navigateTo(hash);
        } else if (!this.pages[hash]) {
          this.navigateTo('subjects');
        }
      } else {
        if (hash === 'signin' || hash === 'auth') {
          this.showAuthView(false);
        } else if (hash === 'signup') {
          this.showAuthView(true);
        } else {
          this.showLandingView();
        }
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
        if (this.currentPage === 'settings' && data && (data.type === 'user' || data.type === 'settings')) {
          return;
        }
        pageConfig.renderer(this.mainContainer);
      }
    });
  }

  setupSyncIndicator() {
    this.syncBadge = document.getElementById('global-sync-badge');
    this.syncDot = document.getElementById('global-sync-dot');
    this.syncLabel = document.getElementById('global-sync-label');
    this.syncPopover = document.getElementById('global-sync-popover');
    this.popoverDot = document.getElementById('popover-status-dot');
    this.popoverTitle = document.getElementById('popover-status-title');
    this.popoverStatePill = document.getElementById('popover-state-pill');
    this.popoverLastSynced = document.getElementById('popover-last-synced');
    this.popoverDesc = document.getElementById('popover-status-desc');
    this.syncNowBtn = document.getElementById('global-sync-now-btn');
    this.mobileSyncBadge = document.getElementById('mobile-sync-badge');
    this.mobileSyncDot = document.getElementById('mobile-sync-dot');

    // Popover Toggle
    this.syncBadge?.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = this.syncPopover?.classList.contains('open');
      if (isOpen) {
        this.closeSyncPopover();
      } else {
        this.openSyncPopover();
      }
    });

    this.mobileSyncBadge?.addEventListener('click', (e) => {
      e.stopPropagation();
      const conn = store.getConnectionStatus();
      if (!conn.isOnline) {
        this.showToast('Offline — Changes saved locally in memory', 'warning');
      } else if (conn.status === 'saving') {
        this.showToast('Synchronizing with Supabase Cloud...', 'info');
      } else {
        this.showToast('Supabase Cloud is connected and up to date', 'success');
      }
    });

    // Close popover when clicking outside
    document.addEventListener('click', (e) => {
      if (this.syncPopover && !this.syncPopover.contains(e.target) && e.target !== this.syncBadge && !this.syncBadge?.contains(e.target)) {
        this.closeSyncPopover();
      }
    });

    // Wire Sync Now button
    this.syncNowBtn?.addEventListener('click', async () => {
      if (!store.isOnline) {
        this.showToast('Cannot sync while offline. Check internet connection.', 'warning');
        return;
      }
      if (this.currentUser) {
        this.showToast('Synchronizing workspace data...', 'info');
        await store.syncFromCloud(this.currentUser.id);
        this.renderUser();
        this.navigateTo(this.currentPage);
        this.showToast('Workspace synchronized with Supabase Cloud', 'success');
      } else {
        this.showToast('Sign in to sync your workspace with cloud storage', 'info');
      }
    });

    // Listen to reactive store sync events
    events.on('sync:connection', (connState) => {
      this.renderSyncStatus(connState);
    });

    events.on('sync:status', () => {
      this.renderSyncStatus(store.getConnectionStatus());
    });

    // Periodic relative timestamp updater
    setInterval(() => {
      if (this.popoverLastSynced) {
        this.popoverLastSynced.textContent = this.formatRelativeTime(store.getLastSyncedAt());
      }
    }, 30000);

    // Initial render
    this.renderSyncStatus(store.getConnectionStatus());
  }

  openSyncPopover() {
    this.syncPopover?.classList.add('open');
    this.syncBadge?.classList.add('active');
    this.syncBadge?.setAttribute('aria-expanded', 'true');
    this.syncPopover?.setAttribute('aria-hidden', 'false');
    if (this.popoverLastSynced) {
      this.popoverLastSynced.textContent = this.formatRelativeTime(store.getLastSyncedAt());
    }
  }

  closeSyncPopover() {
    this.syncPopover?.classList.remove('open');
    this.syncBadge?.classList.remove('active');
    this.syncBadge?.setAttribute('aria-expanded', 'false');
    this.syncPopover?.setAttribute('aria-hidden', 'true');
  }

  renderSyncStatus(connState) {
    if (!connState) connState = store.getConnectionStatus();
    const { isOnline, status, lastSyncedAt, error, message } = connState;

    const badgeClasses = ['sync-synced', 'sync-saving', 'sync-offline', 'sync-error'];
    const currentClass = `sync-${status}`;

    // Update main header badge
    if (this.syncBadge) {
      badgeClasses.forEach(c => this.syncBadge.classList.remove(c));
      this.syncBadge.classList.add(currentClass);
    }

    // Update mobile badge
    if (this.mobileSyncBadge) {
      badgeClasses.forEach(c => this.mobileSyncBadge.classList.remove(c));
      this.mobileSyncBadge.classList.add(currentClass);
    }

    // Update label text
    if (this.syncLabel) {
      if (status === 'saving') {
        this.syncLabel.textContent = 'Syncing...';
      } else if (status === 'offline' || !isOnline) {
        this.syncLabel.textContent = 'Offline';
      } else if (status === 'error') {
        this.syncLabel.textContent = 'Sync failed';
      } else {
        this.syncLabel.textContent = 'Synced';
      }
    }

    // Update popover card details
    if (this.popoverDot) {
      this.popoverDot.className = `sync-popover-dot ${status}`;
    }

    if (this.popoverTitle) {
      if (status === 'saving') {
        this.popoverTitle.textContent = 'Synchronizing Workspace...';
      } else if (status === 'offline' || !isOnline) {
        this.popoverTitle.textContent = 'Offline Mode';
      } else if (status === 'error') {
        this.popoverTitle.textContent = 'Sync Error';
      } else {
        this.popoverTitle.textContent = 'Supabase Cloud Connected';
      }
    }

    if (this.popoverStatePill) {
      this.popoverStatePill.className = `sync-popover-state-pill ${status}`;
      if (status === 'saving') {
        this.popoverStatePill.textContent = 'Syncing';
      } else if (status === 'offline' || !isOnline) {
        this.popoverStatePill.textContent = 'Offline';
      } else if (status === 'error') {
        this.popoverStatePill.textContent = 'Failed';
      } else {
        this.popoverStatePill.textContent = 'Live';
      }
    }

    if (this.popoverLastSynced) {
      this.popoverLastSynced.textContent = this.formatRelativeTime(lastSyncedAt);
    }

    if (this.popoverDesc) {
      if (status === 'offline' || !isOnline) {
        this.popoverDesc.textContent = 'Network connection lost. Changes are stored in memory and will synchronize automatically when reconnected.';
      } else if (status === 'saving') {
        this.popoverDesc.textContent = message || 'Active database transactions are writing to your Supabase Cloud workspace.';
      } else if (status === 'error') {
        this.popoverDesc.textContent = error || 'A cloud synchronization error occurred. Click "Sync Now" to retry.';
      } else {
        this.popoverDesc.textContent = 'Your subjects, study sessions, grades, and study plans are synchronized across all devices.';
      }
    }
  }

  formatRelativeTime(timestamp) {
    if (!timestamp) return 'Just now';
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 10) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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
    }, 3200);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.avenApp = new AvenApp();
});
