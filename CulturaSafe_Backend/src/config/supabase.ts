import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ENV } from './env.js';

// Base Anon Client
export const supabasePublic: SupabaseClient = createClient(
  ENV.SUPABASE_URL || 'https://placeholder.supabase.co',
  ENV.SUPABASE_ANON_KEY || 'placeholder-anon-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

// Admin / Service Role Client (Optional for server-side management)
export const supabaseAdmin: SupabaseClient = createClient(
  ENV.SUPABASE_URL || 'https://placeholder.supabase.co',
  ENV.SUPABASE_SERVICE_ROLE_KEY || ENV.SUPABASE_ANON_KEY || 'placeholder-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

/**
 * Creates a scoped Supabase client with the caller's JWT token
 * This ensures that PostgreSQL Row Level Security (RLS) policies are strictly evaluated
 * based on the caller's user_id (`auth.uid()`).
 */
export function createUserClient(token: string): SupabaseClient {
  return createClient(
    ENV.SUPABASE_URL || 'https://placeholder.supabase.co',
    ENV.SUPABASE_ANON_KEY || 'placeholder-anon-key',
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      },
      auth: {
        persistSession: false
      }
    }
  );
}
