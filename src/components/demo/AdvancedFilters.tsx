/**
 * AdvancedFilters.tsx
 * Advanced Filters component for manual refinement of recommendations.
 * 
 * Provides manual controls (sliders, selectors, toggles) to fine-tune
 * recommendation parameters. Replaces the old Quick Actions and provides
 * a way to build custom queries.
 */

import React from 'react';
import { trackEvent } from '@/lib/analytics/trackEvent';
import Tooltip from './Tooltip';
import colors from '@/lib/design/colors';

export interface FilterValues {
  duration: string;
  budget: 'low' | 'medium' | 'high' | '';
  outdoor: boolean;
  groupActivity: boolean;
  creative: boolean;
  relaxing: boolean;
  vibe: string;
  location: string;
}

export interface AdvancedFiltersProps {
  values: FilterValues;
  onValuesChange: (values: FilterValues) => void;
  disabled?: boolean;
}

const DURATION_OPTIONS = [
  { value: '1 hour', label: '1 hour' },
  { value: '2 hours', label: '2 hours' },
  { value: '3-4 hours', label: '3-4 hours' },
  { value: 'Half day', label: 'Half day' },
  { value: 'Full day', label: 'Full day' },
];

const BUDGET_OPTIONS = [
  { value: 'low', label: '$', description: 'Low budget' },
  { value: 'medium', label: '$$', description: 'Medium budget' },
  { value: 'high', label: '$$$', description: 'High budget' },
];

const ACTIVITY_TYPE_TOOLTIPS: Record<string, string> = {
  outdoor: 'Prefers outdoor or open-air activities when possible. Indoor options may appear if conditions require.',
  groupActivity: 'Favors experiences that work well with multiple people. Does not lock group size.',
  creative: 'Boosts creative experiences like art, culture, or hands-on activities.',
  relaxing: 'Biases toward slower-paced, low-stress experiences. Can be combined with other vibes.',
};

/**
 * AdvancedFilters component - Manual refinement controls.
 */
export default function AdvancedFilters({
  values,
  onValuesChange,
  disabled = false,
}: AdvancedFiltersProps) {
  const handleDurationChange = (duration: string) => {
    if (disabled) return;
    trackEvent('filter_change', { filter: 'duration', value: duration });
    onValuesChange({ ...values, duration });
  };

  const handleBudgetChange = (budget: 'low' | 'medium' | 'high' | '') => {
    if (disabled) return;
    trackEvent('filter_change', { filter: 'budget', value: budget });
    onValuesChange({ ...values, budget });
  };

  const handleToggleChange = (key: keyof FilterValues, value: boolean) => {
    if (disabled) return;
    trackEvent('filter_change', { filter: key, value });
    onValuesChange({ ...values, [key]: value });
  };

  const handleVibeChange = (vibe: string) => {
    if (disabled) return;
    trackEvent('filter_change', { filter: 'vibe', value: vibe });
    onValuesChange({ ...values, vibe });
  };

  const handleLocationChange = (location: string) => {
    if (disabled) return;
    trackEvent('filter_change', { filter: 'location', value: location });
    onValuesChange({ ...values, location });
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Advanced Filters</h3>
      <div style={styles.description}>
        Manually tune your preferences to build a custom query. Changes update immediately.
      </div>

      {/* Duration Control */}
      <div style={styles.filterGroup}>
        <label htmlFor="filter-duration" style={styles.label}>
          Duration
        </label>
        <select
          id="filter-duration"
          value={values.duration}
          onChange={(e) => handleDurationChange(e.target.value)}
          disabled={disabled}
          style={styles.select}
          aria-label="Select duration"
        >
          <option value="">Any duration</option>
          {DURATION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Budget Control */}
      <div style={styles.filterGroup}>
        <label style={styles.label}>Budget</label>
        <div style={styles.budgetContainer}>
          {BUDGET_OPTIONS.map((option) => {
            const isSelected = values.budget === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleBudgetChange(isSelected ? '' : (option.value as 'low' | 'medium' | 'high'))}
                disabled={disabled}
                style={{
                  ...styles.budgetButton,
                  ...(isSelected ? styles.budgetButtonSelected : {}),
                  ...(disabled ? styles.budgetButtonDisabled : {}),
                }}
                aria-label={`${option.description} budget`}
                aria-pressed={isSelected}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Activity Type Toggles */}
      <div style={styles.filterGroup}>
        <label style={styles.label}>Activity Type</label>
        <div style={styles.togglesContainer}>
          {[
            { key: 'outdoor' as const, label: 'Outdoor' },
            { key: 'groupActivity' as const, label: 'Group activity' },
            { key: 'creative' as const, label: 'Creative' },
            { key: 'relaxing' as const, label: 'Relaxing' },
          ].map((toggle) => (
            <div key={toggle.key} style={styles.toggleItem}>
              <label style={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={values[toggle.key] as boolean}
                  onChange={(e) => handleToggleChange(toggle.key, e.target.checked)}
                  disabled={disabled}
                  style={styles.checkbox}
                />
                <span style={styles.toggleText}>{toggle.label}</span>
                <Tooltip
                  content={ACTIVITY_TYPE_TOOLTIPS[toggle.key] || ''}
                  position="top"
                >
                  <button
                    type="button"
                    style={styles.infoButton}
                    aria-label={`Learn more about ${toggle.label}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={styles.infoIcon}>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="12" cy="8" r="1" fill="currentColor"/>
                    </svg>
                  </button>
                </Tooltip>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Vibe Input */}
      <div style={styles.filterGroup}>
        <label htmlFor="filter-vibe" style={styles.label}>
          Vibe Tags
        </label>
        <input
          id="filter-vibe"
          type="text"
          value={values.vibe}
          onChange={(e) => handleVibeChange(e.target.value)}
          disabled={disabled}
          placeholder="e.g., Adventurous, Foodie, Relaxed"
          style={styles.input}
          aria-label="Enter vibe tags"
        />
        <div style={styles.helperText}>
          Separate multiple vibes with commas
        </div>
      </div>

      {/* Location Input */}
      <div style={styles.filterGroup}>
        <label htmlFor="filter-location" style={styles.label}>
          Location Preference
        </label>
        <input
          id="filter-location"
          type="text"
          value={values.location}
          onChange={(e) => handleLocationChange(e.target.value)}
          disabled={disabled}
          placeholder="e.g., Outdoor, San Francisco, Downtown"
          style={styles.input}
          aria-label="Enter location preference"
        />
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    marginBottom: '2rem',
  },
  title: {
    fontSize: '1.125rem',
    fontWeight: '600',
    marginBottom: '0.5rem',
    color: colors.textPrimary,
  },
  description: {
    fontSize: '0.875rem',
    color: colors.textSecondary,
    lineHeight: '1.5',
    marginBottom: '1.5rem',
  },
  filterGroup: {
    marginBottom: '1.5rem',
  },
  label: {
    display: 'block',
    fontSize: '0.9375rem',
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: '0.5rem',
  },
  select: {
    width: '100%',
    padding: '0.625rem 0.75rem',
    fontSize: '0.9375rem',
    border: `1px solid ${colors.border}`,
    borderRadius: '6px',
    backgroundColor: colors.bgPrimary,
    color: colors.textPrimary,
    cursor: 'pointer',
    transition: 'border-color 0.2s',
    outline: 'none',
  },
  budgetContainer: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  budgetButton: {
    padding: '0.625rem 1rem',
    fontSize: '0.9375rem',
    fontWeight: '500',
    backgroundColor: colors.bgHover,
    color: colors.textPrimary,
    border: `1px solid ${colors.border}`,
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none',
    minWidth: '60px',
  },
  budgetButtonSelected: {
    backgroundColor: `var(--sdk-primary-color, ${colors.primary})`,
    color: `var(--sdk-text-inverse, ${colors.textInverse})`,
    borderColor: `var(--sdk-primary-color, ${colors.primary})`,
    fontWeight: '600',
  },
  budgetButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  togglesContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  toggleItem: {
    display: 'flex',
    flexDirection: 'column',
  },
  toggleLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    cursor: 'pointer',
    fontSize: '0.9375rem',
    color: colors.textPrimary,
  },
  toggleText: {
    flex: 1,
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
    accentColor: `var(--sdk-primary-color, ${colors.primary})`,
  },
  infoButton: {
    background: 'none',
    border: 'none',
    padding: '0.25rem',
    cursor: 'pointer',
    color: colors.textMuted,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    transition: 'color 0.2s',
    outline: 'none',
    minWidth: '24px',
    minHeight: '24px',
  },
  infoIcon: {
    width: '14px',
    height: '14px',
    color: 'currentColor',
  },
  input: {
    width: '100%',
    padding: '0.625rem 0.75rem',
    fontSize: '0.9375rem',
    border: `1px solid ${colors.border}`,
    borderRadius: '6px',
    backgroundColor: colors.bgPrimary,
    color: colors.textPrimary,
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  helperText: {
    fontSize: '0.8125rem',
    color: colors.textMuted,
    marginTop: '0.25rem',
  },
};

// Add hover and focus styles
if (typeof document !== 'undefined') {
  const styleId = 'advanced-filters-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      select:focus, input:focus {
        border-color: var(--sdk-primary-color, #1D4289) !important;
        box-shadow: 0 0 0 3px rgba(29, 66, 137, 0.1) !important;
      }
      button[type="button"][aria-pressed="false"]:not(:disabled):hover {
        background-color: var(--sdk-bg-hover, #F3F4F6) !important;
        border-color: var(--sdk-hover-color, #16336B) !important;
      }
      button[type="button"][aria-pressed="true"]:not(:disabled):hover {
        background-color: var(--sdk-hover-color, #16336B) !important;
      }
      button[aria-label^="Learn more"]:hover {
        color: var(--sdk-text-primary, #222222) !important;
        background-color: var(--sdk-bg-hover, #F3F4F6) !important;
      }
      button:focus, select:focus, input:focus {
        box-shadow: 0 0 0 3px rgba(29, 66, 137, 0.2) !important;
      }
    `;
    if (document.head) {
      document.head.appendChild(style);
    }
  }
}

