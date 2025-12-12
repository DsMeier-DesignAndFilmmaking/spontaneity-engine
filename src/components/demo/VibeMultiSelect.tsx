/**
 * VibeMultiSelect.tsx
 * Multi-select vibe selector with chips display.
 * 
 * UI-only component - converts multi-selection to comma-separated string
 * for existing logic consumption. No logic changes to generation flow.
 */

import React, { useState, useRef, useEffect } from 'react';

export interface VibeMultiSelectProps {
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
 * VibeMultiSelect component - Multi-select with chips display.
 * 
 * UI-only: Converts multi-selection to comma-separated string format.
 */
export default function VibeMultiSelect({ value, onChange, disabled = false }: VibeMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parse current value into array
  const selectedVibes = value
    ? value.split(',').map(v => v.trim()).filter(v => v.length > 0)
    : [];

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const toggleVibe = (vibe: string) => {
    const newSelected = selectedVibes.includes(vibe)
      ? selectedVibes.filter(v => v !== vibe)
      : [...selectedVibes, vibe];
    
    // Convert array back to comma-separated string
    onChange(newSelected.join(', '));
  };

  const removeVibe = (vibe: string) => {
    const newSelected = selectedVibes.filter(v => v !== vibe);
    onChange(newSelected.join(', '));
  };

  return (
    <div style={styles.container} ref={dropdownRef}>
      {/* Display field with chips */}
      <div
        style={{
          ...styles.input,
          ...(disabled ? styles.inputDisabled : {}),
        }}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
        aria-label="Select vibes"
        aria-expanded={isOpen}
      >
        {selectedVibes.length > 0 ? (
          <div style={styles.chipsContainer}>
            {selectedVibes.map((vibe, index) => (
              <div key={index} style={styles.chip}>
                <span>{vibe}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeVibe(vibe);
                    }}
                    style={styles.chipRemove}
                    aria-label={`Remove ${vibe}`}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <span style={styles.placeholder}>e.g., adventurous, relaxed, creative</span>
        )}
        <span style={styles.dropdownIcon}>{isOpen ? '▲' : '▼'}</span>
      </div>

      {/* Dropdown menu */}
      {isOpen && !disabled && (
        <div style={styles.dropdown}>
          {VIBE_OPTIONS.map((vibe) => (
            <label
              key={vibe}
              style={styles.option}
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                checked={selectedVibes.includes(vibe)}
                onChange={() => toggleVibe(vibe)}
                style={styles.checkbox}
              />
              <span>{vibe}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    position: 'relative',
    width: '100%',
  },
  input: {
    minHeight: '2.75rem',
    padding: '0.5rem 0.75rem',
    fontSize: '1rem',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  inputDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  chipsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.375rem',
    flex: 1,
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.25rem 0.5rem',
    backgroundColor: '#667eea',
    color: '#ffffff',
    borderRadius: '9999px',
    fontSize: '0.8125rem',
    fontWeight: '500',
  },
  chipRemove: {
    background: 'none',
    border: 'none',
    color: '#ffffff',
    fontSize: '1.125rem',
    lineHeight: '1',
    cursor: 'pointer',
    padding: 0,
    marginLeft: '0.125rem',
    outline: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    color: '#9ca3af',
    flex: 1,
  },
  dropdownIcon: {
    fontSize: '0.75rem',
    color: '#6b7280',
    flexShrink: 0,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '0.25rem',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    maxHeight: '200px',
    overflowY: 'auto',
    zIndex: 1000,
  },
  option: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem',
    cursor: 'pointer',
    fontSize: '0.9375rem',
    transition: 'background-color 0.15s',
  },
  checkbox: {
    width: '1rem',
    height: '1rem',
    cursor: 'pointer',
  },
};

// Add hover effects
if (typeof document !== 'undefined') {
  const styleId = 'vibe-multi-select-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      [role="button"][aria-label="Select vibes"]:not([aria-disabled]):hover {
        border-color: #667eea !important;
      }
      [role="button"][aria-label="Select vibes"]:focus {
        outline: 2px solid #667eea;
        outline-offset: 2px;
      }
      label[style*="option"]:hover {
        background-color: #f3f4f6 !important;
      }
    `;
    if (document.head) {
      document.head.appendChild(style);
    }
  }
}

