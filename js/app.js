/**
 * Aven - Main Application Router & Coordinator
 * Integrated with Supabase Auth, Cloud Sync, and Local Data Migration
 */

import { store, events } from './core/store.js';
import { supabase, getCurrentSession, signOut, onAuthStateChange } from './core/supabase.js';
import { renderStartupSkeleton } from './ui/skeleton.js';
import { initGlobalTooltips } from './core/tooltip.js';

function extractAuthUrlParams() {
  if (typeof window === 'undefined') return {};

  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
  const search = window.location.search.startsWith('?') ? window.location.search.slice(1) : window.location.search;

  const hashParams = new URLSearchParams(hash);
  const searchParams = new URLSearchParams(search);

  const error = hashParams.get('error') || searchParams.get('error');
  const errorCode = hashParams.get('error_code') || searchParams.get('error_code');
  const errorDescription = hashParams.get('error_description') || searchParams.get('error_description');
  const type = hashParams.get('type') || searchParams.get('type');
  const hasAuthTokens = Boolean(hashParams.get('access_token') || hashParams.get('refresh_token') || searchParams.get('code'));

  return {
    error,
    errorCode,
    errorDescription,
    type,
    hasAuthTokens
  };
}

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
        load: () => import('./pages/subjects.js').then(m => m.renderSubjectsView),
        cleanup: () => import('./pages/subjects.js').then(m => m.cleanupSubjectsView?.())
      },
      tracker: {
        title: 'Tracker',
        subtitle: 'Log study sessions, track your activity heatmap, and keep your streak going.',
        load: () => import('./pages/tracker.js').then(m => m.renderTrackerView)
      },
      grades: {
        title: 'Grades',
        subtitle: 'Calculate weighted grades by category, and see exactly what you need on the final.',
        load: () => import('./pages/grades.js').then(m => m.renderGradesView),
        cleanup: () => import('./pages/grades.js').then(m => m.cleanupGradesView?.())
      },
      schedule: {
        title: 'Schedule',
        subtitle: 'Upload and view your syllabi, schedules, and study guides in one place.',
        load: () => import('./pages/plans.js').then(m => m.renderPlansView),
        cleanup: () => import('./pages/plans.js').then(m => m.cleanupPlansView?.())
      },
      plans: {
        title: 'Schedule',
        subtitle: 'Upload and view your syllabi, schedules, and study guides in one place.',
        load: () => import('./pages/plans.js').then(m => m.renderPlansView),
        cleanup: () => import('./pages/plans.js').then(m => m.cleanupPlansView?.())
      },
      settings: {
        title: 'Settings',
        subtitle: 'Manage your academic defaults, grading scale, account, and data.',
        load: () => import('./pages/settings.js').then(m => m.renderSettingsView)
      },
      profile: {
        title: 'Profile',
        subtitle: 'View your student identity, overall academic performance, and study statistics.',
        load: () => import('./pages/profile.js').then(m => m.renderProfileView),
        cleanup: () => import('./pages/profile.js').then(m => m.cleanupProfileView?.())
      }
    };

    this.currentPageCleanup = null;
    this._navId = 0;
    this._spinnerTimeout = null;
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
    initGlobalTooltips();
    this.setupSyncIndicator();
    this.setupAuthListener();

    // Check for auth errors in URL (e.g. expired or invalid email confirmation link)
    const authParams = extractAuthUrlParams();
    if (authParams.error || authParams.errorDescription) {
      const message = decodeURIComponent((authParams.errorDescription || authParams.error || 'Authentication link failed').replace(/\+/g, ' '));
      if (window.history && window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname + '#signin');
      }
      this.handleUnauthenticated();
      setTimeout(() => {
        this.authController?.showAlert(`Email confirmation error: ${message}`, 'error');
        this.showToast(`Confirmation error: ${message}`, 'danger');
      }, 150);
      this.dismissStartupLoader();
      return;
    }

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

    const authParams = extractAuthUrlParams();
    const isConfirmedSignup = authParams.type === 'signup' || authParams.hasAuthTokens;

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

    // 3. Clean up URL search / hash if they contained auth tokens / query params
    if (authParams.hasAuthTokens && window.history && window.history.replaceState) {
      window.history.replaceState({}, document.title, window.location.pathname + '#subjects');
    }

    // 4. Initial page load (check hash or default to subjects)
    const rawHash = window.location.hash.replace('#', '');
    const targetRoute = this.pages[rawHash] ? rawHash : 'subjects';
    if (typeof window.renderStartupSkeleton === 'function') {
      window.renderStartupSkeleton(targetRoute);
    }
    this.navigateTo(targetRoute);

    if (isConfirmedSignup) {
      setTimeout(() => {
        this.showToast('Email confirmed successfully! Welcome to Aven.', 'success');
      }, 300);
    }

    // Smoothly reveal sharp, interactive content
    this.dismissStartupLoader();
  }

  handleUnauthenticated() {
    this.currentUser = null;
    this.hidePageSpinner();
    if (typeof this.currentPageCleanup === 'function') {
      try { this.currentPageCleanup(); } catch (e) {}
      this.currentPageCleanup = null;
    }
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
        const { LandingPage } = await import('./pages/landing.js');
        this.landingPage = new LandingPage(
          (isSignUp) => {
            window.location.hash = isSignUp ? 'signup' : 'signin';
            this.showAuthView(isSignUp);
          },
          (e) => {
            const current = store.getTheme();
            let next = 'light';
            if (current === 'cool-dark') next = 'cool-light';
            else if (current === 'cool-light') next = 'cool-dark';
            else if (current === 'pure-black') next = 'pure-white';
            else if (current === 'pure-white') next = 'pure-black';
            else if (current === 'light') next = 'dark';
            else next = 'light';
            store.setTheme(next, e?.currentTarget || document.getElementById('landing-theme-btn'));
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
        const { AuthController } = await import('./pages/auth.js');
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
      if (user.avatar_url) {
        avatarEl.innerHTML = `<img src="${user.avatar_url}" alt="${name}" class="user-avatar-img">`;
        avatarEl.style.backgroundColor = 'transparent';
      } else {
        avatarEl.textContent = user.avatar || 'ST';
        avatarEl.style.backgroundColor = user.avatar_color || '#6366f1';
      }
    }
    if (nameEl) nameEl.textContent = name;
    if (roleEl) roleEl.textContent = roleText;
    if (emailEl) emailEl.textContent = email;
  }

  updateNavPillActive(pageKey, animate = true) {
    const navLinksGroup = document.getElementById('top-nav-links-group');
    const indicator = document.getElementById('nav-pill-indicator');
    const links = document.querySelectorAll('.top-nav-bar .nav-pill');

    let activeLink = null;
    links.forEach(link => {
      const isMatch = link.dataset.page === pageKey || 
                     (pageKey === 'plans' && link.dataset.page === 'schedule') ||
                     (pageKey === 'schedule' && link.dataset.page === 'schedule');
      link.classList.toggle('active', isMatch);
      if (isMatch) activeLink = link;
    });

    if (activeLink && navLinksGroup && indicator) {
      const leftOffset = activeLink.offsetLeft;
      const width = activeLink.offsetWidth;

      if (!animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        indicator.style.transition = 'none';
      } else {
        indicator.style.transition = '';
      }

      indicator.style.transform = `translateX(${leftOffset}px)`;
      indicator.style.width = `${width}px`;
      indicator.style.opacity = '1';

      // Ensure active pill stays smoothly visible when container scrolls
      try {
        activeLink.scrollIntoView({ behavior: animate ? 'smooth' : 'auto', block: 'nearest', inline: 'nearest' });
      } catch (e) {}
    } else if (indicator) {
      indicator.style.opacity = '0';
    }
  }

  showPageSpinner() {
    if (!this.mainContainer) return;
    this.mainContainer.classList.remove('view-exit');
    this.mainContainer.innerHTML = `
      <div class="page-transition-spinner-wrap" role="status" aria-label="Loading page">
        <div class="page-transition-spinner"></div>
      </div>
    `;
  }

  hidePageSpinner() {
    if (this._spinnerTimeout) {
      clearTimeout(this._spinnerTimeout);
      this._spinnerTimeout = null;
    }
  }

  async navigateTo(pageKey, targetSection = null) {
    if (pageKey === 'plans') pageKey = 'schedule';
    if (!this.pages[pageKey]) pageKey = 'subjects';

    // Page teardown: clean up previous page before navigating away
    if (this.currentPage && this.currentPage !== pageKey) {
      if (typeof this.currentPageCleanup === 'function') {
        try {
          this.currentPageCleanup();
        } catch (err) {
          console.error(`Error cleaning up page ${this.currentPage}:`, err);
        }
        this.currentPageCleanup = null;
      }
      const prevConfig = this.pages[this.currentPage];
      if (typeof prevConfig?.cleanup === 'function') {
        try {
          prevConfig.cleanup();
        } catch (err) {
          console.error(`Error in page cleanup for ${this.currentPage}:`, err);
        }
      }
    }

    // Synchronize address bar hash if it doesn't already match
    if (window.location.hash.replace(/^#/, '').split('?')[0] !== pageKey) {
      window.location.hash = pageKey;
    }

    const pageConfig = this.pages[pageKey];

    // Confirm render will proceed before setting currentPage
    if (this.mainContainer && pageConfig.load) {
      const navId = ++this._navId;
      let isRenderComplete = false;
      this.hidePageSpinner();

      this.currentPage = pageKey;

      // Update Header
      if (this.pageTitleEl) this.pageTitleEl.textContent = pageConfig.title;
      if (this.pageSubtitleEl) this.pageSubtitleEl.textContent = pageConfig.subtitle || '';

      // Update Top Nav pill active state & sliding background indicator
      this.updateNavPillActive(pageKey, true);

      // Render current view with fluid entrance and cross-fade animation
      const isInitialRender = !this.mainContainer.hasChildNodes() || this.mainContainer.innerHTML.trim() === '';
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Schedule spinner if load takes longer than ~150ms threshold
      this._spinnerTimeout = setTimeout(() => {
        if (this._navId === navId && !isRenderComplete && this.mainContainer) {
          this.showPageSpinner();
        }
      }, 150);

      const doRender = async () => {
        if (this._navId !== navId) return;

        if (typeof this.currentPageCleanup === 'function') {
          try {
            this.currentPageCleanup();
          } catch (e) {}
          this.currentPageCleanup = null;
        }

        try {
          const renderer = await pageConfig.load();
          if (this._navId !== navId) return;

          isRenderComplete = true;
          this.hidePageSpinner();

          pageConfig.renderer = renderer;
          this.mainContainer.classList.remove('view-exit');
          const cleanup = renderer(this.mainContainer);
          if (typeof cleanup === 'function') {
            this.currentPageCleanup = cleanup;
          }
          this.mainContainer.classList.remove('view-enter');
          void this.mainContainer.offsetWidth; // Trigger reflow for clean re-animation
          this.mainContainer.classList.add('view-enter');
          this.mainContainer.addEventListener('animationend', () => {
            this.mainContainer.classList.remove('view-enter');
          }, { once: true });
        } catch (err) {
          console.error(`Failed to load page ${pageKey}:`, err);
          if (this._navId !== navId) return;
          isRenderComplete = true;
          this.hidePageSpinner();
          this.mainContainer.classList.remove('view-exit');
        }
      };

      if (isInitialRender || prefersReducedMotion) {
        await doRender();
      } else {
        this.mainContainer.classList.add('view-exit');
        setTimeout(async () => {
          if (this._navId === navId) {
            await doRender();
          }
        }, 120);
      }
    } else {
      this.currentPage = pageKey;
    }

    // Handle scroll to target section if in settings
    if (pageKey === 'settings' && targetSection) {
      setTimeout(() => {
        const el = document.getElementById(targetSection);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    }
  }

  setupNavigation() {
    // 1. Navigation link pills (route through hashchange as single source of truth)
    document.querySelectorAll('.top-nav-bar .nav-pill').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetPage = link.dataset.page;
        if (targetPage) {
          if (window.location.hash.replace(/^#/, '').split('?')[0] === targetPage) {
            if (this.currentPage !== targetPage) {
              this.navigateTo(targetPage);
            }
          } else {
            window.location.hash = targetPage;
          }
        }
      });
    });

    // 2. Top theme toggle button
    document.getElementById('top-theme-btn')?.addEventListener('click', (e) => {
      const current = store.getTheme();
      let next = 'light';
      if (current === 'cool-dark') next = 'cool-light';
      else if (current === 'cool-light') next = 'cool-dark';
      else if (current === 'pure-black') next = 'pure-white';
      else if (current === 'pure-white') next = 'pure-black';
      else if (current === 'light') next = 'dark';
      else next = 'light';
      store.setTheme(next, e.currentTarget);
      const label = next.replace('-', ' ');
      this.showToast(`Theme switched to ${label} mode`, 'info');
    });

    // 3. Top settings button
    document.getElementById('top-settings-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.navigateTo('settings');
    });

    // 4. Profile cluster (click navigates to Profile page)
    document.getElementById('top-profile-cluster')?.addEventListener('click', () => {
      if (window.location.hash.replace(/^#/, '').split('?')[0] === 'profile') {
        if (this.currentPage !== 'profile') {
          this.navigateTo('profile');
        }
      } else {
        window.location.hash = 'profile';
      }
    });
    document.getElementById('top-profile-cluster')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (window.location.hash.replace(/^#/, '').split('?')[0] === 'profile') {
          if (this.currentPage !== 'profile') {
            this.navigateTo('profile');
          }
        } else {
          window.location.hash = 'profile';
        }
      }
    });

    // 5. Log out button
    document.getElementById('top-logout-btn')?.addEventListener('click', async () => {
      if (confirm('Are you sure you want to log out of Aven?')) {
        this.showToast('Signing out...', 'info');
        await signOut();
        this.handleUnauthenticated();
      }
    });

    // 6. Window resize listener to keep sliding pill indicator precisely positioned
    window.addEventListener('resize', () => {
      this.updateNavPillActive(this.currentPage, false);
    }, { passive: true });
  }

  setupGlobalEvents() {
    window.addEventListener('hashchange', () => {
      const fullHash = window.location.hash.replace(/^#/, '');
      const rawRoute = fullHash.split('?')[0];
      if (this.currentUser) {
        if (this.pages[rawRoute] && rawRoute !== this.currentPage) {
          this.navigateTo(rawRoute);
        } else if (!this.pages[rawRoute] && !fullHash.startsWith('signin') && !fullHash.startsWith('signup')) {
          this.navigateTo('subjects');
        }
      } else {
        if (rawRoute === 'signin' || rawRoute === 'auth') {
          this.showAuthView(false);
        } else if (rawRoute === 'signup') {
          this.showAuthView(true);
        } else {
          this.showLandingView();
        }
      }
    });

    events.on('app:navigate', ({ page, subjectId, section }) => {
      if (subjectId) {
        events.emit('plans:select-subject', subjectId);
      }
      this.navigateTo(page, section);
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
        if (this.currentPage === 'plans' && data && data.type === 'plan_autosave') {
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

  showToast(message, type = 'info', options = {}) {
    if (!this.toastContainer) return;

    const { subtitle, actionLabel, actionCallback, duration = 3500 } = options;

    // Normalize type aliases
    const typeClass = (type === 'error') ? 'toast-danger' : `toast-${type}`;

    const toast = document.createElement('div');
    toast.className = `toast ${typeClass}`;

    // ---- Icon SVGs per type ----
    const icons = {
      success: `<polyline points="20 6 9 17 4 12"></polyline>`,
      danger:  `<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>`,
      error:   `<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>`,
      warning: `<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>`,
      info:    `<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>`,
    };
    const iconKey = (type === 'error') ? 'danger' : type;
    const iconPath = icons[iconKey] || icons.info;

    // Determine if badge accent is light enough to need dark icon/text
    const needsDark = (type === 'warning') ||
      (type === 'success' && ['cool-dark', 'pure-black'].includes(
        document.documentElement.getAttribute('data-theme')
      ));

    // ---- Build inner HTML ----
    let html = '';

    // Icon badge
    html += `<div class="toast-icon-badge${needsDark ? ' badge-dark' : ''}">
      <svg viewBox="0 0 24 24">${iconPath}</svg>
    </div>`;

    // Text content
    html += `<div class="toast-content">
      <span class="toast-title">${message}</span>
      ${subtitle ? `<span class="toast-subtitle">${subtitle}</span>` : ''}
    </div>`;

    // Optional action button
    if (actionLabel && actionCallback) {
      html += `<button class="toast-action${needsDark ? ' action-dark' : ''}">${actionLabel}</button>`;
    }

    toast.innerHTML = html;

    let dismissTimer = null;

    // Wire up action button if present
    if (actionLabel && actionCallback) {
      const actionBtn = toast.querySelector('.toast-action');
      actionBtn?.addEventListener('click', () => {
        if (dismissTimer) clearTimeout(dismissTimer);
        actionCallback();
        toast.classList.add('toast-dismissing');
        setTimeout(() => toast.remove(), 220);
      });
    }

    this.toastContainer.appendChild(toast);

    // Auto-dismiss
    dismissTimer = setTimeout(() => {
      toast.classList.add('toast-dismissing');
      setTimeout(() => toast.remove(), 220);
    }, duration);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.avenApp = new AvenApp();
});
