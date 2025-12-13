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
import colors from '@/lib/design/colors';
import { fetchSpontaneousRecommendation } from '@/lib/api/spontaneity';
import SettingsModal from './SettingsModal';
import RecentResults from './RecentResults';
import SaveShareWidget from './SaveShareWidget';
import FeedbackWidget from './FeedbackWidget';
import UnifiedVibeSelector from './UnifiedVibeSelector';
import RecommendationDisplay from './RecommendationDisplay';
import LocationAutocomplete from './LocationAutocomplete';
import UGCSubmissionModal from './UGCSubmissionModal';
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
  // UGC submission modal state
  const [showUGCModal, setShowUGCModal] = useState(false);
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
   * Handles opening UGC submission modal
   */
  const handleOpenUGCModal = () => {
    setShowUGCModal(true);
    trackEvent('cta_click', {
      cta_name: 'open_ugc_modal',
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

      // Use the reusable API function to fetch real AI recommendations
      let resultData: string; // Declare outside try/catch for use in analytics
      
      try {
        const userContext = {
          vibe,
          time,
          location,
          ...(enhancementsEnabled && {
            role: contextValues.role,
            mood: contextValues.mood,
            group_size: contextValues.group_size,
          }),
        };
        
        // Fetch recommendation using the reusable function
        // Note: This function never throws - it returns a placeholder on error
        const recommendationResult = await fetchSpontaneousRecommendation(
          userContext,
          {
            temperature: 0.7,
            maxTokens: 300, // Reduced for MVaP speed
          },
          true // Use demo endpoint (no auth required)
        );
        
        // Ensure result_id is set
        recommendationResult.result_id = newResultId;
        
        // Check if this is a placeholder (API failed)
        const isPlaceholder = (recommendationResult as any)._isPlaceholder === true;
        
        if (isPlaceholder) {
          // Show error message but still display the placeholder
          setError('Unable to connect to AI service. Showing a placeholder recommendation. Please try again.');
          // Log for debugging (already logged in API function)
        } else {
          // Clear any previous errors
          setError(null);
        }
        
        // Set the result (either real or placeholder)
        resultData = JSON.stringify(recommendationResult, null, 2);
        setResult(resultData);
      } catch (apiError) {
        // This catch block should rarely execute since the function doesn't throw
        // But we keep it as a safety net
        console.error('Unexpected error in handleGenerate:', apiError);
        setError('An unexpected error occurred. Please try again.');
        
        // Generate a spontaneous recommendation title based on user inputs
        const generateRecommendationTitle = () => {
          const vibeWords = vibe.split(',').map(v => v.trim()).filter(v => v.length > 0);
          const locationWords = location.trim();
          const timeWords = time.trim();
          
          // Create a dynamic title based on inputs
          if (vibeWords.length > 0 && locationWords) {
            const primaryVibe = vibeWords[0];
            return `${primaryVibe.charAt(0).toUpperCase() + primaryVibe.slice(1)} ${timeWords ? timeWords + ' ' : ''}adventure in ${locationWords}`;
          } else if (locationWords) {
            return `Spontaneous ${timeWords ? timeWords + ' ' : ''}experience in ${locationWords}`;
          } else if (vibeWords.length > 0) {
            const primaryVibe = vibeWords[0];
            return `${primaryVibe.charAt(0).toUpperCase() + primaryVibe.slice(1)} ${timeWords ? timeWords + ' ' : ''}micro-adventure nearby`;
          } else {
            return `Your ${timeWords ? timeWords + ' ' : ''}spontaneous micro-adventure`;
          }
        };
        
        resultData = JSON.stringify(
          {
            result_id: newResultId,
            vibe,
            time,
            location,
            title: generateRecommendationTitle(),
            recommendation: generateRecommendationTitle(),
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
      }

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
        {/* Header with Settings and Suggest Buttons */}
        <div style={styles.headerRow}>
          <div style={styles.headerContent}>
            <h1 style={styles.title}>Instant, personalized micro-adventures — no login needed.</h1>
          </div>
          {/* Header Action Buttons */}
          {enhancementsEnabled && (
            <div style={styles.headerActions}>
              {/* Suggest Something Nearby Button */}
              <button
                type="button"
                onClick={handleOpenUGCModal}
                style={{
                  ...styles.suggestButton,
                  ...(loading ? styles.settingsButtonDisabled : {}),
                }}
                aria-label="Suggest something nearby"
                disabled={loading}
                title="Suggest something nearby"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={styles.suggestIcon}
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 8V16M8 12H16"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              
              {/* Settings Button */}
              <button
                type="button"
                onClick={handleOpenSettings}
                style={{
                  ...styles.settingsButton,
                  ...(loading ? styles.settingsButtonDisabled : {}),
                }}
                aria-label="Settings"
                disabled={loading}
                title="Settings"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={styles.settingsIcon}
                >
                  <path
                    d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Recent Results (feature-flagged) */}
        {enhancementsEnabled && (
          <RecentResults
            onResultSelect={handleResultSelect}
            currentResultId={resultId || undefined}
          />
        )}

        {/* Unified Vibe Selector */}
        <UnifiedVibeSelector
          value={vibe}
          onChange={setVibe}
          onTimeChange={setTime}
          onLocationChange={setLocation}
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
            <LocationAutocomplete
              id="location"
              value={location}
              onChange={setLocation}
              placeholder="e.g., San Francisco, home, outdoors"
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

        {/* Error Display with Try Again Button */}
        {error && (
          <div style={styles.errorBox}>
            <p style={styles.errorText}>{error}</p>
            <button
              onClick={handleGenerate}
              disabled={loading}
              style={{
                ...styles.tryAgainButton,
                ...(loading ? styles.buttonDisabled : {}),
              }}
            >
              {loading ? 'Retrying...' : 'Try Again'}
            </button>
          </div>
        )}

        {result && resultId && (
          <div style={styles.resultBox} id="demo-results" data-result-panel>
            {/* User-Friendly Recommendation Display */}
            <RecommendationDisplay
              resultJson={result}
              resultId={resultId}
              userInput={{
                vibe,
                time,
                location,
              }}
            />
            
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

        {/* UGC Submission Modal (feature-flagged) */}
        {enhancementsEnabled && (
          <UGCSubmissionModal
            isOpen={showUGCModal}
            onClose={() => setShowUGCModal(false)}
            defaultLocation={location}
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
    backgroundColor: colors.bgPrimary,
    border: `1px solid ${colors.border}`,
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
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexShrink: 0,
    marginLeft: '1rem',
    marginTop: '0.25rem',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    marginBottom: '0.5rem',
    color: colors.textPrimary,
    lineHeight: '1.3',
  },
  subtitle: {
    fontSize: '1rem',
    color: colors.textMuted,
    marginBottom: '0.25rem',
    lineHeight: '1.5',
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: '0.9375rem',
    color: colors.textMuted,
    marginBottom: '0',
    lineHeight: '1.5',
  },
  suggestButton: {
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
    color: colors.primary, // More prominent - use primary color
    flexShrink: 0,
  },
  suggestIcon: {
    display: 'block',
    width: '20px',
    height: '20px',
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
    color: colors.textMuted,
    flexShrink: 0,
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
    color: colors.textPrimary,
  },
  input: {
    padding: '0.75rem',
    fontSize: '1rem',
    border: `2px solid ${colors.border}`,
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  select: {
    padding: '0.75rem 1rem',
    fontSize: '1rem',
    fontWeight: '400',
    border: `2px solid ${colors.border}`,
    borderRadius: '0.5rem',
    outline: 'none',
    transition: 'all 0.2s',
    backgroundColor: colors.bgPrimary,
    color: colors.textPrimary,
    cursor: 'pointer',
    minHeight: '44px',
    width: '100%',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6 9L12 15L18 9' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 1rem center',
    backgroundSize: '20px 20px',
    paddingRight: '3rem',
  },
  primaryButton: {
    padding: '0.875rem 2rem',
    fontSize: '1rem',
    fontWeight: '600',
    backgroundColor: colors.primary,
    color: colors.textInverse,
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
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  errorText: {
    color: colors.error,
    margin: 0,
    fontSize: '0.875rem',
  },
  tryAgainButton: {
    padding: '0.625rem 1.25rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    backgroundColor: colors.primary,
    color: colors.textInverse,
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s, opacity 0.2s',
    outline: 'none',
    alignSelf: 'flex-start',
  },
  resultBox: {
    backgroundColor: colors.bgBase,
    border: `1px solid ${colors.border}`,
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
    backgroundColor: colors.bgHover,
    border: `1px solid ${colors.border}`,
    borderRadius: '0.5rem',
  },
  developerDrawerText: {
    fontSize: '0.8125rem',
    color: colors.textMuted,
    margin: 0,
    lineHeight: '1.5',
    fontStyle: 'italic',
  },
};

// Add Duration select hover and focus styles to match Vibe selector
if (typeof document !== 'undefined') {
  const styleId = 'free-demo-widget-select-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Duration select hover and focus to match Vibe selector */
      #time:hover:not(:disabled) {
        border-color: ${colors.textMuted} !important;
      }
      #time:focus {
        border-color: ${colors.primary} !important;
        box-shadow: 0 0 0 3px rgba(15, 82, 186, 0.1) !important;
      }
      /* Ensure select dropdown arrow color matches on hover/focus */
      #time:hover:not(:disabled),
      #time:focus {
        background-image: url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6 9L12 15L18 9' stroke='%230F52BA' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") !important;
      }
    `;
    if (document.head) {
      document.head.appendChild(style);
    }
  }

  // Add header button hover styles
  const headerButtonStyleId = 'free-demo-widget-header-buttons-styles';
  if (!document.getElementById(headerButtonStyleId)) {
    const headerButtonStyle = document.createElement('style');
    headerButtonStyle.id = headerButtonStyleId;
    headerButtonStyle.textContent = `
      button[aria-label="Suggest something nearby"]:hover:not(:disabled) {
        background-color: ${colors.bgAccent} !important;
        color: ${colors.primary} !important;
      }
      button[aria-label="Suggest something nearby"]:active:not(:disabled) {
        background-color: ${colors.bgHover} !important;
      }
      button[aria-label="Suggest something nearby"]:focus {
        box-shadow: 0 0 0 3px rgba(15, 82, 186, 0.2) !important;
      }
      button[aria-label="Settings"]:hover:not(:disabled) {
        background-color: ${colors.bgHover} !important;
        color: ${colors.primary} !important;
      }
      button[aria-label="Settings"]:active:not(:disabled) {
        background-color: ${colors.bgHover} !important;
      }
      button[aria-label="Settings"]:focus {
        box-shadow: 0 0 0 3px rgba(15, 82, 186, 0.2) !important;
      }
    `;
    if (document.head) {
      document.head.appendChild(headerButtonStyle);
    }
  }
}
