/**
 * Aven — Settings Service
 * Manages app settings, theme, grading scale, sort preferences, and view modes.
 * Settings are persisted to both localStorage (instant) and Supabase (durable).
 */

import { supabase, getCurrentUser } from '../core/supabase.js';
import { events } from '../core/events.js';
import { syncEngine } from '../core/sync-engine.js';
import { PHILIPPINE_GRADE_SCALE } from '../domain/scale-definitions.js';
import * as ls from '../utils/local-storage.js';

const DEFAULT_SETTINGS = {
  default_midterm_weight: 50,
  default_final_weight: 50,
  default_timer_mode: 'stopwatch',
  pomodoro_work_mins: 25,
  pomodoro_break_mins: 5,
  pomodoro_long_break_mins: 15,
  pomodoro_long_break_interval: 4,
  pomodoro_auto_start_breaks: false,
  pomodoro_auto_start_pomodoros: false,
  pomodoro_alarm_sound: 'bell',
  pomodoro_alarm_volume: 50,
  pomodoro_alarm_muted: false,
  pomodoro_tick_volume: 30,
  pomodoro_tick_muted: true,
  sound_notifications: true,
  subjects_view_mode: 'grid',
  neutral_colors: false
};

/**
 * @param {object} state - The central reactive state object
 */
export function createSettingsService(state) {

  function getDefaultSettings() {
    return { ...DEFAULT_SETTINGS };
  }

  // ---------------------------------------------------------------------------
  // Core Settings
  // ---------------------------------------------------------------------------

  function getSettings() {
    return { ...DEFAULT_SETTINGS, ...(state.settings || {}) };
  }

  function saveSettings(partial) {
    const updated = { ...getSettings(), ...partial };
    state.settings = updated;

    // Neutral colors DOM attribute
    if (typeof document !== 'undefined') {
      if (updated.neutral_colors) {
        document.documentElement.setAttribute('data-neutral-colors', 'true');
      } else {
        document.documentElement.removeAttribute('data-neutral-colors');
      }
    }
    ls.setItem('aven_neutral_colors', updated.neutral_colors ? 'true' : 'false');

    events.emit('settings:updated', updated);
    events.emit('store:changed', { type: 'settings' });

    // Cloud sync with resilient column fallback
    syncEngine.queue(async () => {
      const user = await getCurrentUser();
      if (!user) return;

      const payload = {
        user_id: user.id,
        theme: state.theme || 'dark',
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

      const { error } = await supabase.from('settings').upsert(payload, { onConflict: 'user_id' });
      if (error?.code === 'PGRST204') {
        // Column not found — retry with base schema columns
        delete payload.neutral_colors;
        delete payload.subjects_view_mode;
        return supabase.from('settings').upsert(payload, { onConflict: 'user_id' });
      }
      return { error };
    }, 'Saving settings');

    return updated;
  }

  // ---------------------------------------------------------------------------
  // View Mode & Sort Preferences (localStorage-only, instant)
  // ---------------------------------------------------------------------------

  function getSubjectsViewMode() {
    return getSettings().subjects_view_mode || 'grid';
  }

  function setSubjectsViewMode(mode) {
    saveSettings({ subjects_view_mode: mode });
  }

  function getSubjectsSort() {
    if (!state.subjects_sort || state.subjects_sort === 'recent-desc') {
      const stored = ls.getItem('aven_subjects_sort');
      if (stored) state.subjects_sort = stored;
    }
    return state.subjects_sort || 'recent-desc';
  }

  function setSubjectsSort(sortKey) {
    state.subjects_sort = sortKey;
    ls.setItem('aven_subjects_sort', sortKey);
  }

  function getGradesSidebarSort() {
    if (!state.grades_sidebar_sort || state.grades_sidebar_sort === 'year-sem-grouped') {
      const stored = ls.getItem('aven_grades_sidebar_sort');
      if (stored) state.grades_sidebar_sort = stored;
    }
    return state.grades_sidebar_sort || 'year-sem-grouped';
  }

  function setGradesSidebarSort(sortKey) {
    state.grades_sidebar_sort = sortKey;
    ls.setItem('aven_grades_sidebar_sort', sortKey);
  }

  // ---------------------------------------------------------------------------
  // Grading Scale
  // ---------------------------------------------------------------------------

  function getGradingScale() {
    return state.grading_scale || JSON.parse(JSON.stringify(PHILIPPINE_GRADE_SCALE));
  }

  function saveGradingScale(scale) {
    state.grading_scale = scale;
    events.emit('scale:updated', scale);
    events.emit('store:changed', { type: 'scale' });
    return scale;
  }

  function resetGradingScale() {
    state.grading_scale = JSON.parse(JSON.stringify(PHILIPPINE_GRADE_SCALE));
    events.emit('scale:updated', state.grading_scale);
    events.emit('store:changed', { type: 'scale' });
    return state.grading_scale;
  }

  // ---------------------------------------------------------------------------
  // Theme
  // ---------------------------------------------------------------------------

  function getTheme() {
    return state.theme || 'dark';
  }

  function setTheme(theme, origin = null, onUpdate = null) {
    if (state.theme === theme) {
      if (typeof onUpdate === 'function') {
        try { onUpdate(); } catch (err) { console.error(err); }
      }
      return;
    }

    if (state._isThemeTransitioning) return;

    const applyTheme = () => {
      state.theme = theme;
      ls.setItem('aven_theme', theme);
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', theme);
      }
      events.emit('theme:changed', theme);

      syncEngine.queue(async () => {
        const user = await getCurrentUser();
        if (!user) return;
        return supabase.from('settings').upsert({
          user_id: user.id,
          theme
        }, { onConflict: 'user_id' });
      }, 'Saving theme');
    };

    // Respect prefers-reduced-motion: instant swap
    const prefersReducedMotion = typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      applyTheme();
      if (typeof onUpdate === 'function') {
        try { onUpdate(); } catch (err) { console.error(err); }
      }
      return;
    }

    // Fallback for browsers without View Transitions API
    if (typeof document === 'undefined' || typeof document.startViewTransition !== 'function') {
      state._isThemeTransitioning = true;
      document.documentElement.classList.add('theme-crossfade-active');
      applyTheme();
      if (typeof onUpdate === 'function') {
        try { onUpdate(); } catch (err) { console.error(err); }
      }
      setTimeout(() => {
        document.documentElement.classList.remove('theme-crossfade-active');
        state._isThemeTransitioning = false;
      }, 480);
      return;
    }

    // Modern View Transitions API: Circular reveal
    state._isThemeTransitioning = true;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;

    if (origin instanceof HTMLElement) {
      const rect = origin.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
      }
    } else if (origin && typeof origin.clientX === 'number' && typeof origin.clientY === 'number') {
      x = origin.clientX;
      y = origin.clientY;
    } else {
      const defaultBtn = document.getElementById('top-theme-btn') || document.getElementById('landing-theme-btn');
      if (defaultBtn) {
        const rect = defaultBtn.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          x = rect.left + rect.width / 2;
          y = rect.top + rect.height / 2;
        }
      }
    }

    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    document.documentElement.style.setProperty('--theme-wipe-x', `${x}px`);
    document.documentElement.style.setProperty('--theme-wipe-y', `${y}px`);
    document.documentElement.style.setProperty('--theme-wipe-radius', `${endRadius}px`);

    try {
      const transition = document.startViewTransition(() => {
        applyTheme();
        if (typeof onUpdate === 'function') {
          try { onUpdate(); } catch (err) { console.error(err); }
        }
      });

      transition.ready.then(() => {
        try {
          document.documentElement.animate(
            { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`] },
            { duration: 600, easing: 'cubic-bezier(0.2, 0, 0, 1)', pseudoElement: '::view-transition-new(root)', fill: 'forwards' }
          );
          document.documentElement.animate(
            { opacity: [1, 0.85, 0] },
            { duration: 480, easing: 'cubic-bezier(0.55, 0, 1, 0.45)', pseudoElement: '::view-transition-old(root)', fill: 'forwards' }
          );
        } catch (animErr) {
          console.warn('Theme view transition animation error:', animErr);
        }
      }).catch(() => {});

      transition.finished.finally(() => {
        state._isThemeTransitioning = false;
      });
    } catch (e) {
      state._isThemeTransitioning = false;
      applyTheme();
      if (typeof onUpdate === 'function') {
        try { onUpdate(); } catch (err) { console.error(err); }
      }
    }
  }

  return {
    getDefaultSettings,
    getSettings,
    saveSettings,
    getSubjectsViewMode,
    setSubjectsViewMode,
    getSubjectsSort,
    setSubjectsSort,
    getGradesSidebarSort,
    setGradesSidebarSort,
    getGradingScale,
    saveGradingScale,
    resetGradingScale,
    getTheme,
    setTheme
  };
}
