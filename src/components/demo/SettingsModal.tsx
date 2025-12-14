/**
 * SettingsModal.tsx
 * Settings modal component for demo preferences.
 * 
 * Contains presets, context toggles, trust & safety settings, and preference controls.
 * Modal is contained within the widget and does not use global portals.
 */

import React, { useEffect, useRef, useState } from 'react';
import { trackEvent } from '@/lib/analytics/trackEvent';
import ContextToggles, { ContextValues } from './ContextToggles';
import Tooltip from './Tooltip';
import ScenariosAndPresets, { ScenarioParameters } from './ScenariosAndPresets';
import AdvancedFilters, { FilterValues } from './AdvancedFilters';
import colors from '@/lib/design/colors';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPresetSelect: (presetText: string) => void;
  onContextChange: (values: ContextValues) => void;
  currentContextValues: ContextValues;
  selectedLLMs?: string[];
  onLLMChange?: (llms: string[]) => void;
  // Filter handlers
  currentVibe?: string;
  currentTime?: string;
  currentLocation?: string;
  onFilterChange?: (filters: { vibe: string; time: string; location: string }) => void;
  onApplyAndGenerate?: () => void;
  disabled?: boolean;
}

// Helper function to convert scenario parameters to filter values
function scenarioToFilters(params: ScenarioParameters, currentFilters: FilterValues): FilterValues {
  return {
    duration: params.time || currentFilters.duration || '',
    budget: params.budget || currentFilters.budget || '',
    outdoor: params.outdoor ?? currentFilters.outdoor,
    groupActivity: params.groupActivity ?? currentFilters.groupActivity,
    creative: params.creative ?? currentFilters.creative,
    relaxing: params.relaxing ?? currentFilters.relaxing,
    vibe: params.vibe || currentFilters.vibe || '',
    location: params.location || currentFilters.location || '',
  };
}

// Helper function to convert filter values to widget state
function filtersToWidgetState(filters: FilterValues): { vibe: string; time: string; location: string } {
  // Combine vibe tags from filters, avoiding duplicates
  const vibeParts: string[] = [];
  
  // Add user-entered vibe tags
  if (filters.vibe) {
    const enteredVibes = filters.vibe.split(',').map(v => v.trim()).filter(v => v.length > 0);
    vibeParts.push(...enteredVibes);
  }
  
  // Add activity type tags if not already present
  const existingVibes = vibeParts.map(v => v.toLowerCase());
  if (filters.creative && !existingVibes.includes('creative')) {
    vibeParts.push('Creative');
  }
  if (filters.relaxing && !existingVibes.includes('relaxed') && !existingVibes.includes('relaxing')) {
    vibeParts.push('Relaxed');
  }
  if (filters.groupActivity && !existingVibes.includes('social') && !existingVibes.includes('group')) {
    vibeParts.push('Social');
  }

  // Determine location - prefer explicit location, then outdoor flag
  let location = filters.location || '';
  if (!location && filters.outdoor) {
    location = 'Outdoor';
  }

  return {
    vibe: vibeParts.join(', '),
    time: filters.duration,
    location: location,
  };
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
  selectedLLMs = ['OpenAI'],
  onLLMChange,
  currentVibe = '',
  currentTime = '',
  currentLocation = '',
  onFilterChange,
  onApplyAndGenerate,
  disabled = false,
}: SettingsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Selected scenario state
  const [selectedScenario, setSelectedScenario] = useState<string | undefined>(undefined);
  
  // Filter values state - initialized from current widget state
  const [filterValues, setFilterValues] = useState<FilterValues>(() => {
    // Parse current vibe to extract activity types
    const vibeLower = (currentVibe || '').toLowerCase();
    return {
      duration: currentTime || '',
      budget: '',
      outdoor: currentLocation.toLowerCase().includes('outdoor'),
      groupActivity: vibeLower.includes('social') || vibeLower.includes('group'),
      creative: vibeLower.includes('creative') || vibeLower.includes('art'),
      relaxing: vibeLower.includes('relaxed') || vibeLower.includes('relaxing'),
      vibe: currentVibe || '',
      location: currentLocation || '',
    };
  });
  
  // Available LLM models with detailed characteristics
  const availableLLMs = [
    { 
      id: 'OpenAI', 
      label: 'OpenAI (GPT-3.5/4)', 
      description: 'Fast, reliable recommendations',
      characteristics: 'Fast response time, reliable output, cost-effective',
      speed: 'Fast',
      creativity: 'High',
      cost: 'Low-Medium'
    },
    { 
      id: 'Anthropic', 
      label: 'Anthropic (Claude)', 
      description: 'Thoughtful, nuanced suggestions',
      characteristics: 'Thoughtful analysis, nuanced understanding, safety-focused',
      speed: 'Medium',
      creativity: 'High',
      cost: 'Medium'
    },
    { 
      id: 'Gemini', 
      label: 'Google (Gemini)', 
      description: 'Creative, diverse options',
      characteristics: 'Creative outputs, diverse perspectives, multimodal capable',
      speed: 'Fast',
      creativity: 'Very High',
      cost: 'Low'
    },
  ];
  
  // LLM selection state (local state synced with prop)
  const [localSelectedLLMs, setLocalSelectedLLMs] = useState<string[]>(selectedLLMs);
  
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
  
  
  // Sync local LLM selection with prop changes
  useEffect(() => {
    setLocalSelectedLLMs(selectedLLMs);
  }, [selectedLLMs]);

  // Sync filter values when current widget state changes
  useEffect(() => {
    const vibeLower = (currentVibe || '').toLowerCase();
    const locationLower = (currentLocation || '').toLowerCase();
    setFilterValues({
      duration: currentTime || '',
      budget: '',
      outdoor: locationLower.includes('outdoor'),
      groupActivity: vibeLower.includes('social') || vibeLower.includes('group'),
      creative: vibeLower.includes('creative') || vibeLower.includes('art'),
      relaxing: vibeLower.includes('relaxed') || vibeLower.includes('relaxing'),
      vibe: currentVibe || '',
      location: currentLocation || '',
    });
  }, [currentVibe, currentTime, currentLocation]);

  // Handle scenario selection
  const handleScenarioSelect = (scenarioName: string, parameters: ScenarioParameters) => {
    setSelectedScenario(scenarioName);
    
    // Update filter values to reflect scenario
    const newFilters = scenarioToFilters(parameters, filterValues);
    setFilterValues(newFilters);
    
    // Update widget state immediately
    const widgetState = filtersToWidgetState(newFilters);
    if (onFilterChange) {
      onFilterChange(widgetState);
    }
    
    // Also call legacy preset handler for compatibility
    onPresetSelect(scenarioName);
  };

  // Handle filter values change
  const handleFilterValuesChange = (newFilters: FilterValues) => {
    setFilterValues(newFilters);
    setSelectedScenario(undefined); // Clear scenario selection when manually editing
    
    // Update widget state immediately
    const widgetState = filtersToWidgetState(newFilters);
    if (onFilterChange) {
      onFilterChange(widgetState);
    }
  };

  // Handle Apply & Generate
  const handleApplyAndGenerate = () => {
    if (onApplyAndGenerate) {
      onApplyAndGenerate();
      onClose(); // Close modal after generating
    }
  };
  
  // Handle LLM selection change
  const handleLLMChange = (model: string, checked: boolean) => {
    let newSelection: string[];
    
    if (checked) {
      newSelection = [...localSelectedLLMs, model];
    } else {
      newSelection = localSelectedLLMs.filter(m => m !== model);
    }
    
    // Ensure at least one LLM is selected
    if (newSelection.length === 0) {
      return;
    }
    
    setLocalSelectedLLMs(newSelection);
    if (onLLMChange) {
      onLLMChange(newSelection);
    }
  };

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
        data-settings-modal
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
          {/* SECTION 1: Scenarios & Presets - High-value instant configurations */}
          <section style={styles.section}>
            <ScenariosAndPresets
              onScenarioSelect={handleScenarioSelect}
              onApplyAndGenerate={handleApplyAndGenerate}
              selectedScenario={selectedScenario}
              disabled={disabled}
              currentFilterState={{
                vibe: filterValues.vibe,
                time: filterValues.duration,
                location: filterValues.location,
                budget: filterValues.budget || undefined,
                outdoor: filterValues.outdoor,
                groupActivity: filterValues.groupActivity,
                creative: filterValues.creative,
                relaxing: filterValues.relaxing,
              }}
              currentLocation={currentLocation}
            />
          </section>

          {/* SECTION 2: Advanced Filters - Manual refinement */}
          <section style={styles.section}>
            <AdvancedFilters
              values={filterValues}
              onValuesChange={handleFilterValuesChange}
              disabled={disabled}
            />
          </section>

          {/* SECTION 3: Travel Context - Core personalization */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Travel Context</h3>
            <div style={styles.sectionDescription}>
              Tell us about your situation to get more personalized recommendations.
            </div>
            <ContextToggles
              onChange={onContextChange}
              disabled={disabled}
            />
          </section>

          {/* SECTION 4: Trust & Safety - Quality filters */}
          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Trust & Safety</h3>
              <div style={styles.sectionDescription}>
                Control how recommendations are filtered and verified for quality and reliability.
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
                  <Tooltip
                    content="Prioritizes suggestions with stronger verification signals."
                    position="top"
                  >
                    <button
                      type="button"
                      style={styles.infoButton}
                      aria-label="Learn more about highly trusted recommendations"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={styles.infoIcon}>
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                        <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <circle cx="12" cy="8" r="1" fill="currentColor"/>
                      </svg>
                    </button>
                  </Tooltip>
                </label>
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
                  <Tooltip
                    content="Helps avoid outdated or inactive recommendations."
                    position="top"
                  >
                    <button
                      type="button"
                      style={styles.infoButton}
                      aria-label="Learn more about recent activity"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={styles.infoIcon}>
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                        <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <circle cx="12" cy="8" r="1" fill="currentColor"/>
                      </svg>
                    </button>
                  </Tooltip>
                </label>
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
                  <Tooltip
                    content="Includes recommendations informed by other travelers and locals."
                    position="top"
                  >
                    <button
                      type="button"
                      style={styles.infoButton}
                      aria-label="Learn more about community-influenced suggestions"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={styles.infoIcon}>
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                        <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <circle cx="12" cy="8" r="1" fill="currentColor"/>
                      </svg>
                    </button>
                  </Tooltip>
                </label>
              </div>
            </div>
          </section>

          {/* SECTION 5: Transparency & Data - How recommendations work */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Transparency & Data</h3>
            <div style={styles.sectionDescription}>
              Control how recommendations are explained and how your feedback is used to improve future suggestions.
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
                    <Tooltip
                      content="Displays a short reason explaining why something was suggested."
                      position="top"
                    >
                      <button
                        type="button"
                        style={styles.infoButton}
                        aria-label="Learn more about recommendation explanations"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={styles.infoIcon}>
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                          <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <circle cx="12" cy="8" r="1" fill="currentColor"/>
                        </svg>
                      </button>
                    </Tooltip>
                </label>
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
                    <Tooltip
                      content="All feedback is anonymous and used to improve future suggestions."
                      position="top"
                    >
                      <button
                        type="button"
                        style={styles.infoButton}
                        aria-label="Learn more about feedback"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={styles.infoIcon}>
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                          <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <circle cx="12" cy="8" r="1" fill="currentColor"/>
                        </svg>
                      </button>
                    </Tooltip>
                </label>
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

          {/* SECTION 6: Content Sources - Informational */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Content Sources</h3>
            <div style={styles.sectionDescription}>
              Understand where recommendations come from and how they're generated.
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
                    <Tooltip
                      content="Community-influenced signals are anonymized and aggregated — not reviews or posts."
                      position="top"
                    >
                      <button
                        type="button"
                        style={styles.infoButton}
                        aria-label="Learn more about community signals"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={styles.infoIcon}>
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                          <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <circle cx="12" cy="8" r="1" fill="currentColor"/>
                        </svg>
                      </button>
                    </Tooltip>
                  </div>
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

          {/* SECTION 7: AI Agent / LLM Selection - Advanced/Technical (Progressive Disclosure) */}
          <section style={{ ...styles.section, borderBottom: 'none' }}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>AI Agent / LLM Selection</h3>
              <div style={styles.sectionDescription}>
                Advanced: Choose one or more AI models to generate recommendations. Multiple models can provide diverse perspectives.
              </div>
            </div>
            
            <div style={{
              ...styles.llmOptions,
              maxHeight: isMobile ? '300px' : 'none',
              overflowY: isMobile ? 'auto' : 'visible',
              WebkitOverflowScrolling: isMobile ? 'touch' : undefined,
              paddingRight: isMobile ? '0.5rem' : '0',
            } as React.CSSProperties}>
              {availableLLMs.map((llm) => {
                const isSelected = localSelectedLLMs.includes(llm.id);
                const infoKey = `llm-${llm.id}`;
                return (
                  <div key={llm.id} style={styles.llmOption}>
                    <label style={styles.llmLabel}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleLLMChange(llm.id, e.target.checked)}
                        disabled={disabled || (isSelected && localSelectedLLMs.length === 1)}
                        style={styles.checkbox}
                      />
                      <div style={styles.llmContent}>
                        <div style={styles.llmHeader}>
                          <span style={styles.llmName}>{llm.label}</span>
                          <Tooltip
                            content={
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                  <span>Speed:</span>
                                  <span style={{ fontWeight: '600' }}>{llm.speed}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                  <span>Creativity:</span>
                                  <span style={{ fontWeight: '600' }}>{llm.creativity}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: `1px solid rgba(255, 255, 255, 0.2)` }}>
                                  <span>Cost:</span>
                                  <span style={{ fontWeight: '600' }}>{llm.cost}</span>
                                </div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>{llm.characteristics}</div>
                              </div>
                            }
                            position="top"
                            maxWidth={240}
                          >
                            <button
                              type="button"
                              style={styles.infoButton}
                              aria-label={`Learn more about ${llm.label}`}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={styles.infoIcon}>
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                                <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <circle cx="12" cy="8" r="1" fill="currentColor"/>
                              </svg>
                            </button>
                          </Tooltip>
                        </div>
                        <span style={styles.llmDescription}>{llm.description}</span>
                      </div>
                    </label>
                  </div>
                );
              })}
            </div>
            
            {localSelectedLLMs.length > 1 && (
              <div style={styles.llmNote}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={styles.infoIcon}>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="12" cy="8" r="1" fill="currentColor"/>
                </svg>
                <span>Multiple models will be used in order of preference. If one fails, the next will be tried automatically.</span>
              </div>
            )}
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
  llmOptions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  llmOption: {
    display: 'flex',
    flexDirection: 'column',
  },
  llmLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    cursor: 'pointer',
    padding: '0.75rem',
    borderRadius: '8px',
    transition: 'background-color 0.2s',
  },
  llmContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    flex: 1,
    position: 'relative',
  },
  llmHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    justifyContent: 'space-between',
  },
  llmName: {
    fontSize: '0.9375rem',
    fontWeight: '500',
    color: colors.textPrimary,
    flex: 1,
  },
  llmDescription: {
    fontSize: '0.8125rem',
    color: colors.textSecondary,
    lineHeight: '1.4',
  },
  llmTooltip: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '0.5rem',
    padding: '0.875rem',
    backgroundColor: colors.bgBase,
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    zIndex: 10,
    fontSize: '0.8125rem',
  },
  llmTooltipRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  llmTooltipLabel: {
    color: colors.textSecondary,
    fontWeight: '500',
  },
  llmTooltipValue: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  llmTooltipDescription: {
    marginTop: '0.5rem',
    paddingTop: '0.5rem',
    borderTop: `1px solid ${colors.border}`,
    color: colors.textSecondary,
    fontSize: '0.75rem',
    lineHeight: '1.5',
  },
  llmNote: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.5rem',
    marginTop: '1rem',
    padding: '0.875rem',
    backgroundColor: colors.bgAccent,
    borderRadius: '8px',
    border: `1px solid ${colors.border}`,
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
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
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
        box-shadow: 0 0 0 3px rgba(29, 66, 137, 0.2) !important;
      }
      button[aria-label="Settings"]:hover:not(:disabled) {
        background-color: ${colors.bgHover} !important;
        color: ${colors.primary} !important;
      }
      /* LLM Option hover - removed, labels are not clickable */
      [data-settings-modal] label[style*="llmLabel"] input[type="checkbox"]:checked + div span:first-child {
        color: ${colors.primary} !important;
      }
      button[aria-label="Settings"]:active:not(:disabled) {
        background-color: ${colors.bgHover} !important;
      }
      button[aria-label="Settings"]:focus {
        box-shadow: 0 0 0 3px rgba(29, 66, 137, 0.2) !important;
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

