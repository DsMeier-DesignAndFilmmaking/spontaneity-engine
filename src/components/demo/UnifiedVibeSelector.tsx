/**
 * UnifiedVibeSelector.tsx
 * Unified vibe selector combining presets and individual vibe chips.
 * 
 * UI-only component - merges presets and vibes into single cohesive interface.
 * Maintains all existing logic - only presentation changes.
 */

import React, { useState, useEffect, useRef } from 'react';
import colors from '@/lib/design/colors';

export interface UnifiedVibeSelectorProps {
  value: string; // Current vibe value as comma-separated string
  onChange: (value: string) => void; // Called with comma-separated string
  onTimeChange?: (time: string) => void; // For time presets
  onLocationChange?: (location: string) => void; // For location presets
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

// Map preset text to vibe tags and field type
const PRESETS = [
  { text: '2 hours', field: 'time' as const, vibes: [] as string[] },
  { text: 'Low budget', field: 'vibe' as const, vibes: ['Adventurous', 'Solo'] },
  { text: 'Something creative', field: 'vibe' as const, vibes: ['Creative', 'Art'] },
  { text: 'Group activity', field: 'vibe' as const, vibes: ['Social', 'Adventurous'] },
  { text: 'Outdoor', field: 'location' as const, vibes: [] as string[] },
  { text: 'Relaxing', field: 'vibe' as const, vibes: ['Relaxed'] },
];

/**
 * UnifiedVibeSelector component - Merged presets and vibe chips.
 * 
 * UI-only: Combines preset quick actions with individual vibe selection.
 */
export default function UnifiedVibeSelector({
  value,
  onChange,
  onTimeChange,
  onLocationChange,
  disabled = false,
}: UnifiedVibeSelectorProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  // Parse current value into array
  const selectedVibes = value
    ? value.split(',').map(v => v.trim()).filter(v => v.length > 0)
    : [];

  // Check if preset is active (all its vibes are selected)
  const isPresetActive = (preset: typeof PRESETS[0]): boolean => {
    if (preset.field !== 'vibe' || preset.vibes.length === 0) {
      return false;
    }
    return preset.vibes.every(vibe => selectedVibes.includes(vibe));
  };

  // Handle preset click
  const handlePresetClick = (preset: typeof PRESETS[0]) => {
    if (disabled) return;

    if (preset.field === 'vibe' && preset.vibes.length > 0) {
      // Append vibes (avoid duplicates)
      const newVibes = [...selectedVibes];
      preset.vibes.forEach(vibe => {
        if (!newVibes.includes(vibe)) {
          newVibes.push(vibe);
        }
      });
      onChange(newVibes.join(', '));
    } else if (preset.field === 'time' && onTimeChange) {
      onTimeChange(preset.text);
    } else if (preset.field === 'location' && onLocationChange) {
      onLocationChange(preset.text);
    }
  };

  // Toggle individual vibe
  const toggleVibe = (vibe: string) => {
    if (disabled) return;
    
    const newSelected = selectedVibes.includes(vibe)
      ? selectedVibes.filter(v => v !== vibe)
      : [...selectedVibes, vibe];
    
    onChange(newSelected.join(', '));
  };


  return (
    <div style={styles.container}>
      {/* Preset Quick Actions */}
      <div style={styles.presetsSection}>
        <label style={styles.sectionLabel}>Quick Actions</label>
        <div style={styles.presetsRow} data-presets-row>
          {PRESETS.map((preset, index) => {
            const isActive = isPresetActive(preset);
            return (
              <button
                key={index}
                type="button"
                onClick={() => handlePresetClick(preset)}
                disabled={disabled}
                style={{
                  ...styles.presetButton,
                  ...(isActive ? styles.presetButtonActive : {}),
                  ...(disabled ? styles.buttonDisabled : {}),
                }}
                aria-label={`Quick action: ${preset.text}`}
                aria-pressed={isActive}
              >
                {preset.text}
              </button>
            );
          })}
        </div>
      </div>

      {/* Select Vibes Dropdown */}
      <div style={styles.dropdownSection}>
        <label style={styles.sectionLabel} htmlFor="vibe-selector">
          Select Vibes
        </label>
        <div style={styles.dropdownContainer} ref={dropdownRef}>
          <button
            type="button"
            id="vibe-selector"
            onClick={() => !disabled && setIsDropdownOpen(!isDropdownOpen)}
            disabled={disabled}
            style={{
              ...styles.dropdownButton,
              ...(isDropdownOpen ? styles.dropdownButtonOpen : {}),
              ...(disabled ? styles.buttonDisabled : {}),
            }}
            aria-haspopup="listbox"
            aria-expanded={isDropdownOpen}
            aria-label="Select vibes"
          >
            <span style={{
              ...styles.dropdownValue,
              color: selectedVibes.length > 0 ? colors.textPrimary : colors.textMuted,
            } as React.CSSProperties}>
              {selectedVibes.length === 0
                ? 'Select vibes...'
                : selectedVibes.length === 1
                ? selectedVibes[0]
                : `${selectedVibes.length} selected`}
            </span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                ...styles.dropdownArrow,
                transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
              aria-hidden="true"
            >
              <path
                d="M6 9L12 15L18 9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div style={styles.dropdownMenu} role="listbox" aria-label="Vibe options" data-dropdown-menu>
              {VIBE_OPTIONS.map((vibe) => {
                const isSelected = selectedVibes.includes(vibe);
                return (
                  <button
                    key={vibe}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => toggleVibe(vibe)}
                    disabled={disabled}
                    style={{
                      ...styles.dropdownOption,
                      ...(isSelected ? styles.dropdownOptionSelected : {}),
                      ...(disabled ? styles.buttonDisabled : {}),
                    }}
                  >
                    <span style={styles.checkboxContainer}>
                      {isSelected && (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          style={styles.checkmark}
                          aria-hidden="true"
                        >
                          <path
                            d="M20 6L9 17L4 12"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                      {!isSelected && <span style={styles.checkboxEmpty} />}
                    </span>
                    <span style={styles.dropdownOptionLabel}>{vibe}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: '100%',
    marginBottom: '1.5rem',
  },
  sectionLabel: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: '0.75rem',
  },
  presetsSection: {
    marginBottom: '1.25rem',
  },
  presetsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    overflowX: 'auto',
    paddingBottom: '0.25rem',
  },
  presetButton: {
    padding: '0.75rem 1.25rem',
    fontSize: '0.9375rem',
    fontWeight: '600',
    backgroundColor: '#667eea',
    color: '#ffffff',
    border: '2px solid #667eea',
    borderRadius: '9999px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none',
    minHeight: '44px',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  presetButtonActive: {
    backgroundColor: '#4338ca',
    borderColor: '#4338ca',
    boxShadow: '0 2px 4px rgba(67, 56, 202, 0.3)',
  },
  dropdownSection: {
    marginBottom: '0',
    position: 'relative',
  },
  dropdownContainer: {
    position: 'relative',
    width: '100%',
  },
  dropdownButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 1rem',
    fontSize: '1rem',
    fontWeight: '400',
    color: colors.textPrimary,
    backgroundColor: colors.bgPrimary,
    border: `2px solid ${colors.border}`,
    borderRadius: '0.5rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none',
    minHeight: '44px',
    textAlign: 'left',
  },
  dropdownButtonOpen: {
    borderColor: colors.primary,
    boxShadow: `0 0 0 3px rgba(15, 82, 186, 0.1)`,
  },
  dropdownValue: {
    flex: 1,
  },
  dropdownArrow: {
    width: '20px',
    height: '20px',
    flexShrink: 0,
    transition: 'transform 0.2s',
    color: colors.textMuted,
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '0.25rem',
    backgroundColor: colors.bgPrimary,
    border: `1px solid ${colors.border}`,
    borderRadius: '0.5rem',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    maxHeight: '300px',
    overflowY: 'auto',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
  },
  dropdownOption: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    fontSize: '0.9375rem',
    fontWeight: '400',
    color: colors.textPrimary,
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: `1px solid ${colors.bgHover}`,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    outline: 'none',
    minHeight: '44px',
    textAlign: 'left',
  },
  dropdownOptionSelected: {
    backgroundColor: colors.bgAccent,
    color: colors.primary,
  },
  checkboxContainer: {
    width: '20px',
    height: '20px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `2px solid ${colors.border}`,
    borderRadius: '0.25rem',
    backgroundColor: colors.bgPrimary,
    transition: 'all 0.2s',
  },
  checkmark: {
    width: '16px',
    height: '16px',
    color: colors.focus,
    strokeWidth: '2.5',
  },
  checkboxEmpty: {
    width: '16px',
    height: '16px',
  },
  dropdownOptionLabel: {
    flex: 1,
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
};

// Add hover effects and responsive styles
if (typeof document !== 'undefined') {
  const styleId = 'unified-vibe-selector-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Preset button hover */
      button[aria-label^="Quick action"]:not(:disabled):not([aria-pressed="true"]):hover {
        background-color: ${colors.hover} !important;
        border-color: ${colors.hover} !important;
        transform: translateY(-1px);
      }
      button[aria-label^="Quick action"][aria-pressed="true"]:not(:disabled):hover {
        background-color: ${colors.hover} !important;
        border-color: ${colors.hover} !important;
      }
      /* Dropdown button hover */
      button[aria-label="Select vibes"]:not(:disabled):hover {
        border-color: ${colors.textMuted} !important;
      }
      button[aria-label="Select vibes"]:not(:disabled):focus {
        border-color: ${colors.primary} !important;
        box-shadow: 0 0 0 3px rgba(15, 82, 186, 0.1) !important;
      }
      /* Dropdown option hover */
      button[role="option"]:not(:disabled):hover {
        background-color: ${colors.bgHover} !important;
      }
      button[role="option"][aria-selected="true"]:not(:disabled):hover {
        background-color: ${colors.bgAccent} !important;
      }
      /* Focus states */
      button:focus {
        outline: 2px solid ${colors.primary};
        outline-offset: 2px;
      }
      button:active:not(:disabled) {
        transform: translateY(0);
      }
      /* Mobile horizontal scroll for presets */
      @media (max-width: 639px) {
        [data-presets-row] {
          flex-wrap: nowrap !important;
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch;
        }
      }
      /* Dropdown scrollbar styling */
      [data-dropdown-menu]::-webkit-scrollbar {
        width: 8px;
      }
      [data-dropdown-menu]::-webkit-scrollbar-track {
        background: ${colors.bgHover};
        border-radius: 4px;
      }
      [data-dropdown-menu]::-webkit-scrollbar-thumb {
        background: ${colors.border};
        border-radius: 4px;
      }
      [data-dropdown-menu]::-webkit-scrollbar-thumb:hover {
        background: ${colors.textMuted};
      }
    `;
    if (document.head) {
      document.head.appendChild(style);
    }
  }
}

