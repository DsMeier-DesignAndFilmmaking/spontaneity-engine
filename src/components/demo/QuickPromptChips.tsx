/**
 * QuickPromptChips.tsx
 * Quick prompt chips component for free demo input.
 * 
 * UI-only component that provides clickable chips to auto-fill inputs.
 * Presets now append vibes instead of overriding existing selections.
 */

import React from 'react';

export interface QuickPromptChipsProps {
  onChipClick: (text: string, field: 'vibe' | 'time' | 'location') => void;
  onVibeAppend?: (vibes: string[]) => void; // New: For appending vibe tags from presets
  currentVibes?: string; // Current vibe string to check if preset is active
  disabled?: boolean;
}

// Map preset text to vibe tags (UI mapping only)
const PRESET_VIBE_MAP: { [key: string]: string[] } = {
  'Low budget adventure': ['Adventurous', 'Solo'],
  'Something creative': ['Creative', 'Art'],
  'Group activity': ['Social', 'Adventurous'],
  'Relaxing vibe': ['Relaxed'],
};

const QUICK_PROMPTS = [
  { text: 'I have 2 hours', field: 'time' as const },
  { text: 'Low budget adventure', field: 'vibe' as const },
  { text: 'Something creative', field: 'vibe' as const },
  { text: 'Group activity', field: 'vibe' as const },
  { text: 'Outdoor option', field: 'location' as const },
  { text: 'Relaxing vibe', field: 'vibe' as const },
];

/**
 * QuickPromptChips component - Quick prompt selection chips.
 * 
 * UI-only: Presets append vibes (for vibe presets) or set values (for time/location).
 * Does not modify generation logic.
 */
export default function QuickPromptChips({
  onChipClick,
  onVibeAppend,
  currentVibes = '',
  disabled = false,
}: QuickPromptChipsProps) {
  // Parse current vibes to check if preset is active
  const selectedVibes = currentVibes
    ? currentVibes.split(',').map(v => v.trim()).filter(v => v.length > 0)
    : [];

  const handlePresetClick = (prompt: typeof QUICK_PROMPTS[0]) => {
    if (disabled) return;

    // For vibe presets, append vibes instead of overriding
    if (prompt.field === 'vibe' && onVibeAppend && PRESET_VIBE_MAP[prompt.text]) {
      const presetVibes = PRESET_VIBE_MAP[prompt.text];
      // Only add vibes that aren't already selected
      const newVibes = presetVibes.filter(v => !selectedVibes.includes(v));
      if (newVibes.length > 0) {
        onVibeAppend(newVibes);
      }
    } else {
      // For time/location or fallback, use original behavior
      onChipClick(prompt.text, prompt.field);
    }
  };

  const isPresetActive = (prompt: typeof QUICK_PROMPTS[0]): boolean => {
    if (prompt.field !== 'vibe' || !PRESET_VIBE_MAP[prompt.text]) {
      return false;
    }
    const presetVibes = PRESET_VIBE_MAP[prompt.text];
    // Preset is active if all its vibes are selected
    return presetVibes.every(vibe => selectedVibes.includes(vibe));
  };

  return (
    <div style={styles.container}>
      <label style={styles.sectionLabel}>Try It Instantly</label>
      <div style={styles.chipsWrapper}>
        {QUICK_PROMPTS.map((prompt, index) => {
          const isActive = isPresetActive(prompt);
          return (
            <button
              key={index}
              type="button"
              onClick={() => handlePresetClick(prompt)}
              disabled={disabled}
              style={{
                ...styles.chip,
                ...(isActive ? styles.chipActive : {}),
                ...(disabled ? styles.chipDisabled : {}),
              }}
              aria-label={`Quick action: ${prompt.text}`}
              aria-pressed={isActive}
            >
              {prompt.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    marginBottom: '1.5rem',
  },
  sectionLabel: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '0.75rem',
  },
  chipsWrapper: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  chip: {
    padding: '0.625rem 1rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '2px solid #e5e7eb',
    borderRadius: '9999px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none',
    minHeight: '44px', // WCAG touch target size
    whiteSpace: 'nowrap',
  },
  chipActive: {
    backgroundColor: '#e0e7ff',
    color: '#4338ca',
    borderColor: '#667eea',
  },
  chipDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
};

// Add hover effects
if (typeof document !== 'undefined') {
  const styleId = 'quick-prompt-chips-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      button[aria-label^="Quick action"]:not(:disabled):not([aria-pressed="true"]):hover {
        background-color: #e5e7eb !important;
        border-color: #d1d5db !important;
        transform: translateY(-1px);
      }
      button[aria-label^="Quick action"][aria-pressed="true"]:not(:disabled):hover {
        background-color: #c7d2fe !important;
        border-color: #5568d3 !important;
        transform: translateY(-1px);
      }
      button[aria-label^="Quick action"]:not(:disabled):active {
        transform: translateY(0);
      }
      button[aria-label^="Quick action"]:focus {
        outline: 2px solid #667eea;
        outline-offset: 2px;
      }
    `;
    if (document.head) {
      document.head.appendChild(style);
    }
  }
}

