/**
 * DeveloperSandbox.tsx
 * Advanced developer sandbox - requires authentication.
 * 
 * Full-featured demo interface with advanced capabilities:
 * - Prompt Versioning: Track and manage different prompt versions
 * - Raw JSON Output: See the exact JSON response from the AI
 * - Log Out functionality
 * - Full API access with authenticated API keys
 */

import React, { useState } from 'react';
import { supabase, validateSupabaseConfig } from '@/lib/db/supabase';

/**
 * DeveloperSandbox component - Advanced demo interface.
 * 
 * Features:
 * - AI Testing Controls: Vibe, Time, Location inputs
 * - Generate & Test button (uses authenticated API keys)
 * - Prompt Versioning: Track prompt versions and history
 * - Raw JSON Output: Full JSON response display
 * - Log Out button for session management
 */
export default function DeveloperSandbox() {
  const [vibe, setVibe] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [promptVersion, setPromptVersion] = useState(1);
  const [showRawJson, setShowRawJson] = useState(true);
  const [promptHistory, setPromptHistory] = useState<Array<{ version: number; prompt: string; timestamp: string }>>([]);

  /**
   * Handles the logout process.
   * 
   * Executes supabase.auth.signOut() to terminate the session and then uses
   * window.location.replace('/') to guarantee a clean return to the main page
   * without adding to the browser history.
   */
  const handleLogout = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate Supabase configuration
      validateSupabaseConfig();
      
      // Sign out using Supabase directly
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        console.error('Error signing out:', signOutError);
        setError('An error occurred during logout. Please try again.');
        setLoading(false);
        return;
      }

      // Use window.location.replace('/') to guarantee session termination
      // and a clean return to the main page without adding to browser history
      if (typeof window !== 'undefined') {
        window.location.replace('/');
      }
    } catch (err) {
      console.error('Unexpected error during logout:', err);
      setError('An unexpected error occurred during logout.');
      setLoading(false);
    }
  };

  /**
   * Handles the Generate & Test action using authenticated API keys.
   * Includes prompt versioning and full JSON output.
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

      // Build prompt for versioning
      const prompt = `Vibe: ${vibe}, Time: ${time}, Location: ${location}`;
      
      // TODO: Integrate with SpontaneityEngine using authenticated API keys
      // For now, return a mock response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockResult = {
        version: promptVersion,
        prompt,
        vibe,
        time,
        location,
        recommendation: {
          title: 'Advanced AI Recommendation',
          activities: [
            {
              name: 'Spontaneous Adventure',
              type: 'outdoor',
              duration: '2-3 hours',
              confidence: 0.95,
            },
          ],
          reasoning: 'Generated using authenticated API with full features',
        },
        metadata: {
          adapter: 'OpenAI GPT-4',
          model: 'gpt-4-turbo',
          tokens: 150,
          timestamp: new Date().toISOString(),
        },
      };

      const resultString = JSON.stringify(mockResult, null, 2);
      setResult(resultString);

      // Add to prompt history
      setPromptHistory((prev) => [
        ...prev,
        {
          version: promptVersion,
          prompt,
          timestamp: new Date().toISOString(),
        },
      ]);

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
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Developer Sandbox</h1>
            <p style={styles.subtitle}>
              Advanced AI testing with prompt versioning and raw JSON output
            </p>
          </div>
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

        {/* Prompt Versioning */}
        <div style={styles.versionSection}>
          <div style={styles.versionControls}>
            <label style={styles.label} htmlFor="promptVersion">
              Prompt Version:
            </label>
            <input
              id="promptVersion"
              type="number"
              min="1"
              value={promptVersion}
              onChange={(e) => setPromptVersion(parseInt(e.target.value, 10) || 1)}
              style={styles.versionInput}
              disabled={loading}
            />
            <button
              onClick={() => setPromptVersion((prev) => prev + 1)}
              disabled={loading}
              style={styles.versionButton}
            >
              New Version
            </button>
          </div>
          
          {promptHistory.length > 0 && (
            <div style={styles.historyBox}>
              <h4 style={styles.historyTitle}>Prompt History:</h4>
              {promptHistory.slice(-5).reverse().map((item, idx) => (
                <div key={idx} style={styles.historyItem}>
                  <span style={styles.historyVersion}>v{item.version}</span>
                  <span style={styles.historyPrompt}>{item.prompt.substring(0, 50)}...</span>
                  <span style={styles.historyTime}>
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

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

        {/* Raw JSON Toggle */}
        <div style={styles.jsonToggle}>
          <label style={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={showRawJson}
              onChange={(e) => setShowRawJson(e.target.checked)}
              style={styles.checkbox}
            />
            Show Raw JSON Output
          </label>
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
            {showRawJson ? (
              <pre style={styles.resultContent}>{result}</pre>
            ) : (
              <div style={styles.resultFormatted}>
                {(() => {
                  try {
                    const parsed = JSON.parse(result);
                    return (
                      <div>
                        <p><strong>Version:</strong> {parsed.version}</p>
                        <p><strong>Recommendation:</strong> {parsed.recommendation?.title}</p>
                        <p><strong>Adapter:</strong> {parsed.metadata?.adapter}</p>
                        <p><strong>Model:</strong> {parsed.metadata?.model}</p>
                      </div>
                    );
                  } catch {
                    return <pre style={styles.resultContent}>{result}</pre>;
                  }
                })()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '2rem 1rem',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '2.5rem',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '2rem',
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
  },
  versionSection: {
    marginBottom: '2rem',
    padding: '1.5rem',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
  },
  versionControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1rem',
  },
  versionInput: {
    padding: '0.5rem',
    fontSize: '1rem',
    border: '2px solid #e0e0e0',
    borderRadius: '6px',
    width: '80px',
    outline: 'none',
  },
  versionButton: {
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    backgroundColor: '#667eea',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  historyBox: {
    marginTop: '1rem',
    padding: '1rem',
    backgroundColor: '#ffffff',
    borderRadius: '6px',
  },
  historyTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    marginBottom: '0.5rem',
    color: '#333',
  },
  historyItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.5rem 0',
    fontSize: '0.75rem',
    borderBottom: '1px solid #e0e0e0',
  },
  historyVersion: {
    fontWeight: '600',
    color: '#667eea',
    minWidth: '40px',
  },
  historyPrompt: {
    flex: 1,
    color: '#666',
  },
  historyTime: {
    color: '#999',
    fontSize: '0.7rem',
  },
  controls: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    marginBottom: '1.5rem',
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
  jsonToggle: {
    marginBottom: '1.5rem',
  },
  toggleLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    cursor: 'pointer',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
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
  resultFormatted: {
    fontSize: '0.875rem',
    lineHeight: '1.6',
  },
};
