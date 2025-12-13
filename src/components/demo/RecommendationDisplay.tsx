/**
 * RecommendationDisplay.tsx
 * User-friendly display component for AI recommendation results.
 * 
 * Transforms raw JSON output into a readable, structured interface
 * while keeping raw JSON available for advanced users.
 */

import React, { useState, useEffect, useRef } from 'react';
import colors from '@/lib/design/colors';
import { getTrustBadgeData, TrustMetadata } from '@/lib/moderation/contentModeration';
import UGCSubmissionModal from './UGCSubmissionModal';

export interface RecommendationDisplayProps {
  resultJson: string;
  resultId?: string;
  userInput?: {
    vibe?: string;
    time?: string;
    location?: string;
  };
}

/**
 * Safely parses JSON and extracts recommendation data
 */
function parseRecommendation(jsonString: string): {
  title?: string;
  summary?: string;
  recommendation?: string;
  activities?: Array<{ name?: string; type?: string; duration?: string; description?: string }>;
  duration?: string;
  cost?: string;
  location?: string;
  indoorOutdoor?: string;
  groupFriendly?: boolean;
  reasoning?: string;
  trustMetadata?: TrustMetadata | null;
  whyNow?: string;
  raw: any;
} {
  try {
    const parsed = JSON.parse(jsonString);
    
    // Extract common fields with fallbacks
    const title = parsed.title || parsed.name || parsed.recommendation?.split('.')[0] || 'Your Spontaneous Micro-Adventure';
    const summary = parsed.summary || parsed.description || parsed.recommendation || '';
    const recommendation = parsed.recommendation || parsed.description || '';
    
    // Extract activities if present
    const activities = parsed.activities || parsed.itinerary || [];
    
    // Extract metadata
    const duration = parsed.duration || parsed.time || parsed.estimated_duration || '';
    const cost = parsed.cost || parsed.budget || parsed.price_range || '';
    const location = parsed.location || parsed.area || '';
    const indoorOutdoor = parsed.indoor_outdoor || parsed.type || parsed.setting || '';
    const groupFriendly = parsed.group_friendly !== undefined ? parsed.group_friendly : parsed.solo_friendly === false;
    const reasoning = parsed.reasoning || parsed.why_this_fits || '';
    
    // Extract trust metadata from API response
    // Frontend NEVER computes badge logic - only reads from trust metadata
    let trustMetadata: TrustMetadata | null = null;
    if (parsed.trust && typeof parsed.trust === 'object') {
      // Use trust metadata from API (single source of truth)
      trustMetadata = parsed.trust as TrustMetadata;
    }
    
    // Extract "Why This Now?" micro-explanation (SERVER-SIDE GENERATED)
    const whyNow = parsed.why_now || null;
    
    return {
      title,
      summary,
      recommendation,
      activities: Array.isArray(activities) ? activities : [],
      duration,
      cost,
      location,
      indoorOutdoor,
      groupFriendly,
      reasoning,
      trustMetadata,
      whyNow,
      raw: parsed,
    };
  } catch (error) {
    // If JSON parsing fails, return raw string as summary
    return {
      title: 'Your Recommendation',
      summary: jsonString,
      raw: { raw: jsonString },
    };
  }
}

/**
 * RecommendationDisplay component
 */
export default function RecommendationDisplay({ resultJson, resultId, userInput }: RecommendationDisplayProps) {
  const [showRawJson, setShowRawJson] = useState(false);
  const [showTrustDetails, setShowTrustDetails] = useState(false);
  const [showUGCModal, setShowUGCModal] = useState(false);
  const [abuseSignalSent, setAbuseSignalSent] = useState(false);
  const [showAbuseOptions, setShowAbuseOptions] = useState(false);
  const [showWhyNow, setShowWhyNow] = useState(false);
  const abuseSignalRef = useRef<HTMLDivElement>(null);
  const whyNowRef = useRef<HTMLDivElement>(null);
  const data = parseRecommendation(resultJson);

  // Close abuse options on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (abuseSignalRef.current && !abuseSignalRef.current.contains(event.target as Node)) {
        setShowAbuseOptions(false);
      }
      if (whyNowRef.current && !whyNowRef.current.contains(event.target as Node)) {
        setShowWhyNow(false);
      }
    };

    if (showAbuseOptions || showWhyNow) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAbuseOptions, showWhyNow]);

  // Generate or retrieve session ID (anonymous)
  const getSessionId = (): string => {
    if (typeof window === 'undefined') return 'anonymous';
    
    let sessionId = sessionStorage.getItem('spontaneity_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem('spontaneity_session_id', sessionId);
    }
    return sessionId;
  };

  // Handle abuse signal submission
  const handleAbuseSignal = async (reason: 'irrelevant' | 'outdated' | 'unsafe') => {
    if (!resultId || abuseSignalSent) return;

    try {
      await fetch('/api/abuse-signal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason,
          recommendation_id: resultId,
          session_id: getSessionId(),
          timestamp: new Date().toISOString(),
        }),
      });

      // Mark as sent (no user feedback)
      setAbuseSignalSent(true);
    } catch (error) {
      // Silent fail - no user feedback
      console.error('Abuse signal error:', error);
    }
  };

  // Generate summary sentence from available data
  const generateSummary = () => {
    if (data.summary && data.summary.length > 0) {
      return data.summary;
    }
    
    const parts: string[] = [];
    if (data.duration) parts.push(`fits within ${data.duration}`);
    if (data.cost) parts.push(`budget-friendly`);
    if (data.location) parts.push(`in ${data.location}`);
    if (data.indoorOutdoor) parts.push(`${data.indoorOutdoor} experience`);
    
    if (parts.length > 0) {
      return `A ${parts.join(', ')} designed to match your preferences.`;
    }
    
    return 'A personalized experience tailored to your preferences.';
  };

  // Extract "What You'll Do" content
  const getActivityDescription = () => {
    if (data.activities && data.activities.length > 0) {
      return data.activities.map(activity => 
        activity.description || activity.name || ''
      ).filter(Boolean).join(' ');
    }
    if (data.recommendation) {
      return data.recommendation;
    }
    return 'Explore a curated experience based on your selected preferences.';
  };

  // Extract "Why This Fits You" bullets
  const getWhyThisFits = () => {
    const bullets: string[] = [];
    
    if (userInput?.vibe) {
      bullets.push(`Matches your ${userInput.vibe} vibe`);
    }
    if (userInput?.time) {
      bullets.push(`Designed for ${userInput.time}`);
    }
    if (data.reasoning) {
      bullets.push(data.reasoning);
    }
    if (bullets.length === 0) {
      bullets.push('Tailored to your preferences');
    }
    
    return bullets.slice(0, 3); // Limit to 3 bullets
  };

  return (
    <div style={styles.container} data-recommendation-display>
      {/* Primary Recommendation Summary */}
      <div style={styles.summarySection}>
        <div style={styles.titleRow} className="title-row">
          <h2 style={styles.title}>{data.title}</h2>
          {/* Trust Badge */}
          {data.trustMetadata && (() => {
            const badgeData = getTrustBadgeData(data.trustMetadata);
            return (
              <div style={styles.trustBadgeContainer} className="trust-badge-container">
                <button
                  type="button"
                  onClick={() => setShowTrustDetails(!showTrustDetails)}
                  style={styles.trustBadge}
                  aria-label={`Trust signal: ${badgeData.label}`}
                  aria-expanded={showTrustDetails}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={styles.trustIcon}
                    aria-hidden="true"
                  >
                    <path
                      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9 12L11 14L15 10"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span style={styles.trustBadgeText}>{badgeData.label}</span>
                </button>
                {/* Trust Details (Collapsible) */}
                {showTrustDetails && (
                  <div style={styles.trustDetails}>
                    <p style={styles.trustDetailsText}>
                      {badgeData.detailText}
                    </p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
        <p style={styles.summaryText}>{generateSummary()}</p>
        
        {/* "Why This Now?" Micro-Explanation (Hidden by default, revealed on hover/tap) */}
        {data.whyNow && (
          <div
            ref={whyNowRef}
            style={styles.whyNowSection}
            onMouseEnter={() => setShowWhyNow(true)}
            onMouseLeave={() => setShowWhyNow(false)}
            onTouchStart={() => setShowWhyNow(!showWhyNow)}
          >
            <button
              type="button"
              style={styles.whyNowTrigger}
              aria-label="Why this recommendation now?"
              aria-expanded={showWhyNow}
            >
              <span style={styles.whyNowLabel}>Why this now?</span>
            </button>
            {showWhyNow && (
              <div style={styles.whyNowTooltip}>
                <p style={styles.whyNowText}>{data.whyNow}</p>
              </div>
            )}
          </div>
        )}
        
        {/* Metadata Row */}
        <div style={styles.metadataRow}>
          {data.duration && (
            <div style={styles.metadataItem}>
              <span style={styles.metadataLabel}>Duration:</span>
              <span style={styles.metadataValue}>{data.duration}</span>
            </div>
          )}
          {data.cost && (
            <div style={styles.metadataItem}>
              <span style={styles.metadataLabel}>Cost:</span>
              <span style={styles.metadataValue}>{data.cost}</span>
            </div>
          )}
          {data.location && (
            <div style={styles.metadataItem}>
              <span style={styles.metadataLabel}>Location:</span>
              <span style={styles.metadataValue}>{data.location}</span>
            </div>
          )}
          {data.groupFriendly !== undefined && (
            <div style={styles.metadataItem}>
              <span style={styles.metadataLabel}>Group:</span>
              <span style={styles.metadataValue}>{data.groupFriendly ? 'Friendly' : 'Solo'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Experience Breakdown */}
      <div style={styles.breakdownSection}>
        {/* What You'll Do */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>What You'll Do</h3>
          <p style={styles.sectionContent}>{getActivityDescription()}</p>
        </div>

        {/* Why This Fits You */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Why This Fits You</h3>
          <ul style={styles.bulletList}>
            {getWhyThisFits().map((bullet, index) => (
              <li key={index} style={styles.bulletItem}>{bullet}</li>
            ))}
          </ul>
        </div>

        {/* Logistics */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Logistics</h3>
          <ul style={styles.logisticsList}>
            {data.duration && (
              <li style={styles.logisticsItem}>
                <span style={styles.logisticsLabel}>Duration:</span>
                <span style={styles.logisticsValue}>{data.duration}</span>
              </li>
            )}
            {data.cost && (
              <li style={styles.logisticsItem}>
                <span style={styles.logisticsLabel}>Cost:</span>
                <span style={styles.logisticsValue}>{data.cost}</span>
              </li>
            )}
            {data.indoorOutdoor && (
              <li style={styles.logisticsItem}>
                <span style={styles.logisticsLabel}>Setting:</span>
                <span style={styles.logisticsValue}>{data.indoorOutdoor}</span>
              </li>
            )}
            {data.groupFriendly !== undefined && (
              <li style={styles.logisticsItem}>
                <span style={styles.logisticsLabel}>Group Size:</span>
                <span style={styles.logisticsValue}>{data.groupFriendly ? 'Group-friendly' : 'Best for solo'}</span>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Abuse Signal Feedback (Minimal, Low Emphasis) */}
      {resultId && !abuseSignalSent && (
        <div style={styles.abuseSignalSection} ref={abuseSignalRef}>
          <button
            type="button"
            onClick={() => setShowAbuseOptions(!showAbuseOptions)}
            style={styles.abuseSignalButton}
            aria-label="Report issue with recommendation"
          >
            <span style={styles.abuseSignalText}>Doesn't seem right?</span>
          </button>
          {showAbuseOptions && (
            <div style={styles.abuseOptions}>
              <button
                type="button"
                onClick={() => {
                  handleAbuseSignal('irrelevant');
                  setShowAbuseOptions(false);
                }}
                style={styles.abuseOption}
              >
                Not relevant
              </button>
              <button
                type="button"
                onClick={() => {
                  handleAbuseSignal('outdated');
                  setShowAbuseOptions(false);
                }}
                style={styles.abuseOption}
              >
                Outdated
              </button>
              <button
                type="button"
                onClick={() => {
                  handleAbuseSignal('unsafe');
                  setShowAbuseOptions(false);
                }}
                style={{
                  ...styles.abuseOption,
                  borderBottom: 'none',
                }}
              >
                Unsafe
              </button>
            </div>
          )}
        </div>
      )}

      {/* UGC Submission Entry Point */}
      <div style={styles.ugcSection}>
        <button
          type="button"
          onClick={() => setShowUGCModal(true)}
          style={styles.ugcButton}
          aria-label="Suggest something nearby"
        >
          Suggest something nearby
        </button>
      </div>

      {/* Optional Actions (Visual Only) */}
      <div style={styles.actionsSection}>
        <button
          type="button"
          style={styles.actionButton}
          disabled
          aria-label="Regenerate (coming soon)"
        >
          Regenerate
        </button>
        <button
          type="button"
          style={styles.actionButton}
          disabled
          aria-label="Adjust Vibes (coming soon)"
        >
          Adjust Vibes
        </button>
      </div>

      {/* UGC Submission Modal */}
      {showUGCModal && (
        <UGCSubmissionModal
          isOpen={showUGCModal}
          onClose={() => setShowUGCModal(false)}
          defaultLocation={userInput?.location || ''}
        />
      )}

      {/* Raw JSON (Collapsible) */}
      <div style={styles.rawJsonSection}>
        <button
          type="button"
          onClick={() => setShowRawJson(!showRawJson)}
          style={styles.rawJsonToggle}
          aria-expanded={showRawJson}
        >
          <span>{showRawJson ? '▼' : '▶'}</span>
          <span style={styles.rawJsonToggleText}>
            View Raw Recommendation Data (JSON)
          </span>
        </button>
        {showRawJson && (
          <div style={styles.rawJsonContainer}>
            <pre style={styles.rawJsonContent}>
              {JSON.stringify(data.raw, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  summarySection: {
    paddingBottom: '1.5rem',
    borderBottom: `1px solid ${colors.border}`,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '1rem',
    marginBottom: '0.75rem',
    flexWrap: 'wrap',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: '1.3',
    margin: 0,
    flex: 1,
    minWidth: '200px',
  },
  trustBadgeContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '0.5rem',
  },
  trustBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.375rem 0.75rem',
    backgroundColor: colors.bgAccent,
    border: `1px solid ${colors.border}`,
    borderRadius: '0.375rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none',
    fontSize: '0.8125rem',
    fontWeight: '500',
    color: colors.textPrimary,
    whiteSpace: 'nowrap',
  },
  trustIcon: {
    width: '14px',
    height: '14px',
    color: colors.primary,
    flexShrink: 0,
  },
  trustBadgeText: {
    color: colors.textPrimary,
  },
  trustDetails: {
    maxWidth: '280px',
    padding: '0.75rem',
    backgroundColor: colors.bgPrimary,
    border: `1px solid ${colors.border}`,
    borderRadius: '0.5rem',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    marginTop: '0.25rem',
  },
  trustDetailsText: {
    fontSize: '0.8125rem',
    lineHeight: '1.5',
    color: colors.textSecondary,
    margin: 0,
  },
  summaryText: {
    fontSize: '1rem',
    color: colors.textSecondary,
    lineHeight: '1.6',
    marginBottom: '1rem',
  },
  whyNowSection: {
    position: 'relative',
    marginTop: '0.5rem',
    marginBottom: '0.5rem',
  },
  whyNowTrigger: {
    backgroundColor: 'transparent',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    fontSize: '0.8125rem',
    color: colors.textMuted,
    textDecoration: 'underline',
    textDecorationColor: colors.textMuted,
    textUnderlineOffset: '2px',
    transition: 'color 0.2s',
    outline: 'none',
    fontStyle: 'italic',
  },
  whyNowLabel: {
    color: colors.textMuted,
  },
  whyNowTooltip: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: '0.5rem',
    padding: '0.75rem',
    backgroundColor: colors.bgPrimary,
    border: `1px solid ${colors.border}`,
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    zIndex: 100,
    maxWidth: '320px',
    minWidth: '200px',
  },
  whyNowText: {
    fontSize: '0.875rem',
    lineHeight: '1.5',
    color: colors.textPrimary,
    margin: 0,
  },
  metadataRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem',
    fontSize: '0.875rem',
  },
  metadataItem: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
  },
  metadataLabel: {
    color: colors.textMuted,
    fontWeight: '500',
  },
  metadataValue: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  breakdownSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: colors.textPrimary,
    margin: 0,
  },
  sectionContent: {
    fontSize: '0.9375rem',
    color: colors.textSecondary,
    lineHeight: '1.6',
    margin: 0,
  },
  bulletList: {
    margin: 0,
    paddingLeft: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  bulletItem: {
    fontSize: '0.9375rem',
    color: colors.textSecondary,
    lineHeight: '1.6',
  },
  logisticsList: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  logisticsItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.9375rem',
    paddingBottom: '0.5rem',
    borderBottom: `1px solid ${colors.bgHover}`,
  },
  logisticsLabel: {
    color: colors.textMuted,
    fontWeight: '500',
  },
  logisticsValue: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  abuseSignalSection: {
    paddingTop: '0.75rem',
    borderTop: `1px solid ${colors.border}`,
    position: 'relative',
  },
  abuseSignalButton: {
    backgroundColor: 'transparent',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    fontSize: '0.8125rem',
    color: colors.textMuted,
    textDecoration: 'underline',
    textDecorationColor: colors.textMuted,
    textUnderlineOffset: '2px',
    transition: 'color 0.2s',
    outline: 'none',
  },
  abuseSignalText: {
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  abuseOptions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: '0.5rem',
    backgroundColor: colors.bgPrimary,
    border: `1px solid ${colors.border}`,
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
    minWidth: '120px',
    overflow: 'hidden',
  },
  abuseOption: {
    padding: '0.625rem 1rem',
    fontSize: '0.8125rem',
    textAlign: 'left',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: `1px solid ${colors.bgHover}`,
    cursor: 'pointer',
    color: colors.textPrimary,
    transition: 'background-color 0.15s',
    outline: 'none',
  },
  ugcSection: {
    paddingTop: '1rem',
    borderTop: `1px solid ${colors.border}`,
  },
  ugcButton: {
    padding: '0.625rem 1rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    backgroundColor: 'transparent',
    color: colors.primary,
    border: `1px solid ${colors.primary}`,
    borderRadius: '0.5rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none',
    width: '100%',
    textAlign: 'center',
  },
  actionsSection: {
    display: 'flex',
    gap: '0.75rem',
    paddingTop: '1rem',
    borderTop: `1px solid ${colors.border}`,
  },
  actionButton: {
    padding: '0.625rem 1.25rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    backgroundColor: colors.bgHover,
    color: colors.textMuted,
    border: `1px solid ${colors.border}`,
    borderRadius: '0.5rem',
    cursor: 'not-allowed',
    opacity: 0.6,
    transition: 'all 0.2s',
  },
  rawJsonSection: {
    marginTop: '0.5rem',
    paddingTop: '1rem',
    borderTop: `1px solid ${colors.border}`,
  },
  rawJsonToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: 'transparent',
    border: 'none',
    padding: '0.5rem 0',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: colors.textMuted,
    transition: 'color 0.2s',
    outline: 'none',
  },
  rawJsonToggleText: {
    color: colors.textMuted,
  },
  rawJsonContainer: {
    marginTop: '0.75rem',
    padding: '1rem',
    backgroundColor: colors.bgBase,
    border: `1px solid ${colors.border}`,
    borderRadius: '0.5rem',
    maxHeight: '400px',
    overflowY: 'auto',
  },
  rawJsonContent: {
    fontSize: '0.8125rem',
    fontFamily: 'monospace',
    color: colors.textPrimary,
    margin: 0,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
};

// Add hover effect and responsive styles
if (typeof document !== 'undefined') {
  const styleId = 'recommendation-display-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      [data-recommendation-display] button[aria-expanded] span:last-child:hover {
        color: ${colors.textPrimary} !important;
      }
      /* Trust Badge hover */
      [data-recommendation-display] button[aria-label^="Trust signal"]:hover {
        background-color: ${colors.bgHover} !important;
        border-color: ${colors.primary} !important;
      }
      [data-recommendation-display] button[aria-label^="Trust signal"]:focus {
        outline: 2px solid ${colors.primary};
        outline-offset: 2px;
      }
      /* Abuse Signal hover */
      [data-recommendation-display] button[aria-label="Report issue with recommendation"]:hover span {
        color: ${colors.textPrimary} !important;
      }
      [data-recommendation-display] button[aria-label^="Report"]:focus {
        outline: 2px solid ${colors.primary};
        outline-offset: 2px;
      }
      [data-recommendation-display] button[type="button"][style*="abuseOption"]:hover {
        background-color: ${colors.bgHover} !important;
      }
      /* Why This Now hover */
      [data-recommendation-display] button[aria-label="Why this recommendation now?"]:hover span {
        color: ${colors.textPrimary} !important;
      }
      [data-recommendation-display] button[aria-label="Why this recommendation now?"]:focus {
        outline: 2px solid ${colors.primary};
        outline-offset: 2px;
      }
      /* UGC Button hover */
      [data-recommendation-display] button[aria-label="Suggest something nearby"]:hover {
        background-color: ${colors.bgAccent} !important;
        border-color: ${colors.hover} !important;
        color: ${colors.hover} !important;
      }
      [data-recommendation-display] button[aria-label="Suggest something nearby"]:focus {
        outline: 2px solid ${colors.primary};
        outline-offset: 2px;
      }
      /* Mobile responsive adjustments */
      @media (max-width: 640px) {
        [data-recommendation-display] {
          gap: 1rem !important;
        }
        [data-recommendation-display] > div:first-child {
          padding-bottom: 1rem !important;
        }
        [data-recommendation-display] .title-row {
          flex-direction: column;
          align-items: flex-start !important;
        }
        [data-recommendation-display] .trust-badge-container {
          align-self: flex-start !important;
        }
      }
    `;
    if (document.head) {
      document.head.appendChild(style);
    }
  }
}

