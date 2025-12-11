/**
 * demo.tsx
 * Demo page - Low-Friction Demo model with Two-Mode Display.
 * 
 * Publicly accessible demo page that renders unconditionally regardless of
 * authentication status. This eliminates the snap-back issue by removing
 * the login requirement for initial page load.
 * 
 * Two-Mode Display:
 * - Always Render: FreeDemoWidget (uses anonymous/generic API key)
 * - If Logged In: DeveloperSandbox (advanced features with Prompt Versioning, Raw JSON, Log Out)
 * - If Logged Out: AuthPromptCard (prominent "Sign In with Google" button)
 */

import React from 'react';
import { useAuth } from '@/stores/auth';
import { isFeatureEnabled, FEATURE_FLAGS } from '@/lib/utils/featureFlags';
import FreeDemoWidget from '@/components/demo/FreeDemoWidget';
import DeveloperSandbox from '@/components/demo/DeveloperSandbox';
import AuthPromptCard from '@/components/demo/AuthPromptCard';
import AdvancedTeaserCard from '@/components/demo/AdvancedTeaserCard';

/**
 * Demo page component - Low-Friction Demo model with Two-Mode Display.
 * 
 * This page renders its content unconditionally, without requiring authentication
 * for the initial load. It provides two distinct modes:
 * 
 * 1. Free Demo: Always visible, uses anonymous API key, no login required
 * 2. Advanced Features: Conditional based on authentication status
 *    - Logged In: Shows DeveloperSandbox with full features
 *    - Logged Out: Shows AuthPromptCard encouraging sign-in
 * 
 * All authentication gate logic and redirects have been removed to solve
 * the snap-back issue permanently.
 */
export default function DemoPage() {
  const { authStatus, session } = useAuth();
  const enhancementsEnabled = isFeatureEnabled(FEATURE_FLAGS.DEMO_ENHANCEMENTS);

  // Always render the free demo widget (no authentication required)
  // Conditionally render advanced features based on auth status
  return (
    <div style={demoStyles.container}>
      {/* Always visible: Free demo with anonymous API key */}
      <FreeDemoWidget />

      {/* Advanced Features Teaser Card (feature-flagged, only shown when logged out) */}
      {enhancementsEnabled && authStatus === 'LOGGED_OUT' && (
        <AdvancedTeaserCard />
      )}

      {/* Visual separator */}
      <div style={demoStyles.separator}>
        <div style={demoStyles.separatorLine}></div>
        <div style={demoStyles.separatorText}>
          {authStatus === 'LOGGED_IN' && session ? '🔓 Advanced Features Unlocked' : '🔒 Unlock Advanced Features'}
        </div>
        <div style={demoStyles.separatorLine}></div>
      </div>

      {/* Conditional: Advanced features based on auth status */}
      {authStatus === 'LOADING' ? (
        // Show nothing while loading (FreeDemoWidget is always visible)
        null
      ) : authStatus === 'LOGGED_IN' && session ? (
        // Logged in: Show advanced DeveloperSandbox
        <div style={demoStyles.advancedSection}>
          <DeveloperSandbox />
        </div>
      ) : (
        // Logged out: Show sign-in prompt to unlock advanced features
        <div style={demoStyles.advancedSection}>
          <AuthPromptCard />
        </div>
      )}
    </div>
  );
}

const demoStyles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '2rem',
  },
  separator: {
    display: 'flex',
    alignItems: 'center',
    margin: '3rem 0',
    gap: '1.5rem',
  },
  separatorLine: {
    flex: 1,
    height: '1px',
    backgroundColor: '#e0e0e0',
  },
  separatorText: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#666',
    whiteSpace: 'nowrap',
  },
  advancedSection: {
    marginTop: '1rem',
  },
};

