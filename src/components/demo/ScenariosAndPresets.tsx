/**
 * ScenariosAndPresets.tsx
 * Scenarios & Presets component for the Settings Modal.
 * 
 * Displays categorized, context-aware scenario presets that users can
 * click to apply complete parameter sets. Features dynamic prioritization
 * based on time, user history, and context.
 */

import React, { useMemo } from 'react';
import { trackEvent } from '@/lib/analytics/trackEvent';
import colors from '@/lib/design/colors';
import { 
  prioritizeScenariosByContext, 
  checkForActiveScenario,
  type MotivationCategory,
  type ScenarioPreset,
  type UserHistory 
} from '@/lib/utils/scenarioPrioritization';

export interface ScenarioParameters {
  vibe?: string;
  time?: string;
  location?: string;
  budget?: 'low' | 'medium' | 'high';
  outdoor?: boolean;
  groupActivity?: boolean;
  creative?: boolean;
  relaxing?: boolean;
}

export interface ScenariosAndPresetsProps {
  onScenarioSelect: (scenario: string, parameters: ScenarioParameters) => void;
  onApplyAndGenerate?: () => void;
  selectedScenario?: string;
  disabled?: boolean;
  // Current filter state for active scenario detection
  currentFilterState?: {
    vibe?: string;
    time?: string;
    location?: string;
    budget?: 'low' | 'medium' | 'high' | '';
    outdoor?: boolean;
    groupActivity?: boolean;
    creative?: boolean;
    relaxing?: boolean;
  };
  // Context for prioritization
  userHistory?: UserHistory;
  currentLocation?: string;
}

// Category display names
const CATEGORY_NAMES: Record<MotivationCategory, string> = {
  RechargeAndUnwind: 'Recharge & Unwind',
  ConnectAndSocialize: 'Connect & Socialize',
  DiscoverAndCreate: 'Discover & Create',
};

// Scenario definitions with motivation categories
const SCENARIOS: ScenarioPreset[] = [
  // Recharge & Unwind
  {
    id: 'unplugged-hour',
    name: 'The Unplugged Hour',
    motivation_category: 'RechargeAndUnwind',
    parameters: {
      vibe: 'Relaxed',
      time: '1 hour',
      location: '',
      budget: 'low',
      outdoor: false,
      groupActivity: false,
      creative: false,
      relaxing: true,
    },
  },
  {
    id: 'slow-paced-wander',
    name: 'Slow-Paced Wander',
    motivation_category: 'RechargeAndUnwind',
    parameters: {
      vibe: 'Relaxed',
      time: '2 hours',
      location: 'Outdoor',
      budget: 'low',
      outdoor: true,
      groupActivity: false,
      creative: false,
      relaxing: true,
    },
  },
  {
    id: 'personal-reset',
    name: 'The Personal Reset',
    motivation_category: 'RechargeAndUnwind',
    parameters: {
      vibe: 'Relaxed',
      time: '3-4 hours',
      location: '',
      budget: 'medium',
      outdoor: false,
      groupActivity: false,
      creative: true,
      relaxing: true,
    },
  },
  // Connect & Socialize
  {
    id: 'after-work-mixer',
    name: 'After-Work Quick-Mixer',
    motivation_category: 'ConnectAndSocialize',
    parameters: {
      vibe: 'Social',
      time: '2 hours',
      location: '',
      budget: 'medium',
      outdoor: false,
      groupActivity: true,
      creative: false,
      relaxing: false,
    },
  },
  {
    id: 'group-challenge',
    name: 'Group Challenge (4+)',
    motivation_category: 'ConnectAndSocialize',
    parameters: {
      vibe: 'Social, Adventurous',
      time: '2-3 hours',
      location: 'Outdoor',
      budget: 'low',
      outdoor: true,
      groupActivity: true,
      creative: false,
      relaxing: false,
    },
  },
  {
    id: 'couples-date',
    name: "Couple's Spontaneous Date",
    motivation_category: 'ConnectAndSocialize',
    parameters: {
      vibe: 'Social, Creative',
      time: '3-4 hours',
      location: '',
      budget: 'medium',
      outdoor: false,
      groupActivity: true,
      creative: true,
      relaxing: true,
    },
  },
  // Discover & Create
  {
    id: 'hidden-gem-seeker',
    name: 'The Hidden Gem Seeker',
    motivation_category: 'DiscoverAndCreate',
    parameters: {
      vibe: 'Adventurous, Creative',
      time: '2-3 hours',
      location: '',
      budget: 'low',
      outdoor: false,
      groupActivity: false,
      creative: true,
      relaxing: false,
    },
  },
  {
    id: 'local-skill-taster',
    name: 'Local Skill Taster (90 min)',
    motivation_category: 'DiscoverAndCreate',
    parameters: {
      vibe: 'Creative',
      time: '1 hour',
      location: '',
      budget: 'medium',
      outdoor: false,
      groupActivity: false,
      creative: true,
      relaxing: false,
    },
  },
  {
    id: 'architecture-explorer',
    name: 'Architecture Explorer',
    motivation_category: 'DiscoverAndCreate',
    parameters: {
      vibe: 'Creative, Adventurous',
      time: '2-3 hours',
      location: 'Outdoor',
      budget: 'low',
      outdoor: true,
      groupActivity: false,
      creative: true,
      relaxing: false,
    },
  },
];

/**
 * ScenariosAndPresets component - Categorized, context-aware scenarios.
 */
export default function ScenariosAndPresets({
  onScenarioSelect,
  onApplyAndGenerate,
  selectedScenario,
  disabled = false,
  currentFilterState,
  userHistory,
  currentLocation,
}: ScenariosAndPresetsProps) {
  // Prioritize categories based on context
  const prioritizedCategories = useMemo(() => {
    return prioritizeScenariosByContext(userHistory, new Date(), currentLocation);
  }, [userHistory, currentLocation]);

  // Group scenarios by category
  const scenariosByCategory = useMemo(() => {
    const grouped: Record<MotivationCategory, ScenarioPreset[]> = {
      RechargeAndUnwind: [],
      ConnectAndSocialize: [],
      DiscoverAndCreate: [],
    };

    SCENARIOS.forEach(scenario => {
      grouped[scenario.motivation_category].push(scenario);
    });

    return grouped;
  }, []);

  // Check for active scenario
  const getActiveScenarioId = (scenario: ScenarioPreset): string | null => {
    if (!currentFilterState) return null;
    return checkForActiveScenario(currentFilterState, scenario) ? scenario.id : null;
  };

  const handleScenarioClick = (scenario: ScenarioPreset) => {
    if (disabled) return;

    trackEvent('scenario_select', {
      scenario_name: scenario.name,
      scenario_id: scenario.id,
      category: scenario.motivation_category,
      timestamp: Date.now(),
    });

    onScenarioSelect(scenario.name, scenario.parameters);
  };

  const handleApplyAndGenerate = () => {
    if (disabled || !onApplyAndGenerate) return;

    trackEvent('apply_and_generate', {
      scenario: selectedScenario || 'custom',
      timestamp: Date.now(),
    });

    onApplyAndGenerate();
  };

  return (
    <div style={styles.container} data-scenarios-presets-section>
      <h3 style={styles.title}>Scenarios & Presets</h3>
      <div style={styles.description}>
        Choose a complete plan to instantly configure your recommendations, or build your own using Advanced Filters below.
      </div>

      {/* Render categories in prioritized order */}
      <div style={styles.categoriesContainer}>
        {prioritizedCategories.map((category) => {
          const categoryScenarios = scenariosByCategory[category];
          if (categoryScenarios.length === 0) return null;

          return (
            <div key={category} style={styles.categoryBlock}>
              <h4 style={styles.categoryTitle}>{CATEGORY_NAMES[category]}</h4>
              <div style={styles.scenariosGrid}>
                {categoryScenarios.map((scenario) => {
                  const isSelected = selectedScenario === scenario.name;
                  const isActive = getActiveScenarioId(scenario) === scenario.id;
                  
                  return (
                    <button
                      key={scenario.id}
                      type="button"
                      onClick={() => handleScenarioClick(scenario)}
                      disabled={disabled}
                      style={{
                        ...styles.scenarioCard,
                        ...(isSelected ? styles.scenarioCardSelected : {}),
                        ...(isActive ? styles.scenarioCardActive : {}),
                        ...(disabled ? styles.scenarioCardDisabled : {}),
                      }}
                      aria-label={`Select scenario: ${scenario.name}`}
                      aria-pressed={isSelected}
                      data-scenario-id={scenario.id}
                      className={isActive ? 'scenario-chip is_active' : 'scenario-chip'}
                    >
                      <div style={styles.scenarioHeader}>
                        <span style={styles.scenarioName} className="scenario-name">{scenario.name}</span>
                        <div style={styles.scenarioIcons}>
                          {isActive && (
                            <span style={styles.activeBadge} aria-label="Currently active">
                              Active
                            </span>
                          )}
                          {isSelected && (
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              style={styles.checkIcon}
                            >
                              <path
                                d="M20 6L9 17L4 12"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </div>
                      </div>
                      <div style={styles.scenarioDescription} className="scenario-description">
                        {scenario.parameters.time} • {scenario.parameters.budget === 'low' ? '$' : scenario.parameters.budget === 'medium' ? '$$' : '$$$'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {selectedScenario && onApplyAndGenerate && (
        <div style={styles.applySection}>
          <button
            type="button"
            onClick={handleApplyAndGenerate}
            disabled={disabled}
            style={{
              ...styles.applyButton,
              ...(disabled ? styles.applyButtonDisabled : {}),
            }}
            aria-label="Apply scenario and generate recommendations"
          >
            <span>Apply & Generate</span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={styles.arrowIcon}
            >
              <path
                d="M5 12H19M19 12L12 5M19 12L12 19"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    marginBottom: '2rem',
  },
  title: {
    fontSize: '1.125rem',
    fontWeight: '600',
    marginBottom: '0.5rem',
    color: colors.textPrimary,
  },
  description: {
    fontSize: '0.875rem',
    color: colors.textSecondary,
    lineHeight: '1.5',
    marginBottom: '1.5rem',
  },
  categoriesContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  categoryBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  categoryTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: colors.textPrimary,
    margin: 0,
  },
  scenariosGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '0.75rem',
  },
  scenarioCard: {
    padding: '1rem',
    backgroundColor: colors.bgPrimary,
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    position: 'relative',
  },
  scenarioCardSelected: {
    backgroundColor: `var(--sdk-bg-accent, ${colors.bgAccent})`,
    borderColor: `var(--sdk-primary-color, ${colors.primary})`,
    borderWidth: '2px',
  },
  scenarioCardActive: {
    backgroundColor: `var(--sdk-ui-background-light, var(--sdk-bg-accent, ${colors.bgAccent}))`,
    borderColor: `var(--sdk-primary-color, ${colors.primary})`,
    borderWidth: '2px',
    borderStyle: 'solid',
    boxShadow: 'none',
    transition: 'all 0.1s ease-in-out',
  },
  scenarioCardDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  scenarioHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '0.5rem',
  },
  scenarioName: {
    fontSize: '0.9375rem',
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  scenarioIcons: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexShrink: 0,
  },
  activeBadge: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: `var(--sdk-primary-color, ${colors.primary})`,
    backgroundColor: `var(--sdk-bg-accent, ${colors.bgAccent})`,
    padding: '0.125rem 0.5rem',
    borderRadius: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.025em',
  },
  checkIcon: {
    color: `var(--sdk-primary-color, ${colors.primary})`,
    flexShrink: 0,
  },
  scenarioDescription: {
    fontSize: '0.8125rem',
    color: colors.textSecondary,
    lineHeight: '1.4',
  },
  applySection: {
    marginTop: '1.5rem',
    paddingTop: '1.5rem',
    borderTop: `1px solid ${colors.border}`,
  },
  applyButton: {
    width: '100%',
    padding: '0.875rem 1.5rem',
    fontSize: '1rem',
    fontWeight: '600',
    backgroundColor: `var(--sdk-primary-color, ${colors.primary})`,
    color: `var(--sdk-text-inverse, ${colors.textInverse})`,
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  },
  applyButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  arrowIcon: {
    flexShrink: 0,
  },
};

// Add hover styles
if (typeof document !== 'undefined') {
  const styleId = 'scenarios-and-presets-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* ---------------------------------------------------- */
      /* Ensure the static state for non-active chips is defined: */
      /* ---------------------------------------------------- */
      .scenario-chip {
        /* Static state: Light background, dark text (Accessible!) */
        background-color: var(--sdk-ui-background-light, var(--sdk-bg-color, ${colors.bgPrimary}));
        color: var(--sdk-text-default, var(--sdk-text-color, ${colors.textPrimary}));
        border: 1px solid var(--sdk-border-default, var(--sdk-border-color, ${colors.border}));
        transition: all 0.2s ease-in-out;
      }
      
      /* ---------------------------------------------------- */
      /* Target: The standard hover state for NON-ACTIVE chips */
      /* Use highest specificity to override any conflicting global styles */
      /* ---------------------------------------------------- */
      [data-settings-modal] [data-scenarios-presets-section] .scenario-chip:hover:not(.is_active),
      [data-scenarios-presets-section] .scenario-chip:hover:not(.is_active),
      .scenario-chip:hover:not(.is_active) {
        /*
        CRITICAL FIX: Ensure the background color switches to the DARK hover color 
        at the exact same time the text color switches to white.
        */
        
        /* 1. FORCE Dark Background (e.g., #16336B)
        This must be dark to justify the white text below.
        If the hover background is staying light, this is the rule being ignored.
        */
        background-color: var(--sdk-hover-color, #16336B) !important;
        
        /* 2. FORCE White Text (#FFFFFF)
        This ensures readability against the dark background defined above.
        NOTE: This is the desired state only because we are forcing the dark background.
        */
        color: #FFFFFF !important;
        
        /* Reset other properties that might cause visual conflicts */
        border-color: var(--sdk-hover-color, #16336B) !important;
        border: 1px solid var(--sdk-hover-color, #16336B) !important;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
        transform: translateY(-2px);
        cursor: pointer !important;
        transition: all 0.2s ease-in-out;
      }
      
      /* Ensure all text elements are white on hover for non-active chips */
      [data-settings-modal] [data-scenarios-presets-section] .scenario-chip:hover:not(.is_active) .scenario-name,
      [data-settings-modal] [data-scenarios-presets-section] .scenario-chip:hover:not(.is_active) .scenario-description,
      [data-settings-modal] [data-scenarios-presets-section] .scenario-chip:hover:not(.is_active) span,
      [data-settings-modal] [data-scenarios-presets-section] .scenario-chip:hover:not(.is_active) div,
      [data-scenarios-presets-section] .scenario-chip:hover:not(.is_active) .scenario-name,
      [data-scenarios-presets-section] .scenario-chip:hover:not(.is_active) .scenario-description,
      [data-scenarios-presets-section] .scenario-chip:hover:not(.is_active) span,
      [data-scenarios-presets-section] .scenario-chip:hover:not(.is_active) div,
      .scenario-chip:hover:not(.is_active) .scenario-name,
      .scenario-chip:hover:not(.is_active) .scenario-description,
      .scenario-chip:hover:not(.is_active) span,
      .scenario-chip:hover:not(.is_active) div {
        color: #FFFFFF !important;
      }
      
      /* Ensure icons are white on hover for non-active chips */
      [data-settings-modal] [data-scenarios-presets-section] .scenario-chip:hover:not(.is_active) svg,
      [data-scenarios-presets-section] .scenario-chip:hover:not(.is_active) svg,
      .scenario-chip:hover:not(.is_active) svg {
        color: #FFFFFF !important;
        stroke: #FFFFFF !important;
      }
      /* Legacy support for aria-pressed="false" */
      button[aria-pressed="false"]:not(:disabled):hover:not(.is_active) {
        background-color: var(--sdk-hover-color, #16336B) !important;
        color: #FFFFFF !important;
        border-color: var(--sdk-hover-color, #16336B) !important;
        transform: translateY(-2px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
      }
      button[aria-pressed="true"]:not(:disabled):hover {
        background-color: inherit !important;
        border-color: inherit !important;
        transform: none !important;
        box-shadow: none !important;
      }
      /* Active badge hover effect for non-active chips only */
      button[data-scenario-id]:not(:disabled):hover:not(.is_active) [style*="activeBadge"] {
        background-color: var(--sdk-primary-color, #1D4289) !important;
        color: var(--sdk-text-inverse, #FFFFFF) !important;
      }
      /* ---------------------------------------------------- */
      /* 1. Define the desired, readable static active state  */
      /* (Ensure this is correctly set for readability)       */
      /* ---------------------------------------------------- */
      .scenario-chip.is_active {
        /* This is the intended look when the chip IS selected */
        background-color: var(--sdk-ui-background-light, var(--sdk-bg-accent, ${colors.bgAccent})) !important;
        color: var(--sdk-primary-color, ${colors.primary}) !important;
        border: 2px solid var(--sdk-primary-color, ${colors.primary}) !important;
        box-shadow: none !important;
        transition: all 0.1s ease-in-out !important;
      }
      
      /* ---------------------------------------------------- */
      /* 2. CRITICAL OVERRIDE: Reset Hover Styles on Active Chip */
      /* ---------------------------------------------------- */
      .scenario-chip.is_active:hover {
        /*
        FORCIBLY RESET THE CONFLICTING STYLES:
        Set the background and text color back to the desired static active values
        to prevent the solid fill/black text from appearing.
        */
        
        /* Reset Background: Must match the static active background color */
        background-color: var(--sdk-ui-background-light, var(--sdk-bg-accent, ${colors.bgAccent})) !important; 

        /* Reset Text Color: Must match the static active text color */
        color: var(--sdk-primary-color, ${colors.primary}) !important; 

        /* Reset any other conflicting properties from the general hover rule: */
        border: 2px solid var(--sdk-primary-color, ${colors.primary}) !important;
        box-shadow: none !important; 
        cursor: default !important; 
        transform: none !important;
        opacity: 1 !important;
      }
      
      /* Ensure all child text elements maintain primary color on hover */
      .scenario-chip.is_active:hover .scenario-name,
      .scenario-chip.is_active:hover .scenario-description,
      .scenario-chip.is_active:hover span.scenario-name,
      .scenario-chip.is_active:hover div.scenario-description,
      .scenario-chip.is_active:hover span,
      .scenario-chip.is_active:hover div {
        color: var(--sdk-primary-color, ${colors.primary}) !important;
      }
      
      /* Ensure active badge maintains static state on hover */
      .scenario-chip.is_active:hover [style*="activeBadge"],
      .scenario-chip.is_active:hover .active-badge {
        background-color: var(--sdk-ui-background-light, var(--sdk-bg-accent, ${colors.bgAccent})) !important;
        color: var(--sdk-primary-color, ${colors.primary}) !important;
      }
      
      /* Ensure icons maintain static active state on hover */
      .scenario-chip.is_active:hover svg {
        color: var(--sdk-primary-color, ${colors.primary}) !important;
        stroke: var(--sdk-primary-color, ${colors.primary}) !important;
      }
      button[type="button"][aria-label*="Apply"]:not(:disabled):hover {
        background-color: var(--sdk-hover-color, #16336B) !important;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(29, 66, 137, 0.3) !important;
      }
      button:focus {
        box-shadow: 0 0 0 3px rgba(29, 66, 137, 0.2) !important;
      }
    `;
    if (document.head) {
      document.head.appendChild(style);
    }
  }
}

