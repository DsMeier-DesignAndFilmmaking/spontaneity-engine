/**
 * RefineAdventureModal.tsx
 * Modal for refining generated recommendations with quick adjustments or new inspiration.
 * 
 * Provides two clear paths:
 * 1. Quick Adjustments: Minor parameter changes that auto-regenerate
 * 2. New Inspiration: Restart with a new scenario
 */

import React, { useState, useEffect } from 'react';
import colors from '@/lib/design/colors';

export interface RefineAdventureModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVibe?: string;
  currentTime?: string;
  currentLocation?: string;
  currentBudget?: 'low' | 'medium' | 'high' | '';
  onQuickAdjust: (adjustments: {
    vibe?: string;
    time?: string;
    location?: string;
    budget?: 'low' | 'medium' | 'high' | '';
  }) => void;
  onRestartScenarios: () => void;
  loading?: boolean;
}

const DURATION_OPTIONS = [
  { value: '1 hour', label: '1 hour' },
  { value: '2 hours', label: '2 hours' },
  { value: '3-4 hours', label: '3-4 hours' },
  { value: 'Half day', label: 'Half day' },
  { value: 'Full day', label: 'Full day' },
];

const BUDGET_OPTIONS = [
  { value: 'low', label: '$', description: 'Low budget' },
  { value: 'medium', label: '$$', description: 'Medium budget' },
  { value: 'high', label: '$$$', description: 'High budget' },
];

/**
 * RefineAdventureModal component
 */
export default function RefineAdventureModal({
  isOpen,
  onClose,
  currentVibe = '',
  currentTime = '',
  currentLocation = '',
  currentBudget = '',
  onQuickAdjust,
  onRestartScenarios,
  loading = false,
}: RefineAdventureModalProps) {
  const [vibe, setVibe] = useState(currentVibe);
  const [time, setTime] = useState(currentTime);
  const [location, setLocation] = useState(currentLocation);
  const [budget, setBudget] = useState<'low' | 'medium' | 'high' | ''>(currentBudget);

  // Update local state when props change
  useEffect(() => {
    setVibe(currentVibe);
    setTime(currentTime);
    setLocation(currentLocation);
    setBudget(currentBudget);
  }, [currentVibe, currentTime, currentLocation, currentBudget]);

  // Handle quick adjustments with auto-regeneration
  const handleApplyAdjustments = () => {
    onQuickAdjust({
      vibe: vibe !== currentVibe ? vibe : undefined,
      time: time !== currentTime ? time : undefined,
      location: location !== currentLocation ? location : undefined,
      budget: budget !== currentBudget ? budget : undefined,
    });
  };

  // Handle restart scenarios
  const handleRestart = () => {
    onClose();
    onRestartScenarios();
  };

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

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()} data-refine-modal>
        {/* Header */}
        <div style={styles.header}>
          <h2 id="refine-modal-title" style={styles.title}>
            Refine Adventure
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
          {/* Quick Adjustments Section */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Quick Adjustments</h3>
            <p style={styles.sectionSubtitle}>Change the Vibe, Not the Destination.</p>

            {/* Vibe Input */}
            <div style={styles.inputGroup}>
              <label htmlFor="refine-vibe" style={styles.label}>
                Vibe
              </label>
              <input
                id="refine-vibe"
                type="text"
                value={vibe}
                onChange={(e) => setVibe(e.target.value)}
                placeholder="e.g., chill, adventurous, creative"
                style={styles.textInput}
                disabled={loading}
              />
            </div>

            {/* Duration Select */}
            <div style={styles.inputGroup}>
              <label htmlFor="refine-duration" style={styles.label}>
                Duration
              </label>
              <select
                id="refine-duration"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                style={styles.select}
                disabled={loading}
              >
                <option value="">Select duration</option>
                {DURATION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Budget Select */}
            <div style={styles.inputGroup}>
              <label htmlFor="refine-budget" style={styles.label}>
                Budget
              </label>
              <div style={styles.budgetGroup}>
                {BUDGET_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setBudget(option.value as 'low' | 'medium' | 'high' | '')}
                    style={{
                      ...styles.budgetButton,
                      ...(budget === option.value ? styles.budgetButtonActive : {}),
                    }}
                    disabled={loading}
                    aria-pressed={budget === option.value}
                    className="budget-button"
                  >
                    <span style={styles.budgetLabel}>{option.label}</span>
                    <span style={styles.budgetDescription}>{option.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Location Input */}
            <div style={styles.inputGroup}>
              <label htmlFor="refine-location" style={styles.label}>
                Location
              </label>
              <input
                id="refine-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Denver, CO"
                style={styles.textInput}
                disabled={loading}
              />
            </div>

            {/* Apply Button */}
            <button
              type="button"
              onClick={handleApplyAdjustments}
              disabled={loading}
              style={{
                ...styles.applyButton,
                ...(loading ? styles.buttonDisabled : {}),
              }}
              className="apply-button"
            >
              {loading ? 'Regenerating...' : 'Apply & Regenerate'}
            </button>
          </section>

          {/* Divider */}
          <div style={styles.divider} />

          {/* New Inspiration Section */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Change Settings & Preferences</h3>
            <p style={styles.sectionSubtitle}>
              Open Settings & Preferences to choose a different scenario, adjust filters, or change your preferences.
            </p>
            <button
              type="button"
              onClick={handleRestart}
              style={styles.restartButton}
              disabled={loading}
              className="restart-button"
            >
              Open Settings & Preferences
            </button>
          </section>
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
    gap: '1.5rem',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: 'var(--sdk-text-color, ' + colors.textPrimary + ')',
    margin: 0,
  },
  sectionSubtitle: {
    fontSize: '0.9375rem',
    color: 'var(--sdk-text-secondary, ' + colors.textSecondary + ')',
    margin: 0,
    marginTop: '-0.5rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--sdk-text-color, ' + colors.textPrimary + ')',
  },
  textInput: {
    padding: '0.75rem',
    fontSize: '1rem',
    border: `1px solid var(--sdk-border-color, ${colors.border})`,
    borderRadius: '8px',
    backgroundColor: 'var(--sdk-bg-color, ' + colors.bgPrimary + ')',
    color: 'var(--sdk-text-color, ' + colors.textPrimary + ')',
    outline: 'none',
    transition: 'all 0.2s',
  },
  select: {
    padding: '0.75rem',
    fontSize: '1rem',
    border: `1px solid var(--sdk-border-color, ${colors.border})`,
    borderRadius: '8px',
    backgroundColor: 'var(--sdk-bg-color, ' + colors.bgPrimary + ')',
    color: 'var(--sdk-text-color, ' + colors.textPrimary + ')',
    outline: 'none',
    transition: 'all 0.2s',
    cursor: 'pointer',
  },
  budgetGroup: {
    display: 'flex',
    gap: '0.75rem',
  },
  budgetButton: {
    flex: 1,
    padding: '0.75rem',
    border: `1px solid var(--sdk-border-color, ${colors.border})`,
    borderRadius: '8px',
    backgroundColor: 'var(--sdk-bg-color, ' + colors.bgPrimary + ')',
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem',
  },
  budgetButtonActive: {
    backgroundColor: 'var(--sdk-bg-accent, ' + colors.bgAccent + ')',
    borderColor: 'var(--sdk-primary-color, ' + colors.primary + ')',
    borderWidth: '2px',
  },
  budgetLabel: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: 'var(--sdk-text-color, ' + colors.textPrimary + ')',
  },
  budgetDescription: {
    fontSize: '0.75rem',
    color: 'var(--sdk-text-secondary, ' + colors.textSecondary + ')',
  },
  applyButton: {
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
    marginTop: '0.5rem',
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  divider: {
    height: '1px',
    backgroundColor: 'var(--sdk-border-color, ' + colors.border + ')',
    margin: '0.5rem 0',
  },
  restartButton: {
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
    marginTop: '0.5rem',
  },
};

// Add hover styles
if (typeof document !== 'undefined') {
  const styleId = 'refine-adventure-modal-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      [data-refine-modal] button[type="button"]:not(:disabled):hover {
        opacity: 0.9;
      }
      [data-refine-modal] .close-button:hover {
        background-color: var(--sdk-bg-hover, ${colors.bgHover}) !important;
        color: var(--sdk-text-color, ${colors.textPrimary}) !important;
      }
      [data-refine-modal] input:focus,
      [data-refine-modal] select:focus {
        border-color: var(--sdk-primary-color, ${colors.primary}) !important;
        box-shadow: 0 0 0 3px rgba(29, 66, 137, 0.1) !important;
      }
      [data-refine-modal] .budget-button:hover:not([aria-pressed="true"]) {
        background-color: var(--sdk-bg-hover, ${colors.bgHover}) !important;
        border-color: var(--sdk-hover-color, ${colors.hover}) !important;
      }
      [data-refine-modal] .apply-button:hover:not(:disabled) {
        background-color: var(--sdk-hover-color, ${colors.hover}) !important;
      }
      [data-refine-modal] .restart-button:hover:not(:disabled) {
        background-color: var(--sdk-bg-accent, ${colors.bgAccent}) !important;
      }
    `;
    if (document.head) {
      document.head.appendChild(style);
    }
  }
}

