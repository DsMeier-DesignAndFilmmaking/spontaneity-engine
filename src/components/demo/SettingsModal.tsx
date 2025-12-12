/**
 * SettingsModal.tsx
 * Settings modal component for demo preferences.
 * 
 * Contains presets, context toggles, and preference controls.
 * Modal is contained within the widget and does not use global portals.
 */

import React, { useEffect, useRef, useState } from 'react';
import { trackEvent } from '@/lib/analytics/trackEvent';
import PresetsBar from './PresetsBar';
import ContextToggles, { ContextValues } from './ContextToggles';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPresetSelect: (presetText: string) => void;
  onContextChange: (values: ContextValues) => void;
  currentContextValues: ContextValues;
  disabled?: boolean;
}

/**
 * SettingsModal component - Contained modal for demo settings.
 * 
 * Features:
 * - Presets selection
 * - Travel context toggles (role, mood, group size)
 * - Save and Reset buttons
 * - Mobile-responsive
 * - Contained within widget boundaries
 */
export default function SettingsModal({
  isOpen,
  onClose,
  onPresetSelect,
  onContextChange,
  currentContextValues,
  disabled = false,
}: SettingsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

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

  // Handle escape key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Handle backdrop click to close
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === backdropRef.current) {
      handleClose();
    }
  };

  const handleClose = () => {
    trackEvent('cta_click', {
      cta_name: 'close_settings',
      timestamp: Date.now(),
    });
    onClose();
  };

  const handleSave = () => {
    trackEvent('cta_click', {
      cta_name: 'save_settings',
      timestamp: Date.now(),
    });
    onClose();
  };

  const handleReset = () => {
    const defaultValues: ContextValues = {
      role: 'Traveler',
      mood: 'Relaxed',
      group_size: 'Solo',
    };
    onContextChange(defaultValues);
  };

  if (!isOpen) return null;

  // Combine modal styles with mobile-specific adjustments
  const modalStyles: React.CSSProperties = {
    ...styles.modal,
    ...(isMobile ? styles.modalMobile : {}),
  };

  return (
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        style={{
          ...styles.backdrop,
          ...(isMobile ? styles.backdropMobile : {}),
        }}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        style={modalStyles}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
      >
        {/* Header */}
        <div style={styles.header}>
          <h2 id="settings-modal-title" style={styles.title}>
            Demo Settings & Preferences
          </h2>
          <button
            type="button"
            onClick={handleClose}
            style={styles.closeButton}
            aria-label="Close settings"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {/* Presets Section */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Presets</h3>
            <PresetsBar onPresetSelect={onPresetSelect} disabled={disabled} />
          </section>

          {/* Travel Context Section */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Travel Context</h3>
            <ContextToggles
              onChange={onContextChange}
              disabled={disabled}
            />
          </section>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <button
            type="button"
            onClick={handleReset}
            style={styles.resetButton}
            disabled={disabled}
          >
            Reset to Default
          </button>
          <button
            type="button"
            onClick={handleSave}
            style={styles.saveButton}
            disabled={disabled}
          >
            Save Settings
          </button>
        </div>
      </div>
    </>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  backdropMobile: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modal: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
    zIndex: 1001,
    maxWidth: '600px',
    width: '90%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
  },
  modalMobile: {
    width: '90%',
    maxHeight: '90vh',
    borderRadius: '12px 12px 0 0',
    top: 'auto',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem',
    borderBottom: '1px solid #e0e0e0',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    margin: 0,
    color: '#1a1a1a',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '2rem',
    lineHeight: '1',
    color: '#666',
    cursor: 'pointer',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    transition: 'all 0.2s',
    outline: 'none',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '1.5rem',
  },
  section: {
    marginBottom: '2rem',
  },
  sectionTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    marginBottom: '1rem',
    color: '#333',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem',
    padding: '1.5rem',
    borderTop: '1px solid #e0e0e0',
  },
  resetButton: {
    padding: '0.75rem 1.5rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    backgroundColor: 'transparent',
    color: '#666',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none',
  },
  saveButton: {
    padding: '0.75rem 2rem',
    fontSize: '1rem',
    fontWeight: '600',
    backgroundColor: '#667eea',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    outline: 'none',
  },
};

// Add hover and focus styles
if (typeof document !== 'undefined') {
  const styleId = 'settings-modal-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      button[aria-label="Close settings"]:hover {
        background-color: #f5f5f5 !important;
        color: #333 !important;
      }
      button[aria-label="Close settings"]:focus {
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2) !important;
      }
      button[aria-label="Settings"]:hover:not(:disabled) {
        background-color: #f5f5f5 !important;
        color: #667eea !important;
      }
      button[aria-label="Settings"]:active:not(:disabled) {
        background-color: #eeeeee !important;
      }
      button[aria-label="Settings"]:focus {
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2) !important;
      }
      button:disabled {
        opacity: 0.6;
        cursor: not-allowed !important;
      }
    `;
    if (document.head) {
      document.head.appendChild(style);
    }
  }
}

