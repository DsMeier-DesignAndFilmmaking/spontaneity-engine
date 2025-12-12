/**
 * VibeChipsSelector.tsx
 * Chip-based vibe selector component.
 * 
 * UI-only component - all vibes displayed as tappable chips.
 * Converts selection to comma-separated string for existing logic.
 */

import React from 'react';

export interface VibeChipsSelectorProps {
  value: string; // Current value as comma-separated string
  onChange: (value: string) => void; // Called with comma-separated string
  disabled?: boolean;
}

const VIBE_OPTIONS = [
  'Adventurous',
  'Relaxed',
  'Creative',
  'Art',
  'Outdoors',
  'Food',
  'Culture',
  'Nightlife',
  'Family-friendly',
  'Romantic',
  'Social',
  'Solo',
];

/**
 * VibeChipsSelector component - Chip-based multi-select.
 * 
 * UI-only: All vibes displayed as chips, selection updates comma-separated string.
 */
export default function VibeChipsSelector({ value, onChange, disabled = false }: VibeChipsSelectorProps) {
  // Parse current value into array
  const selectedVibes = value
    ? value.split(',').map(v => v.trim()).filter(v => v.length > 0)
    : [];

  const toggleVibe = (vibe: string) => {
    if (disabled) return;
    
    const newSelected = selectedVibes.includes(vibe)
      ? selectedVibes.filter(v => v !== vibe)
      : [...selectedVibes, vibe];
    
    // Convert array back to comma-separated string
    onChange(newSelected.join(', '));
  };

  return (
    <div style={styles.container}>
      <label style={styles.label}>Select Vibes</label>
      <div style={styles.chipsGrid}>
        {VIBE_OPTIONS.map((vibe) => {
          const isSelected = selectedVibes.includes(vibe);
          return (
            <button
              key={vibe}
              type="button"
              onClick={() => toggleVibe(vibe)}
              disabled={disabled}
              style={{
                ...styles.chip,
                ...(isSelected ? styles.chipSelected : styles.chipUnselected),
                ...(disabled ? styles.chipDisabled : {}),
              }}
              aria-pressed={isSelected}
              aria-label={`Toggle ${vibe}`}
            >
              {vibe}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: '100%',
  },
  label: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '0.75rem',
  },
  chipsGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  chip: {
    padding: '0.625rem 1rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    borderRadius: '9999px',
    border: '2px solid',
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none',
    minHeight: '44px', // WCAG touch target size
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  chipUnselected: {
    backgroundColor: '#ffffff',
    color: '#374151',
    borderColor: '#d1d5db',
  },
  chipSelected: {
    backgroundColor: '#667eea',
    color: '#ffffff',
    borderColor: '#667eea',
  },
  chipDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
};

// Add hover and focus effects
if (typeof document !== 'undefined') {
  const styleId = 'vibe-chips-selector-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      button[aria-label^="Toggle"]:not(:disabled):not([aria-pressed="true"]):hover {
        background-color: #f3f4f6 !important;
        border-color: #9ca3af !important;
        transform: translateY(-1px);
      }
      button[aria-label^="Toggle"][aria-pressed="true"]:not(:disabled):hover {
        background-color: #5568d3 !important;
        border-color: #5568d3 !important;
        transform: translateY(-1px);
      }
      button[aria-label^="Toggle"]:focus {
        outline: 2px solid #667eea;
        outline-offset: 2px;
      }
      button[aria-label^="Toggle"]:active {
        transform: translateY(0);
      }
    `;
    if (document.head) {
      document.head.appendChild(style);
    }
  }
}

