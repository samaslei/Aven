/**
 * Supabase Client Configuration & Authentication Utilities
 */

import { createClient } from '@supabase/supabase-js';

// 1. Resolve Environment Credentials
function getSupabaseConfig() {
  const envObj = (typeof window !== 'undefined' && window.__ENV__) || {};
  const metaEnv = (typeof import.meta !== 'undefined' && import.meta.env) || {};
  const localStore = typeof localStorage !== 'undefined' ? localStorage : (typeof window !== 'undefined' && window.localStorage ? window.localStorage : null);

  const url = (
    envObj.VITE_SUPABASE_URL ||
    envObj.NEXT_PUBLIC_SUPABASE_URL ||
    envObj.SUPABASE_URL ||
    metaEnv.VITE_SUPABASE_URL ||
    metaEnv.NEXT_PUBLIC_SUPABASE_URL ||
    metaEnv.SUPABASE_URL ||
    (localStore ? localStore.getItem('aven_supabase_url') : '') ||
    ''
  ).trim();

  const anonKey = (
    envObj.VITE_SUPABASE_ANON_KEY ||
    envObj.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    envObj.SUPABASE_ANON_KEY ||
    metaEnv.VITE_SUPABASE_ANON_KEY ||
    metaEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    metaEnv.SUPABASE_ANON_KEY ||
    (localStore ? localStore.getItem('aven_supabase_anon_key') : '') ||
    ''
  ).trim();

  return { url, anonKey };
}

const config = getSupabaseConfig();
export const SUPABASE_URL = config.url;
export const SUPABASE_ANON_KEY = config.anonKey;
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL.startsWith('http'));

// Fallback dummy client if credentials aren't provided yet
export const supabase = createClient(
  isSupabaseConfigured ? SUPABASE_URL : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? SUPABASE_ANON_KEY : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined
    }
  }
);

/**
 * Authentication Helpers
 */
export async function getCurrentSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.warn('Supabase getSession error:', error);
      return null;
    }
    return session;
  } catch (err) {
    console.error('Error fetching session:', err);
    return null;
  }
}

export async function getCurrentUser() {
  const session = await getCurrentSession();
  return session?.user || null;
}

export async function signIn(email, password) {
  return await supabase.auth.signInWithPassword({
    email,
    password
  });
}

export async function signUp(email, password, displayName = '', options = {}) {
  // Explicitly configure email confirmation redirect destination.
  // Resolves to current window origin /#subjects (or production URL) so Supabase routes confirmed users directly to the in-app Subjects view.
  let origin = 'https://aven-livid.vercel.app';
  if (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null') {
    origin = window.location.origin;
  }
  const defaultRedirectTo = `${origin}/#subjects`;
  const emailRedirectTo = options.emailRedirectTo || defaultRedirectTo;

  return await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
      data: {
        display_name: displayName || email.split('@')[0],
        ...(options.data || {})
      },
      ...options
    }
  });
}

export async function signOut() {
  return await supabase.auth.signOut();
}

export async function deleteAccount() {
  const session = await getCurrentSession();
  const user = session?.user || await getCurrentUser();
  if (!user) throw new Error('No active user session to delete.');

  let deleted = false;
  let lastError = null;

  // 1. Try serverless backend endpoint (/api/delete-user) if available
  if (session && session.access_token) {
    try {
      const res = await fetch('/api/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.success) {
          deleted = true;
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        if (res.status !== 404 && res.status !== 405) {
          lastError = errData.error || `API returned status ${res.status}`;
        }
      }
    } catch (apiErr) {
      console.warn('Backend API /api/delete-user not reachable, trying direct RPC:', apiErr);
    }
  }

  // 2. Try direct PostgreSQL RPC function delete_user_account()
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

  // 3. Fallback: Clean up all user data tables in public schema
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

  // 4. If Supabase auth user deletion failed on both backend API and RPC, report the clear error
  if (!deleted) {
    throw new Error(
      `Could not delete Supabase auth account: ${lastError || 'Function not found'}. Please copy and run the SQL migration in supabase_migration_delete_user.sql in your Supabase SQL Editor.`
    );
  }

  // 5. Terminate session and sign out locally
  await signOut();
  return { success: true };
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}

