/**
 * AuthPromptCard.tsx
 * Authentication prompt card component.
 * 
 * Displays a prominent card encouraging users to sign in with Google
 * to unlock advanced features like Prompt Versioning and Raw JSON output.
 */

import React, { useState } from 'react';
import { useAuth } from '@/stores/auth';

/**
 * AuthPromptCard component - Sign-in prompt for advanced features.
 * 
 * Features:
 * - Prominent "Sign In with Google" button
 * - Clear explanation of unlocked features
 * - Visual emphasis on the benefits of signing in
 */
export default function AuthPromptCard() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handles the Sign In with Google action.
   */
  const handleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
      // Note: The OAuth flow will redirect the user, so we may not reach here
    } catch (err) {
      console.error('Error signing in with Google:', err);
      setError('Failed to sign in. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.iconContainer}>
          <div style={styles.icon}>🔓</div>
        </div>
        <h2 style={styles.title}>Unlock Advanced Features</h2>
        <p style={styles.description}>
          Sign in with Google to access the full Developer Sandbox with advanced capabilities:
        </p>
        
        <ul style={styles.featureList}>
          <li style={styles.featureItem}>
            <span style={styles.featureIcon}>📝</span>
            <span><strong>Prompt Versioning:</strong> Track and manage different prompt versions</span>
          </li>
          <li style={styles.featureItem}>
            <span style={styles.featureIcon}>📊</span>
            <span><strong>Raw JSON Output:</strong> See the exact JSON response from the AI</span>
          </li>
          <li style={styles.featureItem}>
            <span style={styles.featureIcon}>💾</span>
            <span><strong>Save Preferences:</strong> Store your settings and preferences</span>
          </li>
          <li style={styles.featureItem}>
            <span style={styles.featureIcon}>🚀</span>
            <span><strong>Full API Access:</strong> Use authenticated API keys for unlimited requests</span>
          </li>
        </ul>

        {error && (
          <div style={styles.errorBox}>
            <p style={styles.errorText}>{error}</p>
          </div>
        )}

        <button
          onClick={handleSignIn}
          disabled={loading}
          style={{
            ...styles.signInButton,
            ...(loading ? styles.buttonDisabled : {}),
          }}
        >
          {loading ? (
            <>
              <span style={styles.buttonIcon}>⏳</span>
              Signing In...
            </>
          ) : (
            <>
              <span style={styles.buttonIcon}>🔐</span>
              Sign In with Google
            </>
          )}
        </button>

        <p style={styles.note}>
          Don't worry - signing in is free and takes just a few seconds
        </p>

        {/* Additional feature labels */}
        <ul style={styles.additionalFeatures}>
          <li style={styles.additionalFeatureItem}>Calendar sync + live routing</li>
          <li style={styles.additionalFeatureItem}>Multi-day constraints + packing lists</li>
          <li style={styles.additionalFeatureItem}>Brandable API & enterprise controls</li>
        </ul>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: '100%',
    padding: '0',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '3rem 2.5rem',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    border: '2px solid #667eea',
    textAlign: 'center',
  },
  iconContainer: {
    marginBottom: '1.5rem',
  },
  icon: {
    fontSize: '4rem',
    display: 'inline-block',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
    color: '#1a1a1a',
  },
  description: {
    fontSize: '1rem',
    color: '#666',
    marginBottom: '2rem',
    lineHeight: '1.6',
  },
  featureList: {
    listStyle: 'none',
    padding: 0,
    margin: '0 0 2rem 0',
    textAlign: 'left',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
    padding: '1rem',
    marginBottom: '0.75rem',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    fontSize: '0.95rem',
    lineHeight: '1.5',
  },
  featureIcon: {
    fontSize: '1.5rem',
    flexShrink: 0,
  },
  errorBox: {
    backgroundColor: '#fee',
    border: '1px solid #fcc',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1.5rem',
  },
  errorText: {
    color: '#c33',
    margin: 0,
    fontSize: '0.875rem',
  },
  signInButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem 2.5rem',
    fontSize: '1.1rem',
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
  buttonIcon: {
    fontSize: '1.25rem',
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  note: {
    marginTop: '1.5rem',
    fontSize: '0.875rem',
    color: '#999',
    fontStyle: 'italic',
  },
  additionalFeatures: {
    listStyle: 'none',
    padding: 0,
    margin: '1.5rem 0 0 0',
    textAlign: 'left',
  },
  additionalFeatureItem: {
    padding: '0.5rem 0',
    fontSize: '0.875rem',
    color: '#666',
    lineHeight: '1.6',
  },
};

// Add hover effects
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    button:not(:disabled):hover {
      background-color: #5568d3 !important;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4) !important;
    }
    button:not(:disabled):active {
      transform: translateY(0);
    }
  `;
  if (document.head) {
    document.head.appendChild(style);
  }
}
