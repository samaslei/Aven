/**
 * Aven — Supabase Client Configuration & Authentication Utilities
 * Provides the singleton Supabase client and core auth helpers.
 * Account deletion logic lives in services/account-service.js.
 */

import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// 1. Resolve Environment Credentials
// ---------------------------------------------------------------------------

function getSupabaseConfig() {
  const envObj = (typeof window !== 'undefined' && window.__ENV__) || {};
  const metaEnv = (typeof import.meta !== 'undefined' && import.meta.env) || {};

  const url = (
    envObj.VITE_SUPABASE_URL ||
    envObj.NEXT_PUBLIC_SUPABASE_URL ||
    envObj.SUPABASE_URL ||
    metaEnv.VITE_SUPABASE_URL ||
    metaEnv.NEXT_PUBLIC_SUPABASE_URL ||
    metaEnv.SUPABASE_URL ||
    ''
  ).trim();

  const anonKey = (
    envObj.VITE_SUPABASE_ANON_KEY ||
    envObj.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    envObj.SUPABASE_ANON_KEY ||
    metaEnv.VITE_SUPABASE_ANON_KEY ||
    metaEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    metaEnv.SUPABASE_ANON_KEY ||
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

// ---------------------------------------------------------------------------
// 2. Authentication Helpers
// ---------------------------------------------------------------------------

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
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(email, password, displayName = '', options = {}) {
  // Resolve redirect destination for email confirmation
  let origin = 'https://aven-livid.vercel.app';
  if (typeof window !== 'undefined' && window.location?.origin && window.location.origin !== 'null') {
    origin = window.location.origin;
  }
  const emailRedirectTo = options.emailRedirectTo || `${origin}/#subjects`;

  return supabase.auth.signUp({
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
  return supabase.auth.signOut();
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}
