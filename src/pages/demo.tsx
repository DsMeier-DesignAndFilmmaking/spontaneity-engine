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

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/stores/auth';
import FreeDemoWidget from '@/components/demo/FreeDemoWidget';
import DeveloperSandbox from '@/components/demo/DeveloperSandbox';
import AuthPromptCard from '@/components/demo/AuthPromptCard';
import LeadGenCTA from '@/components/demo/LeadGenCTA';
import ToastContainer from '@/components/demo/ToastContainer';
import DemoPageNav from '@/components/demo/DemoPageNav';
import DemoTabs from '@/components/demo/DemoTabs';

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
  const [activeTab, setActiveTab] = useState<'free' | 'advanced'>('free');

  // Always render the free demo widget (no authentication required)
  // Conditionally render advanced features based on auth status
  return (
    <div style={demoStyles.container}>
      {/* Top Navigation with Logo and Tabs */}
      <div style={demoStyles.topSection}>
        <DemoPageNav />
        <div style={demoStyles.headerTabsContainer}>
          <div style={demoStyles.header} data-header>
            <h1 style={demoStyles.headerTitle}>Experience the Spontaneity Engine in action.</h1>
            <p style={demoStyles.headerSubtext}>
              Generate instant micro-adventures or unlock the full developer sandbox with routing, constraints, and enterprise-ready workflows.
            </p>
          </div>
          {/* Tabs - visible on both mobile and desktop */}
          <div style={demoStyles.tabsContainer}>
            <DemoTabs activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
        </div>
      </div>

      {/* Tab Content Container - only active tab is visible, max-width constrained */}
      <div style={demoStyles.contentContainer} data-content-container>
        {/* Free Demo Tab Content */}
        <div
          style={{
            ...demoStyles.tabContent,
            ...demoStyles.moduleWrapper,
            ...(activeTab === 'free' ? demoStyles.tabContentActive : demoStyles.tabContentHidden),
          }}
          role="tabpanel"
          id="free-demo-panel"
          aria-labelledby="tab-free-demo"
          data-tab-content="free"
          data-module-wrapper
        >
          <FreeDemoWidget />
        </div>

        {/* Advanced Features Tab Content (conditional based on auth status) */}
        <div
          style={{
            ...demoStyles.tabContent,
            ...demoStyles.moduleWrapper,
            ...(activeTab === 'advanced' ? demoStyles.tabContentActive : demoStyles.tabContentHidden),
          }}
          role="tabpanel"
          id="advanced-demo-panel"
          aria-labelledby="tab-advanced-demo"
          data-tab-content="advanced"
          data-module-wrapper
        >
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

      {/* Lead Generation CTA */}
      <LeadGenCTA />

      {/* Toast Container (visual only framework) */}
      <ToastContainer />
    </div>
  );
}

const demoStyles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '1rem 1rem 2.5rem 1rem',
  },
  topSection: {
    maxWidth: '1280px',
    margin: '0 auto',
    width: '100%',
  },
  headerTabsContainer: {
    width: '100%',
    padding: '0',
  },
  header: {
    margin: '0 0 2rem 0',
    padding: '0',
    textAlign: 'center',
  },
  headerTitle: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '1rem',
    lineHeight: '1.2',
  },
  headerSubtext: {
    fontSize: '1.125rem',
    color: '#6b7280',
    lineHeight: '1.6',
    margin: 0,
    maxWidth: '700px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  tabsContainer: {
    margin: '0 0 1.5rem 0',
    padding: '0',
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
  },
  contentContainer: {
    maxWidth: '1280px',
    margin: '0 auto',
    width: '100%',
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
  },
  moduleWrapper: {
    maxWidth: '600px',
    width: '100%',
    margin: '0 auto',
  },
  tabContent: {
    width: '100%',
    animation: 'fadeIn 0.3s ease-in',
  },
  tabContentActive: {
    display: 'block',
  },
  tabContentHidden: {
    display: 'none',
  },
};

// Add responsive styles via CSS
if (typeof document !== 'undefined') {
  const styleId = 'demo-page-responsive';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Card hover elevation */
      [data-demo-card] {
        transition: all 0.2s ease-in-out !important;
      }
      [data-demo-card]:hover {
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
      }
      /* Result panel animation */
      [data-result-panel] {
        animation: fadeIn 0.3s ease-in;
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      /* Developer drawer animation */
      [data-developer-drawer] {
        animation: slideDown 0.2s ease-out;
      }
      @keyframes slideDown {
        from {
          opacity: 0;
          max-height: 0;
        }
        to {
          opacity: 1;
          max-height: 200px;
        }
      }
      /* Mobile header alignment and padding */
      @media (max-width: 799px) {
        [data-header] {
          text-align: left !important;
        }
        /* Mobile: modules full-width with padding */
        [data-content-container] {
          padding: 0 1rem !important;
        }
        [data-module-wrapper] {
          max-width: 100% !important;
        }
      }
      /* Desktop: center modules with max-width 600px */
      @media (min-width: 800px) {
        [data-content-container] {
          padding: 0 !important;
        }
        [data-module-wrapper] {
          max-width: 600px !important;
        }
      }
      /* Tab content visibility - only active tab is shown */
      [data-tab-content] {
        display: none;
      }
      [data-tab-content][style*="tabContentActive"] {
        display: block !important;
      }
      /* Select focus styles */
      select:focus {
        border-color: #667eea !important;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
      }
      select:hover:not(:disabled) {
        border-color: #d1d5db !important;
      }
    `;
    if (document.head) {
      document.head.appendChild(style);
    }
  }
}

