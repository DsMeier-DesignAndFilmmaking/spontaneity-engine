/**
 * featureFlags.ts
 * Feature flag utility for toggling features on/off.
 * 
 * Allows features to be enabled/disabled via environment variables
 * or runtime configuration without code changes.
 */

/**
 * Check if a feature flag is enabled
 * 
 * @param flagName Feature flag name (e.g., 'FEATURE_DEMO_ENHANCEMENTS')
 * @returns true if the feature is enabled, false otherwise
 */
export function isFeatureEnabled(flagName: string): boolean {
  // Check environment variable (server-side and client-side)
  const envValue = process.env[flagName];
  if (envValue !== undefined) {
    return envValue === 'true' || envValue === '1';
  }
  
  // Check Next.js public env (client-side accessible)
  const publicEnvKey = `NEXT_PUBLIC_${flagName}`;
  const publicEnvValue = process.env[publicEnvKey];
  if (publicEnvValue !== undefined) {
    return publicEnvValue === 'true' || publicEnvValue === '1';
  }
  
  // Default: enabled in development, disabled in production
  // Override by setting the env variable
  return process.env.NODE_ENV === 'development';
}

/**
 * Feature flag names
 */
export const FEATURE_FLAGS = {
  DEMO_ENHANCEMENTS: 'FEATURE_DEMO_ENHANCEMENTS',
} as const;

