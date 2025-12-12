/**
 * UnifiedVibeSelector.tsx
 * Unified vibe selector combining presets and individual vibe chips.
 * 
 * UI-only component - merges presets and vibes into single cohesive interface.
 * Maintains all existing logic - only presentation changes.
 */

import React, { useState, useEffect } from 'react';

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
  const [showCustomVibes, setShowCustomVibes] = useState(false);
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

  // Remove vibe from summary
  const removeVibe = (vibe: string) => {
    if (disabled) return;
    const newSelected = selectedVibes.filter(v => v !== vibe);
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

      {/* Selected Vibes Summary */}
      {selectedVibes.length > 0 && (
        <div style={styles.selectedSection}>
          <div style={styles.selectedHeader}>
            <label style={styles.selectedLabel}>
              Selected Vibes ({selectedVibes.length})
            </label>
          </div>
          <div style={styles.selectedChips} data-selected-chips>
            {selectedVibes.map((vibe, index) => (
              <div key={index} style={styles.selectedChip}>
                <span style={styles.selectedChipText}>{vibe}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeVibe(vibe)}
                    style={styles.selectedChipRemove}
                    aria-label={`Remove ${vibe}`}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customize Vibes Toggle (Mobile only) */}
      {isMobile && (
        <button
          type="button"
          onClick={() => setShowCustomVibes(!showCustomVibes)}
          style={styles.customizeToggle}
          disabled={disabled}
          aria-expanded={showCustomVibes}
        >
          <span>{showCustomVibes ? 'Hide' : 'Customize'} Vibes</span>
          <span style={styles.toggleIcon}>{showCustomVibes ? '▲' : '▼'}</span>
        </button>
      )}

      {/* Vibe Chips Selector */}
      <div
        style={{
          ...styles.vibesSection,
          ...(isMobile && !showCustomVibes ? styles.vibesSectionHidden : {}),
        }}
        data-vibes-section
      >
        <label style={styles.sectionLabel}>Select Vibes</label>
        <div style={styles.vibesGrid}>
          {VIBE_OPTIONS.map((vibe) => {
            const isSelected = selectedVibes.includes(vibe);
            return (
              <button
                key={vibe}
                type="button"
                onClick={() => toggleVibe(vibe)}
                disabled={disabled}
                style={{
                  ...styles.vibeChip,
                  ...(isSelected ? styles.vibeChipSelected : styles.vibeChipUnselected),
                  ...(disabled ? styles.buttonDisabled : {}),
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
    color: '#374151',
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
  selectedSection: {
    marginBottom: '1.25rem',
    padding: '1rem',
    backgroundColor: '#f0f4ff',
    borderRadius: '0.5rem',
    border: '1px solid #e0e7ff',
  },
  selectedHeader: {
    marginBottom: '0.75rem',
  },
  selectedLabel: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#4338ca',
  },
  selectedChips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    overflowX: 'auto',
    paddingBottom: '0.25rem',
  },
  selectedChip: {
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
    minHeight: '44px',
  },
  selectedChipText: {
    whiteSpace: 'nowrap',
    maxWidth: '150px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  selectedChipRemove: {
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
  customizeToggle: {
    width: '100%',
    padding: '0.75rem 1rem',
    fontSize: '0.9375rem',
    fontWeight: '600',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '1px solid #e5e7eb',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    outline: 'none',
    minHeight: '44px',
    transition: 'all 0.2s',
  },
  toggleIcon: {
    fontSize: '0.75rem',
    color: '#6b7280',
  },
  vibesSection: {
    marginBottom: '0',
  },
  vibesSectionHidden: {
    display: 'none',
  },
  vibesGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  vibeChip: {
    padding: '0.625rem 1rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    borderRadius: '9999px',
    border: '2px solid',
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none',
    minHeight: '44px',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  vibeChipUnselected: {
    backgroundColor: '#ffffff',
    color: '#374151',
    borderColor: '#d1d5db',
  },
  vibeChipSelected: {
    backgroundColor: '#667eea',
    color: '#ffffff',
    borderColor: '#667eea',
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
        background-color: #5568d3 !important;
        border-color: #5568d3 !important;
        transform: translateY(-1px);
      }
      button[aria-label^="Quick action"][aria-pressed="true"]:not(:disabled):hover {
        background-color: #3730a3 !important;
        border-color: #3730a3 !important;
      }
      /* Vibe chip hover */
      button[aria-label^="Toggle"]:not(:disabled):not([aria-pressed="true"]):hover {
        background-color: #f3f4f6 !important;
        border-color: #9ca3af !important;
        transform: translateY(-1px);
      }
      button[aria-label^="Toggle"][aria-pressed="true"]:not(:disabled):hover {
        background-color: #5568d3 !important;
        border-color: #5568d3 !important;
      }
      /* Selected chip remove hover */
      button[aria-label^="Remove"]:hover {
        background-color: rgba(255, 255, 255, 0.2) !important;
      }
      /* Customize toggle hover */
      button[aria-expanded]:hover:not(:disabled) {
        background-color: #e5e7eb !important;
      }
      /* Focus states */
      button:focus {
        outline: 2px solid #667eea;
        outline-offset: 2px;
      }
      button:active:not(:disabled) {
        transform: translateY(0);
      }
      /* Mobile horizontal scroll */
      @media (max-width: 639px) {
        [data-presets-row],
        [data-selected-chips] {
          flex-wrap: nowrap !important;
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch;
        }
      }
      /* Desktop: always show vibe chips */
      @media (min-width: 640px) {
        [data-vibes-section] {
          display: block !important;
        }
      }
      /* Hide scrollbar but keep functionality */
      [data-presets-row]::-webkit-scrollbar,
      [data-selected-chips]::-webkit-scrollbar {
        height: 4px;
      }
      [data-presets-row]::-webkit-scrollbar-track,
      [data-selected-chips]::-webkit-scrollbar-track {
        background: #f3f4f6;
        border-radius: 2px;
      }
      [data-presets-row]::-webkit-scrollbar-thumb,
      [data-selected-chips]::-webkit-scrollbar-thumb {
        background: #d1d5db;
        border-radius: 2px;
      }
    `;
    if (document.head) {
      document.head.appendChild(style);
    }
  }
}

