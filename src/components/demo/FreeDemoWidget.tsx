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
import SettingsModal from './SettingsModal';
import RecentResults from './RecentResults';
import SaveShareWidget from './SaveShareWidget';
import FeedbackWidget from './FeedbackWidget';
import QuickPromptChips from './QuickPromptChips';
import VibeChipsSelector from './VibeChipsSelector';
import SelectedVibes from './SelectedVibes';
import type { ContextValues } from './ContextToggles';

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
  
  // Settings modal state
  const [showSettings, setShowSettings] = useState(false);
  // Developer mode toggle (UI only)
  const [developerMode, setDeveloperMode] = useState(false);

  /**
   * Handles preset selection from Settings Modal
   */
  const handlePresetSelect = (presetText: string) => {
    // Insert into vibe field (could be enhanced to parse and distribute)
    setVibe(presetText);
    // Close modal after preset selection (optional - user can still keep it open)
    // setShowSettings(false);
  };

  /**
   * Handles quick prompt chip click - UI only, just updates input state
   */
  const handleQuickChipClick = (text: string, field: 'vibe' | 'time' | 'location') => {
    // UI-only: Update the corresponding input field (for time/location)
    if (field === 'time') {
      setTime(text);
    } else if (field === 'location') {
      setLocation(text);
    }
    // Note: vibe presets are handled by handleVibeAppend
  };

  /**
   * Handles appending vibes from presets - UI only
   */
  const handleVibeAppend = (newVibes: string[]) => {
    // Parse current vibes
    const currentVibesArray = vibe
      ? vibe.split(',').map(v => v.trim()).filter(v => v.length > 0)
      : [];
    
    // Append new vibes (avoid duplicates)
    const combinedVibes = [...currentVibesArray];
    newVibes.forEach(v => {
      if (!combinedVibes.includes(v)) {
        combinedVibes.push(v);
      }
    });
    
    // Convert back to comma-separated string
    setVibe(combinedVibes.join(', '));
  };

  /**
   * Handles removing a vibe - UI only
   */
  const handleVibeRemove = (vibeToRemove: string) => {
    const currentVibesArray = vibe
      ? vibe.split(',').map(v => v.trim()).filter(v => v.length > 0)
      : [];
    
    const newVibes = currentVibesArray.filter(v => v !== vibeToRemove);
    setVibe(newVibes.join(', '));
  };

  // Parse vibes for display
  const selectedVibesArray = vibe
    ? vibe.split(',').map(v => v.trim()).filter(v => v.length > 0)
    : [];

  /**
   * Handles opening settings modal
   */
  const handleOpenSettings = () => {
    setShowSettings(true);
    trackEvent('cta_click', {
      cta_name: 'open_settings',
      timestamp: Date.now(),
    });
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
      <div style={styles.card} id="free-demo-widget" data-demo-card>
        {/* Header with Settings Button */}
        <div style={styles.headerRow}>
          <div style={styles.headerContent}>
            <h1 style={styles.title}>Try a spontaneous micro-adventure — no sign in.</h1>
            <p style={styles.subtitle}>
              Try it instantly
            </p>
            <p style={styles.descriptionText}>
              Get instant, personalized recommendations powered by AI
            </p>
          </div>
          {/* Settings Button (feature-flagged) */}
          {enhancementsEnabled && (
            <button
              type="button"
              onClick={handleOpenSettings}
              style={{
                ...styles.settingsButton,
                ...(loading ? styles.settingsButtonDisabled : {}),
              }}
              aria-label="Settings"
              disabled={loading}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={styles.settingsIcon}
              >
                <path
                  d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M16.6667 12.0833C16.575 12.3167 16.4417 12.525 16.275 12.7C16.1083 12.875 15.9 13.0083 15.6667 13.1L13.5833 14.0083C13.2417 14.1583 12.8333 14.075 12.575 13.8083L11.425 12.6583C11.1917 12.6583 10.9583 12.6083 10.7417 12.5167L10.1833 14.6667C10.075 15.0333 9.75 15.2917 9.375 15.3167H6.625C6.25 15.2917 5.925 15.0333 5.81667 14.6583L5.25833 12.5083C5.04167 12.6 4.80833 12.65 4.575 12.65L3.425 13.8C3.15833 14.0583 2.75 14.1417 2.41667 13.9917L0.333333 13.0833C0.1 12.9917 -0.0333334 12.7833 -0.125 12.55C-0.216667 12.3167 -0.216667 12.0583 -0.125 11.825L0.791667 9.74167C0.941667 9.4 0.858333 8.99167 0.591667 8.73333L-0.558333 7.58333C-0.816667 7.31667 -0.9 6.90833 -0.75 6.575L0.158333 4.49167C0.25 4.25833 0.383333 4.05 0.55 3.875C0.716667 3.7 0.925 3.56667 1.15833 3.475L3.24167 2.56667C3.58333 2.41667 3.99167 2.5 4.25833 2.76667L5.40833 3.91667C5.64167 3.91667 5.875 3.96667 6.09167 4.05833L6.65 1.90833C6.75833 1.54167 7.08333 1.28333 7.45833 1.25833H10.2083C10.5833 1.28333 10.9083 1.54167 11.0167 1.91667L11.575 4.06667C11.7917 3.975 12.025 3.925 12.2583 3.925L13.4083 2.775C13.675 2.51667 14.0833 2.43333 14.4167 2.58333L16.5 3.49167C16.7333 3.58333 16.8667 3.79167 16.9583 4.025C17.05 4.25833 17.05 4.51667 16.9583 4.75L16.0417 6.83333C15.8917 7.175 15.975 7.58333 16.2417 7.85L17.3917 9C17.6583 9.26667 17.7417 9.675 17.5917 10.0083L16.6667 12.0833Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Recent Results (feature-flagged) */}
        {enhancementsEnabled && (
          <RecentResults
            onResultSelect={handleResultSelect}
            currentResultId={resultId || undefined}
          />
        )}

        {/* Quick Prompt Chips */}
        <QuickPromptChips
          onChipClick={handleQuickChipClick}
          onVibeAppend={handleVibeAppend}
          currentVibes={vibe}
          disabled={loading}
        />

        {/* Selected Vibes Display */}
        <SelectedVibes
          vibes={selectedVibesArray}
          onRemove={handleVibeRemove}
          disabled={loading}
        />

        {/* Vibe Selector - All Available Vibes */}
        <VibeChipsSelector
          value={vibe}
          onChange={setVibe}
          disabled={loading}
        />

        {/* AI Testing Controls */}
        <div style={styles.controls} id="free-demo-input">
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="time">
              Duration
            </label>
            <select
              id="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              style={styles.select}
              disabled={loading}
            >
              <option value="">Select time</option>
              <option value="30 min">30 min</option>
              <option value="1 hour">1 hour</option>
              <option value="2 hours">2 hours</option>
              <option value="3 hours">3 hours</option>
              <option value="Half day">Half day</option>
              <option value="Full day">Full day</option>
            </select>
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
          <div style={styles.resultBox} id="demo-results" data-result-panel>
            <h3 style={styles.resultTitle}>Recommendation Result:</h3>
            <div style={styles.resultScrollContainer}>
              <pre style={styles.resultContent}>{result}</pre>
            </div>
            
            {/* Developer Mode Toggle (UI only) */}
            <div style={styles.developerModeSection}>
              <label style={styles.developerModeLabel}>
                <input
                  type="checkbox"
                  checked={developerMode}
                  onChange={(e) => setDeveloperMode(e.target.checked)}
                  style={styles.checkbox}
                />
                <span>Developer Mode</span>
              </label>
            </div>

            {/* Developer Mode Drawer (UI only, no logic) */}
            {developerMode && (
              <div style={styles.developerDrawer} data-developer-drawer>
                <p style={styles.developerDrawerText}>
                  Developer mode preview — JSON response, token usage, and model details will appear here in future versions.
                </p>
              </div>
            )}
            
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

        {/* Settings Modal (feature-flagged) */}
        {enhancementsEnabled && (
          <SettingsModal
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            onPresetSelect={handlePresetSelect}
            onContextChange={setContextValues}
            currentContextValues={contextValues}
            disabled={loading}
          />
        )}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: '100%',
    padding: '0',
    position: 'relative',
  },
  card: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '0.75rem',
    padding: '1.5rem',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    height: '100%',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: '1.5rem', // Improved typography hierarchy
    fontWeight: '700',
    marginBottom: '0.5rem',
    color: '#111827', // Improved contrast
    lineHeight: '1.3',
  },
  subtitle: {
    fontSize: '1rem',
    color: '#6b7280',
    marginBottom: '0.25rem',
    lineHeight: '1.5',
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: '0.9375rem',
    color: '#6b7280',
    marginBottom: '0',
    lineHeight: '1.5',
  },
  settingsButton: {
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    padding: '0',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s ease, color 0.2s ease',
    outline: 'none',
    color: '#666',
    flexShrink: 0,
    marginLeft: '1rem',
    marginTop: '0.25rem',
  },
  settingsButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  settingsIcon: {
    display: 'block',
    width: '20px',
    height: '20px',
  },
  controls: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    marginBottom: '0',
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
  select: {
    padding: '0.75rem',
    fontSize: '1rem',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    minHeight: '2.75rem',
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
    borderRadius: '0.75rem',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  },
  resultTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    marginBottom: '1rem',
    color: '#111827',
  },
  resultScrollContainer: {
    maxHeight: '400px',
    overflowY: 'auto',
    marginBottom: '1rem',
    borderRadius: '0.5rem',
  },
  resultContent: {
    fontSize: '0.875rem',
    fontFamily: 'monospace',
    backgroundColor: '#ffffff',
    padding: '1rem',
    borderRadius: '0.5rem',
    margin: 0,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  developerModeSection: {
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid #e5e7eb',
  },
  developerModeLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
    cursor: 'pointer',
  },
  checkbox: {
    width: '1rem',
    height: '1rem',
    cursor: 'pointer',
  },
  developerDrawer: {
    marginTop: '1rem',
    padding: '1rem',
    backgroundColor: '#f3f4f6',
    border: '1px solid #e5e7eb',
    borderRadius: '0.5rem',
  },
  developerDrawerText: {
    fontSize: '0.8125rem',
    color: '#6b7280',
    margin: 0,
    lineHeight: '1.5',
    fontStyle: 'italic',
  },
};
