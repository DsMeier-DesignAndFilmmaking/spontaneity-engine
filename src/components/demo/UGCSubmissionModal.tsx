/**
 * UGCSubmissionModal.tsx
 * Minimal UGC submission interface for suggesting local ideas.
 * 
 * MVaP-safe: No social mechanics, no profiles, no public moderation UI.
 */

import React, { useState } from 'react';
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
  const [location, setLocation] = useState(defaultLocation);
  const [timing, setTiming] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

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

  const modalContent = (
    <>
      {/* Backdrop */}
      <div
        style={styles.backdrop}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div style={styles.modal} role="dialog" aria-labelledby="ugc-modal-title">
        <div style={styles.modalHeader}>
          <h2 id="ugc-modal-title" style={styles.modalTitle}>
            Suggest something nearby
          </h2>
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
          {/* Field 1: What's the idea? */}
          <div style={styles.fieldGroup}>
            <label htmlFor="ugc-idea" style={styles.label}>
              What's the idea?
            </label>
            <textarea
              id="ugc-idea"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Example: Sunset view from the hill behind the old fort"
              style={styles.textarea}
              maxLength={200}
              rows={4}
              required
              disabled={isSubmitting}
            />
            <div style={styles.characterCount}>
              {idea.length}/200
            </div>
          </div>

          {/* Field 2: Location */}
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

          {/* Field 3: Timing (optional) */}
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
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  modal: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '90vh',
    backgroundColor: colors.bgPrimary,
    borderTopLeftRadius: '1rem',
    borderTopRightRadius: '1rem',
    boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem',
    borderBottom: `1px solid ${colors.border}`,
  },
  modalTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: colors.textPrimary,
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
      #ugc-location:focus,
      #ugc-timing:focus {
        border-color: ${colors.primary} !important;
        box-shadow: 0 0 0 3px rgba(15, 82, 186, 0.1) !important;
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

