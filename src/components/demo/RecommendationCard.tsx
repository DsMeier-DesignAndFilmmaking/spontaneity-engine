/**
 * RecommendationCard.tsx
 * Atomic, high-impact recommendation card for quick decision-making.
 * 
 * Displays essential, actionable data in a compact, scannable format.
 */

import React, { useState } from 'react';
import colors from '@/lib/design/colors';
import RecommendationDetailsModal from './RecommendationDetailsModal';
import FallbackRecommendationMockup from './FallbackRecommendationMockup';

/**
 * Validates recommendation data to check if it's valid and properly formatted
 * Returns false if the recommendation should trigger the fallback mockup
 */
function isValidRecommendationCard(data: {
  activityName?: string;
  title?: string;
  activityRealtimeStatus?: 'open' | 'closed' | 'unknown';
  activityDurationEstimate?: string;
  location?: string;
}): boolean {
  // CRITICAL CHECK 1: Check for missing or unformatted title (parameter leakage)
  const displayTitle = data.activityName || data.title || '';
  if (!displayTitle || displayTitle.trim().length === 0) {
    console.error('[RecommendationCard Validation Failed] Missing title');
    return false;
  }
  
  // CRITICAL CHECK 2: Check for parameter leakage in title
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
    const isContextHeavy = displayTitle.split('[').length > 2;
    
    if (isOnlyContext || isContextHeavy) {
      console.error('[RecommendationCard Validation Failed] Raw parameter leakage detected in title:', displayTitle);
      return false;
    }
    
    // If title contains context but also has actual content, check if it has enough content
    const titleWords = displayTitle.split(' ').filter(w => !w.includes('[') && !w.includes('='));
    if (titleWords.length < 2) {
      console.error('[RecommendationCard Validation Failed] Title has insufficient content, mostly context metadata:', displayTitle);
      return false;
    }
  }
  
  // CRITICAL CHECK 3: Check for closed status
  if (data.activityRealtimeStatus === 'closed') {
    console.error('[RecommendationCard Validation Failed] Recommendation status is "Closed"');
    return false;
  }
  
  // All checks passed
  return true;
}

// Conditionally import useRouter - handle both Next.js and non-Next.js contexts
let useRouter: (() => any) | null = null;
if (typeof window !== 'undefined') {
  try {
    // Try to import Next.js router
    const nextRouter = require('next/router');
    if (nextRouter && nextRouter.useRouter) {
      useRouter = nextRouter.useRouter;
    }
  } catch (error) {
    // Next.js router not available - will use modal fallback
    console.log('[RecommendationCard] Next.js router not available, will use modal fallback');
  }
}

export interface RecommendationCardProps {
  // Core data elements
  activityName: string;
  activityDistanceMi?: number;
  activityDriveTimeMin?: number;
  activityDurationEstimate?: string;
  activityRealtimeStatus?: 'open' | 'closed' | 'unknown';
  activityRatingAggregate?: number; // 0-5 scale
  activityPriceTier?: 1 | 2 | 3 | 4; // $ to $$$$
  activityImageUrl?: string;
  showImage?: boolean; // Configurable via SDK
  onDetailsClick?: () => void;
  onPlanNowClick?: () => void;
  primaryActionLabel?: 'Details' | 'Plan Now';
  isNewlyGenerated?: boolean;
  recommendationId?: string; // Unique ID for navigation
  onRefineAdventure?: () => void; // For details modal
  onCommitAdventure?: () => void; // For details modal
  detailsData?: any; // Full data object for details modal
}

/**
 * Star rating component (5-star SVG)
 */
function StarRating({ rating = 0 }: { rating?: number }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  const primaryColor = `var(--sdk-primary-color, ${colors.primary})`;
  const borderColor = `var(--sdk-border-color, ${colors.border})`;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.125rem' }}>
      {Array.from({ length: fullStars }).map((_, i) => (
        <svg key={`full-${i}`} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
            fill={primaryColor}
            stroke={primaryColor}
            strokeWidth="1"
          />
        </svg>
      ))}
      {hasHalfStar && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <clipPath id="half-star">
              <rect x="0" y="0" width="12" height="24" />
            </clipPath>
          </defs>
          <path
            d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
            fill={primaryColor}
            stroke={primaryColor}
            strokeWidth="1"
            clipPath="url(#half-star)"
          />
          <path
            d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
            fill="none"
            stroke={borderColor}
            strokeWidth="1"
          />
        </svg>
      )}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <svg key={`empty-${i}`} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
            fill="none"
            stroke={borderColor}
            strokeWidth="1"
          />
        </svg>
      ))}
      {rating > 0 && (
        <span style={styles.ratingNumber}>{rating.toFixed(1)}</span>
      )}
    </div>
  );
}

/**
 * Price tier display ($ to $$$$)
 */
function PriceTier({ tier }: { tier?: 1 | 2 | 3 | 4 }) {
  if (!tier || tier < 1 || tier > 4) return null;
  
  const dollarSigns = '$'.repeat(tier);
  return <span style={styles.priceTier}>{dollarSigns}</span>;
}

/**
 * RecommendationCard component
 */
export default function RecommendationCard({
  activityName,
  activityDistanceMi,
  activityDriveTimeMin,
  activityDurationEstimate,
  activityRealtimeStatus = 'unknown',
  activityRatingAggregate,
  activityPriceTier,
  activityImageUrl,
  showImage = true, // Default to true, can be toggled via SDK config
  onDetailsClick,
  onPlanNowClick,
  primaryActionLabel = 'Details',
  isNewlyGenerated = false,
  recommendationId,
  onRefineAdventure,
  onCommitAdventure,
  detailsData,
}: RecommendationCardProps) {
  // Safely get router only on client side and if available
  let router: any = null;
  if (typeof window !== 'undefined' && useRouter) {
    try {
      router = useRouter();
    } catch (error) {
      // Router not available (e.g., in embedded widget context)
      console.log('[RecommendationCard] Router hook failed, using modal fallback');
    }
  }

  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const handleViewDetails = () => {
    console.log('[RecommendationCard] Details button clicked', { 
      recommendationId, 
      hasRouter: !!router,
      hasDetailsData: !!detailsData 
    });
    
    // Always open modal first (more reliable than routing)
    // Modal works in all contexts (embedded widget, Next.js page, etc.)
    console.log('[RecommendationCard] Opening details modal');
    setShowDetailsModal(true);
    
    // Optionally try router navigation in parallel (but don't wait for it)
    if (recommendationId && router && typeof router.push === 'function') {
      try {
        const targetPath = `/details/${recommendationId}`;
        // Store data in sessionStorage for the details page to access
        if (typeof window !== 'undefined' && detailsData) {
          sessionStorage.setItem(`recommendation_${recommendationId}`, JSON.stringify(detailsData));
        }
        // Note: We open the modal instead of navigating to provide immediate feedback
        // Router navigation can be slow or fail in embedded contexts
      } catch (error) {
        console.warn('[RecommendationCard] Router setup failed:', error);
      }
    }
    
    // Also call onDetailsClick if provided (for backward compatibility)
    if (onDetailsClick) {
      onDetailsClick();
    }
  };

  const handlePrimaryAction = () => {
    if (primaryActionLabel === 'Plan Now' && onPlanNowClick) {
      onPlanNowClick();
    } else if (primaryActionLabel === 'Details') {
      handleViewDetails();
    } else if (onDetailsClick) {
      onDetailsClick();
    }
  };

  // Validate recommendation data before rendering
  const cardData = {
    activityName,
    activityRealtimeStatus,
    activityDurationEstimate,
  };
  
  const isValid = isValidRecommendationCard(cardData);
  
  // If data is invalid, render fallback mockup
  if (!isValid) {
    console.warn('[RecommendationCard] Invalid data detected, rendering fallback mockup');
    return (
      <FallbackRecommendationMockup
        onRefineAdventure={onRefineAdventure}
        failureReason="Invalid recommendation data"
      />
    );
  }

  const isOpen = activityRealtimeStatus === 'open';
  const statusColor = isOpen ? colors.success : colors.error;

  return (
    <div 
      style={{
        ...styles.card,
        ...(isNewlyGenerated ? styles.cardNewlyGenerated : {}),
      }} 
      data-recommendation-card
      className={isNewlyGenerated ? 'recommendation-card-new' : ''}
    >
      {/* Optional Image */}
      {showImage && activityImageUrl && (
        <div style={styles.imageContainer}>
          <img
            src={activityImageUrl}
            alt={activityName}
            style={styles.image}
            onError={(e) => {
              // Hide image on error
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}

      <div style={styles.content}>
        {/* Title */}
        <h3 style={styles.title}>{activityName}</h3>

        {/* Metadata Row */}
        <div style={styles.metadataRow}>
          {/* Distance */}
          {(activityDistanceMi !== undefined || activityDriveTimeMin !== undefined) && (
            <div style={styles.metadataItem}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={styles.metadataIcon}>
                <path
                  d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z"
                  fill="currentColor"
                />
              </svg>
              <span style={styles.metadataText}>
                {activityDistanceMi !== undefined && `${activityDistanceMi.toFixed(1)} mi`}
                {activityDistanceMi !== undefined && activityDriveTimeMin !== undefined && ' or '}
                {activityDriveTimeMin !== undefined && `${activityDriveTimeMin} min drive`}
              </span>
            </div>
          )}

          {/* Duration */}
          {activityDurationEstimate && (
            <div style={styles.metadataItem}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={styles.metadataIcon}>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span style={styles.metadataText}>{activityDurationEstimate}</span>
            </div>
          )}

          {/* Status */}
          <div style={styles.metadataItem}>
            {isOpen ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ ...styles.metadataIcon, color: statusColor }}>
                <circle cx="12" cy="12" r="10" fill={statusColor} />
                <path d="M9 12L11 14L15 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ ...styles.metadataIcon, color: statusColor }}>
                <circle cx="12" cy="12" r="10" fill={statusColor} />
                <path d="M9 9L15 15M15 9L9 15" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
            <span style={{ ...styles.metadataText, color: statusColor, fontWeight: '600' }}>
              {isOpen ? 'Open Now' : 'Closed'}
            </span>
          </div>
        </div>

        {/* Rating and Price Row */}
        <div style={styles.ratingPriceRow}>
          {/* Rating */}
          {activityRatingAggregate !== undefined && activityRatingAggregate > 0 && (
            <div style={styles.ratingContainer}>
              <StarRating rating={activityRatingAggregate} />
            </div>
          )}

          {/* Price Tier */}
          {activityPriceTier && (
            <div style={styles.priceContainer}>
              <PriceTier tier={activityPriceTier} />
            </div>
          )}
        </div>

        {/* Primary CTA */}
        <button
          type="button"
          onClick={handlePrimaryAction}
          style={styles.primaryButton}
          aria-label={primaryActionLabel}
        >
          {primaryActionLabel}
        </button>
      </div>

      {/* Details Modal */}
      <RecommendationDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        data={detailsData || {
          activityName,
          activityDistanceMi,
          activityDriveTimeMin,
          activityDurationEstimate,
          activityRealtimeStatus,
          activityRatingAggregate,
          activityPriceTier,
          activityImageUrl,
          duration: activityDurationEstimate,
          location: undefined,
        }}
        onCommitAdventure={onCommitAdventure}
        onRefineAdventure={onRefineAdventure}
      />
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  card: {
    backgroundColor: 'var(--sdk-bg-color, ' + colors.bgPrimary + ')',
    border: `1px solid var(--sdk-border-color, ${colors.border})`,
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  cardNewlyGenerated: {
    border: `2px solid var(--sdk-primary-color, ${colors.primary})`,
    boxShadow: `0 4px 20px rgba(29, 66, 137, 0.15), 0 0 0 4px rgba(29, 66, 137, 0.05)`,
    animation: 'pulseGlow 2s ease-in-out',
  },
  imageContainer: {
    width: '100%',
    height: '200px',
    overflow: 'hidden',
    backgroundColor: 'var(--sdk-bg-hover, ' + colors.bgHover + ')',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  content: {
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: 'var(--sdk-text-color, ' + colors.textPrimary + ')',
    margin: 0,
    lineHeight: '1.3',
  },
  metadataRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem',
    alignItems: 'center',
  },
  metadataItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
  },
  metadataIcon: {
    width: '16px',
    height: '16px',
    color: 'var(--sdk-text-muted, ' + colors.textMuted + ')',
    flexShrink: 0,
  },
  metadataText: {
    fontSize: '0.875rem',
    color: 'var(--sdk-text-secondary, ' + colors.textSecondary + ')',
  },
  ratingPriceRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
  },
  ratingContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  ratingNumber: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--sdk-text-color, ' + colors.textPrimary + ')',
    marginLeft: '0.5rem',
  },
  priceContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  priceTier: {
    fontSize: '1rem',
    fontWeight: '600',
    color: 'var(--sdk-text-secondary, ' + colors.textSecondary + ')',
  },
  primaryButton: {
    width: '100%',
    padding: '0.875rem 1.5rem',
    fontSize: '1rem',
    fontWeight: '700',
    backgroundColor: 'var(--sdk-primary-color, ' + colors.primary + ')',
    color: 'var(--sdk-text-inverse, ' + colors.textInverse + ')',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    outline: 'none',
    marginTop: '0.5rem',
  },
};

// Add hover styles
if (typeof document !== 'undefined') {
  const styleId = 'recommendation-card-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
        style.textContent = `
      button[aria-label="Details"]:hover,
      button[aria-label="Plan Now"]:hover {
        background-color: var(--sdk-hover-color, ${colors.hover}) !important;
        transform: translateY(-1px);
      }
      button[aria-label="Details"]:focus,
      button[aria-label="Plan Now"]:focus {
        outline: 2px solid var(--sdk-primary-color, ${colors.primary});
        outline-offset: 2px;
      }
      .recommendation-card-new {
        animation: fadeInUp 0.6s ease-out, pulseGlow 2s ease-in-out;
      }
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
      @keyframes pulseGlow {
        0%, 100% {
          box-shadow: 0 4px 20px rgba(29, 66, 137, 0.15), 0 0 0 4px rgba(29, 66, 137, 0.05);
        }
        50% {
          box-shadow: 0 4px 20px rgba(29, 66, 137, 0.25), 0 0 0 4px rgba(29, 66, 137, 0.1);
        }
      }
    `;
    if (document.head) {
      document.head.appendChild(style);
    }
  }
}

