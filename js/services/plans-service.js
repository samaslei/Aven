/**
 * Aven — Plans Service
 * CRUD operations for study plans with optimistic updates and cloud sync.
 */

import { supabase, getCurrentUser } from '../core/supabase.js';
import { events } from '../core/events.js';
import { syncEngine } from '../core/sync-engine.js';
import { generateId } from '../core/id.js';

/**
 * Sanitizes and caps the size of a virtual storage snapshot.
 * Prevents malicious or runaway scripts from saving unbounded data.
 */
export function sanitizeStorageSnapshot(snapshot, maxBytes = 524288) {
  if (!snapshot || typeof snapshot !== 'object') return {};
  const clean = {};
  let totalBytes = 0;
  for (const k of Object.keys(snapshot)) {
    const strKey = String(k).slice(0, 256);
    const strVal = String(snapshot[k]);
    const itemBytes = (strKey.length + strVal.length) * 2;
    if (totalBytes + itemBytes > maxBytes) {
      console.warn('Storage snapshot exceeded 512KB cap. Truncating remaining keys.');
      break;
    }
    totalBytes += itemBytes;
    clean[strKey] = strVal;
  }
  return clean;
}

/**
 * Extracts embedded virtual storage JSON from HTML content.
 */
export function extractStorageData(html) {
  if (!html || typeof html !== 'string') return {};
  const match = html.match(/<script id="aven-plan-storage-data" type="application\/json">([\s\S]*?)<\/script>/i);
  if (match && match[1]) {
    try {
      return JSON.parse(match[1]) || {};
    } catch (e) {
      return {};
    }
  }
  return {};
}

/**
 * Embeds or updates the virtual storage JSON tag inside HTML content.
 */
export function embedStorageDataInHtml(html, storageData) {
  if (!html || typeof html !== 'string') return html;
  const jsonStr = JSON.stringify(storageData || {});
  const tag = `<script id="aven-plan-storage-data" type="application/json">${jsonStr}</script>`;

  if (html.includes('id="aven-plan-storage-data"')) {
    return html.replace(/<script id="aven-plan-storage-data" type="application\/json">[\s\S]*?<\/script>/i, tag);
  }

  const headMatch = html.match(/<head\b[^>]*>/i);
  if (headMatch) {
    return html.replace(headMatch[0], `${headMatch[0]}\n${tag}`);
  }
  return `${tag}\n${html}`;
}

/**
 * @param {object} state - The central reactive state object
 */
export function createPlansService(state) {

  function getStudyPlans() {
    return state.plans || [];
  }

  function getStudyPlanById(planId) {
    return (state.plans || []).find(p => p.id === planId) || null;
  }

  function getStudyPlanBySubject(subjectId) {
    if (!subjectId) return null;
    return (state.plans || []).find(p => p.subject_id === subjectId) || null;
  }

  function saveStudyPlan(subjectIdOrObj, title, htmlContent, existingPlanId = null, isAutoSave = false) {
    let subjectId = null;
    let planTitle = title;
    let content = htmlContent;
    let planId = existingPlanId;

    // Support both object-form and positional-args calling conventions
    if (typeof subjectIdOrObj === 'object' && subjectIdOrObj !== null) {
      subjectId = subjectIdOrObj.subject_id || subjectIdOrObj.subjectId || null;
      planTitle = subjectIdOrObj.title;
      content = subjectIdOrObj.html_content || subjectIdOrObj.htmlContent;
      planId = subjectIdOrObj.id || null;
      if (subjectIdOrObj.isAutoSave !== undefined) isAutoSave = subjectIdOrObj.isAutoSave;
    } else {
      subjectId = subjectIdOrObj || null;
    }

    let plans = state.plans || [];
    let existingIdx = -1;

    if (planId) {
      existingIdx = plans.findIndex(p => p.id === planId);
    }

    // If linking to a subject, decouple any other plan that currently had this subject
    if (subjectId) {
      plans.forEach(p => {
        if ((existingIdx === -1 || p.id !== plans[existingIdx]?.id) && p.subject_id === subjectId) {
          p.subject_id = null;
          p.updated_at = new Date().toISOString();
          syncEngine.queue(async () => {
            const user = await getCurrentUser();
            if (!user) return;
            return supabase.from('study_plans').update({
              subject_id: null,
              updated_at: p.updated_at
            }).eq('id', p.id).eq('user_id', user.id);
          }, 'Unlinking previous plan for subject');
        }
      });
    }

    const existingPlan = existingIdx !== -1 ? plans[existingIdx] : null;
    const storageData = (typeof subjectIdOrObj === 'object' && subjectIdOrObj?.storage_data) ||
      existingPlan?.storage_data ||
      extractStorageData(content || '');

    const plan = {
      id: existingPlan ? existingPlan.id : generateId('plan'),
      subject_id: subjectId,
      title: planTitle ? planTitle.trim() : 'Study Plan',
      html_content: content || '',
      storage_data: storageData,
      updated_at: new Date().toISOString()
    };

    if (existingIdx !== -1) {
      plans[existingIdx] = plan;
    } else {
      plans.unshift(plan);
    }

    events.emit('plan:saved', plan);
    events.emit('store:changed', { type: isAutoSave ? 'plan_autosave' : 'plan' });

    syncEngine.queue(async () => {
      const user = await getCurrentUser();
      if (!user) return;
      return supabase.from('study_plans').upsert({
        id: plan.id,
        user_id: user.id,
        subject_id: plan.subject_id,
        title: plan.title,
        html_content: plan.html_content,
        updated_at: plan.updated_at
      }, { onConflict: 'id' });
    }, 'Saving plan');

    return plan;
  }

  function deleteStudyPlan(planIdOrSubjectId) {
    let targetPlan = (state.plans || []).find(p => p.id === planIdOrSubjectId);
    if (!targetPlan) {
      targetPlan = (state.plans || []).find(p => p.subject_id === planIdOrSubjectId);
    }
    const planIdToDelete = targetPlan ? targetPlan.id : planIdOrSubjectId;

    state.plans = (state.plans || []).filter(p => p.id !== planIdToDelete);
    events.emit('plan:deleted', planIdToDelete);
    events.emit('store:changed', { type: 'plan' });

    syncEngine.queue(async () => {
      const user = await getCurrentUser();
      if (!user || !planIdToDelete) return;
      return supabase.from('study_plans').delete().eq('id', planIdToDelete).eq('user_id', user.id);
    }, 'Deleting plan');
  }

  async function loadStudyPlanContent(planId) {
    if (!planId) return '';
    const plan = (state.plans || []).find(p => p.id === planId);
    if (!plan) return '';
    if (plan.html_content !== undefined && plan.html_content !== null) {
      return plan.html_content;
    }

    try {
      const { data, error } = await supabase
        .from('study_plans')
        .select('html_content')
        .eq('id', planId)
        .maybeSingle();

      if (!error && data) {
        plan.html_content = data.html_content || '';
        plan.storage_data = extractStorageData(plan.html_content);
      } else {
        plan.html_content = plan.html_content || '';
      }
    } catch (e) {
      console.warn('Failed to lazy load study plan html_content:', e);
      plan.html_content = plan.html_content || '';
    }

    return plan.html_content;
  }

  function savePlanStorage(planId, storageSnapshot) {
    if (!planId) return null;
    const plans = state.plans || [];
    const plan = plans.find(p => p.id === planId);
    if (!plan) return null;

    const sanitized = sanitizeStorageSnapshot(storageSnapshot);
    plan.storage_data = sanitized;
    plan.html_content = embedStorageDataInHtml(plan.html_content || '', sanitized);
    plan.updated_at = new Date().toISOString();

    events.emit('plan:saved', plan);
    events.emit('store:changed', { type: 'plan_autosave' });

    syncEngine.queue(async () => {
      const user = await getCurrentUser();
      if (!user) return;
      return supabase.from('study_plans').upsert({
        id: plan.id,
        user_id: user.id,
        subject_id: plan.subject_id,
        title: plan.title,
        html_content: plan.html_content,
        updated_at: plan.updated_at
      }, { onConflict: 'id' });
    }, `Autosaving storage for "${plan.title}"`);

    return plan;
  }

  function updatePlanSubject(planId, subjectId) {
    if (!planId) return null;
    const plans = state.plans || [];
    const plan = plans.find(p => p.id === planId);
    if (!plan) return null;

    const newSubjectId = subjectId || null;

    // If linking to a subject, unlink any other plan that currently has this subject_id
    if (newSubjectId) {
      plans.forEach(p => {
        if (p.id !== planId && p.subject_id === newSubjectId) {
          p.subject_id = null;
          p.updated_at = new Date().toISOString();
          syncEngine.queue(async () => {
            const user = await getCurrentUser();
            if (!user) return;
            return supabase.from('study_plans').update({
              subject_id: null,
              updated_at: p.updated_at
            }).eq('id', p.id).eq('user_id', user.id);
          }, 'Unlinking previous plan for subject');
        }
      });
    }

    plan.subject_id = newSubjectId;
    plan.updated_at = new Date().toISOString();

    events.emit('plan:saved', plan);
    events.emit('store:changed', { type: 'plan' });

    syncEngine.queue(async () => {
      const user = await getCurrentUser();
      if (!user) return;
      return supabase.from('study_plans').update({
        subject_id: plan.subject_id,
        updated_at: plan.updated_at
      }).eq('id', plan.id).eq('user_id', user.id);
    }, 'Updating plan subject link');

    return plan;
  }

  function retryPlanSync(planId) {
    const plan = (state.plans || []).find(p => p.id === planId);
    if (!plan) return;

    syncEngine.queue(async () => {
      const user = await getCurrentUser();
      if (!user) return;
      return supabase.from('study_plans').upsert({
        id: plan.id,
        user_id: user.id,
        subject_id: plan.subject_id,
        title: plan.title,
        html_content: plan.html_content || '',
        updated_at: plan.updated_at
      }, { onConflict: 'id' });
    }, `Syncing study plan "${plan.title}"`);
  }

  function syncAllPlansToCloud() {
    const plans = state.plans || [];
    plans.forEach(p => {
      retryPlanSync(p.id);
    });
  }

  return {
    getStudyPlans,
    getStudyPlanById,
    getStudyPlanBySubject,
    saveStudyPlan,
    savePlanStorage,
    updatePlanSubject,
    deleteStudyPlan,
    loadStudyPlanContent,
    retryPlanSync,
    syncAllPlansToCloud
  };
}
