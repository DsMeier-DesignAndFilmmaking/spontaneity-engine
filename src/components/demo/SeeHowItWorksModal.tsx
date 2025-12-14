/**
 * SeeHowItWorksModal.tsx
 * Modal explaining the spontaneity engine's input-process-output loop.
 * 
 * Provides a simple, sequential explanation of how the engine works,
 * optimized for the widget environment.
 */

import React, { useEffect } from 'react';
import colors from '@/lib/design/colors';

export interface SeeHowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Reusable component for each step in the flow
 */
interface HowItWorksStepProps {
  number: number;
  title: string;
  description: string;
  icon: string;
}

function HowItWorksStep({ number, title, description, icon }: HowItWorksStepProps) {
  return (
    <div style={styles.step}>
      <div style={styles.stepNumberIcon}>
        <div style={styles.numberCircle}>{number}</div>
        <span style={styles.stepIcon}>{icon}</span>
      </div>
      <div style={styles.stepContent}>
        <h3 style={styles.stepTitle}>{title}</h3>
        <p style={styles.stepDescription}>{description}</p>
      </div>
    </div>
  );
}

/**
 * SeeHowItWorksModal component
 */
export default function SeeHowItWorksModal({
  isOpen,
  onClose,
}: SeeHowItWorksModalProps) {
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

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div style={styles.overlay} onClick={handleOverlayClick}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()} data-see-how-it-works-modal>
        {/* Header */}
        <div style={styles.header}>
          <h2 id="how-it-works-modal-title" style={styles.title}>
            How Your Next Adventure is Crafted
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={styles.closeButton}
            aria-label="Close"
            className="close-button"
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
        </div>

        {/* Content */}
        <div style={styles.content}>
          <div style={styles.stepFlowContainer}>
            <HowItWorksStep
              number={1}
              title="Set the Vibe"
              description="You define your spontaneous intention (like 'Local Skill') and set your constraints (Budget, Time, Energy) using Scenarios & Presets."
              icon="🧭"
            />
            
            <HowItWorksStep
              number={2}
              title="The Core AI Engine"
              description="Our Spontaneity Core AI instantly cross-references your inputs with thousands of real-time local data points (status, reviews, hours, traffic)."
              icon="🧠"
            />
            
            <HowItWorksStep
              number={3}
              title="Get Your Spontaneous Rec"
              description="We deliver a unique, ready-to-go activity—guaranteed to be open now and perfectly match your immediate spontaneous criteria."
              icon="💡"
            />
          </div>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <button
            type="button"
            onClick={onClose}
            style={styles.primaryButton}
            className="primary-button"
          >
            Got It! Start Exploring
          </button>
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
  },
  modal: {
    backgroundColor: 'var(--sdk-bg-color, ' + colors.bgPrimary + ')',
    borderRadius: '12px',
    maxWidth: '600px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1.5rem',
    borderBottom: `1px solid var(--sdk-border-color, ${colors.border})`,
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: 'var(--sdk-text-color, ' + colors.textPrimary + ')',
    margin: 0,
  },
  closeButton: {
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--sdk-text-muted, ' + colors.textMuted + ')',
    borderRadius: '6px',
    transition: 'all 0.2s',
    outline: 'none',
  },
  content: {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
  },
  stepFlowContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  step: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-start',
    paddingBottom: '1.25rem',
    borderBottom: `1px dashed var(--sdk-border-color, ${colors.border})`,
  },
  stepNumberIcon: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flexShrink: 0,
  },
  numberCircle: {
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: 'var(--sdk-primary-color, ' + colors.primary + ')',
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: '0.9rem',
    marginBottom: '0.25rem',
  },
  stepIcon: {
    fontSize: '1.8rem',
    lineHeight: 1,
    color: 'var(--sdk-text-secondary, ' + colors.textSecondary + ')',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: '1.1rem',
    margin: '0 0 0.25rem 0',
    color: 'var(--sdk-primary-color, ' + colors.primary + ')',
    fontWeight: '600',
  },
  stepDescription: {
    fontSize: '0.9rem',
    margin: 0,
    lineHeight: 1.4,
    color: 'var(--sdk-text-color, ' + colors.textPrimary + ')',
  },
  footer: {
    padding: '1.5rem',
    borderTop: `1px solid var(--sdk-border-color, ${colors.border})`,
    display: 'flex',
    justifyContent: 'center',
  },
  primaryButton: {
    padding: '0.875rem 1.5rem',
    fontSize: '1rem',
    fontWeight: '600',
    backgroundColor: 'var(--sdk-primary-color, ' + colors.primary + ')',
    color: 'var(--sdk-text-inverse, ' + colors.textInverse + ')',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none',
  },
};

// Add hover styles
if (typeof document !== 'undefined') {
  const styleId = 'see-how-it-works-modal-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      [data-see-how-it-works-modal] .close-button:hover {
        background-color: var(--sdk-bg-hover, ${colors.bgHover}) !important;
        color: var(--sdk-text-color, ${colors.textPrimary}) !important;
      }
      [data-see-how-it-works-modal] .primary-button:hover:not(:disabled) {
        background-color: var(--sdk-hover-color, ${colors.hover}) !important;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(29, 66, 137, 0.3) !important;
      }
      [data-see-how-it-works-modal] .primary-button:focus {
        outline: 2px solid var(--sdk-primary-color, ${colors.primary});
        outline-offset: 2px;
      }
    `;
    if (document.head) {
      document.head.appendChild(style);
    }
  }
}

