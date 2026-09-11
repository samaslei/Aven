/**
 * Aven — Sessions Service
 * CRUD operations for study sessions with optimistic updates and cloud sync.
 */

import { supabase, getCurrentUser } from '../core/supabase.js';
import { events } from '../core/events.js';
import { syncEngine } from '../core/sync-engine.js';
import { generateId } from '../core/id.js';

/** Maximum number of sessions retained in-memory and cloud. */
const MAX_SESSION_COUNT = 25;

/**
 * @param {object} state - The central reactive state object (injected by Store)
 */
export function createSessionsService(state) {

  function getSessions(filterSubjectId = null) {
    const list = state.sessions || [];
    return filterSubjectId ? list.filter(s => s.subject_id === filterSubjectId) : list;
  }

  function getSessionById(id) {
    return (state.sessions || []).find(s => s.id === id) || null;
  }

  function saveSession(sessionData) {
    let sessions = state.sessions || [];
    let session;
    const cleanSubjectId = sessionData.subject_id?.trim() || null;

    if (sessionData.id) {
      // Update existing
      const idx = sessions.findIndex(s => s.id === sessionData.id);
      if (idx !== -1) {
        sessions[idx] = { ...sessions[idx], ...sessionData, subject_id: cleanSubjectId };
        session = sessions[idx];
      }
    } else {
      // Create new
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

    // Sort descending by date + creation timestamp
    sessions.sort((a, b) =>
      new Date(b.date + ' ' + (b.created_at || '')) - new Date(a.date + ' ' + (a.created_at || ''))
    );

    // Prune beyond the session limit
    let deletedSessions = [];
    if (sessions.length > MAX_SESSION_COUNT) {
      deletedSessions = sessions.splice(MAX_SESSION_COUNT);
    }
    state.sessions = sessions;

    events.emit('session:saved', session);
    events.emit('store:changed', { type: 'session' });

    // Cloud sync: upsert current + delete pruned
    const sessionRef = session;
    syncEngine.queue(async () => {
      const user = await getCurrentUser();
      if (!user || !sessionRef) return;

      const result = await supabase.from('study_sessions').upsert({
        id: sessionRef.id,
        user_id: user.id,
        subject_id: sessionRef.subject_id,
        duration: sessionRef.duration,
        date: sessionRef.date,
        notes: sessionRef.notes,
        created_at: sessionRef.created_at
      }, { onConflict: 'id' });

      if (deletedSessions.length > 0) {
        const deletedIds = deletedSessions.map(d => d.id).filter(Boolean);
        if (deletedIds.length > 0) {
          await supabase.from('study_sessions').delete().in('id', deletedIds).eq('user_id', user.id);
        }
      }

      return result;
    }, 'Saving session');

    return session;
  }

  function deleteSession(id) {
    state.sessions = (state.sessions || []).filter(s => s.id !== id);
    events.emit('session:deleted', id);
    events.emit('store:changed', { type: 'session' });

    syncEngine.queue(async () => {
      const user = await getCurrentUser();
      if (!user) return;
      return supabase.from('study_sessions').delete().eq('id', id).eq('user_id', user.id);
    }, 'Deleting session');
  }

  function restoreSession(sessionData, originalIndex = null) {
    if (!sessionData || !sessionData.id) return null;
    let sessions = state.sessions || [];

    // If session already exists, return it
    if (sessions.some(s => s.id === sessionData.id)) {
      return sessionData;
    }

    const session = {
      id: sessionData.id,
      subject_id: sessionData.subject_id || null,
      duration: Number(sessionData.duration) || 0,
      date: sessionData.date || new Date().toISOString().split('T')[0],
      notes: sessionData.notes || '',
      created_at: sessionData.created_at || new Date().toISOString()
    };

    if (originalIndex !== null && originalIndex >= 0 && originalIndex <= sessions.length) {
      sessions.splice(originalIndex, 0, session);
    } else {
      sessions.unshift(session);
      sessions.sort((a, b) =>
        new Date(b.date + ' ' + (b.created_at || '')) - new Date(a.date + ' ' + (a.created_at || ''))
      );
    }

    state.sessions = sessions;

    events.emit('session:saved', session);
    events.emit('store:changed', { type: 'session' });

    syncEngine.queue(async () => {
      const user = await getCurrentUser();
      if (!user) return;
      return supabase.from('study_sessions').upsert({
        id: session.id,
        user_id: user.id,
        subject_id: session.subject_id,
        duration: session.duration,
        date: session.date,
        notes: session.notes,
        created_at: session.created_at
      }, { onConflict: 'id' });
    }, 'Restoring session');

    return session;
  }

  function getSubjectTotalStudyMinutes(subjectId) {
    return getSessions(subjectId).reduce((acc, s) => acc + (s.duration || 0), 0);
  }

  return {
    getSessions,
    getSessionById,
    saveSession,
    deleteSession,
    restoreSession,
    getSubjectTotalStudyMinutes
  };
}
