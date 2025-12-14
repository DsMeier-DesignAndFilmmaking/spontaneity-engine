/**
 * RecommendationDetailsModal.tsx
 * Modal-based details view for recommendations (works without routing).
 * 
 * Can be used as a fallback when Next.js router is not available,
 * or as the primary details view in embedded widget contexts.
 */

import React, { useEffect } from 'react';
import GeneratedRecommendationDetailsPage from './GeneratedRecommendationDetailsPage';
import colors from '@/lib/design/colors';

export interface RecommendationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
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
}

export default function RecommendationDetailsModal({
  isOpen,
  onClose,
  data,
  onCommitAdventure,
  onRefineAdventure,
}: RecommendationDetailsModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCommitAdventure = () => {
    if (onCommitAdventure) {
      onCommitAdventure();
    }
    onClose();
  };

  const handleRefineAdventure = () => {
    if (onRefineAdventure) {
      onRefineAdventure();
    }
    onClose();
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()} data-recommendation-details-modal>
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={styles.closeButton}
          className="close-button"
          aria-label="Close details"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M18 6L6 18M6 6L18 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Details Content */}
        <div style={styles.content}>
          <GeneratedRecommendationDetailsPage
            data={data}
            onCommitAdventure={handleCommitAdventure}
            onRefineAdventure={handleRefineAdventure}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    padding: '1rem',
    overflowY: 'auto',
  },
  modal: {
    position: 'relative',
    backgroundColor: 'var(--sdk-bg-color, ' + colors.bgPrimary + ')',
    borderRadius: '12px',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    margin: 'auto',
  },
  closeButton: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    color: 'var(--sdk-text-muted, ' + colors.textMuted + ')',
    transition: 'all 0.2s',
    outline: 'none',
    zIndex: 10001,
  },
  content: {
    padding: '0',
    maxHeight: 'calc(90vh - 2rem)',
    overflowY: 'auto',
  },
};

// Add hover styles
if (typeof document !== 'undefined') {
  const styleId = 'recommendation-details-modal-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      [data-recommendation-details-modal] .close-button:hover {
        background-color: var(--sdk-bg-hover, ${colors.bgHover}) !important;
        color: var(--sdk-text-color, ${colors.textPrimary}) !important;
      }
      [data-recommendation-details-modal] .close-button:focus {
        outline: 2px solid var(--sdk-primary-color, ${colors.primary});
        outline-offset: 2px;
      }
    `;
    if (document.head) {
      document.head.appendChild(style);
    }
  }
}

