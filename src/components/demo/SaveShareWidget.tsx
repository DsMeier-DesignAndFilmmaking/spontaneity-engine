/**
 * SaveShareWidget.tsx
 * Save and share widget for generated results.
 * 
 * Provides functionality to save results and share them via link or email.
 * Creates short-lived result objects (24-hour expiration).
 */

import React, { useState, useRef, useEffect } from 'react';
import { trackEvent } from '@/lib/analytics/trackEvent';
import colors from '@/lib/design/colors';

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
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [savedUrl, setSavedUrl] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowShareMenu(false);
      }
    };

    if (showShareMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showShareMenu]);

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
    let urlToUse = savedUrl;
    
    // If not saved yet, save first
    if (!savedUrl) {
      try {
        setLoading(true);
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

        if (response.ok) {
          const data = await response.json();
          urlToUse = data.url;
          setSavedUrl(data.url);
        }
      } catch (error) {
        console.error('Error saving result:', error);
      } finally {
        setLoading(false);
      }
    }

    try {
      const fullUrl = typeof window !== 'undefined' && urlToUse
        ? `${window.location.origin}${urlToUse}`
        : typeof window !== 'undefined' 
          ? window.location.href 
          : '';
      
      if (fullUrl) {
        await navigator.clipboard.writeText(fullUrl);
        setCopySuccess(true);
        setShowShareMenu(false);
        
        // Track analytics
        trackEvent('result_save_attempt', {
          result_id: resultId,
          save_method: 'copy_link',
          timestamp: Date.now(),
        });
        
        setTimeout(() => setCopySuccess(false), 2000);
      }
    } catch (error) {
      console.error('Error copying link:', error);
    }
  };

  /**
   * Handle share button click - save if needed, then show menu
   */
  const handleShareClick = async () => {
    if (disabled || loading) return;
    
    // If not saved yet, save first
    if (!savedUrl) {
      await handleSave();
      // Wait a moment for URL to be set
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    setShowShareMenu(!showShareMenu);
  };

  /**
   * Handle email option click
   */
  const handleEmailClick = () => {
    setShowShareMenu(false);
    setShowEmailModal(true);
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
      <div style={styles.container} ref={menuRef}>
        <div style={styles.shareButtonGroup}>
          <button
            type="button"
            onClick={handleShareClick}
            disabled={disabled || loading}
            style={{
              ...styles.shareButton,
              ...(disabled || loading ? styles.buttonDisabled : {}),
            }}
            aria-label="Share this plan"
            aria-expanded={showShareMenu}
          >
            {copySuccess ? '✓ Copied!' : loading ? 'Saving...' : 'Share'}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                ...styles.shareIcon,
                transform: showShareMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }}
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
          
          {showShareMenu && (
            <div style={styles.shareMenu}>
              <button
                type="button"
                onClick={handleCopyLink}
                style={{
                  ...styles.menuItem,
                  borderBottom: `1px solid ${colors.bgHover}`,
                }}
                aria-label="Copy link"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={styles.menuIcon}
                >
                  <path
                    d="M10 13C10.4295 13.5741 10.9774 14.0491 11.6066 14.3929C12.2357 14.7367 12.9315 14.9411 13.6466 14.9923C14.3618 15.0435 15.0796 14.9403 15.7513 14.6897C16.4231 14.4392 17.0331 14.047 17.54 13.54L20.54 10.54C21.4508 9.59695 21.9548 8.33394 21.9434 7.02296C21.932 5.71198 21.4061 4.45791 20.4791 3.53087C19.5521 2.60383 18.298 2.07799 16.987 2.0666C15.676 2.0552 14.413 2.55918 13.47 3.47L11.75 5.18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M14 11C13.5705 10.4259 13.0226 9.95087 12.3934 9.60707C11.7643 9.26327 11.0685 9.05886 10.3534 9.00766C9.63821 8.95645 8.92041 9.05972 8.24866 9.31028C7.57691 9.56083 6.96688 9.95304 6.46 10.46L3.46 13.46C2.54918 14.403 2.04519 15.6661 2.05659 16.977C2.06798 18.288 2.59382 19.5421 3.52086 20.4691C4.44791 21.3962 5.70198 21.922 7.01296 21.9334C8.32394 21.9448 9.58695 21.4408 10.53 20.53L12.24 18.82"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Copy Link
              </button>
              <button
                type="button"
                onClick={handleEmailClick}
                style={{
                  ...styles.menuItem,
                  borderBottom: 'none',
                }}
                aria-label="Email this result"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={styles.menuIcon}
                >
                  <path
                    d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M22 6L12 13L2 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Email
              </button>
            </div>
          )}
        </div>
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
    position: 'relative',
  },
  shareButtonGroup: {
    position: 'relative',
    display: 'inline-block',
  },
  shareButton: {
    padding: '0.75rem 1.5rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    backgroundColor: 'var(--sdk-primary-color, ' + colors.primary + ')',
    color: 'var(--sdk-text-inverse, ' + colors.textInverse + ')',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    outline: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  shareIcon: {
    width: '16px',
    height: '16px',
    flexShrink: 0,
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  shareMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: '0.5rem',
    backgroundColor: colors.bgPrimary,
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    zIndex: 100,
    minWidth: '160px',
    overflow: 'hidden',
  },
  menuItem: {
    width: '100%',
    padding: '0.75rem 1rem',
    fontSize: '0.875rem',
    backgroundColor: 'transparent',
    color: colors.textPrimary,
    border: 'none',
    cursor: 'pointer',
    outline: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    textAlign: 'left',
    transition: 'all 0.2s ease-in-out',
  },
  menuIcon: {
    width: '16px',
    height: '16px',
    flexShrink: 0,
    color: colors.textSecondary,
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
    backgroundColor: colors.bgPrimary,
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
    color: colors.textPrimary,
  },
  modalDescription: {
    fontSize: '0.875rem',
    color: colors.textSecondary,
    marginBottom: '1rem',
  },
  emailInput: {
    width: '100%',
    padding: '0.75rem',
    fontSize: '1rem',
    border: `2px solid ${colors.border}`,
    borderRadius: '6px',
    outline: 'none',
    marginBottom: '0.5rem',
    backgroundColor: colors.bgPrimary,
    color: colors.textPrimary,
  },
  privacyNote: {
    fontSize: '0.75rem',
    color: colors.textMuted,
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
    backgroundColor: colors.primary,
    color: colors.textInverse,
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    outline: 'none',
  },
  modalCancelButton: {
    padding: '0.75rem 1.5rem',
    fontSize: '0.875rem',
    backgroundColor: colors.bgHover,
    color: colors.textPrimary,
    border: `1px solid ${colors.border}`,
    borderRadius: '6px',
    cursor: 'pointer',
    outline: 'none',
  },
};

// Add hover effects
if (typeof document !== 'undefined') {
  const styleId = 'save-share-widget-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      button[aria-label="Share this plan"]:hover:not(:disabled) {
        background-color: var(--sdk-hover-color, ${colors.hover}) !important;
      }
      button[aria-label="Share this plan"]:focus {
        box-shadow: 0 0 0 3px rgba(29, 66, 137, 0.2) !important;
      }
      button[aria-label="Copy link"]:hover,
      button[aria-label="Email this result"]:hover {
        background-color: var(--sdk-bg-hover, ${colors.bgHover}) !important;
        color: var(--sdk-hover-color, ${colors.hover}) !important;
      }
      button[aria-label="Copy link"]:focus,
      button[aria-label="Email this result"]:focus {
        outline: 2px solid var(--sdk-primary-color, ${colors.primary}) !important;
        outline-offset: -2px !important;
      }
      input[type="email"]:focus {
        border-color: var(--sdk-primary-color, ${colors.primary}) !important;
        box-shadow: 0 0 0 3px rgba(29, 66, 137, 0.1) !important;
      }
      button[type="submit"]:not(:disabled):hover {
        background-color: var(--sdk-hover-color, ${colors.hover}) !important;
      }
    `;
    if (document.head) {
      document.head.appendChild(style);
    }
  }
}

