/**
 * Aven — Account Service
 * Account deletion, data export/import, clear data, and storage usage.
 */

import { supabase, getCurrentUser, signOut } from '../core/supabase.js';
import { events } from '../core/events.js';
import { generateId } from '../core/id.js';
import * as ls from '../utils/local-storage.js';

/**
 * @param {object} state - The central reactive state object
 * @param {object} services - References to other services for cross-cutting operations
 * @param {Function} services.getSubjects
 * @param {Function} services.getSessions
 * @param {Function} services.getGrades
 * @param {Function} services.getGradeConfigs
 * @param {Function} services.getStudyPlans
 * @param {Function} services.getUserProfile
 * @param {Function} services.getSettings
 * @param {Function} services.resetState
 * @param {Function} services.syncFromCloud
 */
export function createAccountService(state, services) {

  // ---------------------------------------------------------------------------
  // Storage Usage
  // ---------------------------------------------------------------------------

  function getStorageUsageSummary() {
    const subjects = services.getSubjects(true);
    const sessions = services.getSessions();
    const grades = services.getGrades();
    let totalGradeEntries = 0;
    grades.forEach(g => { totalGradeEntries += (g.entries || []).length; });
    const plans = services.getStudyPlans();

    return {
      subjectsCount: subjects.length,
      sessionsCount: sessions.length,
      gradeCategoriesCount: grades.length,
      gradeEntriesCount: totalGradeEntries,
      plansCount: plans.length,
      summaryText: `${subjects.length} subjects · ${sessions.length} sessions · ${totalGradeEntries} grade entries · ${plans.length} study plans`
    };
  }

  function getStorageUsage() {
    return getStorageUsageSummary().summaryText;
  }

  // ---------------------------------------------------------------------------
  // Data Export / Import
  // ---------------------------------------------------------------------------

  function exportAllDataJSON() {
    const data = {
      version: '1.2-supabase',
      exported_at: new Date().toISOString(),
      subjects: services.getSubjects(true),
      sessions: services.getSessions(),
      grades: services.getGrades(),
      grade_configs: services.getGradeConfigs(),
      plans: services.getStudyPlans(),
      user: services.getUserProfile(),
      settings: services.getSettings()
    };
    return JSON.stringify(data, null, 2);
  }

  async function importAllDataJSON(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      if (!Array.isArray(data.subjects)) {
        throw new Error('Invalid backup format: subjects array is missing');
      }

      const user = await getCurrentUser();
      if (!user?.id) {
        throw new Error('You must be signed in to import data to Supabase');
      }
      const userId = user.id;

      // 1. Sync Profile & Settings
      if (data.user) {
        const u = data.user;
        const profilePayload = {
          user_id: userId,
          display_name: u.name || user.email?.split('@')[0],
          email: user.email,
          bio: u.bio || '',
          year_level: u.year_level || '1st Year',
          school: u.institution || '',
          program: u.program || '',
          avatar_color: u.avatar_color || '#6366f1',
          updated_at: new Date().toISOString()
        };

        const { error: pErr } = await supabase
          .from('profiles')
          .upsert({ ...profilePayload, avatar_url: u.avatar_url || null }, { onConflict: 'user_id' });

        if (pErr && (pErr.code === '42703' || pErr.message?.includes('avatar_url'))) {
          await supabase.from('profiles').upsert(profilePayload, { onConflict: 'user_id' });
        }
      }

      if (data.settings) {
        const s = data.settings;
        await supabase.from('settings').upsert({
          user_id: userId,
          theme: state.theme || 'dark',
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
      if (data.subjects?.length > 0) {
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
      if (data.grade_configs?.length > 0) {
        const cfgRows = data.grade_configs.map(cfg => ({
          subject_id: cfg.subject_id,
          user_id: userId,
          midterm_weight: Number(cfg.midterm_weight) || 50,
          final_weight: Number(cfg.final_weight) || 50
        }));
        await supabase.from('subject_grade_configs').upsert(cfgRows, { onConflict: 'subject_id,user_id' });
      }

      // 4. Sync Sessions
      if (data.sessions?.length > 0) {
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
      if (data.grades?.length > 0) {
        const categoryRows = [];
        const entryRows = [];

        data.grades.forEach((cat, idx) => {
          const catId = cat.id || generateId('cat');
          categoryRows.push({
            id: catId, user_id: userId, subject_id: cat.subject_id,
            term: cat.term || 'Midterm', category: cat.category || 'Quizzes',
            weight: Number(cat.weight || 0),
            sort_index: cat.sort_index != null ? Number(cat.sort_index) : idx,
            created_at: cat.created_at || new Date().toISOString()
          });

          (cat.entries || []).forEach(ent => {
            entryRows.push({
              id: ent.id || generateId('ent'), user_id: userId, category_id: catId,
              name: ent.name || 'Assessment', score: Number(ent.score || 0),
              out_of: Number(ent.out_of || 100),
              created_at: ent.created_at || new Date().toISOString()
            });
          });
        });

        if (categoryRows.length > 0) {
          await supabase.from('grade_categories').upsert(categoryRows, { onConflict: 'id' });
        }
        if (entryRows.length > 0) {
          await supabase.from('grade_entries').upsert(entryRows, { onConflict: 'id' });
        }
      }

      // 6. Sync Study Plans
      if (data.plans?.length > 0) {
        const planRows = data.plans.map(p => ({
          id: p.id || generateId('plan'), user_id: userId, subject_id: p.subject_id,
          title: p.title || 'Study Plan', html_content: p.html_content || '',
          updated_at: p.updated_at || new Date().toISOString()
        }));
        await supabase.from('study_plans').upsert(planRows, { onConflict: 'id' });
      }

      // Re-fetch everything from cloud
      await services.syncFromCloud(userId);

      events.emit('store:imported');
      events.emit('store:changed', { type: 'import' });
      return { success: true, count: data.subjects.length };
    } catch (err) {
      console.error('Import failed', err);
      return { success: false, error: err.message };
    }
  }

  // ---------------------------------------------------------------------------
  // Clear / Delete
  // ---------------------------------------------------------------------------

  async function clearAllData() {
    state.subjects = [];
    state.sessions = [];
    state.grades = [];
    state.grade_configs = [];
    state.plans = [];

    const user = await getCurrentUser();
    if (user) {
      // Delete in dependency order: children before parents
      await supabase.from('grade_entries').delete().eq('user_id', user.id);
      await supabase.from('grade_categories').delete().eq('user_id', user.id);
      await supabase.from('study_sessions').delete().eq('user_id', user.id);
      await supabase.from('study_plans').delete().eq('user_id', user.id);
      await supabase.from('subject_grade_configs').delete().eq('user_id', user.id);
      await supabase.from('subjects').delete().eq('user_id', user.id);
    }

    events.emit('store:cleared');
    events.emit('store:changed', { type: 'clear' });
  }

  async function deleteAccount() {
    const user = await getCurrentUser();
    if (!user) throw new Error('No active user session to delete.');

    let deleted = false;
    let lastError = null;

    // 1. Try serverless backend endpoint
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const res = await fetch('/api/delete-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data.success) deleted = true;
        } else if (res.status !== 404 && res.status !== 405) {
          const errData = await res.json().catch(() => ({}));
          lastError = errData.error || `API returned status ${res.status}`;
        }
      }
    } catch (apiErr) {
      console.warn('Backend API /api/delete-user not reachable, trying direct RPC:', apiErr);
    }

    // 2. Try direct PostgreSQL RPC
    if (!deleted) {
      try {
        const { error: rpcError } = await supabase.rpc('delete_user_account');
        if (!rpcError) {
          deleted = true;
        } else {
          console.error('RPC delete_user_account failed:', rpcError);
          lastError = rpcError.message || rpcError.details || 'RPC execution error';
        }
      } catch (rpcErr) {
        console.error('RPC invocation error:', rpcErr);
        lastError = rpcErr.message;
      }
    }

    // 3. Clean up user data tables
    try {
      await supabase.from('study_sessions').delete().eq('user_id', user.id);
      await supabase.from('grade_entries').delete().eq('user_id', user.id);
      await supabase.from('grade_categories').delete().eq('user_id', user.id);
      await supabase.from('subject_grade_configs').delete().eq('user_id', user.id);
      await supabase.from('study_plans').delete().eq('user_id', user.id);
      await supabase.from('subjects').delete().eq('user_id', user.id);
      await supabase.from('profiles').delete().eq('user_id', user.id);
      await supabase.from('settings').delete().eq('user_id', user.id);
    } catch (dataErr) {
      console.warn('Data cascade error:', dataErr);
    }

    if (!deleted) {
      // Still clean up local state even if cloud deletion failed
      services.resetState();
      ls.removeItem('aven_user_profile');
      ls.removeItem('aven_settings');
      ls.removeItem('aven_grading_scale');
      events.emit('store:cleared');
      events.emit('store:changed', { type: 'account_deleted' });

      throw new Error(
        `Could not delete Supabase auth account: ${lastError || 'Function not found'}. ` +
        'Please run the SQL migration in supabase_migration_delete_user.sql in your Supabase SQL Editor.'
      );
    }

    // Sign out and clean up
    await signOut();
    services.resetState();
    ls.removeItem('aven_user_profile');
    ls.removeItem('aven_settings');
    ls.removeItem('aven_grading_scale');
    events.emit('store:cleared');
    events.emit('store:changed', { type: 'account_deleted' });

    return { success: true };
  }

  return {
    getStorageUsageSummary,
    getStorageUsage,
    exportAllDataJSON,
    importAllDataJSON,
    clearAllData,
    deleteAccount
  };
}
