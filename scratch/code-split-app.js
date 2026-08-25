import fs from 'fs';

let code = fs.readFileSync('js/app.js', 'utf-8');

// 1. Replace static page imports with dynamic imports
const oldImports = `import { store, events } from './store.js';
import { supabase, getCurrentSession, signOut, onAuthStateChange } from './supabase.js';
import { AuthController } from './auth.js';
import { LandingPage } from './landing.js';
import { renderSubjectsView } from './subjects.js';
import { renderTrackerView } from './tracker.js';
import { renderGradesView } from './grades.js';
import { renderPlansView } from './plans.js';
import { renderSettingsView } from './settings.js';
import { renderStartupSkeleton } from './ui/skeleton.js';`;

const newImports = `import { store, events } from './store.js';
import { supabase, getCurrentSession, signOut, onAuthStateChange } from './supabase.js';
import { renderStartupSkeleton } from './ui/skeleton.js';`;

code = code.replace(oldImports, newImports);

// 2. Replace pages config in constructor
const oldPages = `    this.pages = {
      subjects: {
        title: 'Subjects',
        subtitle: 'Track your enrolled courses, study progress, and academic standing at a glance.',
        renderer: renderSubjectsView
      },
      tracker: {
        title: 'Study Tracker',
        subtitle: 'Log study sessions, track your activity heatmap, and keep your streak going.',
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
        subtitle: 'Manage your academic defaults, grading scale, account, and data.',
        renderer: renderSettingsView
      }
    };`;

const newPages = `    this.pages = {
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
    };`;

code = code.replace(oldPages, newPages);

// 3. Replace showLandingView and showAuthView to dynamically load
const oldLandingAndAuth = `  showLandingView() {
    if (this.authScreen) this.authScreen.classList.add('hidden');
    if (this.landingScreen) {
      this.landingScreen.classList.remove('hidden');
      if (!this.landingPage) {
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

  showAuthView(isSignUp = false) {
    if (this.landingScreen) this.landingScreen.classList.add('hidden');
    if (this.authScreen) {
      this.authScreen.classList.remove('hidden');
      if (!this.authController) {
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
  }`;

const newLandingAndAuth = `  async showLandingView() {
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
  }`;

code = code.replace(oldLandingAndAuth, newLandingAndAuth);

// 4. Update navigateTo to be async and load renderers dynamically
const oldNavigateTo = `  navigateTo(pageKey, targetSection = null) {
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
  }`;

const newNavigateTo = `  async navigateTo(pageKey, targetSection = null) {
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
  }`;

code = code.replace(oldNavigateTo, newNavigateTo);

fs.writeFileSync('js/app.js', code, 'utf-8');
console.log('Successfully code-split js/app.js routes!');
