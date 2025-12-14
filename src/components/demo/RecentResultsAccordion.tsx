/**
 * RecentResultsAccordion.tsx
 * Collapsible accordion component for recent results.
 * 
 * Default state is collapsed. Located below the Generate button.
 */

import React, { useState, useEffect } from 'react';
import colors from '@/lib/design/colors';
import RecentResults from './RecentResults';

export interface RecentResultsAccordionProps {
  onResultSelect: (resultData: string, selectedResultId: string) => void;
  currentResultId?: string;
}

/**
 * RecentResultsAccordion component - Collapsible recent results.
 */
export default function RecentResultsAccordion({
  onResultSelect,
  currentResultId,
}: RecentResultsAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Add hover styles - light gray hover
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const styleId = 'recent-results-accordion-styles';
    // Remove existing style if it exists to ensure fresh styles
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) {
      existingStyle.remove();
    }
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      [data-recent-results-accordion] {
        outline: none !important;
      }
      [data-recent-results-accordion] button[aria-expanded] {
        margin: 0 !important;
        border: none !important;
        border-width: 0 !important;
        border-style: none !important;
        box-sizing: border-box !important;
        outline: none !important;
      }
      [data-recent-results-accordion] button[aria-expanded]:hover {
        background-color: transparent !important;
        margin: 0 !important;
        border: none !important;
        border-width: 0 !important;
        outline: none !important;
      }
      [data-recent-results-accordion] button[aria-expanded]:focus {
        outline: none !important;
      }
      [data-recent-results-accordion]:focus-within {
        border-color: rgba(29, 66, 137, 0.3) !important;
      }
      [data-recent-results-accordion] > div[style*="content"] {
        border-top: none !important;
        border-width: 0 !important;
        border-style: none !important;
        outline: none !important;
      }
      [data-recent-results-accordion] > div[style*="content"] * {
        outline: none !important;
      }
    `;
    if (document.head) {
      document.head.appendChild(style);
    }

    // Cleanup function
    return () => {
      const styleToRemove = document.getElementById(styleId);
      if (styleToRemove) {
        styleToRemove.remove();
      }
    };
  }, []);

  return (
    <div style={styles.container} data-recent-results-accordion>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        style={styles.header}
        aria-expanded={isExpanded}
        aria-label={isExpanded ? 'Collapse recent results' : 'Expand recent results'}
      >
        <span style={styles.headerText}>Recent Results</span>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            ...styles.chevron,
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
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
      {isExpanded && (
        <div style={styles.content}>
          <RecentResults
            onResultSelect={onResultSelect}
            currentResultId={currentResultId}
          />
        </div>
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: '100%',
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    overflow: 'hidden',
    marginTop: '1rem',
    boxSizing: 'border-box',
    outline: 'none',
  },
  header: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.875rem 1rem',
    backgroundColor: colors.bgPrimary,
    border: 'none',
    borderWidth: 0,
    borderStyle: 'none',
    margin: 0,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    outline: 'none',
    boxSizing: 'border-box',
  },
  headerText: {
    fontSize: '0.9375rem',
    fontWeight: '600',
    color: colors.textPrimary,
  },
  chevron: {
    color: colors.textMuted,
    transition: 'transform 0.2s ease',
  },
  content: {
    borderTop: 'none',
    borderWidth: 0,
    borderStyle: 'none',
    backgroundColor: colors.bgPrimary,
    padding: '1rem',
  },
};

