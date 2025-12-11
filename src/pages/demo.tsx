/**
 * demo.tsx
 * Demo page with authentication gate.
 * 
 * Protected route that requires user authentication. Implements client-side
 * authentication checking and redirects unauthenticated users to the homepage.
 */

import React, { useEffect, useState } from 'react';
import { getAuthStatus, redirectToLogin } from '@/lib/auth/authHelpers';
import { Session } from '@supabase/supabase-js';
import DemoWidget from '@/components/demo/DemoWidget';

/**
 * Demo page component with authentication gate.
 * 
 * Authentication Flow:
 * 1. On mount, checks user's session status
 * 2. If not logged in: immediately redirects to homepage (/)
 * 3. If logged in: renders the DemoWidget component
 * 4. While loading: displays a loading screen
 */
export default function DemoPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /**
     * Check authentication status on component mount.
     * Uses client-side check since we're in a Next.js page component.
     */
    async function checkAuth() {
      try {
        const currentSession = await getAuthStatus();

        if (!currentSession) {
          // User is not authenticated - redirect to homepage
          redirectToLogin();
          return;
        }

        // User is authenticated - set session and render demo
        setSession(currentSession);
        setLoading(false);
      } catch (error) {
        console.error('Error checking authentication:', error);
        // On error, redirect to homepage for security
        redirectToLogin();
      }
    }

    checkAuth();
  }, []);

  // Loading state - show loading screen while checking auth
  if (loading) {
    return (
      <div style={loadingStyles.container}>
        <div style={loadingStyles.content}>
          <div style={loadingStyles.spinner}></div>
          <p style={loadingStyles.text}>Loading...</p>
        </div>
      </div>
    );
  }

  // Authenticated state - render demo widget
  if (session) {
    return (
      <div style={demoStyles.container}>
        <DemoWidget />
      </div>
    );
  }

  // Fallback (should not reach here due to redirect, but included for safety)
  return null;
}

const loadingStyles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  content: {
    textAlign: 'center',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '5px solid #e0e0e0',
    borderTop: '5px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 1rem',
  },
  text: {
    fontSize: '1.125rem',
    color: '#666',
    margin: 0,
  },
};

const demoStyles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '2rem',
  },
};

// Add spinner animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  if (document.head) {
    document.head.appendChild(style);
  }
}

