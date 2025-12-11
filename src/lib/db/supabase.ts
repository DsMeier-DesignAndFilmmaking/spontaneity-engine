/**
 * supabase.ts
 * Supabase client initialization and configuration.
 * Handles authentication and database connections via Supabase.
 */

import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient as SupabaseClientType } from '@supabase/supabase-js';

// Get environment variables (may be undefined during build)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Initialized Supabase client instance.
 * 
 * This client is configured to work in both server-side and client-side contexts.
 * Use this client for all Supabase operations including authentication,
 * database queries, and real-time subscriptions.
 * 
 * Note: Environment variables are validated at runtime when the client is used,
 * not at module load time, to allow Next.js builds to complete successfully.
 * 
 * @example
 * ```ts
 * import { supabase } from '@/lib/db/supabase';
 * const { data, error } = await supabase.from('users').select('*');
 * ```
 */
export const supabase: SupabaseClientType = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

/**
 * Validates that Supabase environment variables are configured.
 * Call this function before using the client in runtime code.
 * 
 * @throws Error if environment variables are missing
 */
export function validateSupabaseConfig(): void {
  if (!supabaseUrl || supabaseUrl === '') {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }
  if (!supabaseAnonKey || supabaseAnonKey === '') {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
  }
}

/**
 * Type helper for Supabase database types (can be extended when database schema is defined)
 */
export type { SupabaseClientType as SupabaseClient };

