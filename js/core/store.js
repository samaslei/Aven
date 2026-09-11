/**
 * Aven — Central Reactive Store (Supabase Cloud Synced)
 *
 * Thin orchestrator that delegates to focused service modules.
 * Maintains 100% backward compatibility: every existing import
 * (`store`, `events`, `YEAR_LEVELS`, `getPhilippineGrade`, etc.)
 * continues to work without any consumer changes.
 *
 * Architecture:
 *   Store (this file) → owns state + syncFromCloud orchestration
 *     ├── SubjectsService
 *     ├── SessionsService
 *     ├── GradesService
 *     ├── PlansService
 *     ├── SettingsService
 *     ├── ProfileService
 *     └── AccountService
 */

import { supabase, getCurrentUser, isSupabaseConfigured } from './supabase.js';
import { events } from './events.js';
import { syncEngine } from './sync-engine.js';
import { generateId } from './id.js';
import * as ls from '../utils/local-storage.js';

// Domain imports
import {
  YEAR_LEVELS,
  SEMESTERS,
  DEFAULT_COLOR_SWATCHES,
  GRADE_CATEGORIES,
  PHILIPPINE_GRADE_SCALE
} from '../domain/scale-definitions.js';
import {
  getPhilippineGrade,
  getGradeStandingTier,
  getStandingColor,
  getStandingClass,
  calculateTermGradeBreakdown,
  calculateSubjectGradeBreakdown
} from '../domain/grade-calculator.js';
import {
  calculateStreakStats,
  generateYearCalendarMatrix,
  calculateMilestoneData
} from '../domain/tracker-calculator.js';
import * as studyStats from '../domain/study-stats.js';

// Service factories
import { createSubjectsService } from '../services/subjects-service.js';
import { createSessionsService } from '../services/sessions-service.js';
import { createGradesService } from '../services/grades-service.js';
import { createPlansService } from '../services/plans-service.js';
import { createSettingsService } from '../services/settings-service.js';
import { createProfileService } from '../services/profile-service.js';
import { createAccountService } from '../services/account-service.js';

// Re-export domain constants & functions for backward compatibility
export {
  events,
  generateId,
  YEAR_LEVELS,
  SEMESTERS,
  DEFAULT_COLOR_SWATCHES,
  GRADE_CATEGORIES,
  PHILIPPINE_GRADE_SCALE,
  getPhilippineGrade,
  getGradeStandingTier,
  getStandingColor,
  getStandingClass
};

// ---------------------------------------------------------------------------
// Store Class
// ---------------------------------------------------------------------------

class Store {
  constructor() {
    this.currentUserId = null;
    this.isSyncing = false;
    this._cachedAcademicStanding = null;
    this.resetState();
    this._initServices();
    events.on('store:changed', (data) => {
      if (!data || !['session', 'plan', 'plan_autosave'].includes(data.type)) {
        this._cachedAcademicStanding = null;
      }
    });
  }

  // ---------------------------------------------------------------------------
  // State Initialization
  // ---------------------------------------------------------------------------

  resetState(clearCachedUser = false) {
    this._cachedAcademicStanding = null;
    const savedGradesSort = ls.getItem('aven_grades_sidebar_sort', 'year-sem-grouped');
    const savedSubjectsSort = ls.getItem('aven_subjects_sort', 'recent-desc');
    const savedTheme = ls.getItem('aven_theme', 'dark');
    const savedNeutralColors = ls.getItem('aven_neutral_colors') === 'true';

    if (clearCachedUser) {
      ls.removeItem('aven_user_profile');
    }

    const savedUser = clearCachedUser ? null : this._profileService?.getLocalCachedUser(this.currentUserId) ?? null;

    if (savedNeutralColors && typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-neutral-colors', 'true');
    }

    const defaultUser = {
      name: 'Alex Rivera', email: 'student@university.edu', bio: 'Undergraduate Student',
      year_level: '1st Year', institution: 'University of the Philippines',
      program: 'BS Computer Science', avatar: 'AR', avatar_color: '#6366f1', avatar_url: null
    };

    this.state = {
      subjects: [],
      sessions: [],
      grades: [],
      grade_configs: [],
      plans: [],
      user: savedUser ? { ...defaultUser, ...savedUser } : { ...defaultUser },
      settings: { neutral_colors: savedNeutralColors },
      grading_scale: JSON.parse(JSON.stringify(PHILIPPINE_GRADE_SCALE)),
      subjects_sort: savedSubjectsSort,
      grades_sidebar_sort: savedGradesSort,
      theme: savedTheme,
      _isThemeTransitioning: false
    };
  }

  /** Wires up all service modules with dependency injection. */
  _initServices() {
    const context = { get currentUserId() { return store.currentUserId; }, set currentUserId(v) { store.currentUserId = v; } };

    this._settingsService = createSettingsService(this.state);
    this._profileService = createProfileService(this.state, context);
    this._gradesService = createGradesService(this.state);
    this._subjectsService = createSubjectsService(
      this.state,
      () => this._settingsService.getSettings(),
      (sid, mw, fw) => this._gradesService.saveSubjectGradeConfig(sid, mw, fw)
    );
    this._sessionsService = createSessionsService(this.state);
    this._plansService = createPlansService(this.state);
    this._accountService = createAccountService(this.state, {
      getSubjects: (ia) => this._subjectsService.getSubjects(ia),
      getSessions: () => this._sessionsService.getSessions(),
      getGrades: () => this._gradesService.getGrades(),
      getGradeConfigs: () => this._gradesService.getGradeConfigs(),
      getStudyPlans: () => this._plansService.getStudyPlans(),
      getUserProfile: () => this._profileService.getUserProfile(),
      getSettings: () => this._settingsService.getSettings(),
      resetState: () => this.resetState(true),
      syncFromCloud: (uid) => this.syncFromCloud(uid)
    });
  }

  // ---------------------------------------------------------------------------
  // Sync Orchestration
  // ---------------------------------------------------------------------------

  handleNetworkChange(isOnline) {
    syncEngine._handleNetworkChange(isOnline);
    if (isOnline && this.currentUserId) {
      this.syncFromCloud(this.currentUserId);
    }
  }

  async syncFromCloud(userId, isFreshLogin = false) {
    if (!userId) return;
    this.currentUserId = userId;
    this.isSyncing = true;

    if (!syncEngine.isOnline) {
      syncEngine.setStatus('offline', 'Cannot sync while offline');
      return;
    }
    syncEngine.setStatus('saving', 'Syncing workspace data...');

    try {
      // 1. Fetch Profile
      const { data: profile } = await supabase
        .from('profiles').select('*').eq('user_id', userId).maybeSingle();

      const user = await getCurrentUser();
      const metaAvatar = user?.user_metadata?.avatar_url;
      const cached = this._profileService.getLocalCachedUser(userId);

      const resolvedAvatarUrl = (profile?.avatar_url)
        ? profile.avatar_url
        : (metaAvatar || cached?.avatar_url || this.state.user?.avatar_url || null);

      if (profile) {
        const name = profile.display_name || user?.user_metadata?.display_name || cached?.name || 'Student';
        const initials = name.split(' ').filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase() || 'ST';
        this.state.user = {
          name,
          email: profile.email || user?.email || '',
          bio: profile.bio || '',
          year_level: profile.year_level || cached?.year_level || '1st Year',
          institution: profile.school || cached?.institution || '',
          program: profile.program || cached?.program || '',
          avatar: initials,
          avatar_color: profile.avatar_color || user?.user_metadata?.avatar_color || cached?.avatar_color || '#6366f1',
          avatar_url: resolvedAvatarUrl,
          created_at: profile?.created_at || user?.created_at || cached?.created_at || null
        };
        this._profileService.saveLocalCachedUser(this.state.user, userId);
        events.emit('user:updated', this.state.user);
      } else if (cached || metaAvatar) {
        const defaultUser = this._profileService.getDefaultUser();
        this.state.user = { 
          ...defaultUser, 
          ...(cached || {}), 
          avatar_url: resolvedAvatarUrl,
          created_at: cached?.created_at || user?.created_at || null 
        };
        this._profileService.saveLocalCachedUser(this.state.user, userId);
        events.emit('user:updated', this.state.user);
      }

      // 2. Fetch Settings
      const { data: settingsRow } = await supabase
        .from('settings').select('*').eq('user_id', userId).maybeSingle();

      if (settingsRow) {
        let isNeutral = settingsRow.neutral_colors === true;
        if (settingsRow.neutral_colors == null) {
          isNeutral = ls.getItem('aven_neutral_colors') === 'true';
        }

        this.state.settings = {
          default_midterm_weight: Number(settingsRow.term_weight_default || 50),
          default_final_weight: 100 - Number(settingsRow.term_weight_default || 50),
          default_timer_mode: settingsRow.timer_mode_default || 'stopwatch',
          pomodoro_work_mins: Number(settingsRow.pomodoro_work || 25),
          pomodoro_break_mins: Number(settingsRow.pomodoro_break || 5),
          pomodoro_long_break_mins: Number(settingsRow.pomodoro_long_break || 15),
          pomodoro_long_break_interval: Number(settingsRow.pomodoro_long_break_interval || settingsRow.pomodoro_cycles || 4),
          pomodoro_auto_start_breaks: settingsRow.pomodoro_auto_start_breaks === true,
          pomodoro_auto_start_pomodoros: settingsRow.pomodoro_auto_start_pomodoros === true,
          sound_notifications: settingsRow.notification_sound !== false,
          subjects_view_mode: settingsRow.subjects_view_mode || 'grid',
          neutral_colors: isNeutral
        };

        if (typeof document !== 'undefined') {
          if (isNeutral) {
            document.documentElement.setAttribute('data-neutral-colors', 'true');
          } else {
            document.documentElement.removeAttribute('data-neutral-colors');
          }
        }
        ls.setItem('aven_neutral_colors', isNeutral ? 'true' : 'false');

        if (isFreshLogin) {
          const activeTheme = this.state.theme || 'dark';
          if (typeof document !== 'undefined') document.documentElement.setAttribute('data-theme', activeTheme);
          ls.setItem('aven_theme', activeTheme);
          if (settingsRow.theme !== activeTheme) {
            await supabase.from('settings').upsert({ user_id: userId, theme: activeTheme }, { onConflict: 'user_id' });
          }
        } else if (settingsRow.theme) {
          this.state.theme = settingsRow.theme;
          ls.setItem('aven_theme', settingsRow.theme);
          if (typeof document !== 'undefined') document.documentElement.setAttribute('data-theme', settingsRow.theme);
        }
      } else {
        // First-time sign-up
        const activeTheme = this.state.theme || 'dark';
        if (typeof document !== 'undefined') document.documentElement.setAttribute('data-theme', activeTheme);
        ls.setItem('aven_theme', activeTheme);
        await supabase.from('settings').upsert({
          user_id: userId, theme: activeTheme, term_weight_default: 50,
          timer_mode_default: 'stopwatch', pomodoro_work: 25, pomodoro_break: 5,
          notification_sound: true, subjects_view_mode: 'grid', neutral_colors: false
        }, { onConflict: 'user_id' }).catch(() => {});
      }

      // 3. Parallel fetch of all entities
      const [subjectsRes, configsRes, sessionsRes, categoriesRes, plansRes, allTimeDurationRes] = await Promise.all([
        supabase.from('subjects').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('subject_grade_configs').select('*').eq('user_id', userId),
        supabase.from('study_sessions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(100),
        supabase.from('grade_categories').select('*, grade_entries(*)').eq('user_id', userId).order('sort_index', { ascending: true }).order('created_at', { ascending: true }),
        supabase.from('study_plans').select('id, subject_id, title, updated_at').eq('user_id', userId),
        supabase.from('study_sessions').select('duration').eq('user_id', userId)
      ]);

      this.state.subjects = subjectsRes.data || [];
      this.state.grade_configs = configsRes.data || [];
      this.state.sessions = sessionsRes.data || [];
      this.state.plans = plansRes.data || [];
      this.state.allTimeStudyMinutes = (allTimeDurationRes.data || []).reduce((sum, s) => sum + (s.duration || 0), 0);

      let categories = categoriesRes.data;
      if (categoriesRes.error) {
        console.warn('Grade categories sort_index query warning, falling back:', categoriesRes.error.message);
        const fallbackRes = await supabase.from('grade_categories').select('*, grade_entries(*)').eq('user_id', userId);
        categories = fallbackRes.data;
      }

      if (categories) {
        this.state.grades = categories.map((cat, idx) => ({
          ...cat,
          sort_index: cat.sort_index != null ? Number(cat.sort_index) : idx,
          entries: (cat.grade_entries || []).map(e => ({
            id: e.id,
            name: e.name,
            score: Number(e.score),
            out_of: Number(e.out_of),
            created_at: e.created_at || null,
            updated_at: e.updated_at || null
          }))
        }));
      } else {
        this.state.grades = [];
      }

      syncEngine.lastSyncedAt = Date.now();
      syncEngine.setStatus('synced', 'Workspace synchronized');
      events.emit('store:synced');
      events.emit('store:changed', { type: 'cloud_sync' });
      events.emit('sync:connection', syncEngine.getConnectionStatus());
    } catch (err) {
      console.error('Error syncing from Supabase:', err);
      const isNetworkError = !syncEngine.isOnline || err?.message?.toLowerCase().includes('failed to fetch');
      syncEngine.setStatus(isNetworkError ? 'offline' : 'error', isNetworkError ? 'Network unreachable' : (err.message || 'Sync failed'));
    } finally {
      this.isSyncing = false;
      events.emit('sync:connection', syncEngine.getConnectionStatus());
    }
  }

  // ---------------------------------------------------------------------------
  // Delegated API — Settings
  // ---------------------------------------------------------------------------

  getDefaultSettings() { return this._settingsService.getDefaultSettings(); }
  getSettings() { return this._settingsService.getSettings(); }
  saveSettings(partial) { return this._settingsService.saveSettings(partial); }
  getSubjectsViewMode() { return this._settingsService.getSubjectsViewMode(); }
  setSubjectsViewMode(mode) { return this._settingsService.setSubjectsViewMode(mode); }
  getSubjectsSort() { return this._settingsService.getSubjectsSort(); }
  setSubjectsSort(sortKey) { return this._settingsService.setSubjectsSort(sortKey); }
  getGradesSidebarSort() { return this._settingsService.getGradesSidebarSort(); }
  setGradesSidebarSort(sortKey) { return this._settingsService.setGradesSidebarSort(sortKey); }
  getGradingScale() { return this._settingsService.getGradingScale(); }
  saveGradingScale(scale) { return this._settingsService.saveGradingScale(scale); }
  resetGradingScale() { return this._settingsService.resetGradingScale(); }
  getTheme() { return this._settingsService.getTheme(); }
  setTheme(theme, origin, onUpdate) { return this._settingsService.setTheme(theme, origin, onUpdate); }

  // ---------------------------------------------------------------------------
  // Delegated API — Subjects
  // ---------------------------------------------------------------------------

  getSubjects(includeArchived) { return this._subjectsService.getSubjects(includeArchived); }
  getSubjectById(id) { return this._subjectsService.getSubjectById(id); }
  saveSubject(data) { return this._subjectsService.saveSubject(data); }
  archiveSubject(id, reason, note) { return this._subjectsService.archiveSubject(id, reason, note); }
  unarchiveSubject(id) { return this._subjectsService.unarchiveSubject(id); }
  bulkArchiveSubjects(ids, reason) { return this._subjectsService.bulkArchiveSubjects(ids, reason); }
  deleteSubject(id) { return this._subjectsService.deleteSubject(id); }
  getCascadeStats(id) { return this._subjectsService.getCascadeStats(id); }

  // ---------------------------------------------------------------------------
  // Delegated API — Sessions
  // ---------------------------------------------------------------------------

  getSessions(filterSubjectId) { return this._sessionsService.getSessions(filterSubjectId); }
  getSessionById(id) { return this._sessionsService.getSessionById(id); }
  saveSession(data) { return this._sessionsService.saveSession(data); }
  deleteSession(id) { return this._sessionsService.deleteSession(id); }
  restoreSession(data, originalIndex) { return this._sessionsService.restoreSession(data, originalIndex); }
  getSubjectTotalStudyMinutes(subjectId) { return this._sessionsService.getSubjectTotalStudyMinutes(subjectId); }

  // ---------------------------------------------------------------------------
  // Delegated API — Grades
  // ---------------------------------------------------------------------------

  getGrades(subjectId, term) { return this._gradesService.getGrades(subjectId, term); }
  getSubjectGradeCategories(subjectId, term) { return this._gradesService.getSubjectGradeCategories(subjectId, term); }
  getGradeCategoryById(id) { return (this.state.grades || []).find(g => g.id === id) || null; }
  saveGradeCategory(data) { return this._gradesService.saveGradeCategory(data); }
  saveGradeCategoriesBulk(list, osId, oTerm) { return this._gradesService.saveGradeCategoriesBulk(list, osId, oTerm); }
  copyCategoriesBetweenTerms(sId, from, to, ow) { return this._gradesService.copyCategoriesBetweenTerms(sId, from, to, ow); }
  reorderGradeCategories(sId, term, ids) { return this._gradesService.reorderGradeCategories(sId, term, ids); }
  deleteGradeCategory(id) { return this._gradesService.deleteGradeCategory(id); }
  saveGradeEntry(catId, data) { return this._gradesService.saveGradeEntry(catId, data); }
  updateGradeEntry(catId, entId, updates) { return this._gradesService.updateGradeEntry(catId, entId, updates); }
  deleteGradeEntry(catId, entId) { return this._gradesService.deleteGradeEntry(catId, entId); }
  restoreGradeEntry(catId, data, originalIndex) { return this._gradesService.restoreGradeEntry(catId, data, originalIndex); }
  getGradeConfigs() { return this._gradesService.getGradeConfigs(); }
  getSubjectGradeConfig(subjectId) {
    const cfg = this._gradesService.getSubjectGradeConfig(subjectId);
    // Augment with default weights from settings if using fallback
    if (!cfg.subject_id || cfg.midterm_weight === 50) {
      const settings = this._settingsService.getSettings();
      return { subject_id: subjectId, midterm_weight: settings.default_midterm_weight, final_weight: settings.default_final_weight };
    }
    return cfg;
  }
  saveSubjectGradeConfig(sId, mw, fw) { return this._gradesService.saveSubjectGradeConfig(sId, mw, fw); }
  syncGradeCategoriesUpsert(rows) { return this._gradesService.syncGradeCategoriesUpsert(rows); }
  syncGradeCategoriesDelete(ids) { return this._gradesService.syncGradeCategoriesDelete(ids); }

  // ---------------------------------------------------------------------------
  // Delegated API — Plans
  // ---------------------------------------------------------------------------

  getStudyPlans() { return this._plansService.getStudyPlans(); }
  getStudyPlanById(id) { return this._plansService.getStudyPlanById(id); }
  getStudyPlanBySubject(subjectId) { return this._plansService.getStudyPlanBySubject(subjectId); }
  saveStudyPlan(a, b, c, d, e) { return this._plansService.saveStudyPlan(a, b, c, d, e); }
  deleteStudyPlan(id) { return this._plansService.deleteStudyPlan(id); }
  loadStudyPlanContent(id) { return this._plansService.loadStudyPlanContent(id); }

  // ---------------------------------------------------------------------------
  // Delegated API — Profile
  // ---------------------------------------------------------------------------

  getDefaultUser() { return this._profileService.getDefaultUser(); }
  getLocalCachedUser(userId) { return this._profileService.getLocalCachedUser(userId); }
  saveLocalCachedUser(user, userId) { return this._profileService.saveLocalCachedUser(user, userId); }
  getUserProfile() { return this._profileService.getUserProfile(); }
  uploadAvatarImage(blob) { return this._profileService.uploadAvatarImage(blob); }
  saveUserProfile(data) { return this._profileService.saveUserProfile(data); }

  // ---------------------------------------------------------------------------
  // Delegated API — Account
  // ---------------------------------------------------------------------------

  getStorageUsageSummary() { return this._accountService.getStorageUsageSummary(); }
  getStorageUsage() { return this._accountService.getStorageUsage(); }
  exportAllDataJSON() { return this._accountService.exportAllDataJSON(); }
  importAllDataJSON(jsonStr) { return this._accountService.importAllDataJSON(jsonStr); }
  clearAllData() { return this._accountService.clearAllData(); }
  deleteAccount() { return this._accountService.deleteAccount(); }

  // ---------------------------------------------------------------------------
  // Delegated API — Sync Status
  // ---------------------------------------------------------------------------

  getSyncStatus() { return syncEngine.getStatus(); }
  getConnectionStatus() { return syncEngine.getConnectionStatus(); }
  getLastSyncedAt() { return syncEngine.lastSyncedAt; }
  setSyncStatus(status, msg) { return syncEngine.setStatus(status, msg); }
  trackCloudOperation(promise, label) { return syncEngine.run(promise, label); }

  // ---------------------------------------------------------------------------
  // Study Statistics (delegates to pure domain functions)
  // ---------------------------------------------------------------------------

  getWeeklyStudyHours() { return studyStats.getWeeklyStudyHours(this.getSessions()); }
  getTodayStudyDuration() { return studyStats.getTodayStudyDuration(this.getSessions()); }
  getWeeklyStudyStats() { return studyStats.getWeeklyStudyStats(this.getSessions()); }
  getMonthlyStudyStats() { return studyStats.getMonthlyStudyStats(this.getSessions()); }
  getStudyHeatmapData(year) { return studyStats.getStudyHeatmapData(this.getSessions(), year); }
  getStudyStreak() { return studyStats.getStudyStreak(this.getSessions()); }
  getStreakStats() { return studyStats.getStreakStats(this.getSessions()); }
  getYearCalendarMatrix(year) { return studyStats.getYearCalendarMatrix(this.getSessions(), year, id => this.getSubjectById(id)); }
  getLeetCodeCalendarMatrix() { return this.getYearCalendarMatrix(new Date().getFullYear()); }
  getAllTimeStudyMinutes() {
    if (this.state.allTimeStudyMinutes != null && this.state.allTimeStudyMinutes > 0) {
      return this.state.allTimeStudyMinutes;
    }
    return (this.state.sessions || []).reduce((acc, s) => acc + (s.duration || 0), 0);
  }

  // ---------------------------------------------------------------------------
  // Grade Calculations (inline, delegates to domain functions)
  // ---------------------------------------------------------------------------

  calculateTermGrade(subjectId, term) {
    const categories = this.getSubjectGradeCategories(subjectId, term);
    return calculateTermGradeBreakdown(categories, this.getGradingScale());
  }

  calculateSubjectGrade(subjectId) {
    const config = this.getSubjectGradeConfig(subjectId);
    const midterm = this.calculateTermGrade(subjectId, 'Midterm');
    const final_ = this.calculateTermGrade(subjectId, 'Final');
    const breakdown = calculateSubjectGradeBreakdown(midterm, final_, config, this.getGradingScale());

    return {
      subjectId,
      midterm,
      final: final_,
      config,
      overallPercentage: breakdown.overallPercentage,
      philGrade: breakdown.philGrade,
      summaryLine: breakdown.summaryLine
    };
  }

  calculateOverallAcademicStanding() {
    if (this._cachedAcademicStanding) {
      return this._cachedAcademicStanding;
    }
    const activeSubjects = this.getSubjects(false);
    if (activeSubjects.length === 0) {
      this._cachedAcademicStanding = { gpa: '—', avgPct: '—', rawAvgPct: null, totalSubjects: 0, gradedSubjects: 0 };
      return this._cachedAcademicStanding;
    }

    let sumGradePoints = 0;
    let sumPct = 0;
    let gradedCount = 0;

    activeSubjects.forEach(s => {
      const stats = this.calculateSubjectGrade(s.id);
      if (stats.overallPercentage !== null && stats.philGrade.grade !== '—') {
        sumGradePoints += Number(stats.philGrade.grade);
        sumPct += stats.overallPercentage;
        gradedCount++;
      }
    });

    const gpa = gradedCount > 0 ? (sumGradePoints / gradedCount).toFixed(2) : '—';
    const rawAvgPct = gradedCount > 0 ? (sumPct / gradedCount) : null;
    const avgPct = gradedCount > 0 ? (sumPct / gradedCount).toFixed(1) + '%' : '—';

    this._cachedAcademicStanding = { gpa, avgPct, rawAvgPct, totalSubjects: activeSubjects.length, gradedSubjects: gradedCount };
    return this._cachedAcademicStanding;
  }

  getRecentGradeEntries(limit = 8) {
    const activeSubjects = this.getSubjects(false);
    const activeSubMap = new Map(activeSubjects.map(s => [s.id, s]));
    const categories = this.state.grades || [];

    const allEntries = [];
    categories.forEach(cat => {
      const sub = activeSubMap.get(cat.subject_id);
      if (!sub) return;

      (cat.entries || []).forEach(e => {
        allEntries.push({
          id: e.id, name: e.name, score: e.score, out_of: e.out_of,
          percentage: e.out_of > 0 ? (e.score / e.out_of) * 100 : 0,
          created_at: e.updated_at || e.created_at || null,
          categoryName: cat.category, term: cat.term, categoryId: cat.id,
          subjectId: sub.id, subjectName: sub.name,
          subjectCode: sub.code || sub.name, subjectColor: sub.color || '#505537'
        });
      });
    });

    allEntries.sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    });

    return allEntries.slice(0, limit);
  }
}

export const store = new Store();
