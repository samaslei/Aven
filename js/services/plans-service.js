/**
 * Aven — Plans Service
 * CRUD operations for study plans with optimistic updates and cloud sync.
 */

import { supabase, getCurrentUser } from '../core/supabase.js';
import { events } from '../core/events.js';
import { syncEngine } from '../core/sync-engine.js';
import { generateId } from '../core/id.js';

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
    } else if (subjectId) {
      // 1-plan-per-subject replacement rule for subject-tied plans
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
      } else {
        plan.html_content = plan.html_content || '';
      }
    } catch (e) {
      console.warn('Failed to lazy load study plan html_content:', e);
      plan.html_content = plan.html_content || '';
    }

    return plan.html_content;
  }

  return {
    getStudyPlans,
    getStudyPlanById,
    getStudyPlanBySubject,
    saveStudyPlan,
    deleteStudyPlan,
    loadStudyPlanContent
  };
}
