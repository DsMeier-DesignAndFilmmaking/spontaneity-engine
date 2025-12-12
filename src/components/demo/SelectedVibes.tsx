/**
 * SelectedVibes.tsx
 * Selected vibes display component.
 * 
 * UI-only component that displays currently selected vibes as chips.
 * Horizontally scrollable on mobile for better UX.
 */

import React from 'react';

export interface SelectedVibesProps {
  vibes: string[]; // Array of selected vibe strings
  onRemove: (vibe: string) => void; // Called when a vibe chip's X is clicked
  disabled?: boolean;
}

/**
 * SelectedVibes component - Display selected vibes as chips.
 * 
 * UI-only: Reads from existing state, provides remove functionality.
 */
export default function SelectedVibes({ vibes, onRemove, disabled = false }: SelectedVibesProps) {
  if (vibes.length === 0) {
    return null;
  }

  return (
    <div style={styles.container} data-selected-vibes>
      <label style={styles.label}>Selected Vibes</label>
      <div style={styles.chipsContainer}>
        {vibes.map((vibe, index) => (
          <div key={index} style={styles.chip}>
            <span style={styles.chipText}>{vibe}</span>
            {!disabled && (
              <button
                type="button"
                onClick={() => onRemove(vibe)}
                style={styles.chipRemove}
                aria-label={`Remove ${vibe}`}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    marginBottom: '1.25rem',
  },
  label: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '0.5rem',
  },
  chipsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    // Horizontal scroll on mobile
    overflowX: 'auto',
    paddingBottom: '0.25rem',
    // Hide scrollbar but keep functionality
    scrollbarWidth: 'thin',
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.5rem 0.75rem',
    backgroundColor: '#667eea',
    color: '#ffffff',
    borderRadius: '9999px',
    fontSize: '0.875rem',
    fontWeight: '500',
    flexShrink: 0,
    minHeight: '44px', // WCAG touch target size
  },
  chipText: {
    whiteSpace: 'nowrap',
    maxWidth: '200px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  chipRemove: {
    background: 'none',
    border: 'none',
    color: '#ffffff',
    fontSize: '1.25rem',
    lineHeight: '1',
    cursor: 'pointer',
    padding: '0.125rem',
    marginLeft: '0.125rem',
    outline: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '24px',
    minHeight: '24px',
    borderRadius: '50%',
    transition: 'background-color 0.2s',
  },
};

// Add hover effects and mobile scroll styling
if (typeof document !== 'undefined') {
  const styleId = 'selected-vibes-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      button[aria-label^="Remove"]:hover {
        background-color: rgba(255, 255, 255, 0.2) !important;
      }
      button[aria-label^="Remove"]:focus {
        outline: 2px solid #ffffff;
        outline-offset: 2px;
      }
      /* Mobile horizontal scroll */
      @media (max-width: 640px) {
        [data-selected-vibes] > div {
          flex-wrap: nowrap !important;
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch;
        }
      }
      /* Hide scrollbar on webkit browsers */
      [data-selected-vibes] > div::-webkit-scrollbar {
        height: 4px;
      }
      [data-selected-vibes] > div::-webkit-scrollbar-track {
        background: #f3f4f6;
        border-radius: 2px;
      }
      [data-selected-vibes] > div::-webkit-scrollbar-thumb {
        background: #d1d5db;
        border-radius: 2px;
      }
    `;
    if (document.head) {
      document.head.appendChild(style);
    }
  }
}

