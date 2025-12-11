/**
 * AdvancedTeaserCard.tsx
 * Advanced features teaser card component.
 * 
 * Displays a small card between the demo area and the Advanced Features
 * Google-auth block, highlighting the benefits of signing in.
 */

import React from 'react';
import { useAuth } from '@/stores/auth';
import { trackEvent } from '@/lib/analytics/trackEvent';

/**
 * AdvancedTeaserCard component - Teaser for advanced features.
 * 
 * Features:
 * - Highlights advanced features benefits
 * - "Try Advanced Features" CTA button
 * - Triggers existing Google auth flow
 * - Analytics tracking on CTA click
 */
export default function AdvancedTeaserCard() {
  const { signInWithGoogle, authStatus } = useAuth();

  const handleCTAClick = async () => {
    // Track analytics
    trackEvent('cta_click', {
      cta_name: 'advanced_teaser',
      timestamp: Date.now(),
    });

    // Trigger existing Google auth flow
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  // Don't show if already logged in
  if (authStatus === 'LOGGED_IN') {
    return null;
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h3 style={styles.title}>Unlock advanced features</h3>
        <ul style={styles.featureList}>
          <li style={styles.featureItem}>Calendar sync + live routing</li>
          <li style={styles.featureItem}>Multi-day constraints + packing lists</li>
          <li style={styles.featureItem}>Brandable API & enterprise controls</li>
        </ul>
        <button
          type="button"
          onClick={handleCTAClick}
          style={styles.ctaButton}
          aria-label="Try Advanced Features — Sign in with Google"
        >
          Try Advanced Features — Sign in with Google
        </button>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    margin: '2rem auto',
    maxWidth: '600px',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '2rem',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e0e0e0',
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
    color: '#1a1a1a',
  },
  featureList: {
    listStyle: 'none',
    padding: 0,
    margin: '0 0 1.5rem 0',
  },
  featureItem: {
    padding: '0.5rem 0',
    fontSize: '0.95rem',
    color: '#666',
    position: 'relative',
    paddingLeft: '1.5rem',
  },
  ctaButton: {
    width: '100%',
    padding: '1rem 2rem',
    fontSize: '1rem',
    fontWeight: '600',
    backgroundColor: '#667eea',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none',
    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
  },
};

// Add hover effect
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    button[type="button"]:hover {
      background-color: #5568d3 !important;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4) !important;
    }
    button[type="button"]:active {
      transform: translateY(0);
    }
  `;
  if (document.head) {
    document.head.appendChild(style);
  }
}

