/**
 * FreeDemoWidget.tsx
 * Free demo widget - publicly accessible without authentication.
 * 
 * Simplified demo interface that uses an anonymous/generic API key
 * and requires no login. Provides basic AI recommendation testing
 * functionality for users to try before signing in.
 */

import React, { useState } from 'react';

/**
 * FreeDemoWidget component - Public demo interface.
 * 
 * Features:
 * - AI Testing Controls: Vibe, Time, Location inputs
 * - Generate & Test button (uses anonymous API key)
 * - No authentication required
 * - Basic recommendation display
 */
export default function FreeDemoWidget() {
  const [vibe, setVibe] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handles the Generate & Test action using anonymous API key.
   * Uses a generic/anonymous API key for public access.
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

      // TODO: Use anonymous/generic API key for public access
      // For now, return a mock response
      await new Promise(resolve => setTimeout(resolve, 1000));
      setResult(
        JSON.stringify(
          {
            vibe,
            time,
            location,
            recommendation: 'Free demo mode: Sign in to unlock advanced features and save your preferences',
            timestamp: new Date().toISOString(),
            note: 'This is a free demo. Sign in to access full features.',
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
        <h1 style={styles.title}>Free Demo</h1>
        <p style={styles.subtitle}>
          Try our AI-powered activity recommendations - no sign-in required
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
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
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
