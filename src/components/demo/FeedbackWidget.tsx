/**
 * FeedbackWidget.tsx
 * Feedback micro-widget component.
 * 
 * Provides thumbs up/down feedback and optional comment text box
 * for user feedback on generated results.
 */

import React, { useState } from 'react';
import { trackEvent } from '@/lib/analytics/trackEvent';

export interface FeedbackWidgetProps {
  resultId: string;
  disabled?: boolean;
}

/**
 * FeedbackWidget component - Thumbs up/down feedback with optional comment.
 * 
 * Features:
 * - Thumbs up/down buttons
 * - Optional 120-character comment text box
 * - Submit button
 * - Analytics tracking
 */
export default function FeedbackWidget({ resultId, disabled = false }: FeedbackWidgetProps) {
  const [rating, setRating] = useState<'up' | 'down' | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRatingClick = (value: 'up' | 'down') => {
    if (disabled || submitted) return;
    setRating(value);
  };

  const handleSubmit = async () => {
    if (!rating || loading || submitted) return;

    try {
      setLoading(true);

      // Track analytics
      trackEvent('feedback_submitted', {
        result_id: resultId,
        rating: rating === 'up' ? 'positive' : 'negative',
        comment: comment.trim() || null,
        timestamp: Date.now(),
      });

      // Submit to API
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          result_id: resultId,
          rating: rating === 'up' ? 'positive' : 'negative',
          comment: comment.trim() || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={styles.submittedContainer}>
        <p style={styles.submittedText}>Thank you for your feedback!</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.label}>Was this helpful?</div>
      <div style={styles.ratingContainer}>
        <button
          type="button"
          onClick={() => handleRatingClick('up')}
          disabled={disabled}
          style={{
            ...styles.thumbButton,
            ...(rating === 'up' ? styles.thumbButtonActive : {}),
            ...(disabled ? styles.buttonDisabled : {}),
          }}
          aria-label="Thumbs up - helpful"
        >
          👍
        </button>
        <button
          type="button"
          onClick={() => handleRatingClick('down')}
          disabled={disabled}
          style={{
            ...styles.thumbButton,
            ...(rating === 'down' ? styles.thumbButtonActive : {}),
            ...(disabled ? styles.buttonDisabled : {}),
          }}
          aria-label="Thumbs down - not helpful"
        >
          👎
        </button>
      </div>

      {rating && (
        <div style={styles.commentContainer}>
          <textarea
            value={comment}
            onChange={(e) => {
              const value = e.target.value;
              if (value.length <= 120) {
                setComment(value);
              }
            }}
            placeholder="Optional: Tell us more (120 characters max)"
            style={styles.commentInput}
            maxLength={120}
            rows={3}
            disabled={disabled || loading}
            aria-label="Optional feedback comment"
          />
          <div style={styles.commentFooter}>
            <span style={styles.charCount}>{comment.length}/120</span>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={disabled || loading}
              style={{
                ...styles.submitButton,
                ...(disabled || loading ? styles.buttonDisabled : {}),
              }}
            >
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    marginTop: '1rem',
    padding: '1rem',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#333',
    marginBottom: '0.75rem',
  },
  ratingContainer: {
    display: 'flex',
    gap: '0.5rem',
  },
  thumbButton: {
    padding: '0.5rem 1rem',
    fontSize: '1.25rem',
    backgroundColor: '#ffffff',
    border: '2px solid #e0e0e0',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none',
  },
  thumbButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
    transform: 'scale(1.1)',
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  commentContainer: {
    marginTop: '1rem',
  },
  commentInput: {
    width: '100%',
    padding: '0.75rem',
    fontSize: '0.875rem',
    border: '2px solid #e0e0e0',
    borderRadius: '6px',
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical',
    marginBottom: '0.5rem',
  },
  commentFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCount: {
    fontSize: '0.75rem',
    color: '#999',
  },
  submitButton: {
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    backgroundColor: '#667eea',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    outline: 'none',
  },
  submittedContainer: {
    padding: '1rem',
    textAlign: 'center',
  },
  submittedText: {
    fontSize: '0.875rem',
    color: '#667eea',
    fontWeight: '600',
  },
};

// Add hover effects
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    button[type="button"]:not(:disabled):hover {
      border-color: #667eea !important;
    }
    textarea:focus {
      border-color: #667eea !important;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
    }
  `;
  if (document.head) {
    document.head.appendChild(style);
  }
}

