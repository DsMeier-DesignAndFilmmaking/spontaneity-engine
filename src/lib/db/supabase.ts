/**
 * supabase.ts
 * Supabase client initialization and configuration.
 * Handles authentication and database connections via Supabase.
 */

import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient as SupabaseClientType } from '@supabase/supabase-js';

// Get environment variables (may be undefined during build)
const supabaseUrlEnv = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKeyEnv = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if we have real environment variables (not placeholders)
// Valid Supabase URLs follow the pattern: https://[project-ref].supabase.co
const hasValidConfig: boolean = !!(
  supabaseUrlEnv && 
  supabaseUrlEnv.trim() !== '' && 
  supabaseUrlEnv.startsWith('https://') &&
  supabaseUrlEnv.includes('.supabase.co') &&
  supabaseAnonKeyEnv && 
  supabaseAnonKeyEnv.trim() !== ''
);

// Use actual values if available, otherwise use valid placeholder format
const supabaseUrl = hasValidConfig 
  ? supabaseUrlEnv!.trim()
  : 'https://abcdefghijklmnop.supabase.co';
  
const supabaseAnonKey = hasValidConfig
  ? supabaseAnonKeyEnv!.trim()
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

/**
 * Initialized Supabase client instance.
 * 
 * This client is configured to work in both server-side and client-side contexts.
 * If environment variables are not set, a placeholder client is created that will
 * fail gracefully when used (operations will return errors rather than crashing).
 * 
 * @example
 * ```ts
 * import { supabase } from '@/lib/db/supabase';
 * const { data, error } = await supabase.from('users').select('*');
 * ```
 */
/**
 * IMPORTANT: Supabase Auth URL Configuration
 * 
 * In Supabase Dashboard → Authentication → URL Configuration, ensure:
 * - "Redirect after sign-out" is set to: https://yourdomain.com/demo
 * 
 * This ensures consistent redirect behavior server-side when users log out.
 * However, the frontend logout handler keeps users on /demo without redirecting.
 */
export const supabase: SupabaseClientType = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: hasValidConfig,
      autoRefreshToken: hasValidConfig,
      detectSessionInUrl: hasValidConfig,
    },
  }
);

/**
 * Validates that Supabase environment variables are configured.
 * Call this function before using the client in runtime code.
 * 
 * @throws Error if environment variables are missing or using placeholder values
 */
export function validateSupabaseConfig(): void {
  if (!hasValidConfig) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables');
  }
}

/**
 * Type helper for Supabase database types (can be extended when database schema is defined)
 */
export type { SupabaseClientType as SupabaseClient };
