/**
 * SettingsModal.tsx
 * Settings modal component for demo preferences.
 * 
 * Contains presets, context toggles, trust & safety settings, and preference controls.
 * Modal is contained within the widget and does not use global portals.
 */

import React, { useEffect, useRef, useState } from 'react';
import { trackEvent } from '@/lib/analytics/trackEvent';
import PresetsBar from './PresetsBar';
import ContextToggles, { ContextValues } from './ContextToggles';
import colors from '@/lib/design/colors';

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
  
  // Trust & Safety toggles state (default all ON)
  const [trustSettings, setTrustSettings] = useState({
    preferHighlyTrusted: true,
    includeRecentActivity: true,
    allowCommunityInfluenced: true,
  });
  
  // Transparency toggles state (default all ON)
  const [transparencySettings, setTransparencySettings] = useState({
    showWhyRecommended: true,
    helpImproveRecommendations: true,
  });
  
  // Hover states for info tooltips
  const [hoveredInfo, setHoveredInfo] = useState<string | null>(null);

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
          {/* SECTION 1: Personalization */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Personalization</h3>
            <div style={styles.sectionDescription}>
              Customize how recommendations are tailored to your preferences.
            </div>
            
            {/* Presets */}
            <div style={styles.subsection}>
              <h4 style={styles.subsectionTitle}>Presets</h4>
              <PresetsBar onPresetSelect={onPresetSelect} disabled={disabled} />
            </div>

            {/* Travel Context */}
            <div style={styles.subsection}>
              <h4 style={styles.subsectionTitle}>Travel Context</h4>
              <ContextToggles
                onChange={onContextChange}
                disabled={disabled}
              />
            </div>
          </section>

          {/* SECTION 2: Trust & Safety */}
          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Trust & Safety</h3>
              <div style={styles.sectionDescription}>
                Control how recommendations are filtered and verified.
              </div>
            </div>
            
            <div style={styles.trustToggles}>
              {/* Prefer Highly Trusted */}
              <div style={styles.toggleItem}>
                <label style={styles.toggleLabel}>
                  <input
                    type="checkbox"
                    checked={trustSettings.preferHighlyTrusted}
                    onChange={(e) => setTrustSettings(prev => ({ ...prev, preferHighlyTrusted: e.target.checked }))}
                    disabled={disabled}
                    style={styles.checkbox}
                  />
                  <span style={styles.toggleText}>Prefer highly trusted recommendations</span>
                  <button
                    type="button"
                    style={styles.infoButton}
                    onMouseEnter={() => setHoveredInfo('prefer-trusted')}
                    onMouseLeave={() => setHoveredInfo(null)}
                    onTouchStart={() => setHoveredInfo(hoveredInfo === 'prefer-trusted' ? null : 'prefer-trusted')}
                    aria-label="Learn more about highly trusted recommendations"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={styles.infoIcon}>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="12" cy="8" r="1" fill="currentColor"/>
                    </svg>
                  </button>
                </label>
                {hoveredInfo === 'prefer-trusted' && (
                  <div style={styles.microcopy}>
                    Prioritizes suggestions with stronger verification signals.
                  </div>
                )}
              </div>

              {/* Include Recent Activity */}
              <div style={styles.toggleItem}>
                <label style={styles.toggleLabel}>
                  <input
                    type="checkbox"
                    checked={trustSettings.includeRecentActivity}
                    onChange={(e) => setTrustSettings(prev => ({ ...prev, includeRecentActivity: e.target.checked }))}
                    disabled={disabled}
                    style={styles.checkbox}
                  />
                  <span style={styles.toggleText}>Include real-time and recently active places</span>
                  <button
                    type="button"
                    style={styles.infoButton}
                    onMouseEnter={() => setHoveredInfo('recent-activity')}
                    onMouseLeave={() => setHoveredInfo(null)}
                    onTouchStart={() => setHoveredInfo(hoveredInfo === 'recent-activity' ? null : 'recent-activity')}
                    aria-label="Learn more about recent activity"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={styles.infoIcon}>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="12" cy="8" r="1" fill="currentColor"/>
                    </svg>
                  </button>
                </label>
                {hoveredInfo === 'recent-activity' && (
                  <div style={styles.microcopy}>
                    Helps avoid outdated or inactive recommendations.
                  </div>
                )}
              </div>

              {/* Allow Community Influenced */}
              <div style={styles.toggleItem}>
                <label style={styles.toggleLabel}>
                  <input
                    type="checkbox"
                    checked={trustSettings.allowCommunityInfluenced}
                    onChange={(e) => setTrustSettings(prev => ({ ...prev, allowCommunityInfluenced: e.target.checked }))}
                    disabled={disabled}
                    style={styles.checkbox}
                  />
                  <span style={styles.toggleText}>Allow community-influenced suggestions</span>
                  <button
                    type="button"
                    style={styles.infoButton}
                    onMouseEnter={() => setHoveredInfo('community')}
                    onMouseLeave={() => setHoveredInfo(null)}
                    onTouchStart={() => setHoveredInfo(hoveredInfo === 'community' ? null : 'community')}
                    aria-label="Learn more about community-influenced suggestions"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={styles.infoIcon}>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="12" cy="8" r="1" fill="currentColor"/>
                    </svg>
                  </button>
                </label>
                {hoveredInfo === 'community' && (
                  <div style={styles.microcopy}>
                    Includes recommendations informed by other travelers and locals.
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* SECTION 3: Content Sources */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Content Sources</h3>
            <div style={styles.sectionDescription}>
              Understand where recommendations come from.
            </div>
            
            <div style={styles.contentSources}>
              <div style={styles.sourceItem}>
                <div style={styles.sourceHeader}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={styles.sourceIcon}>
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span style={styles.sourceText}>AI-curated recommendations</span>
                </div>
              </div>
              
              <div style={styles.sourceItem}>
                <div style={styles.sourceHeader}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={styles.sourceIcon}>
                    <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span style={styles.sourceText}>Community-influenced signals</span>
                  <button
                    type="button"
                    style={styles.infoButton}
                    onMouseEnter={() => setHoveredInfo('community-signals')}
                    onMouseLeave={() => setHoveredInfo(null)}
                    onTouchStart={() => setHoveredInfo(hoveredInfo === 'community-signals' ? null : 'community-signals')}
                    aria-label="Learn more about community signals"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={styles.infoIcon}>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="12" cy="8" r="1" fill="currentColor"/>
                    </svg>
                  </button>
                </div>
                {hoveredInfo === 'community-signals' && (
                  <div style={styles.microcopy}>
                    Community-influenced signals are anonymized and aggregated — not reviews or posts.
                  </div>
                )}
              </div>
              
              <div style={styles.sourceItem}>
                <div style={styles.sourceHeader}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={styles.sourceIcon}>
                    <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span style={styles.sourceText}>Context-verified activity data</span>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 4: Transparency & Data */}
          <section style={{ ...styles.section, borderBottom: 'none' }}>
            <h3 style={styles.sectionTitle}>Transparency & Data</h3>
            <div style={styles.sectionDescription}>
              Control how recommendations are explained and how your feedback is used.
            </div>
            
            <div style={styles.transparencyToggles}>
              {/* Show Why Recommended */}
              <div style={styles.toggleItem}>
                <label style={styles.toggleLabel}>
                  <input
                    type="checkbox"
                    checked={transparencySettings.showWhyRecommended}
                    onChange={(e) => setTransparencySettings(prev => ({ ...prev, showWhyRecommended: e.target.checked }))}
                    disabled={disabled}
                    style={styles.checkbox}
                  />
                  <span style={styles.toggleText}>Show "Why this was recommended" explanations</span>
                  <button
                    type="button"
                    style={styles.infoButton}
                    onMouseEnter={() => setHoveredInfo('why-recommended')}
                    onMouseLeave={() => setHoveredInfo(null)}
                    onTouchStart={() => setHoveredInfo(hoveredInfo === 'why-recommended' ? null : 'why-recommended')}
                    aria-label="Learn more about recommendation explanations"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={styles.infoIcon}>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="12" cy="8" r="1" fill="currentColor"/>
                    </svg>
                  </button>
                </label>
                {hoveredInfo === 'why-recommended' && (
                  <div style={styles.microcopy}>
                    Displays a short reason explaining why something was suggested.
                  </div>
                )}
              </div>

              {/* Help Improve */}
              <div style={styles.toggleItem}>
                <label style={styles.toggleLabel}>
                  <input
                    type="checkbox"
                    checked={transparencySettings.helpImproveRecommendations}
                    onChange={(e) => setTransparencySettings(prev => ({ ...prev, helpImproveRecommendations: e.target.checked }))}
                    disabled={disabled}
                    style={styles.checkbox}
                  />
                  <span style={styles.toggleText}>Help improve recommendations</span>
                  <button
                    type="button"
                    style={styles.infoButton}
                    onMouseEnter={() => setHoveredInfo('help-improve')}
                    onMouseLeave={() => setHoveredInfo(null)}
                    onTouchStart={() => setHoveredInfo(hoveredInfo === 'help-improve' ? null : 'help-improve')}
                    aria-label="Learn more about feedback"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={styles.infoIcon}>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="12" cy="8" r="1" fill="currentColor"/>
                    </svg>
                  </button>
                </label>
                {hoveredInfo === 'help-improve' && (
                  <div style={styles.microcopy}>
                    All feedback is anonymous and used to improve future suggestions.
                  </div>
                )}
              </div>
            </div>

            {/* Abuse Feedback Callout */}
            <div style={styles.abuseCallout}>
              <div style={styles.abuseCalloutText}>
                <strong>Something feel off?</strong>
                <br />
                You can flag recommendations as outdated or irrelevant — no account required.
              </div>
            </div>
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
    maxWidth: '540px', // 520-560px range
    width: '90%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
  },
  modalMobile: {
    width: '100%',
    maxHeight: '90vh',
    borderRadius: '16px 16px 0 0',
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
    borderBottom: `1px solid ${colors.border}`,
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    margin: 0,
    color: colors.textPrimary,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '2rem',
    lineHeight: '1',
    color: colors.textSecondary,
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
    paddingBottom: '1.5rem',
    borderBottom: `1px solid ${colors.border}`,
  },
  sectionHeader: {
    marginBottom: '1rem',
  },
  sectionTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    marginBottom: '0.5rem',
    color: colors.textPrimary,
  },
  sectionDescription: {
    fontSize: '0.875rem',
    color: colors.textSecondary,
    lineHeight: '1.5',
    marginBottom: '1rem',
  },
  subsection: {
    marginBottom: '1.5rem',
  },
  subsectionTitle: {
    fontSize: '0.9375rem',
    fontWeight: '600',
    marginBottom: '0.75rem',
    color: colors.textPrimary,
  },
  trustToggles: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  toggleItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
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
    accentColor: colors.primary,
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
  microcopy: {
    fontSize: '0.8125rem',
    color: colors.textSecondary,
    lineHeight: '1.5',
    paddingLeft: '2rem',
    fontStyle: 'italic',
    marginTop: '0.25rem',
  },
  contentSources: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  sourceItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  sourceHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  sourceIcon: {
    width: '16px',
    height: '16px',
    color: colors.textSecondary,
    flexShrink: 0,
  },
  sourceText: {
    fontSize: '0.9375rem',
    color: colors.textPrimary,
    flex: 1,
  },
  transparencyToggles: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginBottom: '1rem',
  },
  abuseCallout: {
    marginTop: '1rem',
    padding: '0.875rem',
    backgroundColor: colors.bgAccent,
    borderRadius: '8px',
    border: `1px solid ${colors.border}`,
  },
  abuseCalloutText: {
    fontSize: '0.875rem',
    color: colors.textSecondary,
    lineHeight: '1.6',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem',
    padding: '1.5rem',
    borderTop: `1px solid ${colors.border}`,
  },
  resetButton: {
    padding: '0.75rem 1.5rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    backgroundColor: 'transparent',
    color: colors.textSecondary,
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none',
  },
  saveButton: {
    padding: '0.75rem 2rem',
    fontSize: '1rem',
    fontWeight: '600',
    backgroundColor: colors.primary,
    color: colors.textInverse,
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
        background-color: ${colors.bgHover} !important;
        color: ${colors.textPrimary} !important;
      }
      button[aria-label="Close settings"]:focus {
        box-shadow: 0 0 0 3px rgba(15, 82, 186, 0.2) !important;
      }
      button[aria-label="Settings"]:hover:not(:disabled) {
        background-color: ${colors.bgHover} !important;
        color: ${colors.primary} !important;
      }
      button[aria-label="Settings"]:active:not(:disabled) {
        background-color: ${colors.bgHover} !important;
      }
      button[aria-label="Settings"]:focus {
        box-shadow: 0 0 0 3px rgba(15, 82, 186, 0.2) !important;
      }
      button[aria-label^="Learn more"]:hover {
        color: ${colors.textPrimary} !important;
        background-color: ${colors.bgHover} !important;
      }
      button[aria-label^="Learn more"]:focus {
        box-shadow: 0 0 0 2px ${colors.primary} !important;
      }
      input[type="checkbox"]:disabled {
        opacity: 0.5;
        cursor: not-allowed !important;
      }
      label:has(input[type="checkbox"]:disabled) {
        opacity: 0.6;
        cursor: not-allowed !important;
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

