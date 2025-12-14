/**
 * UGCSubmissionModal.tsx
 * Minimal UGC submission interface for suggesting local ideas.
 * 
 * MVaP-safe: No social mechanics, no profiles, no public moderation UI.
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import colors from '@/lib/design/colors';

export interface UGCSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultLocation?: string;
}

/**
 * UGCSubmissionModal component
 */
export default function UGCSubmissionModal({
  isOpen,
  onClose,
  defaultLocation = '',
}: UGCSubmissionModalProps) {
  const [idea, setIdea] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(defaultLocation);
  const [timing, setTiming] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(typeof window !== 'undefined' && window.innerWidth < 640);
    };
    
    checkMobile();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!idea.trim() || idea.trim().length === 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit UGC to API
      const response = await fetch('/api/ugc/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idea: idea.trim(),
          description: description.trim(),
          location: location.trim() || 'Nearby',
          timing: timing || 'Today',
        }),
      });

      if (response.ok) {
        // Optimistic UI: Show toast and close
        setShowToast(true);
        setTimeout(() => {
          setShowToast(false);
          onClose();
          // Reset form
          setIdea('');
          setDescription('');
          setLocation(defaultLocation);
          setTiming('');
          setIsSubmitting(false);
        }, 2000);
      } else {
        // Silent fail - just close
        setIsSubmitting(false);
        onClose();
      }
    } catch (error) {
      // Silent fail - just close
      console.error('UGC submission error:', error);
      setIsSubmitting(false);
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Combine modal styles with mobile-specific adjustments
  const modalStyles: React.CSSProperties = {
    ...styles.modal,
    ...(isMobile ? styles.modalMobile : {}),
  };

  const backdropStyles: React.CSSProperties = {
    ...styles.backdrop,
    ...(isMobile ? styles.backdropMobile : {}),
  };

  const modalContent = (
    <>
      {/* Backdrop */}
      <div
        style={backdropStyles}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div style={modalStyles} role="dialog" aria-labelledby="ugc-modal-title">
        <div style={styles.modalHeader}>
          <div style={styles.headerContent}>
            <h2 id="ugc-modal-title" style={styles.modalTitle}>
              Share Your Spontaneous Idea
            </h2>
            <p style={styles.modalSubtext}>
              Help others spark their next adventure. Submit a quick activity for the community to discover.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={styles.closeButton}
            aria-label="Close"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Field 1: Spontaneous Headline */}
          <div style={styles.fieldGroup}>
            <label htmlFor="ugc-idea" style={styles.label}>
              Spontaneous Headline
            </label>
            <textarea
              id="ugc-idea"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Example: Sunset view from the hill behind the old fort"
              style={styles.textarea}
              maxLength={200}
              rows={3}
              required
              disabled={isSubmitting}
            />
            <div style={styles.characterCount}>
              {idea.length}/200
            </div>
          </div>

          {/* Field 2: Description (optional) */}
          <div style={styles.fieldGroup}>
            <label htmlFor="ugc-description" style={styles.label}>
              Description <span style={styles.optional}>(optional)</span>
            </label>
            <textarea
              id="ugc-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details about this spontaneous idea..."
              style={styles.textarea}
              maxLength={500}
              rows={4}
              disabled={isSubmitting}
            />
            <div style={styles.characterCount}>
              {description.length}/500
            </div>
          </div>

          {/* Field 3: Location */}
          <div style={styles.fieldGroup}>
            <label htmlFor="ugc-location" style={styles.label}>
              Location
            </label>
            <input
              id="ugc-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Auto-filled from your search"
              style={styles.input}
              disabled={isSubmitting}
            />
          </div>

          {/* Field 4: Timing (optional) */}
          <div style={styles.fieldGroup}>
            <label htmlFor="ugc-timing" style={styles.label}>
              Timing <span style={styles.optional}>(optional)</span>
            </label>
            <select
              id="ugc-timing"
              value={timing}
              onChange={(e) => setTiming(e.target.value)}
              style={styles.select}
              disabled={isSubmitting}
            >
              <option value="">Select timing</option>
              <option value="Happening now">Happening now</option>
              <option value="Today">Today</option>
              <option value="This week">This week</option>
            </select>
          </div>

          {/* Safety Microcopy */}
          <p style={styles.safetyText}>
            Suggestions are reviewed automatically for safety and relevance.
          </p>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!idea.trim() || isSubmitting}
            style={{
              ...styles.submitButton,
              ...((!idea.trim() || isSubmitting) ? styles.submitButtonDisabled : {}),
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit idea'}
          </button>
        </form>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div style={styles.toast} role="status" aria-live="polite">
          Thanks — your idea may help others discover something local.
        </div>
      )}
    </>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
}

const styles: { [key: string]: React.CSSProperties } = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 9998,
  },
  backdropMobile: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modal: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: colors.bgPrimary,
    borderRadius: '12px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
    zIndex: 9999,
    maxWidth: '540px', // Match Settings modal width
    width: '90%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  modalMobile: {
    width: '100%',
    maxHeight: '90vh',
    borderRadius: '16px 16px 0 0',
    top: 'auto',
    bottom: 0,
    left: 0,
    transform: 'none',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '1.5rem',
    borderBottom: `1px solid ${colors.border}`,
    gap: '1rem',
  },
  headerContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  modalTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: colors.textPrimary,
    margin: 0,
  },
  modalSubtext: {
    fontSize: '0.875rem',
    color: colors.textSecondary,
    lineHeight: '1.5',
    margin: 0,
  },
  closeButton: {
    backgroundColor: 'transparent',
    border: 'none',
    padding: '0.5rem',
    cursor: 'pointer',
    color: colors.textMuted,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '0.375rem',
    transition: 'background-color 0.2s',
    outline: 'none',
  },
  form: {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    overflowY: 'auto',
    flex: 1,
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: colors.textPrimary,
  },
  optional: {
    fontSize: '0.875rem',
    fontWeight: '400',
    color: colors.textMuted,
  },
  textarea: {
    padding: '0.75rem',
    fontSize: '1rem',
    border: `2px solid ${colors.border}`,
    borderRadius: '0.5rem',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'inherit',
    resize: 'vertical',
    backgroundColor: colors.bgPrimary,
    color: colors.textPrimary,
  },
  input: {
    padding: '0.75rem',
    fontSize: '1rem',
    border: `2px solid ${colors.border}`,
    borderRadius: '0.5rem',
    outline: 'none',
    transition: 'border-color 0.2s',
    backgroundColor: colors.bgPrimary,
    color: colors.textPrimary,
  },
  select: {
    padding: '0.75rem 1rem',
    fontSize: '1rem',
    border: `2px solid ${colors.border}`,
    borderRadius: '0.5rem',
    outline: 'none',
    transition: 'border-color 0.2s',
    backgroundColor: colors.bgPrimary,
    color: colors.textPrimary,
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6 9L12 15L18 9' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 1rem center',
    backgroundSize: '20px 20px',
    paddingRight: '3rem',
  },
  characterCount: {
    fontSize: '0.75rem',
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: '-0.25rem',
  },
  safetyText: {
    fontSize: '0.8125rem',
    color: colors.textMuted,
    margin: 0,
    lineHeight: '1.5',
    fontStyle: 'italic',
  },
  submitButton: {
    padding: '0.875rem 2rem',
    fontSize: '1rem',
    fontWeight: '600',
    backgroundColor: colors.primary,
    color: colors.textInverse,
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    outline: 'none',
    marginTop: '0.5rem',
  },
  submitButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  toast: {
    position: 'fixed',
    bottom: '1rem',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '1rem 1.5rem',
    backgroundColor: colors.textPrimary,
    color: colors.textInverse,
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    zIndex: 10000,
    fontSize: '0.875rem',
    maxWidth: '90vw',
    textAlign: 'center',
  },
};

// Add hover and focus styles
if (typeof document !== 'undefined') {
  const styleId = 'ugc-submission-modal-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      #ugc-idea:focus,
      #ugc-description:focus,
      #ugc-location:focus,
      #ugc-timing:focus {
        border-color: ${colors.primary} !important;
        box-shadow: 0 0 0 3px rgba(29, 66, 137, 0.1) !important;
      }
      button[aria-label="Close"]:hover {
        background-color: ${colors.bgHover} !important;
      }
      button[type="submit"]:not(:disabled):hover {
        background-color: ${colors.hover} !important;
      }
    `;
    if (document.head) {
      document.head.appendChild(style);
    }
  }
}

