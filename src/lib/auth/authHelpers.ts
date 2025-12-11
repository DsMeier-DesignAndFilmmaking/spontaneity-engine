/**
 * authHelpers.ts
 * Client-side authentication helper functions.
 * Provides utilities for checking auth status and handling redirects.
 */

import { supabase, validateSupabaseConfig } from '@/lib/db/supabase';
import { Session } from '@supabase/supabase-js';
import { getBaseUrl, getFullUrl } from '@/lib/config/constants';

/**
 * Fixed redirect path for authenticated users (relative path).
 * 
 * For relative navigation, use this path directly.
 * For absolute URLs (e.g., Supabase redirect URLs), use getFullUrl(FIXED_REDIRECT_PATH).
 * 
 * Note: Relative paths work in all environments, but absolute URLs with the clean domain
 * are required for external redirects (e.g., Supabase auth callbacks).
 */
export const FIXED_REDIRECT_PATH = '/demo';

/**
 * Gets the absolute redirect URL for authenticated users.
 * 
 * Returns the full URL using the clean production domain:
 * https://spontaneity-engine.vercel.app/demo
 * 
 * Use this for Supabase redirectTo URLs and other external redirects.
 * 
 * @returns Full URL with clean domain (no trailing slash)
 */
export function getFixedRedirectUrl(): string {
  return getFullUrl(FIXED_REDIRECT_PATH);
}

/**
 * Gets the base URL for the application.
 * 
 * Returns the clean production domain or the value from NEXT_PUBLIC_BASE_URL.
 * 
 * @returns Base URL (no trailing slash)
 */
export function getAppBaseUrl(): string {
  return getBaseUrl();
}

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

  // Use relative path to work in all environments (localhost, Vercel, etc.)
  // This ensures the redirect works regardless of the deployment URL
  window.location.replace('/');
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

