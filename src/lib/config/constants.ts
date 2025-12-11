/**
 * constants.ts
 * Application-wide constants and configuration values.
 * 
 * Central source of truth for domain and base URL configuration.
 */

/**
 * Production base URL - Clean custom domain.
 * 
 * This is the final, clean, fixed domain for the production application.
 * All absolute URLs should use this as the base.
 * 
 * IMPORTANT: This should match the value in NEXT_PUBLIC_BASE_URL environment variable
 * in production. Update this constant if the domain changes.
 */
export const PRODUCTION_BASE_URL = 'https://spontaneity-engine.vercel.app';

/**
 * Gets the base URL for the application.
 * 
 * Priority:
 * 1. NEXT_PUBLIC_BASE_URL environment variable (if set)
 * 2. PRODUCTION_BASE_URL constant (fallback)
 * 
 * This ensures the clean custom domain is always used unless explicitly overridden.
 * 
 * @returns The base URL for the application (no trailing slash)
 */
export function getBaseUrl(): string {
  // Use environment variable if available, otherwise use production URL
  const envUrl = process.env.NEXT_PUBLIC_BASE_URL;
  
  if (envUrl && envUrl.trim() !== '') {
    // Remove trailing slash if present
    return envUrl.trim().replace(/\/+$/, '');
  }
  
  // Fallback to production URL
  return PRODUCTION_BASE_URL;
}

/**
 * Gets the full URL for a path.
 * 
 * @param path - The path to append (should start with '/')
 * @returns The full URL
 * 
 * @example
 * getFullUrl('/demo') // Returns 'https://spontaneity-engine.vercel.app/demo'
 */
export function getFullUrl(path: string): string {
  const baseUrl = getBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

