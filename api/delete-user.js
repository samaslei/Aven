import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Allow POST or DELETE methods
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    return res.status(500).json({ error: 'Supabase URL is not configured on the server.' });
  }

  try {
    // 1. Verify user identity using their session JWT token
    const authClient = createClient(supabaseUrl, anonKey || serviceRoleKey || 'placeholder');
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired session token.' });
    }

    // 2. If Service Role Key is configured on the backend, use Admin API to delete user from auth.users
    if (serviceRoleKey) {
      const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
      if (deleteError) {
        console.error('Admin deleteUser error:', deleteError);
        return res.status(500).json({ error: deleteError.message });
      }

      return res.status(200).json({ success: true, message: 'Account permanently deleted via Admin API.' });
    }

    // 3. If no Service Role Key on server, execute the RPC function with the user's authenticated client
    const userClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    const { error: rpcError } = await userClient.rpc('delete_user_account');
    if (rpcError) {
      console.error('RPC delete_user_account error in API handler:', rpcError);
      return res.status(500).json({
        error: `RPC delete failed: ${rpcError.message}. Ensure delete_user_account() is created in Supabase SQL editor.`
      });
    }

    return res.status(200).json({ success: true, message: 'Account permanently deleted via RPC.' });
  } catch (err) {
    console.error('Unexpected error in delete-user handler:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
