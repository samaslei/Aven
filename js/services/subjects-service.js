/**
 * Aven — Subjects Service
 * CRUD operations for academic subjects with optimistic in-memory updates
 * and queued Supabase cloud sync.
 */

import { supabase, getCurrentUser } from '../core/supabase.js';
import { events } from '../core/events.js';
import { syncEngine } from '../core/sync-engine.js';
import { generateId } from '../core/id.js';
import { DEFAULT_COLOR_SWATCHES } from '../domain/scale-definitions.js';

/**
 * @param {object} state - The central reactive state object (injected by Store)
 * @param {Function} getSettings - Returns current settings
 * @param {Function} saveSubjectGradeConfig - Creates default grade config for new subjects
 */
export function createSubjectsService(state, getSettings, saveSubjectGradeConfig) {

  function getSubjects(includeArchived = true) {
    const list = state.subjects || [];
    return includeArchived ? list : list.filter(s => !s.archived);
  }

  function getSubjectById(id) {
    return (state.subjects || []).find(s => s.id === id) || null;
  }

  function saveSubject(subjectData) {
    const subjects = state.subjects || [];
    let subject;
    const isNew = !subjectData.id;

    if (!isNew) {
      const idx = subjects.findIndex(s => s.id === subjectData.id);
      if (idx !== -1) {
        subjects[idx] = { ...subjects[idx], ...subjectData };
        subject = subjects[idx];
      }
    } else {
      const settings = getSettings();
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
      saveSubjectGradeConfig(subject.id, settings.default_midterm_weight, settings.default_final_weight);
    }

    events.emit('subject:saved', subject);
    events.emit('store:changed', { type: 'subject' });

    // Cloud sync
    const subjectRef = subject;
    syncEngine.queue(async () => {
      const user = await getCurrentUser();
      if (!user || !subjectRef) return;
      return supabase.from('subjects').upsert({
        id: subjectRef.id,
        user_id: user.id,
        name: subjectRef.name,
        code: subjectRef.code,
        year_level: subjectRef.year_level,
        semester: subjectRef.semester,
        color: subjectRef.color,
        instructor: subjectRef.instructor,
        archived: subjectRef.archived,
        archive_reason: subjectRef.archive_reason || null,
        archived_at: subjectRef.archived_at || null,
        created_at: subjectRef.created_at
      }, { onConflict: 'id' });
    }, 'Saving subject');

    return subject;
  }

  function archiveSubject(id, reason = 'Semester ended', note = '') {
    const item = (state.subjects || []).find(s => s.id === id);
    if (!item) return null;

    item.archived = true;
    item.archive_reason = (reason === 'Other' && note.trim()) ? `Other: ${note.trim()}` : (reason || 'Semester ended');
    item.archived_at = new Date().toISOString();

    events.emit('subject:archived', item);
    events.emit('store:changed', { type: 'subject' });

    syncEngine.queue(async () => {
      const user = await getCurrentUser();
      if (!user) return;
      return supabase.from('subjects').update({
        archived: true,
        archive_reason: item.archive_reason,
        archived_at: item.archived_at
      }).eq('id', id).eq('user_id', user.id);
    }, 'Archiving subject');

    return item;
  }

  function unarchiveSubject(id) {
    const item = (state.subjects || []).find(s => s.id === id);
    if (!item) return null;

    item.archived = false;
    item.archive_reason = null;
    item.archived_at = null;

    events.emit('subject:archived', item);
    events.emit('store:changed', { type: 'subject' });

    syncEngine.queue(async () => {
      const user = await getCurrentUser();
      if (!user) return;
      return supabase.from('subjects').update({
        archived: false,
        archive_reason: null,
        archived_at: null
      }).eq('id', id).eq('user_id', user.id);
    }, 'Unarchiving subject');

    return item;
  }

  function bulkArchiveSubjects(subjectIds, reason = 'Semester ended') {
    const subjects = state.subjects || [];
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

      syncEngine.queue(async () => {
        const user = await getCurrentUser();
        if (!user) return;
        return supabase.from('subjects')
          .update({ archived: true, archive_reason: reason, archived_at: now })
          .in('id', subjectIds)
          .eq('user_id', user.id);
      }, 'Archiving subjects');
    }
    return count;
  }

  function deleteSubject(id) {
    state.subjects = (state.subjects || []).filter(s => s.id !== id);
    state.sessions = (state.sessions || []).filter(s => s.subject_id !== id);
    state.grades = (state.grades || []).filter(g => g.subject_id !== id);
    state.grade_configs = (state.grade_configs || []).filter(c => c.subject_id !== id);
    state.plans = (state.plans || []).filter(p => p.subject_id !== id);

    events.emit('subject:deleted', id);
    events.emit('store:changed', { type: 'subject' });

    syncEngine.queue(async () => {
      const user = await getCurrentUser();
      if (!user) return;
      return supabase.from('subjects').delete().eq('id', id).eq('user_id', user.id);
    }, 'Deleting subject');
  }

  /** Returns cascade stats showing how much data is tied to a subject. */
  function getCascadeStats(subjectId) {
    const sessions = (state.sessions || []).filter(s => s.subject_id === subjectId);
    const grades = (state.grades || []).filter(g => g.subject_id === subjectId);
    let totalGradeEntries = 0;
    grades.forEach(g => { totalGradeEntries += (g.entries || []).length; });
    const plan = (state.plans || []).find(p => p.subject_id === subjectId);

    return {
      sessionCount: sessions.length,
      gradeCategoriesCount: grades.length,
      gradeEntriesCount: totalGradeEntries,
      hasPlan: !!plan
    };
  }

  return {
    getSubjects,
    getSubjectById,
    saveSubject,
    archiveSubject,
    unarchiveSubject,
    bulkArchiveSubjects,
    deleteSubject,
    getCascadeStats
  };
}
