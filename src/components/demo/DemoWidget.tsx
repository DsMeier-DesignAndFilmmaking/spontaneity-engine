/**
 * DemoWidget.tsx
 * Main demo widget UI component.
 * 
 * Provides AI testing controls and session management functionality.
 * Allows users to input parameters (Vibe, Time, Location) and generate
 * spontaneous activity recommendations.
 */

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/stores/auth';

/**
 * DemoWidget component - Main interactive demo interface.
 * 
 * Features:
 * - AI Testing Controls: Vibe, Time, Location inputs
 * - Generate & Test button to trigger recommendations
 * - Log Out button for session management
 */
export default function DemoWidget() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [vibe, setVibe] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handles the logout process.
   * Uses the auth store's signOut method which will automatically
   * update the auth state via the onAuthStateChange listener.
   */
  const handleLogout = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await signOut();

      // Redirect to homepage after successful logout
      // The auth store will automatically update to LOGGED_OUT state
      router.push('/');
    } catch (err) {
      console.error('Unexpected error during logout:', err);
      setError('An unexpected error occurred during logout.');
      setLoading(false);
    }
  };

  /**
   * Handles the Generate & Test action.
   * TODO: Integrate with SpontaneityEngine to generate recommendations
   */
  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      // Validate inputs
      if (!vibe.trim() || !time.trim() || !location.trim()) {
        setError('Please fill in all fields (Vibe, Time, Location)');
        setLoading(false);
        return;
      }

      // TODO: Integrate with SpontaneityEngine
      // For now, return a mock response
      await new Promise(resolve => setTimeout(resolve, 1000));
      setResult(
        JSON.stringify(
          {
            vibe,
            time,
            location,
            recommendation: 'Demo mode: Connect SpontaneityEngine to generate real recommendations',
            timestamp: new Date().toISOString(),
          },
          null,
          2
        )
      );
      setLoading(false);
    } catch (err) {
      console.error('Error generating recommendation:', err);
      setError('Failed to generate recommendation. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Spontaneity Engine Demo</h1>
        <p style={styles.subtitle}>
          Test AI-powered activity recommendations
        </p>

        {/* AI Testing Controls */}
        <div style={styles.controls}>
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="vibe">
              Vibe
            </label>
            <input
              id="vibe"
              type="text"
              value={vibe}
              onChange={(e) => setVibe(e.target.value)}
              placeholder="e.g., adventurous, relaxed, creative"
              style={styles.input}
              disabled={loading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="time">
              Time
            </label>
            <input
              id="time"
              type="text"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="e.g., 2 hours, afternoon, evening"
              style={styles.input}
              disabled={loading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="location">
              Location
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., San Francisco, home, outdoors"
              style={styles.input}
              disabled={loading}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            style={{
              ...styles.primaryButton,
              ...(loading ? styles.buttonDisabled : {}),
            }}
          >
            {loading ? 'Generating...' : 'Generate & Test'}
          </button>
        </div>

        {/* Results Display */}
        {error && (
          <div style={styles.errorBox}>
            <p style={styles.errorText}>{error}</p>
          </div>
        )}

        {result && (
          <div style={styles.resultBox}>
            <h3 style={styles.resultTitle}>Recommendation Result:</h3>
            <pre style={styles.resultContent}>{result}</pre>
          </div>
        )}

        {/* Session Exit */}
        <div style={styles.footer}>
          <button
            onClick={handleLogout}
            disabled={loading}
            style={{
              ...styles.logoutButton,
              ...(loading ? styles.buttonDisabled : {}),
            }}
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '2rem 1rem',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '2.5rem',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: '1rem',
    color: '#666',
    marginBottom: '2rem',
  },
  controls: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#333',
  },
  input: {
    padding: '0.75rem',
    fontSize: '1rem',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  primaryButton: {
    padding: '0.875rem 2rem',
    fontSize: '1rem',
    fontWeight: '600',
    backgroundColor: '#667eea',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    outline: 'none',
  },
  logoutButton: {
    padding: '0.75rem 1.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    backgroundColor: '#f5f5f5',
    color: '#666',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none',
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  footer: {
    marginTop: '2rem',
    paddingTop: '2rem',
    borderTop: '1px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'flex-end',
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
  resultBox: {
    backgroundColor: '#f9f9f9',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
  },
  resultTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    marginBottom: '1rem',
    color: '#333',
  },
  resultContent: {
    fontSize: '0.875rem',
    fontFamily: 'monospace',
    backgroundColor: '#ffffff',
    padding: '1rem',
    borderRadius: '4px',
    overflow: 'auto',
    margin: 0,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
};

// Add hover effects
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    input:focus {
      border-color: #667eea !important;
    }
    button:not(:disabled):hover {
      opacity: 0.9;
    }
    button:not(:disabled):active {
      transform: scale(0.98);
    }
  `;
  if (document.head) {
    document.head.appendChild(style);
  }
}

