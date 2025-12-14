/**
 * SpontaneityInputModal.tsx
 * Modal overlay containing the SmartInput and Generate button.
 * 
 * Opens when user clicks the minimal trigger, providing full input interface.
 */

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import colors from '@/lib/design/colors';
import SmartInput from './SmartInput';

export interface SpontaneityInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  value: string;
  onChange: (value: string) => void;
  onParsedChange?: (parsed: { vibe: string; duration: string; location: string }) => void;
  onGenerate: () => void;
  loading?: boolean;
  disabled?: boolean;
}

/**
 * SpontaneityInputModal component - Full input interface in modal
 */
export default function SpontaneityInputModal({
  isOpen,
  onClose,
  value,
  onChange,
  onParsedChange,
  onGenerate,
  loading = false,
  disabled = false,
}: SpontaneityInputModalProps) {
  const [isMobile, setIsMobile] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

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

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const firstInput = modalRef.current.querySelector('textarea') as HTMLElement;
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) {
      onClose();
    }
  };

  const handleGenerate = () => {
    onGenerate();
    // Don't close modal - let user see the result
  };

  const modalContent = (
    <>
      <div
        ref={backdropRef}
        style={{
          ...styles.backdrop,
          ...(isMobile ? styles.backdropMobile : {}),
        }}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />
      <div
        ref={modalRef}
        style={{
          ...styles.modal,
          ...(isMobile ? styles.modalMobile : {}),
        }}
        role="dialog"
        aria-labelledby="spontaneity-modal-title"
        aria-modal="true"
      >
        <div style={styles.header}>
          <h2 id="spontaneity-modal-title" style={styles.title}>
            Feeling Spontaneous?
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={styles.closeButton}
            aria-label="Close"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div style={styles.content}>
          <SmartInput
            value={value}
            onChange={onChange}
            onParsedChange={onParsedChange}
            disabled={disabled || loading}
            placeholder="Spark an adventure for..."
          />

          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || !value.trim()}
            style={{
              ...styles.generateButton,
              ...(loading || !value.trim() ? styles.buttonDisabled : {}),
            }}
            aria-label="Find activity"
          >
            {loading ? (
              <>
                <span style={styles.spinner}>⟳</span>
                Finding...
              </>
            ) : (
              <>
                <span>Find Activity</span>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={styles.searchIcon}
                >
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                  <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
}

const styles: { [key: string]: React.CSSProperties } = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 9998,
    backdropFilter: 'blur(4px)',
  },
  backdropMobile: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modal: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'var(--sdk-bg-color, ' + colors.bgPrimary + ')',
    borderRadius: '16px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    zIndex: 9999,
    maxWidth: '600px',
    width: '90%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  modalMobile: {
    width: '100%',
    maxHeight: '90vh',
    borderRadius: '20px 20px 0 0',
    top: 'auto',
    bottom: 0,
    left: 0,
    transform: 'none',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem',
    borderBottom: `1px solid var(--sdk-border-color, ${colors.border})`,
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: 'var(--sdk-text-color, ' + colors.textPrimary + ')',
    margin: 0,
  },
  closeButton: {
    backgroundColor: 'transparent',
    border: 'none',
    padding: '0.5rem',
    cursor: 'pointer',
    color: 'var(--sdk-text-muted, ' + colors.textMuted + ')',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '0.375rem',
    transition: 'background-color 0.2s',
    outline: 'none',
  },
  content: {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    overflowY: 'auto',
    flex: 1,
  },
  generateButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    width: '100%',
    padding: '1rem 2rem',
    fontSize: '1.125rem',
    fontWeight: '700',
    backgroundColor: 'var(--sdk-primary-color, ' + colors.primary + ')',
    color: 'var(--sdk-text-inverse, ' + colors.textInverse + ')',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    outline: 'none',
    boxShadow: `0 4px 12px rgba(29, 66, 137, 0.2)`,
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  searchIcon: {
    width: '20px',
    height: '20px',
  },
  spinner: {
    display: 'inline-block',
    animation: 'spin 1s linear infinite',
  },
};

// Add animations and hover styles
if (typeof document !== 'undefined') {
  const styleId = 'spontaneity-input-modal-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      button[aria-label="Close"]:hover {
        background-color: var(--sdk-bg-hover, ${colors.bgHover}) !important;
      }
      button[aria-label="Find activity"]:not(:disabled):hover {
        background-color: var(--sdk-hover-color, ${colors.hover}) !important;
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(29, 66, 137, 0.3) !important;
      }
    `;
    if (document.head) {
      document.head.appendChild(style);
    }
  }
}

