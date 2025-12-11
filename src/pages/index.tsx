/**
 * index.tsx
 * Marketing homepage for Spontaneity Engine.
 * Entry point for users to discover and try the demo.
 */

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/stores/auth';

/**
 * Homepage component - Marketing landing page.
 * 
 * Provides a clean, welcoming interface with a prominent call-to-action
 * to try the demo. The "Try the Demo" button uses smart navigation based on
 * authentication status to optimize user experience.
 */
export default function HomePage() {
  const { authStatus } = useAuth();

  /**
   * Hard navigation handler for logged-in users.
   * 
   * If the user is already logged in, use hard navigation (window.location.href)
   * to bypass the auth check on the demo page. This provides a faster, more
   * direct navigation since we already know the user is authenticated.
   * 
   * Hard navigation bypasses client-side routing and ensures the demo page
   * receives a fresh request with the session cookie already set.
   */
  const handleLoggedInNavigation = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/demo';
    }
  };

  /**
   * Render button based on authentication status.
   * 
   * Conditional Navigation Logic:
   * - LOGGED_IN: Use hard navigation (window.location.href) to bypass auth check
   * - LOGGED_OUT or LOADING: Use Next.js Link component for standard navigation
   */
  const renderDemoButton = () => {
    // If user is logged in, use hard navigation to bypass auth check
    if (authStatus === 'LOGGED_IN') {
      return (
        <button
          type="button"
          onClick={handleLoggedInNavigation}
          style={styles.demoButton}
          aria-label="Try the Demo"
        >
          Try the Demo
        </button>
      );
    }

    // For logged out or loading users, use Next.js Link component
    // This ensures reliable navigation even before JavaScript loads
    return (
      <Link href="/demo" style={styles.linkWrapper}>
        <button
          type="button"
          style={styles.demoButton}
          aria-label="Try the Demo"
        >
          Try the Demo
        </button>
      </Link>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>Spontaneity Engine</h1>
        <p style={styles.subtitle}>
          Discover spontaneous activities powered by AI
        </p>
        <p style={styles.description}>
          Experience the future of personalized recommendations. Get instant,
          creative suggestions for activities tailored to your vibe, time, and location.
        </p>
        {renderDemoButton()}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '2rem',
  },
  content: {
    textAlign: 'center',
    maxWidth: '600px',
    color: '#ffffff',
  },
  title: {
    fontSize: '3.5rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
    lineHeight: '1.2',
  },
  subtitle: {
    fontSize: '1.5rem',
    marginBottom: '1.5rem',
    opacity: 0.95,
    fontWeight: '300',
  },
  description: {
    fontSize: '1.125rem',
    marginBottom: '2.5rem',
    opacity: 0.9,
    lineHeight: '1.6',
  },
  linkWrapper: {
    textDecoration: 'none',
    display: 'inline-block',
  },
  demoButton: {
    fontSize: '1.25rem',
    fontWeight: '600',
    padding: '1rem 3rem',
    backgroundColor: '#ffffff',
    color: '#667eea',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
    transition: 'all 0.3s ease',
    outline: 'none',
    display: 'block',
    width: '100%',
  },
};

// Add hover effect via inline style and onMouseEnter/onMouseLeave
// For a production app, consider using CSS modules or styled-components
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4) !important;
    }
    button:active {
      transform: translateY(0);
    }
  `;
  if (typeof document !== 'undefined' && document.head) {
    document.head.appendChild(style);
  }
}

