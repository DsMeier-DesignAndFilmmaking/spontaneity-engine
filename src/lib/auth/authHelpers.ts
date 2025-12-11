/**
 * authHelpers.ts
 * Client-side authentication helper functions.
 * Provides utilities for checking auth status and handling redirects.
 */

import { supabase, validateSupabaseConfig } from '@/lib/db/supabase';
import { Session } from '@supabase/supabase-js';

/**
 * Fixed redirect path for authenticated users.
 * 
 * This path is constructed from the NEXT_PUBLIC_BASE_URL environment variable
 * to ensure consistent redirect behavior across different deployment environments.
 * 
 * Example: If NEXT_PUBLIC_BASE_URL is 'http://localhost:3000',
 * FIXED_REDIRECT_PATH will be 'http://localhost:3000/demo'
 */
export const FIXED_REDIRECT_PATH = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/demo`;

/**
 * Gets the current authentication status and session data.
 * 
 * This function checks if the user is currently authenticated by
 * retrieving the active session from Supabase. It can be used both
 * on the client and server side (with proper context).
 * 
 * @returns Promise resolving to Session object if authenticated, null otherwise
 * 
 * @example
 * ```ts
 * const session = await getAuthStatus();
 * if (!session) {
 *   redirectToLogin();
 * }
 * ```
 */
export async function getAuthStatus(): Promise<Session | null> {
  try {
    // Validate Supabase configuration at runtime
    validateSupabaseConfig();
    
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Error getting auth status:', error);
      return null;
    }

    return session;
  } catch (error) {
    console.error('Unexpected error in getAuthStatus:', error);
    return null;
  }
}

/**
 * Redirects the user to the login/main page.
 * 
 * Uses window.location.replace() to navigate to the root/main page
 * without adding to the browser history. This is the preferred method
 * for authentication redirects as it prevents users from navigating
 * back to protected pages after logout.
 * 
 * Note: This function only works in the browser (client-side).
 * For server-side redirects, use Next.js redirect() or useRouter().
 * 
 * @example
 * ```ts
 * const session = await getAuthStatus();
 * if (!session) {
 *   redirectToLogin();
 *   return;
 * }
 * ```
 */
export function redirectToLogin(): void {
  // Check if we're in the browser environment
  if (typeof window === 'undefined') {
    console.warn('redirectToLogin() called on server side. Use Next.js redirect() instead.');
    return;
  }

  // Use the base URL from environment variable, defaulting to root
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const loginPath = `${baseUrl}/`;

  // Use replace() instead of assign() to prevent back button navigation
  window.location.replace(loginPath);
}

/**
 * Gets the current user if authenticated.
 * 
 * Convenience function that returns the user object from the session.
 * 
 * @returns Promise resolving to User object if authenticated, null otherwise
 * 
 * @example
 * ```ts
 * const user = await getCurrentUser();
 * if (user) {
 *   console.log('Logged in as:', user.email);
 * }
 * ```
 */
export async function getCurrentUser() {
  const session = await getAuthStatus();
  return session?.user ?? null;
}

