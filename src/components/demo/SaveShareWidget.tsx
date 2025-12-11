/**
 * SaveShareWidget.tsx
 * Save and share widget for generated results.
 * 
 * Provides functionality to save results and share them via link or email.
 * Creates short-lived result objects (24-hour expiration).
 */

import React, { useState } from 'react';
import { trackEvent } from '@/lib/analytics/trackEvent';

export interface SaveShareWidgetProps {
  resultId: string;
  resultData: string;
  disabled?: boolean;
}

/**
 * SaveShareWidget component - Save and share functionality.
 * 
 * Features:
 * - Save result button
 * - Copy link to clipboard
 * - Email result modal
 * - 24-hour expiration on shared links
 * - Analytics tracking
 */
export default function SaveShareWidget({ resultId, resultData, disabled = false }: SaveShareWidgetProps) {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [savedUrl, setSavedUrl] = useState<string | null>(null);

  /**
   * Save result and generate share URL
   */
  const handleSave = async () => {
    if (disabled || loading) return;
    
    try {
      setLoading(true);
      
      // Call API to save result
      const response = await fetch('/api/save-result', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          result_id: resultId,
          result_data: resultData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save result');
      }

      const data = await response.json();
      setSavedUrl(data.url);
      
      // Track analytics
      trackEvent('result_save_attempt', {
        result_id: resultId,
        save_method: 'save',
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Error saving result:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Copy share link to clipboard
   */
  const handleCopyLink = async () => {
    if (!savedUrl) {
      // Save first if not already saved
      await handleSave();
      // Wait a moment for URL to be set
      await new Promise(resolve => setTimeout(resolve, 300));
      if (!savedUrl) return;
    }

    try {
      const fullUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}${savedUrl}`
        : savedUrl;
      
      await navigator.clipboard.writeText(fullUrl);
      setCopySuccess(true);
      
      // Track analytics
      trackEvent('result_save_attempt', {
        result_id: resultId,
        save_method: 'copy_link',
        timestamp: Date.now(),
      });
      
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Error copying link:', error);
    }
  };

  /**
   * Send result via email
   */
  const handleEmailSubmit = async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      
      // Track analytics
      trackEvent('result_save_attempt', {
        result_id: resultId,
        save_method: 'email',
        email_provided: !!email && email.trim().length > 0,
        timestamp: Date.now(),
      });

      if (email && email.trim().length > 0) {
        // Save result first if not saved
        if (!savedUrl) {
          await handleSave();
        }
        
        // Send email
        const response = await fetch('/api/send-result', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            result_id: resultId,
            result_data: resultData,
            email: email.trim(),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to send email');
        }
        
        // Close modal and reset
        setShowEmailModal(false);
        setEmail('');
      } else {
        // User skipped email, just close modal
        setShowEmailModal(false);
      }
    } catch (error) {
      console.error('Error sending email:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={styles.container}>
        <button
          type="button"
          onClick={handleSave}
          disabled={disabled || loading}
          style={{
            ...styles.saveButton,
            ...(disabled || loading ? styles.buttonDisabled : {}),
          }}
          aria-label="Save or email this plan"
        >
          {loading ? 'Saving...' : 'Save or Email this plan'}
        </button>
        
        {savedUrl && (
          <div style={styles.shareOptions}>
            <button
              type="button"
              onClick={handleCopyLink}
              style={styles.linkButton}
              aria-label="Copy link"
            >
              {copySuccess ? '✓ Copied!' : 'Copy Link'}
            </button>
            <button
              type="button"
              onClick={() => setShowEmailModal(true)}
              style={styles.emailButton}
              aria-label="Email me this result"
            >
              Email me
            </button>
          </div>
        )}
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div style={styles.modalOverlay} onClick={() => setShowEmailModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Email this result</h3>
            <p style={styles.modalDescription}>
              Enter your email address to receive this plan (optional)
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={styles.emailInput}
              aria-label="Email address"
            />
            <p style={styles.privacyNote}>
              We'll only email you the saved result and product updates. Unsubscribe any time.
            </p>
            <div style={styles.modalButtons}>
              <button
                type="button"
                onClick={handleEmailSubmit}
                disabled={loading}
                style={styles.modalSubmitButton}
              >
                {loading ? 'Sending...' : 'Send'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowEmailModal(false);
                  setEmail('');
                }}
                style={styles.modalCancelButton}
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    marginTop: '1rem',
    marginBottom: '1rem',
  },
  saveButton: {
    padding: '0.75rem 1.5rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    backgroundColor: '#667eea',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none',
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  shareOptions: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.75rem',
  },
  linkButton: {
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    backgroundColor: '#f5f5f5',
    color: '#333',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    cursor: 'pointer',
    outline: 'none',
  },
  emailButton: {
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    backgroundColor: '#f5f5f5',
    color: '#333',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    cursor: 'pointer',
    outline: 'none',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '2rem',
    maxWidth: '400px',
    width: '90%',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
  },
  modalTitle: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    color: '#1a1a1a',
  },
  modalDescription: {
    fontSize: '0.875rem',
    color: '#666',
    marginBottom: '1rem',
  },
  emailInput: {
    width: '100%',
    padding: '0.75rem',
    fontSize: '1rem',
    border: '2px solid #e0e0e0',
    borderRadius: '6px',
    outline: 'none',
    marginBottom: '0.5rem',
  },
  privacyNote: {
    fontSize: '0.75rem',
    color: '#999',
    marginBottom: '1.5rem',
    lineHeight: '1.4',
  },
  modalButtons: {
    display: 'flex',
    gap: '0.75rem',
    justifyContent: 'flex-end',
  },
  modalSubmitButton: {
    padding: '0.75rem 1.5rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    backgroundColor: '#667eea',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    outline: 'none',
  },
  modalCancelButton: {
    padding: '0.75rem 1.5rem',
    fontSize: '0.875rem',
    backgroundColor: '#f5f5f5',
    color: '#333',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    cursor: 'pointer',
    outline: 'none',
  },
};

