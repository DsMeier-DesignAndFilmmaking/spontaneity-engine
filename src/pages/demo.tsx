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
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(typeof window !== 'undefined' && window.innerWidth < 800);
    };
    
    checkMobile();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  // Always render the free demo widget (no authentication required)
  // Conditionally render advanced features based on auth status
  return (
    <div style={demoStyles.container}>
      {/* Top Navigation with Logo */}
      <DemoPageNav />

      {/* Developer Story Header */}
      <div style={demoStyles.header} data-header>
        <h1 style={demoStyles.headerTitle}>Experience the Spontaneity Engine in action.</h1>
        <p style={demoStyles.headerSubtext}>
          Generate instant micro-adventures or unlock the full developer sandbox with routing, constraints, and enterprise-ready workflows.
        </p>
      </div>

      {/* Mobile Tabs (only visible on mobile) */}
      {isMobile && (
        <div style={demoStyles.tabsContainer}>
          <DemoTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      )}

      {/* Grid layout: Free Demo and Advanced Features */}
      <div style={demoStyles.gridContainer} data-grid-container>
        {/* Left column: Free Demo */}
        <div
          style={demoStyles.gridColumn}
          data-grid-column
          data-mobile-tab-content="free"
          data-mobile-visible={isMobile ? (activeTab === 'free' ? 'true' : 'false') : 'true'}
        >
          <FreeDemoWidget />
        </div>

        {/* Mobile-only "OR" divider */}
        <div style={demoStyles.mobileDivider} data-mobile-divider>
          <span style={demoStyles.dividerText}>OR</span>
        </div>

        {/* Right column: Advanced Features (conditional based on auth status) */}
        <div
          style={demoStyles.gridColumn}
          data-grid-column
          data-mobile-tab-content="advanced"
          data-mobile-visible={isMobile ? (activeTab === 'advanced' ? 'true' : 'false') : 'true'}
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
    padding: '2.5rem 1rem',
  },
  header: {
    maxWidth: '1280px',
    margin: '0 auto 3rem auto',
    padding: '0 1rem',
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
    maxWidth: '1280px',
    margin: '0 auto 1.5rem auto',
    padding: '0 1rem',
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '1.5rem',
    maxWidth: '1280px', // max-w-7xl equivalent
    margin: '0 auto',
    width: '100%',
  },
  gridColumn: {
    width: '100%',
  },
  mobileDivider: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '1rem 0',
  },
  dividerText: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#9ca3af', // text-gray-400 equivalent
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
};

// Add responsive styles via CSS
if (typeof document !== 'undefined') {
  const styleId = 'demo-page-responsive';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Desktop: 2-column grid */
      @media (min-width: 768px) {
        [data-grid-container] {
          grid-template-columns: repeat(2, 1fr) !important;
        }
        [data-mobile-divider] {
          display: none !important;
        }
      }
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
      /* Mobile header alignment */
      @media (max-width: 640px) {
        [data-header] {
          text-align: left !important;
        }
      }
      /* Mobile tab visibility */
      @media (max-width: 799px) {
        [data-mobile-tab-content][data-mobile-visible="false"] {
          display: none !important;
        }
      }
      /* Desktop: always show both */
      @media (min-width: 800px) {
        [data-mobile-tab-content] {
          display: block !important;
        }
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

