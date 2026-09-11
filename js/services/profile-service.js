/**
 * Aven — Profile Service
 * User profile CRUD, avatar upload, and local profile caching.
 */

import { supabase, getCurrentUser, isSupabaseConfigured } from '../core/supabase.js';
import { events } from '../core/events.js';
import { syncEngine } from '../core/sync-engine.js';
import * as ls from '../utils/local-storage.js';

export const DEFAULT_USER = {
  name: '',
  email: '',
  bio: '',
  year_level: '1st Year',
  institution: '',
  program: '',
  avatar: '',
  avatar_color: '#6366f1',
  avatar_url: null,
  is_loaded: false
};

/**
 * Derives a neutral/clean user profile from an active Supabase session or user object.
 * Avoids any hardcoded fake names or placeholder institutions.
 * @param {object|null} sessionUser - Supabase session.user
 * @returns {object}
 */
export function deriveUserFromSession(sessionUser) {
  if (!sessionUser) return { ...DEFAULT_USER };
  const meta = sessionUser.user_metadata || {};
  const email = sessionUser.email || '';
  const rawMetaName = meta.display_name || meta.full_name || meta.name || '';
  const cleanName = (rawMetaName && rawMetaName.toLowerCase() !== 'alex rivera')
    ? rawMetaName
    : (email ? email.split('@')[0] : '');

  const initials = cleanName
    ? cleanName.split(' ').filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase()
    : (email ? email.slice(0, 2).toUpperCase() : 'U');

  return {
    ...DEFAULT_USER,
    name: cleanName,
    email,
    avatar: initials,
    avatar_color: meta.avatar_color || '#6366f1',
    avatar_url: meta.avatar_url || null,
    is_loaded: false
  };
}

/**
 * Checks if a cached profile object is the legacy fake placeholder.
 */
function isDummyUser(u) {
  if (!u) return true;
  const name = (u.name || '').trim().toLowerCase();
  const email = (u.email || '').trim().toLowerCase();
  return name === 'alex rivera' || email === 'student@university.edu';
}

/**
 * @param {object} state - The central reactive state object
 * @param {{ currentUserId: string|null }} context - Mutable context ref shared with Store
 */
export function createProfileService(state, context) {

  function getDefaultUser() {
    return { ...DEFAULT_USER };
  }

  // ---------------------------------------------------------------------------
  // Local Profile Cache
  // ---------------------------------------------------------------------------

  function getLocalCachedUser(userId = null) {
    if (userId) {
      const userSpecific = ls.getJSON(`aven_user_profile_${userId}`);
      if (userSpecific) {
        if (isDummyUser(userSpecific)) {
          ls.removeItem(`aven_user_profile_${userId}`);
        } else {
          return userSpecific;
        }
      }
    }
    const legacy = ls.getJSON('aven_user_profile');
    if (legacy) {
      if (isDummyUser(legacy)) {
        ls.removeItem('aven_user_profile');
        return null;
      }
      return legacy;
    }
    return null;
  }

  function saveLocalCachedUser(user, userId = null) {
    if (!user || isDummyUser(user)) return;
    ls.setJSON('aven_user_profile', user);
    if (userId) {
      ls.setJSON(`aven_user_profile_${userId}`, user);
    }
  }

  // ---------------------------------------------------------------------------
  // Profile CRUD
  // ---------------------------------------------------------------------------

  function getUserProfile() {
    return { ...getDefaultUser(), ...(state.user || {}) };
  }

  async function uploadAvatarImage(blob) {
    if (!blob) return null;
    try {
      const user = await getCurrentUser();
      if (user && isSupabaseConfigured) {
        const isWebp = blob.type === 'image/webp';
        const fileExt = isWebp ? 'webp' : 'png';
        const contentType = blob.type || (isWebp ? 'image/webp' : 'image/png');
        const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

        const { data, error } = await supabase.storage.from('avatars').upload(fileName, blob, {
          contentType,
          upsert: true
        });

        if (!error && data) {
          const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(fileName);
          if (publicData?.publicUrl) return publicData.publicUrl;
        } else if (error) {
          console.warn('Avatar storage upload notice:', error.message || error);
        }
      }
    } catch (err) {
      console.warn('Avatar storage upload notice:', err);
    }

    // Fallback: convert blob to Data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  function saveUserProfile(profileData) {
    const current = getUserProfile();
    const name = profileData.name !== undefined ? profileData.name.trim() : current.name;
    const email = profileData.email !== undefined ? profileData.email.trim() : current.email;
    const bio = profileData.bio !== undefined ? profileData.bio.trim() : (current.bio || '');
    const year_level = profileData.year_level !== undefined ? profileData.year_level : current.year_level;
    const institution = profileData.institution !== undefined ? profileData.institution.trim() : current.institution;
    const program = profileData.program !== undefined ? profileData.program.trim() : current.program;
    const avatar_color = profileData.avatar_color !== undefined ? profileData.avatar_color : current.avatar_color;
    const avatar_url = profileData.avatar_url !== undefined ? profileData.avatar_url : (current.avatar_url || null);

    const initials = name.split(' ')
      .filter(Boolean)
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || (email ? email.slice(0, 2).toUpperCase() : 'U');

    const updatedProfile = {
      ...current,
      ...profileData,
      name, email, bio, year_level, institution, program,
      avatar_color, avatar_url,
      avatar: initials,
      is_loaded: true
    };

    state.user = updatedProfile;
    saveLocalCachedUser(updatedProfile, context.currentUserId);
    events.emit('user:updated', updatedProfile);
    events.emit('store:changed', { type: 'user' });

    // Cloud sync: Auth metadata + profiles table
    getCurrentUser().then(async user => {
      if (!user) return;
      const userId = user.id;
      context.currentUserId = userId;
      saveLocalCachedUser(updatedProfile, userId);

      // 1. Auth user_metadata
      try {
        await supabase.auth.updateUser({
          data: {
            avatar_url: updatedProfile.avatar_url || null,
            avatar_color: updatedProfile.avatar_color,
            display_name: updatedProfile.name
          }
        });
      } catch (authMetaErr) {
        console.warn('Auth metadata update notice:', authMetaErr);
      }

      // 2. public.profiles table
      const basePayload = {
        user_id: userId,
        display_name: updatedProfile.name,
        email: updatedProfile.email || user.email,
        bio: updatedProfile.bio,
        year_level: updatedProfile.year_level,
        school: updatedProfile.institution,
        program: updatedProfile.program,
        avatar_color: updatedProfile.avatar_color,
        updated_at: new Date().toISOString()
      };

      const { error: fullErr } = await supabase
        .from('profiles')
        .upsert({ ...basePayload, avatar_url: updatedProfile.avatar_url || null }, { onConflict: 'user_id' });

      if (fullErr) {
        if (fullErr.code === '42703' || fullErr.message?.includes('avatar_url')) {
          // avatar_url column doesn't exist yet — upsert without it
          const { error: retryErr } = await supabase
            .from('profiles')
            .upsert(basePayload, { onConflict: 'user_id' });
          if (retryErr) console.warn('Profile sync error:', retryErr);
        } else {
          console.warn('Profile sync error:', fullErr);
        }
      }
    });

    return updatedProfile;
  }

  return {
    getDefaultUser,
    getLocalCachedUser,
    saveLocalCachedUser,
    getUserProfile,
    uploadAvatarImage,
    saveUserProfile
  };
}
