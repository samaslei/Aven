/**
 * Aven — Grades Service
 * CRUD operations for grade categories, grade entries, and subject grade configs
 * with optimistic in-memory updates and cloud sync.
 */

import { supabase, getCurrentUser } from '../core/supabase.js';
import { events } from '../core/events.js';
import { syncEngine } from '../core/sync-engine.js';
import { generateId } from '../core/id.js';

/**
 * @param {object} state - The central reactive state object
 */
export function createGradesService(state) {

  // ---------------------------------------------------------------------------
  // Grade Categories
  // ---------------------------------------------------------------------------

  function getGrades(subjectId = null, term = null) {
    let list = state.grades || [];
    if (subjectId) list = list.filter(g => g.subject_id === subjectId);
    if (term) list = list.filter(g => g.term === term);

    return list.slice().sort((a, b) => {
      const orderA = a.sort_index ?? 999999;
      const orderB = b.sort_index ?? 999999;
      if (orderA !== orderB) return Number(orderA) - Number(orderB);
      return (a.created_at || '').localeCompare(b.created_at || '');
    });
  }

  function getSubjectGradeCategories(subjectId, term = null) {
    return getGrades(subjectId, term);
  }

  // ---------------------------------------------------------------------------
  // Cloud sync helpers for grade categories
  // ---------------------------------------------------------------------------

  async function syncGradeCategoriesUpsert(rows) {
    if (!rows || rows.length === 0) return { success: true };
    syncEngine.setStatus('saving');
    try {
      const user = await getCurrentUser();
      if (!user) { syncEngine.setStatus('synced'); return { success: true }; }

      const { error } = await supabase.from('grade_categories').upsert(rows, { onConflict: 'id' });
      if (error) {
        // Fallback: sort_index column might not exist in user's DB yet
        if (error.message?.includes('sort_index') || error.code === 'PGRST204') {
          console.warn('Retrying grade_categories upsert without sort_index:', error.message);
          const fallbackRows = rows.map(({ sort_index, ...rest }) => rest);
          const { error: fallbackErr } = await supabase.from('grade_categories').upsert(fallbackRows, { onConflict: 'id' });
          if (fallbackErr) {
            console.error('Grade categories upsert fallback error:', fallbackErr);
            syncEngine.setStatus('error', fallbackErr.message || 'Failed to save categories');
            return { success: false, error: fallbackErr };
          }
        } else {
          console.error('Grade categories upsert error:', error);
          syncEngine.setStatus('error', error.message || 'Failed to save categories');
          return { success: false, error };
        }
      }

      syncEngine.setStatus('synced');
      return { success: true };
    } catch (err) {
      console.error('syncGradeCategoriesUpsert exception:', err);
      syncEngine.setStatus('error', err.message || 'Cloud sync failed');
      return { success: false, error: err };
    }
  }

  async function syncGradeCategoriesDelete(ids) {
    if (!ids || ids.length === 0) return { success: true };
    syncEngine.setStatus('saving');
    try {
      const user = await getCurrentUser();
      if (!user) { syncEngine.setStatus('synced'); return { success: true }; }

      const { error } = await supabase.from('grade_categories').delete().in('id', ids).eq('user_id', user.id);
      if (error) {
        console.error('Grade categories delete error:', error);
        syncEngine.setStatus('error', error.message || 'Failed to delete categories');
        return { success: false, error };
      }
      syncEngine.setStatus('synced');
      return { success: true };
    } catch (err) {
      console.error('syncGradeCategoriesDelete exception:', err);
      syncEngine.setStatus('error', err.message || 'Delete failed');
      return { success: false, error: err };
    }
  }

  // ---------------------------------------------------------------------------
  // Category CRUD
  // ---------------------------------------------------------------------------

  function _computeNextSortIndex(subjectId, term) {
    const existing = (state.grades || []).filter(
      g => g.subject_id === subjectId && g.term === (term || 'Midterm')
    );
    return existing.reduce(
      (max, g) => Math.max(max, g.sort_index != null ? Number(g.sort_index) : -1),
      -1
    ) + 1;
  }

  function saveGradeCategory(categoryData) {
    const grades = state.grades;
    let category;
    const isNew = !categoryData.id;

    if (!isNew) {
      const idx = grades.findIndex(g => g.id === categoryData.id);
      if (idx !== -1) {
        grades[idx] = { ...grades[idx], ...categoryData };
        category = grades[idx];
      }
    } else {
      const sortIndex = categoryData.sort_index ?? _computeNextSortIndex(categoryData.subject_id, categoryData.term);
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

    // Cloud sync
    const catRef = category;
    getCurrentUser().then(user => {
      if (!user || !catRef) return;
      syncGradeCategoriesUpsert([{
        id: catRef.id,
        user_id: user.id,
        subject_id: catRef.subject_id,
        term: catRef.term,
        category: catRef.category,
        weight: catRef.weight,
        sort_index: catRef.sort_index ?? 0,
        created_at: catRef.created_at
      }]);
    });

    return category;
  }

  function saveGradeCategoriesBulk(categoriesList, overwriteSubjectId = null, overwriteTerm = null) {
    let grades = state.grades;
    let targetIdsToDelete = [];

    if (overwriteSubjectId && overwriteTerm) {
      targetIdsToDelete = grades
        .filter(g => g.subject_id === overwriteSubjectId && g.term === overwriteTerm)
        .map(t => t.id);
      state.grades = grades.filter(g => !(g.subject_id === overwriteSubjectId && g.term === overwriteTerm));
      grades = state.grades;
    }

    const created = categoriesList.map(catData => {
      const sortIndex = catData.sort_index ?? _computeNextSortIndex(catData.subject_id, catData.term);
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
      return category;
    });

    events.emit('store:changed', { type: 'grade' });

    // Cloud sync: delete old → upsert new
    getCurrentUser().then(async user => {
      if (!user) return;
      if (targetIdsToDelete.length > 0) await syncGradeCategoriesDelete(targetIdsToDelete);
      if (created.length > 0) {
        await syncGradeCategoriesUpsert(created.map(c => ({
          id: c.id, user_id: user.id, subject_id: c.subject_id,
          term: c.term, category: c.category, weight: c.weight,
          sort_index: c.sort_index ?? 0, created_at: c.created_at
        })));
      }
    });

    return created;
  }

  function copyCategoriesBetweenTerms(subjectId, fromTerm = 'Midterm', toTerm = 'Final', overwrite = true) {
    const sourceCategories = getSubjectGradeCategories(subjectId, fromTerm);
    if (sourceCategories.length === 0) return [];

    let grades = state.grades;
    const targetIdsToDelete = grades
      .filter(g => g.subject_id === subjectId && g.term === toTerm)
      .map(t => t.id);

    if (overwrite && targetIdsToDelete.length > 0) {
      state.grades = grades.filter(g => !(g.subject_id === subjectId && g.term === toTerm));
      grades = state.grades;
    }

    const created = sourceCategories.map((sc, idx) => {
      const newCat = {
        id: generateId('cat'),
        subject_id: subjectId,
        term: toTerm,
        category: sc.category,
        weight: Number(sc.weight) || 0,
        sort_index: sc.sort_index != null ? Number(sc.sort_index) : idx,
        entries: [],
        created_at: new Date().toISOString()
      };
      grades.push(newCat);
      return newCat;
    });

    events.emit('store:changed', { type: 'grade' });

    getCurrentUser().then(async user => {
      if (!user) return;
      if (overwrite && targetIdsToDelete.length > 0) await syncGradeCategoriesDelete(targetIdsToDelete);
      if (created.length > 0) {
        await syncGradeCategoriesUpsert(created.map(c => ({
          id: c.id, user_id: user.id, subject_id: c.subject_id,
          term: c.term, category: c.category, weight: c.weight,
          sort_index: c.sort_index ?? 0, created_at: c.created_at
        })));
      }
    });

    return created;
  }

  async function reorderGradeCategories(subjectId, term, orderedCategoryIds) {
    if (!subjectId || !term || !Array.isArray(orderedCategoryIds) || orderedCategoryIds.length === 0) return;

    const grades = state.grades || [];
    const updated = [];

    orderedCategoryIds.forEach((catId, index) => {
      const cat = grades.find(g => g.id === catId && g.subject_id === subjectId && g.term === term);
      if (cat) {
        cat.sort_index = index;
        updated.push(cat);
      }
    });

    events.emit('grade_categories:reordered', { subjectId, term, orderedCategoryIds });
    events.emit('store:changed', { type: 'grade' });

    try {
      const user = await getCurrentUser();
      if (user && updated.length > 0) {
        await syncGradeCategoriesUpsert(updated.map(c => ({
          id: c.id, user_id: user.id, subject_id: c.subject_id,
          term: c.term, category: c.category, weight: c.weight,
          sort_index: c.sort_index, created_at: c.created_at || new Date().toISOString()
        })));
      }
    } catch (err) {
      console.error('Failed to sync category reorder:', err);
    }
  }

  function deleteGradeCategory(categoryId) {
    state.grades = (state.grades || []).filter(g => g.id !== categoryId);
    events.emit('grade_category:deleted', categoryId);
    events.emit('store:changed', { type: 'grade' });
    syncGradeCategoriesDelete([categoryId]);
  }

  // ---------------------------------------------------------------------------
  // Grade Entries
  // ---------------------------------------------------------------------------

  function saveGradeEntry(categoryId, entryData) {
    const cat = (state.grades || []).find(g => g.id === categoryId);
    if (!cat) return null;
    if (!cat.entries) cat.entries = [];

    const entry = {
      id: generateId('ent'),
      name: entryData.name ? entryData.name.trim() : 'New Assessment',
      score: Number(entryData.score) || 0,
      out_of: Number(entryData.out_of) || 100,
      created_at: entryData.created_at || new Date().toISOString()
    };

    cat.entries.push(entry);
    events.emit('grade_entry:saved', { categoryId, entry });
    events.emit('store:changed', { type: 'grade' });

    syncEngine.queue(async () => {
      const user = await getCurrentUser();
      if (!user) return;
      return supabase.from('grade_entries').upsert({
        id: entry.id,
        user_id: user.id,
        category_id: categoryId,
        name: entry.name,
        score: entry.score,
        out_of: entry.out_of,
        created_at: new Date().toISOString()
      }, { onConflict: 'id' });
    }, 'Saving assessment');

    return entry;
  }

  function updateGradeEntry(categoryId, entryId, updates) {
    const cat = (state.grades || []).find(g => g.id === categoryId);
    if (!cat?.entries) return null;
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
    entry.updated_at = new Date().toISOString();

    events.emit('grade_entry:saved', { categoryId, entry });
    events.emit('store:changed', { type: 'grade' });

    syncEngine.queue(async () => {
      const user = await getCurrentUser();
      if (!user) return;
      return supabase.from('grade_entries').update({
        name: entry.name,
        score: entry.score,
        out_of: entry.out_of
      }).eq('id', entryId).eq('user_id', user.id);
    }, 'Updating score');

    return entry;
  }

  function deleteGradeEntry(categoryId, entryId) {
    const cat = (state.grades || []).find(g => g.id === categoryId);
    if (!cat?.entries) return;

    cat.entries = cat.entries.filter(e => e.id !== entryId);
    events.emit('grade_entry:deleted', { categoryId, entryId });
    events.emit('store:changed', { type: 'grade' });

    syncEngine.queue(async () => {
      const user = await getCurrentUser();
      if (!user) return;
      return supabase.from('grade_entries').delete().eq('id', entryId).eq('user_id', user.id);
    }, 'Deleting assessment');
  }

  // ---------------------------------------------------------------------------
  // Subject Grade Configs
  // ---------------------------------------------------------------------------

  function getGradeConfigs() {
    return state.grade_configs || [];
  }

  function getSubjectGradeConfig(subjectId) {
    const found = (state.grade_configs || []).find(c => c.subject_id === subjectId);
    if (found) return found;

    // Fall back to default weights — caller must provide getSettings() at construction
    return {
      subject_id: subjectId,
      midterm_weight: 50,
      final_weight: 50
    };
  }

  function saveSubjectGradeConfig(subjectId, midtermWeight, finalWeight) {
    const configs = state.grade_configs;
    const config = {
      subject_id: subjectId,
      midterm_weight: Number(midtermWeight) || 50,
      final_weight: Number(finalWeight) || 50
    };

    const idx = configs.findIndex(c => c.subject_id === subjectId);
    if (idx !== -1) {
      configs[idx] = config;
    } else {
      configs.push(config);
    }

    events.emit('grade_config:saved', config);
    events.emit('store:changed', { type: 'config' });

    syncEngine.queue(async () => {
      const user = await getCurrentUser();
      if (!user) return;
      return supabase.from('subject_grade_configs').upsert({
        subject_id: subjectId,
        user_id: user.id,
        midterm_weight: config.midterm_weight,
        final_weight: config.final_weight
      }, { onConflict: 'subject_id,user_id' });
    }, 'Saving grade config');

    return config;
  }

  return {
    getGrades,
    getSubjectGradeCategories,
    syncGradeCategoriesUpsert,
    syncGradeCategoriesDelete,
    saveGradeCategory,
    saveGradeCategoriesBulk,
    copyCategoriesBetweenTerms,
    reorderGradeCategories,
    deleteGradeCategory,
    saveGradeEntry,
    updateGradeEntry,
    deleteGradeEntry,
    getGradeConfigs,
    getSubjectGradeConfig,
    saveSubjectGradeConfig
  };
}
