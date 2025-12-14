/**
 * GeneratedRecommendationDetailsPage.tsx
 * High-impact details view for spontaneous activity recommendations.
 * 
 * Three-zone architecture:
 * - Zone I: Summary Header (Identity & Status)
 * - Zone II: Core Logistics (Decision Factors)
 * - Zone III: Action Center (Commitment & Refinement) - Sticky Footer
 */

import React from 'react';
import colors from '@/lib/design/colors';
import { trackEvent } from '@/lib/analytics/trackEvent';

export interface GeneratedRecommendationDetailsPageProps {
  data: {
    title?: string;
    activityName?: string;
    address?: string;
    location?: string;
    mapLink?: string;
    activityRealtimeStatus?: 'open' | 'closed' | 'unknown';
    activityRatingAggregate?: number;
    reviewCount?: number;
    activityDurationEstimate?: string;
    duration?: string;
    activityPriceTier?: 1 | 2 | 3 | 4;
    cost?: string;
    tags?: string[];
    vibe?: string;
    activityImageUrl?: string;
    activityDistanceMi?: number;
    activityDriveTimeMin?: number;
  };
  onCommitAdventure?: () => void;
  onRefineAdventure?: () => void;
  onClose?: () => void;
}

/**
 * Star Rating Component (reused from RecommendationCard pattern)
 */
function StarRating({ rating = 0, count }: { rating?: number; count?: number }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  const primaryColor = `var(--sdk-primary-color, ${colors.primary})`;
  const borderColor = `var(--sdk-border-color, ${colors.border})`;

  return (
    <div style={starRatingStyles.container}>
      {Array.from({ length: fullStars }).map((_, i) => (
        <svg key={`full-${i}`} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
            fill={primaryColor}
            stroke={primaryColor}
            strokeWidth="1"
          />
        </svg>
      ))}
      {hasHalfStar && (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <clipPath id="half-star-details">
              <rect x="0" y="0" width="12" height="24" />
            </clipPath>
          </defs>
          <path
            d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
            fill={primaryColor}
            stroke={primaryColor}
            strokeWidth="1"
            clipPath="url(#half-star-details)"
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
        <svg key={`empty-${i}`} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
            fill="none"
            stroke={borderColor}
            strokeWidth="1"
          />
        </svg>
      ))}
      {rating > 0 && (
        <span style={starRatingStyles.ratingNumber}>{rating.toFixed(1)}</span>
      )}
      {count !== undefined && count > 0 && (
        <span style={starRatingStyles.reviewCount}>({count})</span>
      )}
    </div>
  );
}

/**
 * Status Pill Component
 */
function StatusPill({ status }: { status?: 'open' | 'closed' | 'unknown' }) {
  const isOpen = status === 'open';
  const statusColor = isOpen ? colors.success : colors.error;
  const statusText = isOpen ? 'Open Now' : status === 'closed' ? 'Closed' : 'Unknown';

  return (
    <div style={{ ...statusPillStyles.pill, backgroundColor: statusColor + '20', color: statusColor }}>
      <div style={{ ...statusPillStyles.dot, backgroundColor: statusColor }} />
      <span>{statusText}</span>
    </div>
  );
}

/**
 * Map Snippet Component (Static placeholder for map/photo)
 */
function MapSnippet({ location, address, distanceMi, driveTimeMin }: { 
  location?: string; 
  address?: string;
  distanceMi?: number;
  driveTimeMin?: number;
}) {
  const displayLocation = address || location || 'Location';
  
  return (
    <div style={mapSnippetStyles.container}>
      <div style={mapSnippetStyles.placeholder}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z"
            fill={colors.textMuted}
          />
        </svg>
      </div>
      <div style={mapSnippetStyles.info}>
        <div style={mapSnippetStyles.locationText}>{displayLocation}</div>
        {(distanceMi !== undefined || driveTimeMin !== undefined) && (
          <div style={mapSnippetStyles.distanceText}>
            {distanceMi !== undefined && `${distanceMi.toFixed(1)} mi`}
            {distanceMi !== undefined && driveTimeMin !== undefined && ' • '}
            {driveTimeMin !== undefined && `${driveTimeMin} min drive`}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Vibe Tag Component
 */
function VibeTag({ label }: { label: string }) {
  return (
    <span style={vibeTagStyles.tag}>{label}</span>
  );
}

/**
 * GeneratedRecommendationDetailsPage Component
 */
export default function GeneratedRecommendationDetailsPage({
  data,
  onCommitAdventure,
  onRefineAdventure,
  onClose,
}: GeneratedRecommendationDetailsPageProps) {
  // Extract and normalize data
  const title = data.activityName || data.title || 'Activity';
  const address = data.address || data.location || '';
  const status = data.activityRealtimeStatus || 'unknown';
  const rating = data.activityRatingAggregate;
  const reviewCount = data.reviewCount;
  const duration = data.activityDurationEstimate || data.duration || '';
  
  // Format budget
  const budgetFormatted = data.activityPriceTier 
    ? '$'.repeat(data.activityPriceTier)
    : data.cost || '';
  
  // Extract tags from vibe or tags array
  const tags = data.tags || (data.vibe ? data.vibe.split(',').map(t => t.trim()).filter(Boolean) : []);
  
  // Generate map link if address is available
  const mapLink = data.mapLink || (address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : '');

  const handleCommitAdventure = () => {
    trackEvent('cta_click', {
      cta_name: 'commit_adventure',
      activity_name: title,
      timestamp: Date.now(),
    });
    if (onCommitAdventure) {
      onCommitAdventure();
    }
  };

  const handleOpenRefineModal = () => {
    trackEvent('cta_click', {
      cta_name: 'refine_adventure_from_details',
      timestamp: Date.now(),
    });
    if (onRefineAdventure) {
      onRefineAdventure();
    }
  };

  return (
    <div style={styles.page} data-recommendation-details-page>
      {/* Zone I: Summary Header */}
      <section style={styles.summaryHeader}>
        <div style={styles.mediaAndStatus}>
          <MapSnippet 
            location={address} 
            address={address}
            distanceMi={data.activityDistanceMi}
            driveTimeMin={data.activityDriveTimeMin}
          />
          <StatusPill status={status} />
        </div>
        <h1 style={styles.title}>{title}</h1>
        {rating !== undefined && rating > 0 && (
          <div style={styles.rating}>
            <StarRating rating={rating} count={reviewCount} />
          </div>
        )}
      </section>

      {/* Zone II: Core Logistics */}
      <section style={styles.coreLogistics}>
        <h2 style={styles.sectionTitle}>Logistics at a Glance</h2>
        
        {/* Duration */}
        {duration && (
          <div style={styles.detailRow}>
            <span style={styles.icon}>🕰️</span>
            <span style={styles.label}>Duration:</span>
            <span style={styles.value}>{duration}</span>
          </div>
        )}
        
        {/* Budget */}
        {budgetFormatted && (
          <div style={styles.detailRow}>
            <span style={styles.icon}>💰</span>
            <span style={styles.label}>Budget:</span>
            <span style={styles.value}>{budgetFormatted}</span>
          </div>
        )}
        
        {/* Location & Directions */}
        {address && (
          <div style={styles.detailRow}>
            <span style={styles.icon}>📍</span>
            <span style={styles.label}>Location:</span>
            <span style={styles.value}>{address}</span>
            {mapLink && (
              <a 
                href={mapLink} 
                target="_blank" 
                rel="noopener noreferrer"
                style={styles.directionsLink}
                className="directions-link"
              >
                Get Directions
              </a>
            )}
          </div>
        )}

        {/* Vibe Tags */}
        {tags.length > 0 && (
          <div style={styles.vibeTagsContainer}>
            {tags.map((tag, index) => (
              <VibeTag key={index} label={tag} />
            ))}
          </div>
        )}
      </section>

      {/* Zone III: Action Center (Sticky Footer) */}
      <section style={styles.actionCenter}>
        <button
          type="button"
          onClick={handleCommitAdventure}
          style={styles.primaryButton}
          className="primary-button"
          aria-label="Go on this adventure"
        >
          Go On This Adventure!
        </button>
        {onRefineAdventure && (
          <button
            type="button"
            onClick={handleOpenRefineModal}
            style={styles.secondaryButton}
            className="secondary-button"
            aria-label="Refine adventure"
          >
            Refine Adventure
          </button>
        )}
      </section>
    </div>
  );
}

// Styles
const styles: { [key: string]: React.CSSProperties } = {
  page: {
    maxWidth: '400px',
    margin: '0 auto',
    paddingBottom: '100px', // Space for sticky footer
    backgroundColor: 'var(--sdk-bg-color, ' + colors.bgPrimary + ')',
    minHeight: 'calc(100vh - 2rem)', // Account for modal padding
  },
  summaryHeader: {
    padding: '1rem',
    borderBottom: `1px solid var(--sdk-border-color, ${colors.border})`,
  },
  mediaAndStatus: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
    gap: '1rem',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: 'var(--sdk-text-color, ' + colors.textPrimary + ')',
    margin: '0.5rem 0',
    lineHeight: '1.3',
  },
  rating: {
    marginTop: '0.5rem',
  },
  coreLogistics: {
    padding: '1rem',
  },
  sectionTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: 'var(--sdk-text-color, ' + colors.textPrimary + ')',
    margin: '0 0 1rem 0',
  },
  detailRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '0.75rem',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  icon: {
    fontSize: '1.2rem',
    lineHeight: '1',
  },
  label: {
    fontSize: '0.9375rem',
    fontWeight: '600',
    color: 'var(--sdk-text-secondary, ' + colors.textSecondary + ')',
    minWidth: '80px',
  },
  value: {
    fontSize: '0.9375rem',
    color: 'var(--sdk-text-color, ' + colors.textPrimary + ')',
    flex: 1,
  },
  directionsLink: {
    marginLeft: 'auto',
    fontSize: '0.875rem',
    color: 'var(--sdk-primary-color, ' + colors.primary + ')',
    textDecoration: 'none',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  vibeTagsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginTop: '1rem',
  },
  actionCenter: {
    position: 'sticky',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'var(--sdk-bg-color, ' + colors.bgPrimary + ')',
    padding: '0.75rem 1rem',
    boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    gap: '0.625rem',
    zIndex: 1000,
    marginTop: '1rem',
    borderRadius: '0 0 12px 12px',
  },
  primaryButton: {
    flex: 1,
    padding: '0.875rem 1.5rem',
    fontSize: '1rem',
    fontWeight: '700',
    backgroundColor: 'var(--sdk-primary-color, ' + colors.primary + ')',
    color: 'var(--sdk-text-inverse, ' + colors.textInverse + ')',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none',
  },
  secondaryButton: {
    flex: 1,
    padding: '0.875rem 1.5rem',
    fontSize: '1rem',
    fontWeight: '600',
    backgroundColor: 'transparent',
    color: 'var(--sdk-primary-color, ' + colors.primary + ')',
    border: `2px solid var(--sdk-primary-color, ${colors.primary})`,
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none',
  },
};

const starRatingStyles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  ratingNumber: {
    fontSize: '0.9375rem',
    fontWeight: '600',
    color: 'var(--sdk-text-color, ' + colors.textPrimary + ')',
    marginLeft: '0.5rem',
  },
  reviewCount: {
    fontSize: '0.875rem',
    color: 'var(--sdk-text-secondary, ' + colors.textSecondary + ')',
    marginLeft: '0.25rem',
  },
};

const statusPillStyles: { [key: string]: React.CSSProperties } = {
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.375rem 0.75rem',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: '600',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
};

const mapSnippetStyles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flex: 1,
  },
  placeholder: {
    width: '80px',
    height: '80px',
    backgroundColor: 'var(--sdk-bg-hover, ' + colors.bgHover + ')',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  locationText: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--sdk-text-color, ' + colors.textPrimary + ')',
    marginBottom: '0.25rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  distanceText: {
    fontSize: '0.8125rem',
    color: 'var(--sdk-text-secondary, ' + colors.textSecondary + ')',
  },
};

const vibeTagStyles: { [key: string]: React.CSSProperties } = {
  tag: {
    display: 'inline-block',
    padding: '0.375rem 0.75rem',
    backgroundColor: 'var(--sdk-bg-accent, ' + colors.bgAccent + ')',
    color: 'var(--sdk-primary-color, ' + colors.primary + ')',
    borderRadius: '6px',
    fontSize: '0.8125rem',
    fontWeight: '500',
  },
};

// Add hover styles for buttons
if (typeof document !== 'undefined') {
  const styleId = 'recommendation-details-page-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      [data-recommendation-details-page] .primary-button:hover:not(:disabled) {
        background-color: var(--sdk-hover-color, ${colors.hover}) !important;
        transform: translateY(-1px);
      }
      [data-recommendation-details-page] .secondary-button:hover:not(:disabled) {
        background-color: var(--sdk-bg-accent, ${colors.bgAccent}) !important;
        border-color: var(--sdk-hover-color, ${colors.hover}) !important;
        color: var(--sdk-hover-color, ${colors.hover}) !important;
      }
      [data-recommendation-details-page] .directions-link:hover {
        text-decoration: underline;
        color: var(--sdk-hover-color, ${colors.hover}) !important;
      }
      [data-recommendation-details-page] .primary-button:focus,
      [data-recommendation-details-page] .secondary-button:focus {
        outline: 2px solid var(--sdk-primary-color, ${colors.primary});
        outline-offset: 2px;
      }
    `;
    if (document.head) {
      document.head.appendChild(style);
    }
  }
}

