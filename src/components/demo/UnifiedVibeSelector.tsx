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

// Tooltip content for each preset
const PRESET_TOOLTIPS: Record<string, string> = {
  '2 hours': 'Biases recommendations toward nearby, short experiences that fit within ~2 hours. Does not affect budget or vibe.',
  'Low budget': 'Prioritizes free or low-cost options. Higher-cost experiences may still appear if they strongly match your other preferences.',
  'Something creative': 'Boosts creative experiences like art, culture, or hands-on activities. You can still refine vibes manually.',
  'Group activity': 'Favors experiences that work well with multiple people. Does not lock group size.',
  'Outdoor': 'Prefers outdoor or open-air activities when possible. Indoor options may appear if conditions require.',
  'Relaxing': 'Biases toward slower-paced, low-stress experiences. Can be combined with other vibes.',
};

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
  const [activeTooltipIndex, setActiveTooltipIndex] = useState<number | null>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const tooltipRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const tooltipTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Detect mobile device
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close dropdown and tooltips on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsDropdownOpen(false);
      }
      
      // Close tooltip if clicking outside tooltip area
      const clickedTooltipButton = tooltipRefs.current.some(ref => 
        ref && ref.contains(target)
      );
      if (!clickedTooltipButton && activeTooltipIndex !== null) {
        setActiveTooltipIndex(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen, activeTooltipIndex]);

  // Handle tooltip interactions
  const handleTooltipMouseEnter = (index: number) => {
    if (disabled) return;
    // Clear any existing timeout
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }
    // Show tooltip on desktop hover, or on mobile if already shown
    if (!isMobile || activeTooltipIndex === index) {
      setActiveTooltipIndex(index);
    }
  };

  const handleTooltipMouseLeave = () => {
    // Clear any existing timeout
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    // Add delay before hiding to allow moving to tooltip (desktop only)
    if (!isMobile) {
      tooltipTimeoutRef.current = setTimeout(() => {
        setActiveTooltipIndex(null);
        tooltipTimeoutRef.current = null;
      }, 200);
    } else {
      // On mobile, don't auto-hide on mouse leave (use click to dismiss)
    }
  };

  // Keep tooltip visible when hovering over it
  const handleTooltipMouseEnterTooltip = (index: number) => {
    if (disabled) return;
    // Clear any existing timeout
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }
    // Keep tooltip visible when hovering over it
    setActiveTooltipIndex(index);
  };

  const handleTooltipClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    
    if (isMobile) {
      // Toggle on mobile
      setActiveTooltipIndex(activeTooltipIndex === index ? null : index);
    } else {
      // On desktop, clicking also shows tooltip
      setActiveTooltipIndex(index);
    }
  };

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

  // Clear all selected vibes
  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent dropdown toggle
    if (disabled) return;
    onChange('');
  };


  return (
    <div style={styles.container}>
      {/* Preset Quick Actions */}
      <div style={styles.presetsSection}>
        <label style={styles.sectionLabel}>Quick Actions</label>
        <div style={styles.presetsRow} data-presets-row>
          {PRESETS.map((preset, index) => {
            const isActive = isPresetActive(preset);
            const tooltipText = PRESET_TOOLTIPS[preset.text];
            const showTooltip = activeTooltipIndex === index && tooltipText;
            
            return (
              <div
                key={index}
                style={styles.presetButtonWrapper}
                onMouseEnter={() => handleTooltipMouseEnter(index)}
                onMouseLeave={handleTooltipMouseLeave}
              >
                <button
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
                {tooltipText && (
                  <button
                    ref={(el) => { tooltipRefs.current[index] = el; }}
                    type="button"
                    onClick={(e) => handleTooltipClick(index, e)}
                    disabled={disabled}
                    style={styles.infoButton}
                    aria-label={`Information about ${preset.text}`}
                    aria-expanded={showTooltip ? true : false}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      style={styles.infoIcon}
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                      <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
                {showTooltip && (
                  <>
                    {isMobile && (
                      <div
                        style={styles.tooltipBackdrop}
                        onClick={() => setActiveTooltipIndex(null)}
                        aria-hidden="true"
                      />
                    )}
                    <div
                      style={{
                        ...styles.tooltip,
                        ...(isMobile ? styles.tooltipMobile : {}),
                      }}
                      role="tooltip"
                      onMouseEnter={() => handleTooltipMouseEnterTooltip(index)}
                      onMouseLeave={handleTooltipMouseLeave}
                    >
                      {tooltipText}
                    </div>
                    {/* Invisible hover area above tooltip to keep it visible */}
                    {!isMobile && (
                      <div
                        style={styles.tooltipHoverArea}
                        onMouseEnter={() => handleTooltipMouseEnterTooltip(index)}
                        onMouseLeave={handleTooltipMouseLeave}
                        aria-hidden="true"
                      />
                    )}
                  </>
                )}
              </div>
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
            <div style={styles.dropdownIcons}>
              {selectedVibes.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  disabled={disabled}
                  style={styles.clearButton}
                  aria-label="Clear all selected vibes"
                  title="Clear all"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={styles.clearIcon}
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
              )}
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  ...styles.dropdownArrow,
                  transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
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
            </div>
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
              {selectedVibes.length > 0 && (
                <div style={styles.clearAllDivider} />
              )}
              {selectedVibes.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  disabled={disabled}
                  style={{
                    ...styles.clearAllButton,
                    ...(disabled ? styles.buttonDisabled : {}),
                  }}
                  aria-label="Clear all selected vibes"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={styles.clearAllIcon}
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
                  <span>Clear all</span>
                </button>
              )}
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
  presetButtonWrapper: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    transform: 'none',
    zIndex: 1,
  },
  presetButton: {
    padding: '0.75rem 1.25rem',
    fontSize: '0.9375rem',
    fontWeight: '600',
    backgroundColor: colors.bgPrimary,
    color: colors.primary,
    border: `1px solid ${colors.primary}`,
    borderRadius: '9999px',
    cursor: 'pointer',
    transition: 'background-color 0.2s, border-color 0.2s, color 0.2s',
    outline: 'none',
    minHeight: '44px',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  presetButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    color: colors.textInverse,
  },
  infoButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
    minWidth: '20px',
    minHeight: '20px',
    padding: 0,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '50%',
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none',
    color: colors.textMuted,
    flexShrink: 0,
  },
  infoIcon: {
    width: '14px',
    height: '14px',
    color: 'currentColor',
  },
  tooltip: {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    marginBottom: '0.5rem',
    padding: '0.75rem',
    maxWidth: '280px',
    width: 'max-content',
    fontSize: '0.8125rem',
    lineHeight: '1.4',
    color: colors.textPrimary,
    backgroundColor: colors.bgPrimary,
    border: `1px solid ${colors.border}`,
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    zIndex: 1001,
    pointerEvents: 'auto',
    whiteSpace: 'normal',
    textAlign: 'left',
  },
  tooltipHoverArea: {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '300px',
    height: '1rem',
    marginBottom: '0.25rem',
    zIndex: 1000,
    pointerEvents: 'auto',
  },
  tooltipMobile: {
    position: 'fixed',
    bottom: 'auto',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    marginBottom: 0,
    maxWidth: 'calc(100vw - 2rem)',
    width: 'auto',
    pointerEvents: 'auto',
  },
  tooltipBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1000,
    pointerEvents: 'auto',
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
  dropdownIcons: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexShrink: 0,
  },
  clearButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    padding: 0,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '50%',
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none',
    color: colors.textMuted,
  },
  clearIcon: {
    width: '16px',
    height: '16px',
    color: 'currentColor',
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
  clearAllDivider: {
    height: '1px',
    backgroundColor: colors.bgHover,
    margin: '0.25rem 0',
  },
  clearAllButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1rem',
    fontSize: '0.9375rem',
    fontWeight: '500',
    color: colors.textMuted,
    backgroundColor: 'transparent',
    border: 'none',
    borderTop: `1px solid ${colors.bgHover}`,
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none',
    minHeight: '44px',
    textAlign: 'center',
  },
  clearAllIcon: {
    width: '16px',
    height: '16px',
    color: 'currentColor',
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
        background-color: ${colors.bgAccent} !important;
        border-color: ${colors.hover} !important;
        color: ${colors.hover} !important;
      }
      button[aria-label^="Quick action"][aria-pressed="true"]:not(:disabled):hover {
        background-color: ${colors.hover} !important;
        border-color: ${colors.hover} !important;
        color: ${colors.textInverse} !important;
      }
      /* Info button hover */
      button[aria-label^="Information about"]:not(:disabled):hover {
        background-color: ${colors.bgHover} !important;
        color: ${colors.textPrimary} !important;
      }
      button[aria-label^="Information about"]:not(:disabled):focus {
        outline: 2px solid ${colors.primary};
        outline-offset: 2px;
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
      /* Clear button hover */
      button[aria-label="Clear all selected vibes"]:not(:disabled):hover {
        background-color: ${colors.bgHover} !important;
        color: ${colors.textPrimary} !important;
      }
      button[aria-label="Clear all selected vibes"]:not(:disabled):hover svg {
        color: ${colors.textPrimary} !important;
      }
      /* Focus states */
      button:focus {
        outline: 2px solid ${colors.primary};
        outline-offset: 2px;
      }
      /* Prevent any transform on preset buttons */
      button[aria-label^="Quick action"] {
        transform: none !important;
      }
      /* Prevent movement on preset button wrapper */
      [data-presets-row] > div {
        transform: none !important;
      }
      /* Mobile horizontal scroll for presets */
      @media (max-width: 639px) {
        [data-presets-row] {
          flex-wrap: nowrap !important;
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch;
        }
        button[aria-label^="Information about"] {
          width: 44px !important;
          height: 44px !important;
          min-width: 44px !important;
          min-height: 44px !important;
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

