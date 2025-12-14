/**
 * RecentResults.tsx
 * Recent results component - displays last 3 results from localStorage.
 * 
 * Shows small thumbnails of recently generated results below the demo input.
 * Clicking a thumbnail loads the result into view.
 */

import React, { useState, useEffect } from 'react';
import { trackEvent } from '@/lib/analytics/trackEvent';
import colors from '@/lib/design/colors';

/**
 * Sanitizes title by removing parameter leakage patterns
 */
function sanitizeTitle(title: string): string {
  if (!title || typeof title !== 'string') {
    return '';
  }
  
  // Remove context metadata patterns
  let sanitized = title
    .replace(/\[Context:[^\]]+\]/gi, '')
    .replace(/\[Role:[^\]]+\]/gi, '')
    .replace(/\[Mood:[^\]]+\]/gi, '')
    .replace(/Role=[^,\]]+/gi, '')
    .replace(/Mood=[^,\]]+/gi, '')
    .replace(/Group=[^,\]]+/gi, '')
    .trim();
  
  // If title is empty after sanitization, return a default
  if (!sanitized || sanitized.length === 0) {
    return 'Your Spontaneous Adventure';
  }
  
  // Remove any remaining brackets or metadata artifacts
  sanitized = sanitized.replace(/^[\[\],\s]+|[\[\],\s]+$/g, '').trim();
  
  return sanitized;
}

/**
 * Validates recommendation data to check if it's valid and properly formatted
 * Returns false if the recommendation should be filtered out
 */
function isValidRecommendation(data: {
  title?: string;
  activityName?: string;
  activityRealtimeStatus?: 'open' | 'closed' | 'unknown';
  raw?: any;
}): boolean {
  // Check for missing or unformatted title (parameter leakage)
  const displayTitle = data.activityName || data.title || '';
  if (!displayTitle || displayTitle.trim().length === 0) {
    return false;
  }
  
  // Check for parameter leakage in title (e.g., [Context:...])
  const hasContextLeakage = displayTitle.includes('[Context:') || 
                            displayTitle.includes('[Role:') || 
                            displayTitle.includes('[Mood:') ||
                            displayTitle.includes('Role=') ||
                            displayTitle.includes('Mood=') ||
                            displayTitle.includes('Group=');
  
  if (hasContextLeakage) {
    // Check if the title is primarily or entirely context metadata
    const isOnlyContext = displayTitle.trim().startsWith('[') && 
                         (displayTitle.includes('Context:') || displayTitle.includes('Role='));
    const isContextHeavy = displayTitle.split('[').length > 2; // Multiple context blocks
    
    if (isOnlyContext || isContextHeavy) {
      return false;
    }
    
    // If title starts with a word but contains context, check if it has enough content
    const titleWords = displayTitle.split(' ').filter(w => !w.includes('[') && !w.includes('='));
    if (titleWords.length < 2) {
      return false;
    }
  }
  
  // Check for closed status
  if (data.activityRealtimeStatus === 'closed') {
    return false;
  }
  
  // Check raw data for closed status in various formats
  if (data.raw) {
    const rawStatus = data.raw.status || data.raw.activity_realtime_status || data.raw.realtime_status;
    if (rawStatus === 'closed' || rawStatus === 'Closed' || rawStatus === 'CLOSED') {
      return false;
    }
    
    // Check for unavailable flags
    if (data.raw.is_unavailable === true || 
        data.raw.unavailable === true ||
        data.raw.isUnavailable === true) {
      return false;
    }
  }
  
  return true;
}

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

  // Load results from localStorage and filter out invalid ones
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ResultThumbnail[];
        
        // Filter out invalid results (parameter leakage, closed status, etc.)
        const validResults = parsed.filter((result) => {
          try {
            const data = typeof result.data === 'string' ? JSON.parse(result.data) : result.data;
            const displayTitle = data.activityName || data.title || data.name || '';
            const status = data.activity_realtime_status || data.status || data.realtime_status || '';
            
            // Quick validation check
            return isValidRecommendation({
              title: displayTitle,
              activityName: displayTitle,
              activityRealtimeStatus: status === 'open' ? 'open' : status === 'closed' ? 'closed' : 'unknown',
              raw: data,
            });
          } catch (e) {
            // If we can't parse the data, filter it out
            return false;
          }
        });
        
        // Update localStorage with only valid results
        if (validResults.length !== parsed.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(validResults));
          console.log(`[RecentResults] Filtered out ${parsed.length - validResults.length} invalid results from localStorage`);
        }
        
        setResults(validResults);
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

  // Add hover effect styles - uses global hover color
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const styleId = 'recent-results-hover-styles';
    // Remove existing style if it exists to ensure fresh styles
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) {
      existingStyle.remove();
    }
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .recent-result-thumbnail:hover,
      [data-recent-results] button[type="button"]:hover {
        border-color: var(--sdk-hover-color, #16336B) !important;
        transform: translateY(-2px) !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
      }
      .recent-result-thumbnail:focus,
      [data-recent-results] button[type="button"]:focus {
        outline: 2px solid var(--sdk-primary-color, #1D4289) !important;
        outline-offset: 2px !important;
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
    <div style={styles.container} data-recent-results>
      <label style={styles.label}>Recent results</label>
      <div style={styles.thumbnailsContainer}>
        {results.map((result) => (
          <button
            key={result.id}
            type="button"
            onClick={() => handleResultClick(result)}
            className="recent-result-thumbnail"
            style={{
              ...styles.thumbnail,
              ...(currentResultId === result.id ? styles.thumbnailActive : {}),
            }}
            aria-label={`Load result from ${new Date(result.timestamp).toLocaleString()}`}
          >
            <div style={styles.thumbnailPreview}>
              {(() => {
                // Sanitize preview text to remove parameter leakage
                let preview = result.preview;
                try {
                  // Try to extract a clean title from the stored data
                  const data = typeof result.data === 'string' ? JSON.parse(result.data) : result.data;
                  const title = data.activityName || data.title || data.name || '';
                  if (title) {
                    preview = sanitizeTitle(title);
                  } else {
                    preview = sanitizeTitle(result.preview);
                  }
                } catch (e) {
                  // If parsing fails, just sanitize the preview text
                  preview = sanitizeTitle(result.preview);
                }
                return preview.substring(0, 50) + (preview.length > 50 ? '...' : '');
              })()}
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
    borderColor: 'var(--sdk-primary-color, ' + colors.primary + ')',
    backgroundColor: 'var(--sdk-bg-accent, ' + colors.bgAccent + ')',
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

