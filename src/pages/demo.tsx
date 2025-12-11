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
import FreeDemoWidget from '@/components/demo/FreeDemoWidget';
import DeveloperSandbox from '@/components/demo/DeveloperSandbox';
import AuthPromptCard from '@/components/demo/AuthPromptCard';

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

  // Always render the free demo widget (no authentication required)
  // Conditionally render advanced features based on auth status
  return (
    <div style={demoStyles.container}>
      {/* Side-by-side layout: Free Demo and Advanced Features */}
      <div style={demoStyles.twoColumnLayout} data-two-column-layout>
        {/* Left column: Free Demo (always visible) */}
        <div style={demoStyles.column} data-column>
          <FreeDemoWidget />
        </div>

        {/* Right column: Advanced Features (conditional based on auth status) */}
        <div style={demoStyles.column} data-column>
          {authStatus === 'LOADING' ? (
            // Show nothing while loading
            null
          ) : authStatus === 'LOGGED_IN' && session ? (
            // Logged in: Show advanced DeveloperSandbox
            <DeveloperSandbox />
          ) : (
            // Logged out: Show sign-in prompt to unlock advanced features
            <AuthPromptCard />
          )}
        </div>
      </div>
    </div>
  );
}

const demoStyles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '2rem',
  },
  twoColumnLayout: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  column: {
    width: '100%',
  },
};

// Add responsive styles via CSS
if (typeof document !== 'undefined') {
  const styleId = 'demo-page-responsive';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @media (min-width: 800px) {
        [data-two-column-layout] {
          flex-direction: row !important;
          align-items: flex-start !important;
        }
        [data-column] {
          width: 48% !important;
          flex: 1 1 48% !important;
        }
      }
    `;
    if (document.head) {
      document.head.appendChild(style);
    }
  }
}

