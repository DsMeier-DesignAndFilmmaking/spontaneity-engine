/**
 * FreeDemoWidget.tsx
 * Free demo widget - publicly accessible without authentication.
 * 
 * Simplified demo interface that uses an anonymous/generic API key
 * and requires no login. Provides basic AI recommendation testing
 * functionality for users to try before signing in.
 * 
 * Enhanced with:
 * - Predefined presets bar
 * - Context toggles (role, mood, group_size)
 * - Save & Share functionality
 * - Feedback widget
 * - Recent results (localStorage)
 * - Analytics tracking
 */

import React, { useState, useEffect } from 'react';
import { isFeatureEnabled, FEATURE_FLAGS } from '@/lib/utils/featureFlags';
import { trackEvent } from '@/lib/analytics/trackEvent';
import PresetsBar from './PresetsBar';
import ContextToggles, { ContextValues } from './ContextToggles';
import RecentResults from './RecentResults';
import SaveShareWidget from './SaveShareWidget';
import FeedbackWidget from './FeedbackWidget';

/**
 * Generate a unique result ID
 */
function generateResultId(): string {
  return 'result_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
}

/**
 * FreeDemoWidget component - Public demo interface with enhancements.
 * 
 * Features:
 * - AI Testing Controls: Vibe, Time, Location inputs
 * - Generate & Test button (uses anonymous API key)
 * - Predefined presets bar (feature-flagged)
 * - Context toggles (role, mood, group_size) (feature-flagged)
 * - Save & Share functionality (feature-flagged)
 * - Feedback widget (feature-flagged)
 * - Recent results (feature-flagged)
 * - Analytics tracking
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
  const [resultId, setResultId] = useState<string | null>(null);
  const [contextValues, setContextValues] = useState<ContextValues>({
    role: 'Traveler',
    mood: 'Relaxed',
    group_size: 'Solo',
  });
  
  // Check if enhancements are enabled
  const enhancementsEnabled = isFeatureEnabled(FEATURE_FLAGS.DEMO_ENHANCEMENTS);

  /**
   * Handles preset selection from PresetsBar
   */
  const handlePresetSelect = (presetText: string) => {
    // For now, insert into vibe field (could be enhanced to parse and distribute)
    setVibe(presetText);
  };

  /**
   * Handles result selection from RecentResults
   */
  const handleResultSelect = (resultData: string, selectedResultId: string) => {
    setResult(resultData);
    setResultId(selectedResultId);
  };

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

      // Generate result ID
      const newResultId = generateResultId();
      setResultId(newResultId);

      // Build prompt (visible to user)
      const visiblePrompt = `Vibe: ${vibe}, Time: ${time}, Location: ${location}`;
      
      // Build full prompt with context metadata (hidden, sent to API)
      const fullPrompt = enhancementsEnabled
        ? `${visiblePrompt} [Context: Role=${contextValues.role}, Mood=${contextValues.mood}, Group=${contextValues.group_size}]`
        : visiblePrompt;

      // TODO: Use anonymous/generic API key for public access
      // For now, return a mock response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const resultData = JSON.stringify(
        {
          result_id: newResultId,
          vibe,
          time,
          location,
          recommendation: 'Free demo mode: Sign in to unlock advanced features and save your preferences',
          timestamp: new Date().toISOString(),
          note: 'This is a free demo. Sign in to access full features.',
          ...(enhancementsEnabled && {
            context: {
              role: contextValues.role,
              mood: contextValues.mood,
              group_size: contextValues.group_size,
            },
          }),
        },
        null,
        2
      );
      
      setResult(resultData);

      // Track analytics
      if (enhancementsEnabled) {
        trackEvent('demo_run', {
          variant: 'free',
          preset: null, // Could be enhanced to track which preset was used
          role: contextValues.role,
          mood: contextValues.mood,
          group_size: contextValues.group_size,
          prompt_length: visiblePrompt.length,
          result_id: newResultId,
          timestamp: Date.now(),
        });

        // Save to recent results
        if (typeof window !== 'undefined' && (window as any).addRecentResult) {
          (window as any).addRecentResult({
            id: newResultId,
            preview: visiblePrompt,
            timestamp: Date.now(),
            data: resultData,
          });
        }
      }

      setLoading(false);
    } catch (err) {
      console.error('Error generating recommendation:', err);
      setError('Failed to generate recommendation. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card} id="free-demo-widget">
        <h1 style={styles.title}>Try a spontaneous micro-adventure — no sign in.</h1>
        <p style={styles.subtitle}>
          Get instant, personalized recommendations powered by AI
        </p>

        {/* Predefined Presets Bar (feature-flagged) */}
        {enhancementsEnabled && (
          <PresetsBar onPresetSelect={handlePresetSelect} disabled={loading} />
        )}

        {/* Context Toggles (feature-flagged) */}
        {enhancementsEnabled && (
          <ContextToggles onChange={setContextValues} disabled={loading} />
        )}

        {/* Recent Results (feature-flagged) */}
        {enhancementsEnabled && (
          <RecentResults
            onResultSelect={handleResultSelect}
            currentResultId={resultId || undefined}
          />
        )}

        {/* AI Testing Controls */}
        <div style={styles.controls} id="free-demo-input">
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

        {result && resultId && (
          <div style={styles.resultBox} id="demo-results">
            <h3 style={styles.resultTitle}>Recommendation Result:</h3>
            <pre style={styles.resultContent}>{result}</pre>
            
            {/* Save & Share Widget (feature-flagged) */}
            {enhancementsEnabled && (
              <SaveShareWidget
                resultId={resultId}
                resultData={result}
                disabled={loading}
              />
            )}

            {/* Feedback Widget (feature-flagged) */}
            {enhancementsEnabled && (
              <FeedbackWidget
                resultId={resultId}
                disabled={loading}
              />
            )}
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
