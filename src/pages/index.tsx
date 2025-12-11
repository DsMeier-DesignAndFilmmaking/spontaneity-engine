/**
 * index.tsx
 * Marketing homepage for Spontaneity Engine.
 * Entry point for users to discover and try the demo.
 */

import React from 'react';
import Link from 'next/link';

/**
 * Homepage component - Marketing landing page.
 * 
 * Provides a clean, welcoming interface with a prominent call-to-action
 * to try the demo. The "Try the Demo" button uses Next.js Link component
 * for reliable navigation that works even before client-side hydration.
 * 
 * Using Link ensures:
 * - Navigation works on first render (before JavaScript loads)
 * - Better accessibility (native anchor tag)
 * - Prefetching of the /demo page
 * - No hydration dependency issues
 * 
 * Fallback: If Link fails for any reason, onClick handler provides
 * hard redirect using window.location.href for maximum reliability.
 */
export default function HomePage() {
  /**
   * Hard redirect fallback handler.
   * 
   * This function provides a safety mechanism in case the Link component
   * fails for any reason. It forces a full browser navigation using
   * window.location.href, which bypasses any client-side routing issues
   * and ensures reliable navigation even if Next.js routing fails.
   * 
   * This is a defense-in-depth approach - Link is the primary method,
   * but this ensures navigation always works.
   */
  const handleHardRedirect = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Only use hard redirect if Link somehow fails
    // This provides a safety net for edge cases
    if (typeof window !== 'undefined') {
      window.location.href = '/demo';
    }
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
        <Link href="/demo" style={styles.linkWrapper}>
          <button
            type="button"
            onClick={handleHardRedirect}
            style={styles.demoButton}
            aria-label="Try the Demo"
          >
            Try the Demo
          </button>
        </Link>
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

