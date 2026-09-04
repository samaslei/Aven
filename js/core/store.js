/**
 * Aven - Central Reactive Store (Supabase Cloud Synced)
 * Single source of truth. All entities reference Subject by subject_id.
 * Backed purely by Supabase Cloud with responsive in-memory reactivity.
 * (Zero localStorage usage)
 */

import { supabase, getCurrentUser, deleteAccount as deleteSupabaseAccount } from './supabase.js';
import { events } from './events.js';
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
  calculateMilestoneData,
  calculateDistributionStats
} from '../domain/tracker-calculator.js';

// Re-export domain constants & functions for full backward compatibility
export {
  events,
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

// Generate Clean IDs
export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`;
}

// Store Class
class Store {
  constructor() {
    this.currentUserId = null;
    this.isSyncing = false;
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.lastSyncedAt = null;
    this.activeCloudOperations = 0;
    this.syncStatusState = { status: 'idle', message: '', error: null, timestamp: Date.now() };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
    }

    this.resetState();
  }

  handleNetworkChange(isOnline) {
    this.isOnline = isOnline;
    if (!isOnline) {
      this.setSyncStatus('offline', 'Network offline');
    } else {
      this.setSyncStatus('synced', 'Connected to Supabase Cloud');
      if (this.currentUserId) {
        this.syncFromCloud(this.currentUserId);
      }
    }
    events.emit('sync:connection', this.getConnectionStatus());
  }

  resetState() {
    let savedGradesSort = 'year-sem-grouped';
    let savedSubjectsSort = 'recent-desc';
    let savedTheme = 'dark';
    let savedNeutralColors = false;
    try {
      if (typeof localStorage !== 'undefined') {
        savedGradesSort = localStorage.getItem('aven_grades_sidebar_sort') || 'year-sem-grouped';
        savedSubjectsSort = localStorage.getItem('aven_subjects_sort') || 'recent-desc';
        savedTheme = localStorage.getItem('aven_theme') || 'dark';
        savedNeutralColors = localStorage.getItem('aven_neutral_colors') === 'true';
      }
    } catch (e) {}

    if (savedNeutralColors && typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-neutral-colors', 'true');
    }

    this.state = {
      subjects: [],
      sessions: [],
      grades: [],
      grade_configs: [],
      plans: [],
      user: this.getDefaultUser(),
      settings: { ...this.getDefaultSettings(), neutral_colors: savedNeutralColors },
      grading_scale: JSON.parse(JSON.stringify(PHILIPPINE_GRADE_SCALE)),
      subjects_sort: savedSubjectsSort,
      grades_sidebar_sort: savedGradesSort,
      theme: savedTheme
    };
  }

  getDefaultUser() {
    return {
      name: 'Alex Rivera',
      email: 'student@university.edu',
      bio: 'Undergraduate Student',
      year_level: '1st Year',
      institution: 'University of the Philippines',
      program: 'BS Computer Science',
      avatar: 'AR',
      avatar_color: '#6366f1'
    };
  }

  getDefaultSettings() {
    return {
      default_midterm_weight: 50,
      default_final_weight: 50,
      default_timer_mode: 'stopwatch',
      pomodoro_work_mins: 25,
      pomodoro_break_mins: 5,
      pomodoro_long_break_mins: 15,
      pomodoro_long_break_interval: 4,
      pomodoro_auto_start_breaks: false,
      pomodoro_auto_start_pomodoros: false,
      sound_notifications: true,
      subjects_view_mode: 'grid',
      neutral_colors: false
    };
  }

  /**
   * Synchronize all data from Supabase Cloud to in-memory state
   */
  async syncFromCloud(userId, isFreshLogin = false) {
    if (!userId) return;
    this.currentUserId = userId;
    this.isSyncing = true;
    if (!this.isOnline) {
      this.setSyncStatus('offline', 'Cannot sync while offline');
      return;
    }
    this.setSyncStatus('saving', 'Syncing workspace data...');

    try {
      // 1. Fetch Profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profile) {
        const name = profile.display_name || 'Student';
        const initials = name.split(' ').filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase() || 'ST';
        this.state.user = {
          name,
          email: profile.email || '',
          bio: profile.bio || '',
          year_level: profile.year_level || '1st Year',
          institution: profile.school || '',
          program: profile.program || '',
          avatar: initials,
          avatar_color: profile.avatar_color || '#6366f1'
        };
        events.emit('user:updated', this.state.user);
      }

      // 2. Fetch Settings
      const { data: settingsRow } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (settingsRow) {
        let isNeutral = settingsRow.neutral_colors === true;
        if (settingsRow.neutral_colors === undefined || settingsRow.neutral_colors === null) {
          try {
            if (typeof localStorage !== 'undefined') {
              isNeutral = localStorage.getItem('aven_neutral_colors') === 'true';
            }
          } catch (e) {}
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

        if (isNeutral) {
          document.documentElement.setAttribute('data-neutral-colors', 'true');
        } else {
          document.documentElement.removeAttribute('data-neutral-colors');
        }
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('aven_neutral_colors', isNeutral ? 'true' : 'false');
          }
        } catch (e) {}

        if (isFreshLogin) {
          // Carry over the active landing page theme choice into the app and persist to Supabase
          const activeTheme = this.state.theme || 'dark';
          document.documentElement.setAttribute('data-theme', activeTheme);
          try {
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem('aven_theme', activeTheme);
            }
          } catch (e) {}

          if (settingsRow.theme !== activeTheme) {
            await supabase.from('settings').upsert({
              user_id: userId,
              theme: activeTheme
            }, { onConflict: 'user_id' });
          }
        } else if (settingsRow.theme) {
          this.state.theme = settingsRow.theme;
          try {
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem('aven_theme', settingsRow.theme);
            }
          } catch (e) {}
          document.documentElement.setAttribute('data-theme', settingsRow.theme);
        }
      } else {
        // First-time sign-up / no settings row exists yet
        const activeTheme = this.state.theme || 'dark';
        document.documentElement.setAttribute('data-theme', activeTheme);
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('aven_theme', activeTheme);
          }
        } catch (e) {}

        await supabase.from('settings').upsert({
          user_id: userId,
          theme: activeTheme,
          term_weight_default: 50,
          timer_mode_default: 'stopwatch',
          pomodoro_work: 25,
          pomodoro_break: 5,
          notification_sound: true,
          subjects_view_mode: 'grid',
          neutral_colors: false
        }, { onConflict: 'user_id' }).catch(() => {});
      }

      // 3. Parallel fetch of all entities for maximum startup throughput
      const [
        subjectsRes,
        configsRes,
        sessionsRes,
        categoriesRes,
        entriesRes,
        plansRes
      ] = await Promise.all([
        supabase.from('subjects').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('subject_grade_configs').select('*').eq('user_id', userId),
        supabase.from('study_sessions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('grade_categories').select('*').eq('user_id', userId).order('sort_index', { ascending: true }).order('created_at', { ascending: true }),
        supabase.from('grade_entries').select('*').eq('user_id', userId),
        supabase.from('study_plans').select('*').eq('user_id', userId)
      ]);

      this.state.subjects = subjectsRes.data || [];
      this.state.grade_configs = configsRes.data || [];
      this.state.sessions = sessionsRes.data || [];
      this.state.plans = plansRes.data || [];

      let categories = categoriesRes.data;
      if (categoriesRes.error) {
        console.warn('Grade categories sort_index order query warning, falling back to natural order:', categoriesRes.error.message);
        const fallbackRes = await supabase.from('grade_categories').select('*').eq('user_id', userId);
        categories = fallbackRes.data;
      }

      const entries = entriesRes.data || [];

      if (categories) {
        const entriesByCat = {};
        entries.forEach(e => {
          if (!entriesByCat[e.category_id]) entriesByCat[e.category_id] = [];
          entriesByCat[e.category_id].push({
            id: e.id,
            name: e.name,
            score: Number(e.score),
            out_of: Number(e.out_of)
          });
        });

        this.state.grades = categories.map((cat, idx) => ({
          ...cat,
          sort_index: cat.sort_index !== undefined && cat.sort_index !== null ? Number(cat.sort_index) : idx,
          entries: entriesByCat[cat.id] || []
        }));
      } else {
        this.state.grades = [];
      }

      this.lastSyncedAt = Date.now();
      this.setSyncStatus('synced', 'Workspace synchronized');
      events.emit('store:synced');
      events.emit('store:changed', { type: 'cloud_sync' });
      events.emit('sync:connection', this.getConnectionStatus());
    } catch (err) {
      console.error('Error syncing from Supabase:', err);
      if (!this.isOnline || (err && err.message && err.message.toLowerCase().includes('failed to fetch'))) {
        this.setSyncStatus('offline', 'Network unreachable');
      } else {
        this.setSyncStatus('error', err.message || 'Sync failed');
      }
    } finally {
      this.isSyncing = false;
      events.emit('sync:connection', this.getConnectionStatus());
    }
  }

  // --- SETTINGS ---
  getSettings() {
    return { ...this.getDefaultSettings(), ...(this.state.settings || {}) };
  }

  saveSettings(partial) {
    const current = this.getSettings();
    const updated = { ...current, ...partial };
    this.state.settings = updated;

    if (updated.neutral_colors) {
      document.documentElement.setAttribute('data-neutral-colors', 'true');
    } else {
      document.documentElement.removeAttribute('data-neutral-colors');
    }
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('aven_neutral_colors', updated.neutral_colors ? 'true' : 'false');
      }
    } catch (e) {}

    events.emit('settings:updated', updated);
    events.emit('store:changed', { type: 'settings' });

    // Supabase Cloud sync with resilient column fallback
    getCurrentUser().then(user => {
      if (user) {
        const payload = {
          user_id: user.id,
          theme: this.state.theme || 'dark',
          term_weight_default: updated.default_midterm_weight,
          timer_mode_default: updated.default_timer_mode,
          pomodoro_work: updated.pomodoro_work_mins,
          pomodoro_break: updated.pomodoro_break_mins,
          pomodoro_long_break: updated.pomodoro_long_break_mins,
          pomodoro_long_break_interval: updated.pomodoro_long_break_interval,
          pomodoro_auto_start_breaks: updated.pomodoro_auto_start_breaks || false,
          pomodoro_auto_start_pomodoros: updated.pomodoro_auto_start_pomodoros || false,
          notification_sound: updated.sound_notifications,
          subjects_view_mode: updated.subjects_view_mode,
          neutral_colors: updated.neutral_colors || false,
          updated_at: new Date().toISOString()
        };

        supabase.from('settings').upsert(payload, { onConflict: 'user_id' }).then(({ error }) => {
          if (error && error.code === 'PGRST204') {
            // Column not found in remote DB schema cache yet - retry with base schema columns
            delete payload.neutral_colors;
            delete payload.subjects_view_mode;
            supabase.from('settings').upsert(payload, { onConflict: 'user_id' }).catch(() => {});
          } else if (error) {
            console.warn('Supabase settings sync warning:', error.message || error);
          }
        }).catch(() => {});
      }
    });

    return updated;
  }

  getSubjectsViewMode() {
    return this.getSettings().subjects_view_mode || 'grid';
  }

  setSubjectsViewMode(mode) {
    this.saveSettings({ subjects_view_mode: mode });
  }

  getSubjectsSort() {
    if (!this.state.subjects_sort || this.state.subjects_sort === 'recent-desc') {
      try {
        const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('aven_subjects_sort') : null;
        if (stored) this.state.subjects_sort = stored;
      } catch (e) {}
    }
    return this.state.subjects_sort || 'recent-desc';
  }

  setSubjectsSort(sortKey) {
    this.state.subjects_sort = sortKey;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('aven_subjects_sort', sortKey);
      }
    } catch (e) {}
  }

  getGradesSidebarSort() {
    if (!this.state.grades_sidebar_sort || this.state.grades_sidebar_sort === 'year-sem-grouped') {
      try {
        const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('aven_grades_sidebar_sort') : null;
        if (stored) this.state.grades_sidebar_sort = stored;
      } catch (e) {}
    }
    return this.state.grades_sidebar_sort || 'year-sem-grouped';
  }

  setGradesSidebarSort(sortKey) {
    this.state.grades_sidebar_sort = sortKey;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('aven_grades_sidebar_sort', sortKey);
      }
    } catch (e) {}
  }

  // --- GRADING SCALE CUSTOMIZATION ---
  getGradingScale() {
    return this.state.grading_scale || JSON.parse(JSON.stringify(PHILIPPINE_GRADE_SCALE));
  }

  saveGradingScale(scale) {
    this.state.grading_scale = scale;
    events.emit('scale:updated', scale);
    events.emit('store:changed', { type: 'scale' });
    return scale;
  }

  resetGradingScale() {
    this.state.grading_scale = JSON.parse(JSON.stringify(PHILIPPINE_GRADE_SCALE));
    events.emit('scale:updated', this.state.grading_scale);
    events.emit('store:changed', { type: 'scale' });
    return this.state.grading_scale;
  }

  // --- STORAGE USAGE CALCULATION (SUPABASE RECORD COUNTS) ---
  getStorageUsageSummary() {
    const subjects = this.getSubjects(true);
    const sessions = this.getSessions();
    const grades = this.getGrades();
    let totalGradeEntries = 0;
    grades.forEach(g => {
      totalGradeEntries += (g.entries || []).length;
    });
    const plans = this.getStudyPlans();

    return {
      subjectsCount: subjects.length,
      sessionsCount: sessions.length,
      gradeCategoriesCount: grades.length,
      gradeEntriesCount: totalGradeEntries,
      plansCount: plans.length,
      summaryText: `${subjects.length} subjects · ${sessions.length} sessions · ${totalGradeEntries} grade entries · ${plans.length} study plans`
    };
  }

  getStorageUsage() {
    const summary = this.getStorageUsageSummary();
    return summary.summaryText;
  }

  // --- DATA BACKUP, EXPORT, IMPORT, CLEAR ---
  exportAllDataJSON() {
    const data = {
      version: '1.2-supabase',
      exported_at: new Date().toISOString(),
      subjects: this.getSubjects(true),
      sessions: this.getSessions(),
      grades: this.getGrades(),
      grade_configs: this.getGradeConfigs(),
      plans: this.getStudyPlans(),
      user: this.getUserProfile(),
      settings: this.getSettings()
    };
    return JSON.stringify(data, null, 2);
  }

  async importAllDataJSON(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      if (!Array.isArray(data.subjects)) {
        throw new Error('Invalid backup format: subjects array is missing');
      }

      const user = await getCurrentUser();
      if (!user || !user.id) {
        throw new Error('You must be signed in to import data to Supabase');
      }
      const userId = user.id;

      // 1. Sync Profile & Settings
      if (data.user) {
        const u = data.user;
        await supabase
          .from('profiles')
          .upsert({
            user_id: userId,
            display_name: u.name || user.email?.split('@')[0],
            email: user.email,
            bio: u.bio || '',
            year_level: u.year_level || '1st Year',
            school: u.institution || '',
            program: u.program || '',
            avatar_color: u.avatar_color || '#6366f1',
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
      }

      if (data.settings) {
        const s = data.settings;
        await supabase
          .from('settings')
          .upsert({
            user_id: userId,
            theme: this.state.theme || 'dark',
            term_weight_default: s.default_midterm_weight || 50,
            timer_mode_default: s.default_timer_mode || 'stopwatch',
            pomodoro_work: s.pomodoro_work_mins || 25,
            pomodoro_break: s.pomodoro_break_mins || 5,
            notification_sound: s.sound_notifications !== false,
            subjects_view_mode: s.subjects_view_mode || 'grid',
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
      }

      // 2. Sync Subjects
      if (Array.isArray(data.subjects) && data.subjects.length > 0) {
        const subjectRows = data.subjects.map(sub => ({
          id: sub.id || generateId('sub'),
          user_id: userId,
          name: sub.name,
          code: sub.code || '',
          year_level: sub.year_level || '1st Year',
          semester: sub.semester || '1st Semester',
          color: sub.color || '#6366f1',
          instructor: sub.instructor || '',
          archived: Boolean(sub.archived),
          archive_reason: sub.archive_reason || null,
          archived_at: sub.archived_at || null,
          created_at: sub.created_at || new Date().toISOString()
        }));

        const { error: sErr } = await supabase.from('subjects').upsert(subjectRows, { onConflict: 'id' });
        if (sErr) throw new Error(`Failed importing subjects: ${sErr.message}`);
      }

      // 3. Sync Grade Configs
      if (Array.isArray(data.grade_configs) && data.grade_configs.length > 0) {
        const cfgRows = data.grade_configs.map(cfg => ({
          subject_id: cfg.subject_id,
          user_id: userId,
          midterm_weight: Number(cfg.midterm_weight) || 50,
          final_weight: Number(cfg.final_weight) || 50
        }));

        await supabase.from('subject_grade_configs').upsert(cfgRows, { onConflict: 'subject_id,user_id' });
      }

      // 4. Sync Sessions
      if (Array.isArray(data.sessions) && data.sessions.length > 0) {
        const sessionRows = data.sessions.map(ses => ({
          id: ses.id || generateId('ses'),
          user_id: userId,
          subject_id: ses.subject_id,
          duration: Number(ses.duration || 0),
          date: ses.date || new Date().toISOString().split('T')[0],
          notes: ses.notes || '',
          created_at: ses.created_at || new Date().toISOString()
        }));

        const { error: sesErr } = await supabase.from('study_sessions').upsert(sessionRows, { onConflict: 'id' });
        if (sesErr) console.warn('Sessions import warning:', sesErr.message);
      }

      // 5. Sync Grade Categories & Entries
      if (Array.isArray(data.grades) && data.grades.length > 0) {
        const categoryRows = [];
        const entryRows = [];

        data.grades.forEach((cat, idx) => {
          const catId = cat.id || generateId('cat');
          categoryRows.push({
            id: catId,
            user_id: userId,
            subject_id: cat.subject_id,
            term: cat.term || 'Midterm',
            category: cat.category || 'Quizzes',
            weight: Number(cat.weight || 0),
            sort_index: cat.sort_index !== undefined && cat.sort_index !== null ? Number(cat.sort_index) : idx,
            created_at: cat.created_at || new Date().toISOString()
          });

          if (Array.isArray(cat.entries)) {
            cat.entries.forEach(ent => {
              entryRows.push({
                id: ent.id || generateId('ent'),
                user_id: userId,
                category_id: catId,
                name: ent.name || 'Assessment',
                score: Number(ent.score || 0),
                out_of: Number(ent.out_of || 100),
                created_at: ent.created_at || new Date().toISOString()
              });
            });
          }
        });

        if (categoryRows.length > 0) {
          await supabase.from('grade_categories').upsert(categoryRows, { onConflict: 'id' });
        }
        if (entryRows.length > 0) {
          await supabase.from('grade_entries').upsert(entryRows, { onConflict: 'id' });
        }
      }

      // 6. Sync Study Plans
      if (Array.isArray(data.plans) && data.plans.length > 0) {
        const planRows = data.plans.map(p => ({
          id: p.id || generateId('plan'),
          user_id: userId,
          subject_id: p.subject_id,
          title: p.title || 'Study Plan',
          html_content: p.html_content || '',
          updated_at: p.updated_at || new Date().toISOString()
        }));

        await supabase.from('study_plans').upsert(planRows, { onConflict: 'id' });
      }

      // Re-fetch everything cleanly from Supabase
      await this.syncFromCloud(userId);

      events.emit('store:imported');
      events.emit('store:changed', { type: 'import' });
      return { success: true, count: data.subjects.length };
    } catch (err) {
      console.error('Import failed', err);
      return { success: false, error: err.message };
    }
  }

  async clearAllData() {
    this.state.subjects = [];
    this.state.sessions = [];
    this.state.grades = [];
    this.state.grade_configs = [];
    this.state.plans = [];

    const user = await getCurrentUser();
    if (user) {
      await supabase.from('subjects').delete().eq('user_id', user.id);
      await supabase.from('study_sessions').delete().eq('user_id', user.id);
      await supabase.from('grade_categories').delete().eq('user_id', user.id);
      await supabase.from('study_plans').delete().eq('user_id', user.id);
      await supabase.from('subject_grade_configs').delete().eq('user_id', user.id);
    }

    events.emit('store:cleared');
    events.emit('store:changed', { type: 'clear' });
  }

  async deleteAccount() {
    try {
      await deleteSupabaseAccount();
    } catch (err) {
      console.error('Error deleting account from Supabase:', err);
    }
    this.resetState();
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('aven_user_profile');
      localStorage.removeItem('aven_settings');
      localStorage.removeItem('aven_grading_scale');
    }
    events.emit('store:cleared');
    events.emit('store:changed', { type: 'account_deleted' });
  }

  // --- SUBJECTS CRUD ---
  getSubjects(includeArchived = true) {
    const list = this.state.subjects || [];
    if (includeArchived) return list;
    return list.filter(s => !s.archived);
  }

  getSubjectById(id) {
    const subjects = this.getSubjects(true);
    return subjects.find(s => s.id === id) || null;
  }

  saveSubject(subjectData) {
    const subjects = this.getSubjects(true);
    let subject;
    const isNew = !subjectData.id;

    if (!isNew) {
      const idx = subjects.findIndex(s => s.id === subjectData.id);
      if (idx !== -1) {
        subjects[idx] = { ...subjects[idx], ...subjectData };
        subject = subjects[idx];
      }
    } else {
      const settings = this.getSettings();
      subject = {
        id: generateId('sub'),
        name: subjectData.name.trim(),
        code: subjectData.code ? subjectData.code.trim() : '',
        year_level: subjectData.year_level || '1st Year',
        semester: subjectData.semester || '1st Semester',
        color: subjectData.color || DEFAULT_COLOR_SWATCHES[0],
        instructor: subjectData.instructor ? subjectData.instructor.trim() : '',
        archived: false,
        created_at: new Date().toISOString()
      };
      subjects.unshift(subject);
      this.saveSubjectGradeConfig(subject.id, settings.default_midterm_weight, settings.default_final_weight);
    }

    events.emit('subject:saved', subject);
    events.emit('store:changed', { type: 'subject' });

    // Supabase Cloud sync
    getCurrentUser().then(user => {
      if (user && subject) {
        supabase.from('subjects').upsert({
          id: subject.id,
          user_id: user.id,
          name: subject.name,
          code: subject.code,
          year_level: subject.year_level,
          semester: subject.semester,
          color: subject.color,
          instructor: subject.instructor,
          archived: subject.archived,
          archive_reason: subject.archive_reason || null,
          archived_at: subject.archived_at || null,
          created_at: subject.created_at
        }, { onConflict: 'id' }).then(({ error }) => {
          if (error) console.warn('Supabase subject sync error:', error);
        });
      }
    });

    return subject;
  }

  archiveSubject(id, reason = 'Semester ended', note = '') {
    const subjects = this.getSubjects(true);
    const item = subjects.find(s => s.id === id);
    if (item) {
      item.archived = true;
      item.archive_reason = (reason === 'Other' && note.trim()) ? `Other: ${note.trim()}` : (reason || 'Semester ended');
      item.archived_at = new Date().toISOString();
      events.emit('subject:archived', item);
      events.emit('store:changed', { type: 'subject' });

      getCurrentUser().then(user => {
        if (user) {
          supabase.from('subjects').update({
            archived: true,
            archive_reason: item.archive_reason,
            archived_at: item.archived_at
          }).eq('id', id).eq('user_id', user.id).then();
        }
      });
    }
    return item;
  }

  unarchiveSubject(id) {
    const subjects = this.getSubjects(true);
    const item = subjects.find(s => s.id === id);
    if (item) {
      item.archived = false;
      item.archive_reason = null;
      item.archived_at = null;
      events.emit('subject:archived', item);
      events.emit('store:changed', { type: 'subject' });

      getCurrentUser().then(user => {
        if (user) {
          supabase.from('subjects').update({
            archived: false,
            archive_reason: null,
            archived_at: null
          }).eq('id', id).eq('user_id', user.id).then();
        }
      });
    }
    return item;
  }

  bulkArchiveSubjects(subjectIds, reason = 'Semester ended') {
    const subjects = this.getSubjects(true);
    let count = 0;
    const now = new Date().toISOString();

    subjectIds.forEach(id => {
      const item = subjects.find(s => s.id === id);
      if (item && !item.archived) {
        item.archived = true;
        item.archive_reason = reason;
        item.archived_at = now;
        count++;
      }
    });

    if (count > 0) {
      events.emit('store:changed', { type: 'subject' });

      getCurrentUser().then(user => {
        if (user) {
          supabase.from('subjects')
            .update({ archived: true, archive_reason: reason, archived_at: now })
            .in('id', subjectIds)
            .eq('user_id', user.id).then();
        }
      });
    }
    return count;
  }

  deleteSubject(id) {
    this.state.subjects = (this.state.subjects || []).filter(s => s.id !== id);
    this.state.sessions = (this.state.sessions || []).filter(s => s.subject_id !== id);
    this.state.grades = (this.state.grades || []).filter(g => g.subject_id !== id);
    this.state.grade_configs = (this.state.grade_configs || []).filter(c => c.subject_id !== id);
    this.state.plans = (this.state.plans || []).filter(p => p.subject_id !== id);

    events.emit('subject:deleted', id);
    events.emit('store:changed', { type: 'subject' });

    getCurrentUser().then(user => {
      if (user) {
        supabase.from('subjects').delete().eq('id', id).eq('user_id', user.id).then();
      }
    });
  }

  getCascadeStats(subjectId) {
    const sessions = this.getSessions().filter(s => s.subject_id === subjectId);
    const grades = this.getGrades().filter(g => g.subject_id === subjectId);
    let totalGradeEntries = 0;
    grades.forEach(g => {
      totalGradeEntries += (g.entries || []).length;
    });
    const plan = this.getStudyPlanBySubject(subjectId);
    return {
      sessionCount: sessions.length,
      gradeCategoriesCount: grades.length,
      gradeEntriesCount: totalGradeEntries,
      hasPlan: !!plan
    };
  }

  // --- STUDY SESSIONS CRUD ---
  getSessions(filterSubjectId = null) {
    const list = this.state.sessions || [];
    if (filterSubjectId) {
      return list.filter(s => s.subject_id === filterSubjectId);
    }
    return list;
  }

  getSessionById(id) {
    const sessions = this.getSessions();
    return sessions.find(s => s.id === id) || null;
  }

  saveSession(sessionData) {
    let sessions = this.state.sessions || [];
    let session;
    const cleanSubjectId = sessionData.subject_id && sessionData.subject_id.trim() ? sessionData.subject_id.trim() : null;

    if (sessionData.id) {
      const idx = sessions.findIndex(s => s.id === sessionData.id);
      if (idx !== -1) {
        sessions[idx] = { ...sessions[idx], ...sessionData, subject_id: cleanSubjectId };
        session = sessions[idx];
      }
    } else {
      session = {
        id: generateId('ses'),
        subject_id: cleanSubjectId,
        duration: Math.max(1, parseInt(sessionData.duration, 10) || 0),
        date: sessionData.date || new Date().toISOString().split('T')[0],
        notes: sessionData.notes ? sessionData.notes.trim() : '',
        created_at: new Date().toISOString()
      };
      sessions.unshift(session);
    }

    // Sort descending by date and creation timestamp
    sessions.sort((a, b) => new Date(b.date + ' ' + (b.created_at || '')) - new Date(a.date + ' ' + (a.created_at || '')));

    // Enforce 25 logs maximum: prune older sessions beyond 25
    let deletedSessions = [];
    if (sessions.length > 25) {
      deletedSessions = sessions.splice(25);
    }
    this.state.sessions = sessions;

    events.emit('session:saved', session);
    events.emit('store:changed', { type: 'session' });

    // Supabase Cloud sync: upsert current session and delete pruned older sessions
    getCurrentUser().then(user => {
      if (user && session) {
        supabase.from('study_sessions').upsert({
          id: session.id,
          user_id: user.id,
          subject_id: session.subject_id,
          duration: session.duration,
          date: session.date,
          notes: session.notes,
          created_at: session.created_at
        }, { onConflict: 'id' }).then(({ error }) => {
          if (error) console.warn('Supabase session sync error:', error);
        });

        if (deletedSessions.length > 0) {
          const deletedIds = deletedSessions.map(d => d.id).filter(Boolean);
          if (deletedIds.length > 0) {
            supabase.from('study_sessions').delete().in('id', deletedIds).eq('user_id', user.id).then();
          }
        }
      }
    });

    return session;
  }

  deleteSession(id) {
    this.state.sessions = (this.state.sessions || []).filter(s => s.id !== id);
    events.emit('session:deleted', id);
    events.emit('store:changed', { type: 'session' });

    getCurrentUser().then(user => {
      if (user) {
        supabase.from('study_sessions').delete().eq('id', id).eq('user_id', user.id).then();
      }
    });
  }

  getSubjectTotalStudyMinutes(subjectId) {
    const sessions = this.getSessions().filter(s => s.subject_id === subjectId);
    return sessions.reduce((acc, curr) => acc + (curr.duration || 0), 0);
  }

  getWeeklyStudyHours() {
    const sessions = this.getSessions();
    if (!sessions || sessions.length === 0) return '0.0';
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(now.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);

    const minutes = sessions.reduce((acc, s) => {
      const sDate = new Date(s.date + 'T00:00:00');
      if (sDate >= startOfWeek) {
        return acc + (s.duration || 0);
      }
      return acc;
    }, 0);

    return (minutes / 60).toFixed(1);
  }

  getStreakStats() {
    return calculateStreakStats(this.getSessions());
  }

  getTodayStudyDuration() {
    const today = new Date().toISOString().split('T')[0];
    const sessions = this.getSessions();
    return sessions
      .filter(s => s.date === today)
      .reduce((sum, s) => sum + Number(s.duration || 0), 0);
  }

  getWeeklyStudyStats() {
    const sessions = this.getSessions();
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const daySessions = sessions.filter(s => s.date === dateStr);
      const totalMins = daySessions.reduce((acc, s) => acc + Number(s.duration || 0), 0);
      days.push({
        date: dateStr,
        dayName: dayNames[d.getDay()],
        minutes: totalMins,
        sessionsCount: daySessions.length
      });
    }
    return days;
  }

  getMonthlyStudyStats() {
    const sessions = this.getSessions();
    const weeks = [0, 0, 0, 0];
    const now = new Date();

    sessions.forEach(s => {
      const sDate = new Date(s.date);
      const diffDays = Math.floor((now - sDate) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < 28) {
        const weekIdx = Math.floor(diffDays / 7);
        if (weekIdx >= 0 && weekIdx < 4) {
          weeks[3 - weekIdx] += Number(s.duration || 0);
        }
      }
    });

    return [
      { label: '3 wks ago', minutes: weeks[0] },
      { label: '2 wks ago', minutes: weeks[1] },
      { label: 'Last week', minutes: weeks[2] },
      { label: 'This week', minutes: weeks[3] }
    ];
  }

  getStudyHeatmapData(year = new Date().getFullYear()) {
    const sessions = this.getSessions();
    const map = {};
    sessions.forEach(s => {
      if (s.date && s.date.startsWith(String(year))) {
        map[s.date] = (map[s.date] || 0) + Number(s.duration || 0);
      }
    });
    return map;
  }

  getLeetCodeCalendarMatrix(weeksCount = 52) {
    return this.getYearCalendarMatrix(new Date().getFullYear());
  }

  getYearCalendarMatrix(year = new Date().getFullYear()) {
    return generateYearCalendarMatrix(this.getSessions(), year, id => this.getSubjectById(id));
  }

  getStudyStreak() {
    const sessions = this.getSessions();
    if (!sessions || sessions.length === 0) return 0;

    const dates = [...new Set(sessions.map(s => s.date))].sort().reverse();
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (!dates.includes(today) && !dates.includes(yesterday)) {
      return 0;
    }

    let streak = 0;
    let checkDate = new Date();
    if (!dates.includes(today)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dStr = checkDate.toISOString().split('T')[0];
      if (dates.includes(dStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }

  // --- GRADES & CATEGORIES CRUD ---
  getGrades(subjectId = null, term = null) {
    let list = this.state.grades || [];
    if (subjectId) {
      list = list.filter(g => g.subject_id === subjectId);
    }
    if (term) {
      list = list.filter(g => g.term === term);
    }
    return list.slice().sort((a, b) => {
      const orderA = a.sort_index !== undefined && a.sort_index !== null ? Number(a.sort_index) : 999999;
      const orderB = b.sort_index !== undefined && b.sort_index !== null ? Number(b.sort_index) : 999999;
      if (orderA !== orderB) return orderA - orderB;
      return (a.created_at || '').localeCompare(b.created_at || '');
    });
  }

  getSubjectGradeCategories(subjectId, term = null) {
    return this.getGrades(subjectId, term);
  }



  // --- SYNC & CONNECTION STATUS TRACKING ---
  getSyncStatus() {
    return this.syncStatusState || { status: 'idle', message: '', error: null, timestamp: Date.now() };
  }

  getConnectionStatus() {
    let effectiveStatus = 'synced';
    if (!this.isOnline) {
      effectiveStatus = 'offline';
    } else if (this.activeCloudOperations > 0 || this.isSyncing || (this.syncStatusState && this.syncStatusState.status === 'saving')) {
      effectiveStatus = 'saving';
    } else if (this.syncStatusState && this.syncStatusState.status === 'error') {
      effectiveStatus = 'error';
    } else if (this.syncStatusState && this.syncStatusState.status === 'offline') {
      effectiveStatus = 'offline';
    } else {
      effectiveStatus = 'synced';
    }

    return {
      isOnline: this.isOnline,
      status: effectiveStatus,
      message: this.syncStatusState?.message || '',
      error: this.syncStatusState?.error || null,
      lastSyncedAt: this.lastSyncedAt
    };
  }

  getLastSyncedAt() {
    return this.lastSyncedAt;
  }

  setSyncStatus(status, messageOrError = '') {
    if (status === 'synced') {
      this.lastSyncedAt = Date.now();
    }

    this.syncStatusState = {
      status, // 'idle' | 'saving' | 'synced' | 'error' | 'offline'
      message: status === 'error' ? '' : messageOrError,
      error: status === 'error' ? messageOrError : null,
      timestamp: Date.now()
    };

    events.emit('sync:status', this.syncStatusState);
    events.emit('sync:connection', this.getConnectionStatus());

    // If synced, automatically transition back to idle after 2.5 seconds for per-action indicators
    if (status === 'synced') {
      if (this.syncStatusTimer) clearTimeout(this.syncStatusTimer);
      this.syncStatusTimer = setTimeout(() => {
        if (this.syncStatusState && this.syncStatusState.status === 'synced') {
          this.syncStatusState = { status: 'idle', message: '', error: null, timestamp: Date.now() };
          events.emit('sync:status', this.syncStatusState);
          events.emit('sync:connection', this.getConnectionStatus());
        }
      }, 2500);
    }
  }

  async trackCloudOperation(operationPromise, label = 'Syncing...') {
    if (!this.isOnline) {
      this.setSyncStatus('offline', 'Cannot sync while offline');
      return await operationPromise;
    }

    this.activeCloudOperations++;
    this.setSyncStatus('saving', label);

    try {
      const result = await operationPromise;
      this.activeCloudOperations = Math.max(0, this.activeCloudOperations - 1);
      if (this.activeCloudOperations === 0) {
        this.lastSyncedAt = Date.now();
        this.setSyncStatus('synced', 'Synced with cloud');
      }
      return result;
    } catch (err) {
      this.activeCloudOperations = Math.max(0, this.activeCloudOperations - 1);
      console.error('Tracked cloud operation error:', err);
      if (!this.isOnline || (err && err.message && err.message.toLowerCase().includes('failed to fetch'))) {
        this.setSyncStatus('offline', 'Network connection lost');
      } else {
        this.setSyncStatus('error', err.message || 'Sync failed');
      }
      throw err;
    }
  }

  async syncGradeCategoriesUpsert(rows) {
    if (!rows || rows.length === 0) return { success: true };
    this.setSyncStatus('saving');
    try {
      const user = await getCurrentUser();
      if (!user) {
        this.setSyncStatus('synced');
        return { success: true };
      }

      // 1. Try upserting with full payload including sort_index
      const { error } = await supabase.from('grade_categories').upsert(rows, { onConflict: 'id' });
      if (error) {
        // 2. If sort_index column is missing in user's Supabase DB schema, retry without sort_index
        if (error.message && (error.message.includes('sort_index') || error.code === 'PGRST204')) {
          console.warn('Retrying grade_categories upsert without sort_index column:', error.message);
          const fallbackRows = rows.map(({ sort_index, ...rest }) => rest);
          const { error: fallbackErr } = await supabase.from('grade_categories').upsert(fallbackRows, { onConflict: 'id' });
          if (fallbackErr) {
            console.error('Supabase grade_categories upsert fallback error:', fallbackErr);
            this.setSyncStatus('error', fallbackErr.message || 'Failed to save categories to cloud');
            return { success: false, error: fallbackErr };
          }
        } else {
          console.error('Supabase grade_categories upsert error:', error);
          this.setSyncStatus('error', error.message || 'Failed to save categories to cloud');
          return { success: false, error };
        }
      }

      this.setSyncStatus('synced');
      return { success: true };
    } catch (err) {
      console.error('Supabase syncGradeCategoriesUpsert exception:', err);
      this.setSyncStatus('error', err.message || 'Cloud sync failed');
      return { success: false, error: err };
    }
  }

  async syncGradeCategoriesDelete(ids) {
    if (!ids || ids.length === 0) return { success: true };
    this.setSyncStatus('saving');
    try {
      const user = await getCurrentUser();
      if (!user) {
        this.setSyncStatus('synced');
        return { success: true };
      }
      const { error } = await supabase.from('grade_categories').delete().in('id', ids).eq('user_id', user.id);
      if (error) {
        console.error('Supabase grade_categories delete error:', error);
        this.setSyncStatus('error', error.message || 'Failed to delete categories');
        return { success: false, error };
      }
      this.setSyncStatus('synced');
      return { success: true };
    } catch (err) {
      console.error('Supabase syncGradeCategoriesDelete exception:', err);
      this.setSyncStatus('error', err.message || 'Delete failed');
      return { success: false, error: err };
    }
  }

  saveGradeCategory(categoryData) {
    const grades = this.state.grades;
    let category;
    const isNew = !categoryData.id;

    if (!isNew) {
      const idx = grades.findIndex(g => g.id === categoryData.id);
      if (idx !== -1) {
        grades[idx] = { ...grades[idx], ...categoryData };
        category = grades[idx];
      }
    } else {
      let sortIndex = categoryData.sort_index;
      if (sortIndex === undefined || sortIndex === null) {
        const existingForTerm = grades.filter(g => g.subject_id === categoryData.subject_id && g.term === (categoryData.term || 'Midterm'));
        const maxSort = existingForTerm.reduce((max, g) => Math.max(max, g.sort_index !== undefined && g.sort_index !== null ? Number(g.sort_index) : -1), -1);
        sortIndex = maxSort + 1;
      }

      category = {
        id: generateId('cat'),
        subject_id: categoryData.subject_id,
        term: categoryData.term || 'Midterm',
        category: categoryData.category || 'Quizzes',
        weight: Number(categoryData.weight) || 0,
        sort_index: sortIndex,
        entries: [],
        created_at: new Date().toISOString()
      };
      grades.push(category);
    }

    events.emit('grade_category:saved', category);
    events.emit('store:changed', { type: 'grade' });

    // Supabase Cloud sync
    getCurrentUser().then(user => {
      if (user && category) {
        const row = {
          id: category.id,
          user_id: user.id,
          subject_id: category.subject_id,
          term: category.term,
          category: category.category,
          weight: category.weight,
          sort_index: category.sort_index !== undefined ? category.sort_index : 0,
          created_at: category.created_at
        };
        this.syncGradeCategoriesUpsert([row]);
      }
    });

    return category;
  }

  saveGradeCategoriesBulk(categoriesList, overwriteSubjectId = null, overwriteTerm = null) {
    let grades = this.state.grades;
    let targetIdsToDelete = [];

    if (overwriteSubjectId && overwriteTerm) {
      const targetCategoriesToDelete = grades.filter(g => g.subject_id === overwriteSubjectId && g.term === overwriteTerm);
      targetIdsToDelete = targetCategoriesToDelete.map(t => t.id);
      this.state.grades = grades.filter(g => !(g.subject_id === overwriteSubjectId && g.term === overwriteTerm));
      grades = this.state.grades;
    }

    const created = [];
    categoriesList.forEach((catData) => {
      let sortIndex = catData.sort_index;
      if (sortIndex === undefined || sortIndex === null) {
        const existingForTerm = grades.filter(g => g.subject_id === catData.subject_id && g.term === (catData.term || 'Midterm'));
        const maxSort = existingForTerm.reduce((max, g) => Math.max(max, g.sort_index !== undefined && g.sort_index !== null ? Number(g.sort_index) : -1), -1);
        sortIndex = maxSort + 1;
      }

      const category = {
        id: generateId('cat'),
        subject_id: catData.subject_id,
        term: catData.term || 'Midterm',
        category: catData.category ? catData.category.trim() : 'New Category',
        weight: Number(catData.weight) || 0,
        sort_index: sortIndex,
        entries: [],
        created_at: new Date().toISOString()
      };
      grades.push(category);
      created.push(category);
    });

    events.emit('store:changed', { type: 'grade' });

    // Supabase Cloud sync with coordinated delete -> upsert
    getCurrentUser().then(async user => {
      if (user) {
        if (targetIdsToDelete.length > 0) {
          await this.syncGradeCategoriesDelete(targetIdsToDelete);
        }

        if (created.length > 0) {
          const rows = created.map(c => ({
            id: c.id,
            user_id: user.id,
            subject_id: c.subject_id,
            term: c.term,
            category: c.category,
            weight: c.weight,
            sort_index: c.sort_index !== undefined ? c.sort_index : 0,
            created_at: c.created_at
          }));
          await this.syncGradeCategoriesUpsert(rows);
        }
      }
    });

    return created;
  }

  copyCategoriesBetweenTerms(subjectId, fromTerm = 'Midterm', toTerm = 'Final', overwrite = true) {
    const sourceCategories = this.getSubjectGradeCategories(subjectId, fromTerm);
    if (sourceCategories.length === 0) return [];

    let grades = this.state.grades;
    const targetCategoriesToDelete = grades.filter(g => g.subject_id === subjectId && g.term === toTerm);
    const targetIdsToDelete = targetCategoriesToDelete.map(t => t.id);

    if (overwrite && targetIdsToDelete.length > 0) {
      this.state.grades = grades.filter(g => !(g.subject_id === subjectId && g.term === toTerm));
      grades = this.state.grades;
    }

    const created = [];
    sourceCategories.forEach((sc, idx) => {
      const newCat = {
        id: generateId('cat'),
        subject_id: subjectId,
        term: toTerm,
        category: sc.category,
        weight: Number(sc.weight) || 0,
        sort_index: sc.sort_index !== undefined && sc.sort_index !== null ? Number(sc.sort_index) : idx,
        entries: [], // Empty entries, never copies scores
        created_at: new Date().toISOString()
      };
      grades.push(newCat);
      created.push(newCat);
    });

    events.emit('store:changed', { type: 'grade' });

    // Supabase Cloud sync
    getCurrentUser().then(async user => {
      if (user) {
        if (overwrite && targetIdsToDelete.length > 0) {
          await this.syncGradeCategoriesDelete(targetIdsToDelete);
        }
        if (created.length > 0) {
          const rows = created.map(c => ({
            id: c.id,
            user_id: user.id,
            subject_id: c.subject_id,
            term: c.term,
            category: c.category,
            weight: c.weight,
            sort_index: c.sort_index !== undefined ? c.sort_index : 0,
            created_at: c.created_at
          }));
          await this.syncGradeCategoriesUpsert(rows);
        }
      }
    });

    return created;
  }

  async reorderGradeCategories(subjectId, term, orderedCategoryIds) {
    if (!subjectId || !term || !Array.isArray(orderedCategoryIds) || orderedCategoryIds.length === 0) return;

    const grades = this.state.grades || [];
    const updatedCategories = [];

    orderedCategoryIds.forEach((catId, index) => {
      const cat = grades.find(g => g.id === catId && g.subject_id === subjectId && g.term === term);
      if (cat) {
        cat.sort_index = index;
        updatedCategories.push(cat);
      }
    });

    events.emit('grade_categories:reordered', { subjectId, term, orderedCategoryIds });
    events.emit('store:changed', { type: 'grade' });

    // Supabase Cloud sync
    try {
      const user = await getCurrentUser();
      if (user && updatedCategories.length > 0) {
        const rows = updatedCategories.map(c => ({
          id: c.id,
          user_id: user.id,
          subject_id: c.subject_id,
          term: c.term,
          category: c.category,
          weight: c.weight,
          sort_index: c.sort_index,
          created_at: c.created_at || new Date().toISOString()
        }));
        await this.syncGradeCategoriesUpsert(rows);
      }
    } catch (err) {
      console.error('Failed to sync category reorder to cloud:', err);
    }
  }

  deleteGradeCategory(categoryId) {
    this.state.grades = (this.state.grades || []).filter(g => g.id !== categoryId);
    events.emit('grade_category:deleted', categoryId);
    events.emit('store:changed', { type: 'grade' });

    this.syncGradeCategoriesDelete([categoryId]);
  }

  saveGradeEntry(categoryId, entryData) {
    const grades = this.state.grades;
    const cat = grades.find(g => g.id === categoryId);
    if (!cat) return null;
    if (!cat.entries) cat.entries = [];

    const entry = {
      id: generateId('ent'),
      name: entryData.name ? entryData.name.trim() : 'New Assessment',
      score: Number(entryData.score) || 0,
      out_of: Number(entryData.out_of) || 100
    };

    cat.entries.push(entry);
    events.emit('grade_entry:saved', { categoryId, entry });
    events.emit('store:changed', { type: 'grade' });

    // Supabase Cloud sync
    this.setSyncStatus('saving');
    getCurrentUser().then(user => {
      if (user) {
        supabase.from('grade_entries').upsert({
          id: entry.id,
          user_id: user.id,
          category_id: categoryId,
          name: entry.name,
          score: entry.score,
          out_of: entry.out_of,
          created_at: new Date().toISOString()
        }, { onConflict: 'id' }).then(({ error }) => {
          if (error) {
            console.error('Supabase grade entry sync error:', error);
            this.setSyncStatus('error', error.message || 'Failed to save assessment');
          } else {
            this.setSyncStatus('synced');
          }
        });
      } else {
        this.setSyncStatus('synced');
      }
    });

    return entry;
  }

  updateGradeEntry(categoryId, entryId, updates) {
    const grades = this.state.grades;
    const cat = grades.find(g => g.id === categoryId);
    if (!cat || !cat.entries) return null;
    const entry = cat.entries.find(e => e.id === entryId);
    if (!entry) return null;

    if (updates.name !== undefined) {
      const trimmed = String(updates.name).trim();
      if (trimmed) entry.name = trimmed;
    }
    if (updates.score !== undefined) {
      const num = Number(updates.score);
      if (!isNaN(num) && num >= 0) entry.score = num;
    }
    if (updates.out_of !== undefined) {
      const num = Number(updates.out_of);
      if (!isNaN(num) && num > 0) entry.out_of = num;
    }

    events.emit('grade_entry:saved', { categoryId, entry });
    events.emit('store:changed', { type: 'grade' });

    // Supabase Cloud sync
    this.setSyncStatus('saving');
    getCurrentUser().then(user => {
      if (user) {
        supabase.from('grade_entries').update({
          name: entry.name,
          score: entry.score,
          out_of: entry.out_of
        }).eq('id', entryId).eq('user_id', user.id).then(({ error }) => {
          if (error) {
            console.error('Supabase grade entry update error:', error);
            this.setSyncStatus('error', error.message || 'Failed to update score');
          } else {
            this.setSyncStatus('synced');
          }
        });
      } else {
        this.setSyncStatus('synced');
      }
    });

    return entry;
  }

  deleteGradeEntry(categoryId, entryId) {
    const grades = this.state.grades;
    const cat = grades.find(g => g.id === categoryId);
    if (cat && cat.entries) {
      cat.entries = cat.entries.filter(e => e.id !== entryId);
      events.emit('grade_entry:deleted', { categoryId, entryId });
      events.emit('store:changed', { type: 'grade' });

      this.setSyncStatus('saving');
      getCurrentUser().then(user => {
        if (user) {
          supabase.from('grade_entries').delete().eq('id', entryId).eq('user_id', user.id).then(({ error }) => {
            if (error) {
              console.error('Supabase grade entry delete error:', error);
              this.setSyncStatus('error', error.message || 'Failed to delete assessment');
            } else {
              this.setSyncStatus('synced');
            }
          });
        } else {
          this.setSyncStatus('synced');
        }
      });
    }
  }

  // --- SUBJECT GRADE CONFIGS ---
  getGradeConfigs() {
    return this.state.grade_configs || [];
  }

  getSubjectGradeConfig(subjectId) {
    const configs = this.getGradeConfigs();
    const found = configs.find(c => c.subject_id === subjectId);
    if (found) return found;

    const settings = this.getSettings();
    return {
      subject_id: subjectId,
      midterm_weight: settings.default_midterm_weight,
      final_weight: settings.default_final_weight
    };
  }

  saveSubjectGradeConfig(subjectId, midtermWeight, finalWeight) {
    const configs = this.state.grade_configs;
    const idx = configs.findIndex(c => c.subject_id === subjectId);
    const config = {
      subject_id: subjectId,
      midterm_weight: Number(midtermWeight) || 50,
      final_weight: Number(finalWeight) || 50
    };

    if (idx !== -1) {
      configs[idx] = config;
    } else {
      configs.push(config);
    }

    events.emit('grade_config:saved', config);
    events.emit('store:changed', { type: 'config' });

    // Supabase Cloud sync
    getCurrentUser().then(user => {
      if (user) {
        supabase.from('subject_grade_configs').upsert({
          subject_id: subjectId,
          user_id: user.id,
          midterm_weight: config.midterm_weight,
          final_weight: config.final_weight
        }, { onConflict: 'subject_id,user_id' }).then(({ error }) => {
          if (error) console.warn('Supabase config sync error:', error);
        });
      }
    });

    return config;
  }

  calculateTermGrade(subjectId, term) {
    const categories = this.getSubjectGradeCategories(subjectId, term);
    return calculateTermGradeBreakdown(categories, this.getGradingScale());
  }

  calculateSubjectGrade(subjectId) {
    const config = this.getSubjectGradeConfig(subjectId);
    const midterm = this.calculateTermGrade(subjectId, 'Midterm');
    const final = this.calculateTermGrade(subjectId, 'Final');
    const breakdown = calculateSubjectGradeBreakdown(midterm, final, config, this.getGradingScale());

    return {
      subjectId,
      midterm,
      final,
      config,
      overallPercentage: breakdown.overallPercentage,
      philGrade: breakdown.philGrade,
      summaryLine: breakdown.summaryLine
    };
  }

  calculateOverallAcademicStanding() {
    const activeSubjects = this.getSubjects(false);
    if (activeSubjects.length === 0) {
      return { gpa: '—', avgPct: '—', totalSubjects: 0, gradedSubjects: 0 };
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

    return {
      gpa,
      avgPct,
      rawAvgPct,
      totalSubjects: activeSubjects.length,
      gradedSubjects: gradedCount
    };
  }

  // --- STUDY PLANS ---
  getStudyPlans() {
    return this.state.plans || [];
  }

  getStudyPlanById(planId) {
    const plans = this.getStudyPlans();
    return plans.find(p => p.id === planId) || null;
  }

  getStudyPlanBySubject(subjectId) {
    if (!subjectId) return null;
    const plans = this.getStudyPlans();
    return plans.find(p => p.subject_id === subjectId) || null;
  }

  saveStudyPlan(subjectIdOrObj, title, htmlContent, existingPlanId = null, isAutoSave = false) {
    let subjectId = null;
    let planTitle = title;
    let content = htmlContent;
    let planId = existingPlanId;

    if (typeof subjectIdOrObj === 'object' && subjectIdOrObj !== null) {
      subjectId = subjectIdOrObj.subject_id || subjectIdOrObj.subjectId || null;
      planTitle = subjectIdOrObj.title;
      content = subjectIdOrObj.html_content || subjectIdOrObj.htmlContent;
      planId = subjectIdOrObj.id || null;
      if (subjectIdOrObj.isAutoSave !== undefined) isAutoSave = subjectIdOrObj.isAutoSave;
    } else {
      subjectId = subjectIdOrObj || null;
    }

    let plans = this.state.plans || [];
    let existingIdx = -1;

    if (planId) {
      existingIdx = plans.findIndex(p => p.id === planId);
    } else if (subjectId) {
      // 1-plan-per-subject replacement rule applies to subject-tied plans
      existingIdx = plans.findIndex(p => p.subject_id === subjectId);
    }

    const plan = {
      id: existingIdx !== -1 ? plans[existingIdx].id : generateId('plan'),
      subject_id: subjectId,
      title: planTitle ? planTitle.trim() : 'Study Plan',
      html_content: content || '',
      updated_at: new Date().toISOString()
    };

    if (existingIdx !== -1) {
      plans[existingIdx] = plan;
    } else {
      plans.unshift(plan);
    }

    events.emit('plan:saved', plan);
    events.emit('store:changed', { type: isAutoSave ? 'plan_autosave' : 'plan' });

    // Supabase Cloud sync
    getCurrentUser().then(user => {
      if (user) {
        supabase.from('study_plans').upsert({
          id: plan.id,
          user_id: user.id,
          subject_id: plan.subject_id,
          title: plan.title,
          html_content: plan.html_content,
          updated_at: plan.updated_at
        }, { onConflict: 'id' }).then(({ error }) => {
          if (error) console.warn('Supabase plan sync error:', error);
        });
      }
    });

    return plan;
  }

  deleteStudyPlan(planIdOrSubjectId) {
    let targetPlan = (this.state.plans || []).find(p => p.id === planIdOrSubjectId);
    if (!targetPlan) {
      targetPlan = (this.state.plans || []).find(p => p.subject_id === planIdOrSubjectId);
    }
    const planIdToDelete = targetPlan ? targetPlan.id : planIdOrSubjectId;

    this.state.plans = (this.state.plans || []).filter(p => p.id !== planIdToDelete);
    events.emit('plan:deleted', planIdToDelete);
    events.emit('store:changed', { type: 'plan' });

    getCurrentUser().then(user => {
      if (user && planIdToDelete) {
        supabase.from('study_plans').delete().eq('id', planIdToDelete).eq('user_id', user.id).then();
      }
    });
  }

  // --- USER PROFILE ---
  getUserProfile() {
    return { ...this.getDefaultUser(), ...(this.state.user || {}) };
  }

  saveUserProfile(profileData) {
    const current = this.getUserProfile();
    const name = profileData.name !== undefined ? profileData.name.trim() : current.name;
    const email = profileData.email !== undefined ? profileData.email.trim() : current.email;
    const bio = profileData.bio !== undefined ? profileData.bio.trim() : (current.bio || '');
    const year_level = profileData.year_level !== undefined ? profileData.year_level : current.year_level;
    const institution = profileData.institution !== undefined ? profileData.institution.trim() : current.institution;
    const program = profileData.program !== undefined ? profileData.program.trim() : current.program;
    const avatar_color = profileData.avatar_color !== undefined ? profileData.avatar_color : current.avatar_color;
    
    const initials = name.split(' ')
      .filter(Boolean)
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'ST';

    const updatedProfile = {
      ...current,
      ...profileData,
      name,
      email,
      bio,
      year_level,
      institution,
      program,
      avatar_color,
      avatar: initials
    };

    this.state.user = updatedProfile;
    events.emit('user:updated', updatedProfile);
    events.emit('store:changed', { type: 'user' });

    // Supabase Cloud sync
    getCurrentUser().then(user => {
      if (user) {
        supabase.from('profiles').upsert({
          user_id: user.id,
          display_name: updatedProfile.name,
          email: updatedProfile.email || user.email,
          bio: updatedProfile.bio,
          year_level: updatedProfile.year_level,
          school: updatedProfile.institution,
          program: updatedProfile.program,
          avatar_color: updatedProfile.avatar_color,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' }).then(({ error }) => {
          if (error) console.warn('Supabase profile sync error:', error);
        });
      }
    });

    return updatedProfile;
  }

  // --- THEME ---
  getTheme() {
    return this.state.theme || 'dark';
  }

  setTheme(theme) {
    this.state.theme = theme;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('aven_theme', theme);
      }
    } catch (e) {}
    document.documentElement.setAttribute('data-theme', theme);
    events.emit('theme:changed', theme);

    getCurrentUser().then(user => {
      if (user) {
        supabase.from('settings').upsert({
          user_id: user.id,
          theme: theme
        }, { onConflict: 'user_id' }).then();
      }
    });
  }
}

export const store = new Store();
