/**
 * supabase.ts
 * Supabase client initialization and configuration.
 * Handles authentication and database connections via Supabase.
 */

import { createClient } from '@supabase/supabase-js';

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

/**
 * Initialized Supabase client instance.
 * 
 * This client is configured to work in both server-side and client-side contexts.
 * Use this client for all Supabase operations including authentication,
 * database queries, and real-time subscriptions.
 * 
 * @example
 * ```ts
 * import { supabase } from '@/lib/db/supabase';
 * const { data, error } = await supabase.from('users').select('*');
 * ```
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Type helper for Supabase database types (can be extended when database schema is defined)
 */
export type SupabaseClient = typeof supabase;

