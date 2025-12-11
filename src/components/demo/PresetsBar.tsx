/**
 * PresetsBar.tsx
 * Predefined presets bar component.
 * 
 * Displays a horizontal pill bar with predefined preset options that users
 * can click to quickly populate the demo input fields.
 */

import React from 'react';
import { trackEvent } from '@/lib/analytics/trackEvent';

export interface PresetsBarProps {
  onPresetSelect: (presetText: string) => void;
  disabled?: boolean;
}

const PRESETS = [
  'Half-day café crawl',
  'Local nightwalk + photo spots',
  'Kid-friendly 2-hour plan',
  'Budget micro-adventure',
  'Hidden gems for foodies',
];

/**
 * PresetsBar component - Horizontal pill bar with preset options.
 * 
 * Features:
 * - Clickable preset pills
 * - Mobile-responsive (wraps on small screens)
 * - Analytics tracking on preset click
 */
export default function PresetsBar({ onPresetSelect, disabled = false }: PresetsBarProps) {
  const handlePresetClick = (preset: string) => {
    if (disabled) return;
    
    // Track analytics event
    trackEvent('preset_click', {
      preset_name: preset,
      timestamp: Date.now(),
    });
    
    // Call parent handler to update input
    onPresetSelect(preset);
  };

  return (
    <div style={styles.container}>
      <label style={styles.label}>Try a preset</label>
      <div style={styles.pillsContainer}>
        {PRESETS.map((preset, index) => (
          <button
            key={index}
            type="button"
            onClick={() => handlePresetClick(preset)}
            disabled={disabled}
            style={{
              ...styles.pill,
              ...(disabled ? styles.pillDisabled : {}),
            }}
            aria-label={`Use preset: ${preset}`}
          >
            {preset}
          </button>
        ))}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    marginBottom: '1.5rem',
  },
  label: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#333',
    marginBottom: '0.75rem',
  },
  pillsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  pill: {
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    backgroundColor: '#f5f5f5',
    color: '#333',
    border: '1px solid #e0e0e0',
    borderRadius: '20px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none',
    whiteSpace: 'nowrap',
  },
  pillDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
};

// Add hover effect
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    button[type="button"]:not(:disabled):hover {
      background-color: #667eea !important;
      color: #ffffff !important;
      border-color: #667eea !important;
      transform: translateY(-1px);
    }
    button[type="button"]:not(:disabled):active {
      transform: translateY(0);
    }
  `;
  if (document.head) {
    document.head.appendChild(style);
  }
}

