/**
 * QuickPromptChips.tsx
 * Quick prompt chips component for free demo input.
 * 
 * UI-only component that provides clickable chips to auto-fill inputs.
 * Does not modify any generation logic - only updates input state.
 */

import React from 'react';

export interface QuickPromptChipsProps {
  onChipClick: (text: string, field: 'vibe' | 'time' | 'location') => void;
  disabled?: boolean;
}

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
 * UI-only: Only updates input field state, does not modify generation logic.
 */
export default function QuickPromptChips({ onChipClick, disabled = false }: QuickPromptChipsProps) {
  return (
    <div style={styles.container}>
      <div style={styles.chipsWrapper}>
        {QUICK_PROMPTS.map((prompt, index) => (
          <button
            key={index}
            type="button"
            onClick={() => !disabled && onChipClick(prompt.text, prompt.field)}
            disabled={disabled}
            style={{
              ...styles.chip,
              ...(disabled ? styles.chipDisabled : {}),
            }}
            aria-label={`Quick fill: ${prompt.text}`}
          >
            {prompt.text}
          </button>
        ))}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    marginBottom: '1rem',
  },
  chipsWrapper: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  chip: {
    padding: '0.375rem 0.75rem',
    fontSize: '0.8125rem',
    fontWeight: '500',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '1px solid #e5e7eb',
    borderRadius: '9999px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none',
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
      button[aria-label^="Quick fill"]:not(:disabled):hover {
        background-color: #e5e7eb !important;
        border-color: #d1d5db !important;
        transform: translateY(-1px);
      }
      button[aria-label^="Quick fill"]:not(:disabled):active {
        transform: translateY(0);
      }
      button[aria-label^="Quick fill"]:focus {
        outline: 2px solid #667eea;
        outline-offset: 2px;
      }
    `;
    if (document.head) {
      document.head.appendChild(style);
    }
  }
}

