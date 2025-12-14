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
import RecommendationCard from './RecommendationCard';
import FallbackRecommendationMockup from './FallbackRecommendationMockup';

export interface RecommendationDisplayProps {
  resultJson: string;
  resultId?: string;
  userInput?: {
    vibe?: string;
    time?: string;
    location?: string;
  };
  onRegenerate?: () => void;
  onAdjustVibes?: () => void;
  onRefineAdventure?: () => void;
  loading?: boolean;
  isNewlyGenerated?: boolean;
}

/**
 * Validates recommendation data to check if it's valid and properly formatted
 * Returns false if the recommendation should trigger the fallback mockup
 */
function isValidRecommendation(data: {
  title?: string;
  activityName?: string;
  activityRealtimeStatus?: 'open' | 'closed' | 'unknown';
  raw?: any;
}): { isValid: boolean; reason?: string } {
  // CRITICAL CHECK A: Check for missing or unformatted title (parameter leakage)
  const displayTitle = data.activityName || data.title || '';
  if (!displayTitle || displayTitle.trim().length === 0) {
    console.error('[Validation Failed] Missing title');
    return { isValid: false, reason: 'Missing title' };
  }
  
  // CRITICAL CHECK B: Check for parameter leakage in title (e.g., [Context:...])
  // Check if title contains context metadata patterns
  const hasContextLeakage = displayTitle.includes('[Context:') || 
                            displayTitle.includes('[Role:') || 
                            displayTitle.includes('[Mood:') ||
                            displayTitle.includes('Role=') ||
                            displayTitle.includes('Mood=') ||
                            displayTitle.includes('Group=');
  
  if (hasContextLeakage) {
    // Check if the title is primarily or entirely context metadata
    const isOnlyContext = displayTitle.trim().startsWith('[') && 
                         (displayTitle.includes('Context:') || displayTitle.includes('Role='));
    const isContextHeavy = displayTitle.split('[').length > 2; // Multiple context blocks
    
    if (isOnlyContext || isContextHeavy) {
      console.error('[Validation Failed] Raw parameter leakage detected in title:', displayTitle);
      return { isValid: false, reason: 'Unformatted title - parameter leakage detected' };
    }
    
    // If title starts with a word but contains context, still flag it
    const titleWords = displayTitle.split(' ').filter(w => !w.includes('[') && !w.includes('='));
    if (titleWords.length < 2) {
      console.error('[Validation Failed] Title has insufficient content, mostly context metadata:', displayTitle);
      return { isValid: false, reason: 'Unformatted title - parameter leakage detected' };
    }
  }
  
  // CRITICAL CHECK C: Check for closed status in multiple places
  // Check parsed status field
  if (data.activityRealtimeStatus === 'closed') {
    console.error('[Validation Failed] Recommendation status is "Closed"');
    return { isValid: false, reason: 'Status was "Closed"' };
  }
  
  // Check raw data for closed status in various formats
  if (data.raw) {
    // Check status field in raw data
    const rawStatus = data.raw.status || data.raw.activity_realtime_status || data.raw.realtime_status;
    if (rawStatus === 'closed' || rawStatus === 'Closed' || rawStatus === 'CLOSED') {
      console.error('[Validation Failed] Raw data indicates closed status:', rawStatus);
      return { isValid: false, reason: 'Status was "Closed"' };
    }
    
    // Check for unavailable flags
    if (data.raw.is_unavailable === true || 
        data.raw.unavailable === true ||
        data.raw.isUnavailable === true) {
      console.error('[Validation Failed] Activity marked as unavailable');
      return { isValid: false, reason: 'Activity marked as unavailable' };
    }
    
    // Check if title in raw data contains "Closed"
    const rawTitle = data.raw.title || data.raw.activity_name || data.raw.name || '';
    if (rawTitle && typeof rawTitle === 'string' && rawTitle.toLowerCase().includes('closed')) {
      console.error('[Validation Failed] Title contains "Closed" indicator:', rawTitle);
      return { isValid: false, reason: 'Status was "Closed"' };
    }
    
    // Check description/recommendation for "closed" mentions
    const rawDescription = data.raw.recommendation || data.raw.description || '';
    if (rawDescription && typeof rawDescription === 'string') {
      const closedPattern = /\b(closed|closes? at|not open|unavailable)\b/i;
      if (closedPattern.test(rawDescription) && !rawDescription.toLowerCase().includes('open')) {
        console.error('[Validation Failed] Description indicates closed status');
        return { isValid: false, reason: 'Status was "Closed"' };
      }
    }
  }
  
  // All checks passed
  return { isValid: true };
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
  // Card-specific fields
  activityName?: string;
  activityDistanceMi?: number;
  activityDriveTimeMin?: number;
  activityDurationEstimate?: string;
  activityRealtimeStatus?: 'open' | 'closed' | 'unknown';
  activityRatingAggregate?: number;
  activityPriceTier?: 1 | 2 | 3 | 4;
  activityImageUrl?: string;
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
    
    // Extract card-specific fields
    const activityName = parsed.activity_name || parsed.name || title;
    const activityDistanceMi = parsed.activity_distance_mi !== undefined ? Number(parsed.activity_distance_mi) : undefined;
    const activityDriveTimeMin = parsed.activity_drive_time_min !== undefined ? Number(parsed.activity_drive_time_min) : undefined;
    const activityDurationEstimate = parsed.activity_duration_estimate || duration;
    const activityRealtimeStatus = parsed.activity_realtime_status === 'open' ? 'open' : 
                                   parsed.activity_realtime_status === 'closed' ? 'closed' : 'unknown';
    const activityRatingAggregate = parsed.activity_rating_aggregate !== undefined ? Number(parsed.activity_rating_aggregate) : undefined;
    // Convert price tier: $=1, $$=2, $$$=3, $$$$=4
    let activityPriceTier: 1 | 2 | 3 | 4 | undefined;
    if (parsed.activity_price_tier) {
      const tier = typeof parsed.activity_price_tier === 'string' 
        ? parsed.activity_price_tier.length 
        : Number(parsed.activity_price_tier);
      if (tier >= 1 && tier <= 4) {
        activityPriceTier = tier as 1 | 2 | 3 | 4;
      }
    } else if (cost) {
      // Try to infer from cost string
      const dollarCount = (cost.match(/\$/g) || []).length;
      if (dollarCount >= 1 && dollarCount <= 4) {
        activityPriceTier = dollarCount as 1 | 2 | 3 | 4;
      }
    }
    const activityImageUrl = parsed.activity_image_url || parsed.image_url || parsed.image;
    
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
      // Card fields
      activityName,
      activityDistanceMi,
      activityDriveTimeMin,
      activityDurationEstimate,
      activityRealtimeStatus,
      activityRatingAggregate,
      activityPriceTier,
      activityImageUrl,
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
export default function RecommendationDisplay({ 
  resultJson, 
  resultId, 
  userInput,
  onRegenerate,
  onAdjustVibes,
  onRefineAdventure,
  loading = false,
  isNewlyGenerated = false,
}: RecommendationDisplayProps) {
  const [showRawJson, setShowRawJson] = useState(false);
  const [showTrustDetails, setShowTrustDetails] = useState(false);
  const [showUGCModal, setShowUGCModal] = useState(false);
  const [abuseSignalSent, setAbuseSignalSent] = useState(false);
  const [showAbuseOptions, setShowAbuseOptions] = useState(false);
  const [showWhyNow, setShowWhyNow] = useState(false);
  const abuseSignalRef = useRef<HTMLDivElement>(null);
  const whyNowRef = useRef<HTMLDivElement>(null);
  const data = parseRecommendation(resultJson);

  // Validate recommendation - check if we should show fallback mockup
  const validation = isValidRecommendation(data);
  const shouldShowFallback = !validation.isValid;

  // Log validation failure for debugging (only once, not on every render)
  useEffect(() => {
    if (shouldShowFallback && validation.reason) {
      // Use console.log instead of console.warn to reduce noise
      console.log('[RecommendationDisplay] Showing fallback - Reason:', validation.reason);
    }
  }, [shouldShowFallback, validation.reason]);

  // If validation fails, show fallback mockup
  if (shouldShowFallback) {
    return (
      <FallbackRecommendationMockup
        onRefineAdventure={onRefineAdventure}
        failureReason={validation.reason}
      />
    );
  }

  // Check if we have card-specific data to use the new card format
  const hasCardData = data.activityName && (
    data.activityDistanceMi !== undefined || 
    data.activityDriveTimeMin !== undefined || 
    data.activityDurationEstimate || 
    data.activityRealtimeStatus !== 'unknown' ||
    data.activityRatingAggregate !== undefined ||
    data.activityPriceTier !== undefined
  );

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
    // If we have real activity data, use it
    if (data.activities && data.activities.length > 0) {
      return data.activities.map(activity => 
        activity.description || activity.name || ''
      ).filter(Boolean).join(' ');
    }
    
    // If recommendation exists and is not the demo placeholder, use it
    if (data.recommendation && !data.recommendation.includes('Free demo mode')) {
      return data.recommendation;
    }
    
    // Generate realistic spontaneous adventure copy based on user inputs
    const generateSpontaneousDescription = () => {
      const vibeWords = userInput?.vibe ? userInput.vibe.split(',').map(v => v.trim()).filter(v => v.length > 0) : [];
      const location = userInput?.location || data.location || 'nearby';
      const time = userInput?.time || data.duration || '';
      
      // Build description based on vibe
      let description = '';
      
      if (vibeWords.length > 0) {
        const primaryVibe = vibeWords[0].toLowerCase();
        
        // Vibe-specific descriptions
        if (primaryVibe.includes('adventur') || primaryVibe.includes('active')) {
          description = `Discover hidden gems and local spots in ${location} that most visitors miss. `;
          description += time ? `Perfect for a ${time} exploration, ` : '';
          description += `you'll uncover unique experiences that match your adventurous spirit—from secret viewpoints to off-the-beaten-path local favorites.`;
        } else if (primaryVibe.includes('relax') || primaryVibe.includes('chill')) {
          description = `Find your perfect peaceful moment in ${location}. `;
          description += time ? `In just ${time}, ` : '';
          description += `you can unwind at serene spots that offer a break from the usual hustle—think quiet parks, cozy cafes, or scenic spots perfect for slowing down.`;
        } else if (primaryVibe.includes('creativ') || primaryVibe.includes('art')) {
          description = `Tap into ${location}'s creative pulse. `;
          description += time ? `With ${time} to spare, ` : '';
          description += `explore local art scenes, maker spaces, or cultural corners where inspiration flows—whether it's street art, galleries, or hands-on creative experiences.`;
        } else if (primaryVibe.includes('food') || primaryVibe.includes('culinary')) {
          description = `Taste your way through ${location}'s local flavor. `;
          description += time ? `In ${time}, ` : '';
          description += `you can discover authentic eats, hidden food spots, or unique culinary experiences that locals love—from food markets to neighborhood gems.`;
        } else if (primaryVibe.includes('social') || primaryVibe.includes('group')) {
          description = `Connect with ${location}'s vibrant social scene. `;
          description += time ? `Perfect for ${time} of fun, ` : '';
          description += `you'll find spots where people gather, share experiences, and create memories—whether it's lively markets, community events, or social spaces.`;
        } else {
          // Generic but engaging description
          description = `Experience ${location} through a fresh lens. `;
          description += time ? `In ${time}, ` : '';
          description += `you'll discover something unexpected that matches your ${primaryVibe} vibe—local spots, unique experiences, or hidden corners waiting to be explored.`;
        }
      } else {
        // No vibe specified - create a general spontaneous description
        description = `Spontaneously explore ${location} and discover something unexpected. `;
        description += time ? `With ${time} available, ` : '';
        description += `you'll find local experiences, hidden spots, or unique moments that make for an unforgettable micro-adventure.`;
      }
      
      return description;
    };
    
    return generateSpontaneousDescription();
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

  // If we have card data, use the new RecommendationCard component
  if (hasCardData) {
    return (
      <div 
        style={{
          ...styles.container,
          ...(isNewlyGenerated ? styles.containerNewlyGenerated : {}),
        }} 
        data-recommendation-display
        className={isNewlyGenerated ? 'recommendation-newly-generated' : ''}
      >
        {isNewlyGenerated && (
          <div style={styles.successBadge}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={styles.successIcon}>
              <path
                d="M20 6L9 17L4 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Recommendation Generated</span>
          </div>
        )}
        <RecommendationCard
          activityName={data.activityName || data.title || 'Activity'}
          activityDistanceMi={data.activityDistanceMi}
          activityDriveTimeMin={data.activityDriveTimeMin}
          activityDurationEstimate={data.activityDurationEstimate}
          activityRealtimeStatus={data.activityRealtimeStatus}
          activityRatingAggregate={data.activityRatingAggregate}
          activityPriceTier={data.activityPriceTier}
          activityImageUrl={data.activityImageUrl}
          showImage={true} // Can be configured via SDK
          onDetailsClick={() => {
            // Fallback: Expand to full view if navigation fails
            setShowRawJson(true);
          }}
          primaryActionLabel="Details"
          isNewlyGenerated={isNewlyGenerated}
          recommendationId={resultId || undefined}
          onRefineAdventure={onRefineAdventure}
          onCommitAdventure={() => {
            // Handle commit action
            console.log('Adventure committed:', resultId);
          }}
          // Pass additional data for details modal
          detailsData={{
            title: data.title,
            activityName: data.activityName || data.title,
            address: data.location,
            location: data.location,
            mapLink: data.raw?.map_link || data.raw?.mapLink,
            activityRealtimeStatus: data.activityRealtimeStatus,
            activityRatingAggregate: data.activityRatingAggregate,
            reviewCount: data.raw?.review_count || data.raw?.reviewCount,
            activityDurationEstimate: data.activityDurationEstimate,
            duration: data.duration,
            activityPriceTier: data.activityPriceTier,
            cost: data.cost,
            tags: data.raw?.tags || (data.raw?.vibe ? data.raw.vibe.split(',').map((t: string) => t.trim()) : []),
            vibe: data.raw?.vibe || userInput?.vibe,
            activityImageUrl: data.activityImageUrl,
            activityDistanceMi: data.activityDistanceMi,
            activityDriveTimeMin: data.activityDriveTimeMin,
          }}
        />
        
        {/* Refine Adventure Button */}
        {onRefineAdventure && (
          <div style={styles.refineAdventureContainer}>
            <button
              type="button"
              onClick={onRefineAdventure}
              style={styles.refineAdventureButton}
              aria-label="Refine adventure"
              disabled={loading}
            >
              Refine Adventure
            </button>
          </div>
        )}
      </div>
    );
  }

  // Fallback to original detailed display if card data not available
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

      {/* Optional Actions */}
      <div style={styles.actionsSection}>
        {onRegenerate && (
          <button
            type="button"
            onClick={onRegenerate}
            disabled={loading}
            style={{
              ...styles.actionButton,
              ...(loading ? styles.actionButtonDisabled : styles.actionButtonEnabled),
            }}
            aria-label="Regenerate recommendation"
          >
            {loading ? (
              <>
                <span style={styles.spinner}>⟳</span>
                <span>Regenerating...</span>
              </>
            ) : (
              'Regenerate'
            )}
          </button>
        )}
        {onRefineAdventure && (
          <button
            type="button"
            onClick={onRefineAdventure}
            disabled={loading}
            style={{
              ...styles.actionButton,
              ...(loading ? styles.actionButtonDisabled : styles.actionButtonSecondary),
            }}
            aria-label="Refine adventure"
          >
            Refine Adventure
          </button>
        )}
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
    position: 'relative',
  },
  containerNewlyGenerated: {
    animation: 'fadeInUp 0.6s ease-out',
  },
  successBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.625rem 1rem',
    backgroundColor: `var(--sdk-bg-accent, ${colors.bgAccent})`,
    border: `2px solid var(--sdk-primary-color, ${colors.primary})`,
    borderRadius: '8px',
    marginBottom: '1rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: `var(--sdk-primary-color, ${colors.primary})`,
    animation: 'slideInDown 0.4s ease-out',
  },
  successIcon: {
    width: '16px',
    height: '16px',
    color: `var(--sdk-primary-color, ${colors.primary})`,
    flexShrink: 0,
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
    border: `1px solid var(--sdk-border-color, ${colors.border})`,
    borderRadius: '0.5rem',
    transition: 'all 0.2s ease-in-out',
    outline: 'none',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  },
  actionButtonEnabled: {
    backgroundColor: 'var(--sdk-primary-color, ' + colors.primary + ')',
    color: 'var(--sdk-text-inverse, #ffffff)',
    borderColor: 'var(--sdk-primary-color, ' + colors.primary + ')',
    cursor: 'pointer',
    opacity: 1,
  },
  actionButtonDisabled: {
    backgroundColor: colors.bgHover,
    color: colors.textMuted,
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  spinner: {
    display: 'inline-block',
    animation: 'spin 1s linear infinite',
    fontSize: '1rem',
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
  refineAdventureContainer: {
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: `1px solid ${colors.border}`,
    textAlign: 'center',
  },
  refineAdventureButton: {
    backgroundColor: 'transparent',
    border: `2px solid var(--sdk-primary-color, ${colors.primary})`,
    color: 'var(--sdk-primary-color, ' + colors.primary + ')',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    padding: '0.625rem 1.25rem',
    borderRadius: '8px',
    transition: 'all 0.2s ease-in-out',
    outline: 'none',
  },
  actionButtonSecondary: {
    backgroundColor: 'transparent',
    color: 'var(--sdk-primary-color, ' + colors.primary + ')',
    borderColor: 'var(--sdk-primary-color, ' + colors.primary + ')',
    cursor: 'pointer',
    opacity: 1,
  },
};

// Add animations for newly generated recommendations
if (typeof document !== 'undefined') {
  const styleId = 'recommendation-display-animations';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes slideInDown {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .recommendation-newly-generated {
        animation: fadeInUp 0.6s ease-out;
      }
      .recommendation-result-container {
        scroll-margin-top: 20px;
      }
    `;
    if (document.head) {
      document.head.appendChild(style);
    }
  }
}

// Add hover effect and responsive styles
if (typeof document !== 'undefined') {
  const styleId = 'recommendation-display-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
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
        background-color: var(--sdk-bg-accent, ${colors.bgAccent}) !important;
        border-color: var(--sdk-hover-color, ${colors.hover}) !important;
        color: var(--sdk-hover-color, ${colors.hover}) !important;
      }
      [data-recommendation-display] button[aria-label="Suggest something nearby"]:focus {
        outline: 2px solid ${colors.primary};
        outline-offset: 2px;
      }
      /* Action Buttons hover */
      [data-recommendation-display] button[aria-label="Regenerate recommendation"]:not(:disabled):hover {
        background-color: var(--sdk-hover-color, ${colors.hover}) !important;
        transform: translateY(-1px);
      }
      [data-recommendation-display] button[aria-label="Refine adventure"]:not(:disabled):hover {
        background-color: var(--sdk-bg-accent, ${colors.bgAccent}) !important;
        border-color: var(--sdk-hover-color, ${colors.hover}) !important;
        color: var(--sdk-hover-color, ${colors.hover}) !important;
        transform: translateY(-1px);
      }
      [data-recommendation-display] button[aria-label="Regenerate recommendation"]:not(:disabled):focus,
      [data-recommendation-display] button[aria-label="Refine adventure"]:not(:disabled):focus {
        outline: 2px solid var(--sdk-primary-color, ${colors.primary});
        outline-offset: 2px;
      }
      /* Refine Adventure button hover */
      [data-recommendation-display] button[aria-label="Refine adventure"]:hover:not(:disabled) {
        background-color: var(--sdk-bg-accent, ${colors.bgAccent}) !important;
        border-color: var(--sdk-hover-color, ${colors.hover}) !important;
        color: var(--sdk-hover-color, ${colors.hover}) !important;
      }
      [data-recommendation-display] button[aria-label="Refine adventure"]:focus {
        outline: 2px solid var(--sdk-primary-color, ${colors.primary});
        outline-offset: 2px;
      }
      [data-recommendation-display] button[aria-label="Refine adventure"]:disabled {
        opacity: 0.6;
        cursor: not-allowed;
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

