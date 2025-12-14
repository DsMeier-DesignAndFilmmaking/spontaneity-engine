/**
 * FallbackRecommendationMockup.tsx
 * Pre-designed, compelling recommendation mockup displayed when AI engine fails.
 * 
 * Shows an ideal, high-value spontaneous scenario that demonstrates all required UI fields
 * and aligns with "Discover & Create" motivation category.
 */

import React from 'react';
import colors from '@/lib/design/colors';
import RecommendationCard from './RecommendationCard';
import SeeHowItWorksModal from './SeeHowItWorksModal';

export interface FallbackRecommendationMockupProps {
  onRefineAdventure?: () => void;
  failureReason?: string;
}

/**
 * FallbackRecommendationMockup component
 * Displays a compelling, static recommendation when AI engine fails
 */
export default function FallbackRecommendationMockup({
  onRefineAdventure,
  failureReason,
}: FallbackRecommendationMockupProps) {
  // Log the failure reason for debugging (only once, not on every render)
  React.useEffect(() => {
    if (failureReason) {
      // Use console.log instead of console.warn to reduce noise
      console.log('[Recommendation Fallback] Showing fallback mockup - Reason:', failureReason);
    }
  }, [failureReason]);

  // Static mockup data - universally appealing, open now, demonstrates all fields
  const mockupData = {
    activityName: 'Discover the Speakeasy History Walking Tour',
    activityDistanceMi: 0.8,
    activityDriveTimeMin: 3,
    activityDurationEstimate: '2 hours, starting now',
    activityRealtimeStatus: 'open' as const,
    activityRatingAggregate: 4.7,
    activityPriceTier: 2 as const, // $$ (Mid-Range)
    activityImageUrl: undefined, // No image for mockup
  };

  const handleShowTutorial = () => {
    // Could open a tutorial modal or scroll to help section
    console.log('[Fallback Mockup] Tutorial requested');
    if (onRefineAdventure) {
      onRefineAdventure();
    }
  };

  const [showHowItWorksModal, setShowHowItWorksModal] = React.useState(false);

  const handleSeeHowItWorks = () => {
    console.log('[Fallback Mockup] See How it Works clicked');
    setShowHowItWorksModal(true);
  };

  return (
    <div 
      style={styles.container}
      data-fallback-mockup
      className="recommendation-card mockup-state"
    >
      {/* Success Badge */}
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
        <span>Example Recommendation</span>
      </div>

      {/* Recommendation Card */}
      <RecommendationCard
        activityName={mockupData.activityName}
        activityDistanceMi={mockupData.activityDistanceMi}
        activityDriveTimeMin={mockupData.activityDriveTimeMin}
        activityDurationEstimate={mockupData.activityDurationEstimate}
        activityRealtimeStatus={mockupData.activityRealtimeStatus}
        activityRatingAggregate={mockupData.activityRatingAggregate}
        activityPriceTier={mockupData.activityPriceTier}
        activityImageUrl={mockupData.activityImageUrl}
        showImage={false}
        onDetailsClick={() => {
          // Show full description
          console.log('[Fallback Mockup] Details clicked');
        }}
        primaryActionLabel="Details"
        isNewlyGenerated={true}
        recommendationId="mockup-example"
        onRefineAdventure={onRefineAdventure}
        onCommitAdventure={() => {
          console.log('[Fallback Mockup] Adventure committed');
        }}
        detailsData={{
          activityName: mockupData.activityName,
          address: 'Denver, CO',
          location: 'Denver, CO',
          activityRealtimeStatus: mockupData.activityRealtimeStatus,
          activityRatingAggregate: mockupData.activityRatingAggregate,
          reviewCount: 127,
          activityDurationEstimate: mockupData.activityDurationEstimate,
          duration: mockupData.activityDurationEstimate,
          activityPriceTier: mockupData.activityPriceTier,
          cost: '$$',
          tags: ['History', 'Walking Tour', 'Cultural'],
          activityDistanceMi: mockupData.activityDistanceMi,
          activityDriveTimeMin: mockupData.activityDriveTimeMin,
        }}
      />

      {/* CTA Container */}
      <div style={styles.ctaContainer}>
        {onRefineAdventure && (
          <button
            type="button"
            onClick={handleShowTutorial}
            style={styles.secondaryButton}
            className="secondary-button"
            aria-label="Refine Adventure"
          >
            Refine Adventure
          </button>
        )}
        <button
          type="button"
          onClick={handleSeeHowItWorks}
          style={styles.primaryButton}
          aria-label="See How it Works"
        >
          See How it Works
        </button>
      </div>

      {/* See How It Works Modal */}
      <SeeHowItWorksModal
        isOpen={showHowItWorksModal}
        onClose={() => setShowHowItWorksModal(false)}
      />
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
  successBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.625rem 1rem',
    backgroundColor: `var(--sdk-bg-accent, ${colors.bgAccent})`,
    border: `2px solid var(--sdk-primary-color, ${colors.primary})`,
    borderRadius: '8px',
    marginBottom: '0.5rem',
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
  ctaContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    paddingTop: '1rem',
    borderTop: `1px solid var(--sdk-border-color, ${colors.border})`,
  },
  secondaryButton: {
    padding: '0.875rem 1.5rem',
    fontSize: '1rem',
    fontWeight: '600',
    backgroundColor: 'transparent',
    color: `var(--sdk-primary-color, ${colors.primary})`,
    border: `2px solid var(--sdk-primary-color, ${colors.primary})`,
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none',
  },
  primaryButton: {
    padding: '0.75rem 1.25rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    backgroundColor: 'transparent',
    color: `var(--sdk-text-secondary, ${colors.textSecondary})`,
    border: `1px solid var(--sdk-border-color, ${colors.border})`,
    borderRadius: '8px',
    cursor: 'pointer',
    opacity: 1,
    transition: 'all 0.2s',
    outline: 'none',
  },
};

// Add hover styles
if (typeof document !== 'undefined') {
  const styleId = 'fallback-mockup-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      [data-fallback-mockup] .secondary-button:hover:not(:disabled) {
        background-color: var(--sdk-bg-accent, ${colors.bgAccent}) !important;
        border-color: var(--sdk-hover-color, ${colors.hover}) !important;
        color: var(--sdk-hover-color, ${colors.hover}) !important;
      }
      [data-fallback-mockup] .secondary-button:focus {
        outline: 2px solid var(--sdk-primary-color, ${colors.primary});
        outline-offset: 2px;
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
    `;
    if (document.head) {
      document.head.appendChild(style);
    }
  }
}

