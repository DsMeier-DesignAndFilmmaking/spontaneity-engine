/**
 * RecentResults.tsx
 * Recent results component - displays last 3 results from localStorage.
 * 
 * Shows small thumbnails of recently generated results below the demo input.
 * Clicking a thumbnail loads the result into view.
 */

import React, { useState, useEffect } from 'react';
import { trackEvent } from '@/lib/analytics/trackEvent';

export interface ResultThumbnail {
  id: string;
  preview: string;
  timestamp: number;
  data: string;
}

export interface RecentResultsProps {
  onResultSelect: (resultData: string, resultId: string) => void;
  currentResultId?: string;
}

const STORAGE_KEY = 'demo_recent_results';
const MAX_RESULTS = 3;

/**
 * RecentResults component - LocalStorage-based recent results display.
 * 
 * Features:
 * - Shows last 3 generated results
 * - Clickable thumbnails
 * - Loads result on click
 * - Analytics tracking
 */
export default function RecentResults({ onResultSelect, currentResultId }: RecentResultsProps) {
  const [results, setResults] = useState<ResultThumbnail[]>([]);

  // Load results from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ResultThumbnail[];
        setResults(parsed);
      }
    } catch (error) {
      console.error('Error loading recent results:', error);
    }
  }, []);

  // Expose method to add new result (called by parent)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).addRecentResult = (result: ResultThumbnail) => {
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          const existing: ResultThumbnail[] = stored ? JSON.parse(stored) : [];
          
          // Remove duplicate if exists
          const filtered = existing.filter(r => r.id !== result.id);
          
          // Add new result at the beginning
          const updated = [result, ...filtered].slice(0, MAX_RESULTS);
          
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          setResults(updated);
        } catch (error) {
          console.error('Error saving recent result:', error);
        }
      };
    }
  }, []);

  const handleResultClick = (result: ResultThumbnail) => {
    // Track analytics
    trackEvent('cta_click', {
      cta_name: 'recent_result',
      result_id: result.id,
      timestamp: Date.now(),
    });

    // Load result
    onResultSelect(result.data, result.id);
  };

  if (results.length === 0) {
    return null;
  }

  return (
    <div style={styles.container}>
      <label style={styles.label}>Recent results</label>
      <div style={styles.thumbnailsContainer}>
        {results.map((result) => (
          <button
            key={result.id}
            type="button"
            onClick={() => handleResultClick(result)}
            style={{
              ...styles.thumbnail,
              ...(currentResultId === result.id ? styles.thumbnailActive : {}),
            }}
            aria-label={`Load result from ${new Date(result.timestamp).toLocaleString()}`}
          >
            <div style={styles.thumbnailPreview}>
              {result.preview.substring(0, 50)}...
            </div>
            <div style={styles.thumbnailTime}>
              {new Date(result.timestamp).toLocaleTimeString()}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    marginTop: '1rem',
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#333',
    marginBottom: '0.75rem',
  },
  thumbnailsContainer: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  thumbnail: {
    flex: '1 1 150px',
    minWidth: '150px',
    maxWidth: '200px',
    padding: '0.75rem',
    backgroundColor: '#f9f9f9',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: '#e0e0e0',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none',
    textAlign: 'left',
  },
  thumbnailActive: {
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: '#667eea',
    backgroundColor: '#f0f4ff',
  },
  thumbnailPreview: {
    fontSize: '0.75rem',
    color: '#666',
    marginBottom: '0.5rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  thumbnailTime: {
    fontSize: '0.7rem',
    color: '#999',
  },
};

// Add hover effect
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    button[type="button"]:hover {
      border-color: #667eea !important;
      transform: translateY(-2px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
    }
  `;
  if (document.head) {
    document.head.appendChild(style);
  }
}

