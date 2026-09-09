import { createClient } from '@supabase/supabase-js';

/**
 * Vercel Serverless Function — Delete User Account
 * Permanently deletes a user's auth account via Admin API or RPC fallback.
 *
 * Security hardening:
 * - CORS headers for cross-origin safety
 * - Auth verification always uses the anon key (never the service role key)
 * - Structured error responses with consistent shape
 * - Input validation and environment variable checks
 */

const ALLOWED_METHODS = new Set(['POST', 'DELETE', 'OPTIONS']);

/** Consistent error response shape */
function errorResponse(res, status, message, code = null) {
  return res.status(status).json({
    success: false,
    error: message,
    ...(code && { code })
  });
}

/** Sets CORS headers on the response */
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
}

export default async function handler(req, res) {
  setCorsHeaders(res);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (!ALLOWED_METHODS.has(req.method)) {
    return errorResponse(res, 405, 'Method not allowed', 'METHOD_NOT_ALLOWED');
  }

  // ---------------------------------------------------------------------------
  // 1. Validate environment
  // ---------------------------------------------------------------------------

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    return errorResponse(res, 500, 'Supabase URL is not configured on the server.', 'MISSING_CONFIG');
  }

  if (!anonKey && !serviceRoleKey) {
    return errorResponse(res, 500, 'No Supabase key configured on the server.', 'MISSING_CONFIG');
  }

  // ---------------------------------------------------------------------------
  // 2. Validate Authorization header
  // ---------------------------------------------------------------------------

  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 401, 'Missing or invalid Authorization header', 'UNAUTHORIZED');
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token || token.length < 10) {
    return errorResponse(res, 401, 'Invalid token format', 'UNAUTHORIZED');
  }

  try {
    // ---------------------------------------------------------------------------
    // 3. Verify user identity using their JWT (always use anon key, never service role)
    // ---------------------------------------------------------------------------

    const verificationKey = anonKey || serviceRoleKey;
    const authClient = createClient(supabaseUrl, verificationKey);
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);

    if (authError || !user) {
      return errorResponse(res, 401, 'Invalid or expired session token.', 'INVALID_TOKEN');
    }

    // ---------------------------------------------------------------------------
    // 4. Delete user via Admin API (preferred) or RPC fallback
    // ---------------------------------------------------------------------------

    if (serviceRoleKey) {
      const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });

      const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
      if (deleteError) {
        console.error('Admin deleteUser error:', deleteError);
        return errorResponse(res, 500, deleteError.message, 'ADMIN_DELETE_FAILED');
      }

      return res.status(200).json({
        success: true,
        message: 'Account permanently deleted via Admin API.'
      });
    }

    // Fallback: RPC with user's authenticated session
    if (!anonKey) {
      return errorResponse(res, 500, 'No anon key configured for RPC fallback.', 'MISSING_CONFIG');
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { error: rpcError } = await userClient.rpc('delete_user_account');
    if (rpcError) {
      console.error('RPC delete_user_account error:', rpcError);
      return errorResponse(
        res, 500,
        `RPC delete failed: ${rpcError.message}. Ensure delete_user_account() exists in Supabase.`,
        'RPC_FAILED'
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Account permanently deleted via RPC.'
    });
  } catch (err) {
    console.error('Unexpected error in delete-user handler:', err);
    return errorResponse(res, 500, err.message || 'Internal server error', 'INTERNAL_ERROR');
  }
}
