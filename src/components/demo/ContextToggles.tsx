/**
 * ContextToggles.tsx
 * Context toggles component for role, mood, and group size.
 * 
 * Provides dropdown selectors for contextual metadata that is sent
 * with the demo request but not displayed in the visible prompt.
 * On mobile (< 640px), collapses into an accordion.
 */

import React, { useState, useEffect } from 'react';

export interface ContextValues {
  role: string;
  mood: string;
  group_size: string;
}

export interface ContextTogglesProps {
  onChange: (values: ContextValues) => void;
  disabled?: boolean;
}

const ROLES = ['Traveler', 'Host', 'Hotel staff', 'Tour operator'];
const MOODS = ['Relaxed', 'Adventurous', 'Foodie'];
const GROUP_SIZES = ['Solo', '2-4', '5+'];

/**
 * ContextToggles component - Compact dropdowns for contextual metadata.
 * 
 * Features:
 * - Role dropdown (Traveler, Host, Hotel staff, Tour operator)
 * - Mood dropdown (Relaxed, Adventurous, Foodie)
 * - Group size dropdown (Solo, 2-4, 5+)
 * - Mobile-responsive (collapses into accordion on small screens)
 * - Values sent as hidden metadata with demo requests
 */
export default function ContextToggles({ onChange, disabled = false }: ContextTogglesProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [values, setValues] = useState<ContextValues>({
    role: 'Traveler',
    mood: 'Relaxed',
    group_size: 'Solo',
  });

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

  // Notify parent of changes
  useEffect(() => {
    onChange(values);
  }, [values, onChange]);

  const handleChange = (field: keyof ContextValues, value: string) => {
    setValues(prev => ({ ...prev, [field]: value }));
  };

  const renderToggles = () => (
    <div style={styles.togglesContainer}>
      <div style={styles.toggleGroup}>
        <label htmlFor="context-role" style={styles.label}>
          Role
        </label>
        <select
          id="context-role"
          value={values.role}
          onChange={(e) => handleChange('role', e.target.value)}
          disabled={disabled}
          style={styles.select}
          aria-label="Select your role"
        >
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.toggleGroup}>
        <label htmlFor="context-mood" style={styles.label}>
          Mood
        </label>
        <select
          id="context-mood"
          value={values.mood}
          onChange={(e) => handleChange('mood', e.target.value)}
          disabled={disabled}
          style={styles.select}
          aria-label="Select your mood"
        >
          {MOODS.map((mood) => (
            <option key={mood} value={mood}>
              {mood}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.toggleGroup}>
        <label htmlFor="context-group-size" style={styles.label}>
          Group Size
        </label>
        <select
          id="context-group-size"
          value={values.group_size}
          onChange={(e) => handleChange('group_size', e.target.value)}
          disabled={disabled}
          style={styles.select}
          aria-label="Select group size"
        >
          {GROUP_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  if (isMobile) {
    // Mobile: Accordion view
    return (
      <div style={styles.container}>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          style={styles.accordionButton}
          aria-expanded={isExpanded}
          aria-label="Toggle more options"
        >
          <span>More options</span>
          <span style={styles.accordionIcon}>{isExpanded ? '▼' : '▶'}</span>
        </button>
        {isExpanded && (
          <div style={styles.accordionContent}>
            {renderToggles()}
          </div>
        )}
      </div>
    );
  }

  // Desktop: Always visible
  return <div style={styles.container}>{renderToggles()}</div>;
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    marginBottom: '1.5rem',
  },
  togglesContainer: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  toggleGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    minWidth: '120px',
    flex: '1 1 auto',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#333',
  },
  select: {
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    border: '2px solid #e0e0e0',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    outline: 'none',
    cursor: 'pointer',
    transition: 'border-color 0.2s',
  },
  accordionButton: {
    width: '100%',
    padding: '0.75rem 1rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    backgroundColor: '#f5f5f5',
    color: '#333',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    outline: 'none',
  },
  accordionIcon: {
    fontSize: '0.75rem',
  },
  accordionContent: {
    marginTop: '0.5rem',
    padding: '1rem',
    backgroundColor: '#f9f9f9',
    borderRadius: '6px',
    border: '1px solid #e0e0e0',
  },
};

// Add focus styles for accessibility
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    select:focus {
      border-color: #667eea !important;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
    }
    button[type="button"]:focus {
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2) !important;
    }
  `;
  if (document.head) {
    document.head.appendChild(style);
  }
}

