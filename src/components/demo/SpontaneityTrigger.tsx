/**
 * SpontaneityTrigger.tsx
 * Minimalist trigger button/bar for the spontaneity widget.
 * 
 * Small, unobtrusive entry point that opens the full input modal.
 */

import React from 'react';
import colors from '@/lib/design/colors';

export interface SpontaneityTriggerProps {
  onClick: () => void;
  disabled?: boolean;
}

/**
 * SpontaneityTrigger component - Minimal entry point
 */
export default function SpontaneityTrigger({
  onClick,
  disabled = false,
}: SpontaneityTriggerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles.trigger,
        ...(disabled ? styles.triggerDisabled : {}),
      }}
      aria-label="Feeling Spontaneous?"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={styles.icon}
      >
        <path
          d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      <span style={styles.text}>Feeling Spontaneous?</span>
    </button>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  trigger: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1rem',
    fontSize: '0.9375rem',
    fontWeight: '600',
    color: 'var(--sdk-text-inverse, ' + colors.textInverse + ')',
    backgroundColor: 'var(--sdk-primary-color, ' + colors.primary + ')',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    outline: 'none',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    fontFamily: 'inherit',
  },
  triggerDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  icon: {
    width: '20px',
    height: '20px',
    color: 'var(--sdk-text-inverse, ' + colors.textInverse + ')',
    flexShrink: 0,
  },
  text: {
    whiteSpace: 'nowrap',
  },
};

// Add hover styles
if (typeof document !== 'undefined') {
  const styleId = 'spontaneity-trigger-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      button[aria-label="Feeling Spontaneous?"]:not(:disabled):hover {
        background-color: var(--sdk-hover-color, ${colors.hover}) !important;
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15) !important;
      }
      button[aria-label="Feeling Spontaneous?"]:focus {
        outline: 2px solid var(--sdk-primary-color, ${colors.primary});
        outline-offset: 2px;
      }
    `;
    if (document.head) {
      document.head.appendChild(style);
    }
  }
}

