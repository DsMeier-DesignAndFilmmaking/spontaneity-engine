/**
 * DeveloperSandbox.tsx
 * Advanced developer sandbox - requires authentication.
 * 
 * Enterprise-ready B2B testing interface with:
 * - Three-column feature showcase
 * - Pre-populated high-value test scenarios
 * - Side-by-side Input vs Output JSON comparison
 * - Advanced developer experience messaging
 */

import React, { useState } from 'react';
import { supabase, validateSupabaseConfig } from '@/lib/db/supabase';
import colors from '@/lib/design/colors';
import { testScenarios, getScenarioById, type TestScenario } from './testScenarios';

/**
 * DeveloperSandbox component - Advanced B2B demo interface.
 * 
 * Features:
 * - Three-column feature layout (responsive)
 * - Togglable test scenarios with instant execution
 * - Side-by-side Input/Output JSON comparison
 * - B2B-focused messaging and CTAs
 * - Logout functionality
 */
export default function DeveloperSandbox() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [inputJson, setInputJson] = useState<string | null>(null);
  const [outputJson, setOutputJson] = useState<string | null>(null);

  /**
   * Handles the logout process.
   * 
   * Executes supabase.auth.signOut() to terminate the session.
   * User remains on /demo page after logout - no redirect occurs.
   */
  const handleLogout = async () => {
    try {
      setLoading(true);
      setError(null);
      
      validateSupabaseConfig();
      
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        console.error('Error signing out:', signOutError);
        setError('An error occurred during logout. Please try again.');
        setLoading(false);
        return;
      }

      setLoading(false);
    } catch (err) {
      console.error('Unexpected error during logout:', err);
      setError('An unexpected error occurred during logout.');
      setLoading(false);
    }
  };

  /**
   * Handles test scenario selection and instant execution.
   */
  const handleScenarioSelect = (scenarioId: string) => {
    const scenario = getScenarioById(scenarioId);
    if (!scenario) {
      setError('Scenario not found');
      return;
    }

    // Toggle: If same scenario is clicked, deselect it
    if (selectedScenario === scenarioId) {
      setSelectedScenario(null);
      setInputJson(null);
      setOutputJson(null);
      return;
    }

    // Set selected scenario and display JSON
    setSelectedScenario(scenarioId);
    setError(null);
    
    // Format and display Input JSON
    setInputJson(JSON.stringify(scenario.input, null, 2));
    
    // Format and display Output JSON (simulate instant execution)
    setOutputJson(JSON.stringify(scenario.output, null, 2));
  };

  return (
    <div style={styles.container}>
      <div style={styles.card} data-demo-card>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>The Developer Sandbox</h1>
            <p style={styles.subtitle}>
              Try the Engine — Enterprise testing with advanced capabilities
            </p>
          </div>
          <button
            onClick={handleLogout}
            disabled={loading}
            style={{
              ...styles.logoutButton,
              ...(loading ? styles.buttonDisabled : {}),
            }}
          >
            Log Out
          </button>
        </div>

        {/* Three-Column Feature Layout */}
        <div style={styles.featuresGrid}>
          {/* Column 1: Dynamic Trip Logic */}
          <div style={styles.featureColumn}>
            <h3 style={styles.featureColumnTitle}>Dynamic Trip Logic</h3>
            <ul style={styles.featureList}>
              <li style={styles.featureItem}>Calendar Sync & Live Geo-Routing</li>
              <li style={styles.featureItem}>Scenario Versioning</li>
              <li style={styles.featureItem}>Dedicated API Key for Sandbox</li>
              <li style={styles.featureItem}>Contextual Trip Constraints</li>
            </ul>
          </div>

          {/* Column 2: Debugging & Precision */}
          <div style={styles.featureColumn}>
            <h3 style={styles.featureColumnTitle}>Debugging & Precision</h3>
            <ul style={styles.featureList}>
              <li style={styles.featureItem}>Raw JSON & Schema Validation</li>
              <li style={styles.featureItem}>White-Label API & Branding Preview</li>
              <li style={styles.featureItem}>Ancillary Data Output</li>
              <li style={styles.featureItem}>Persistent Test Sessions</li>
            </ul>
          </div>

          {/* Column 3: Deployment & Production Readiness */}
          <div style={styles.featureColumn}>
            <h3 style={styles.featureColumnTitle}>Deployment & Production Readiness</h3>
            <ul style={styles.featureList}>
              <li style={styles.featureItem}>Role-Based Access Control (RBAC) Preview</li>
              <li style={styles.featureItem}>Enterprise Security Standards</li>
              <li style={styles.featureItem}>Scalable Architecture</li>
              <li style={styles.featureItem}>Production Monitoring</li>
            </ul>
          </div>
        </div>

        {/* Test Scenarios Section */}
        <div style={styles.scenariosSection}>
          <h3 style={styles.sectionTitle}>High-Impact Test Scenarios</h3>
          <p style={styles.sectionDescription}>
            Click any scenario to instantly view Input vs Optimized AI Output side-by-side
          </p>
          
          <div style={styles.scenariosGrid}>
            {testScenarios.map((scenario) => (
              <button
                key={scenario.id}
                type="button"
                onClick={() => handleScenarioSelect(scenario.id)}
                style={{
                  ...styles.scenarioButton,
                  ...(selectedScenario === scenario.id ? styles.scenarioButtonActive : {}),
                }}
                aria-pressed={selectedScenario === scenario.id}
              >
                <div style={styles.scenarioHeader}>
                  <h4 style={styles.scenarioName}>{scenario.name}</h4>
                  <span style={styles.scenarioBadge}>{scenario.description}</span>
                </div>
                <p style={styles.scenarioCoreFunction}>{scenario.coreFunction}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Side-by-Side Input vs Output Display */}
        {(inputJson && outputJson) && (
          <div style={styles.jsonComparisonSection}>
            <h3 style={styles.sectionTitle}>Input vs Optimized Output</h3>
            <div style={styles.jsonComparison}>
              {/* Input JSON */}
              <div style={styles.jsonPanel}>
                <div style={styles.jsonPanelHeader}>
                  <h4 style={styles.jsonPanelTitle}>Input JSON / Constraints</h4>
                </div>
                <pre style={styles.jsonContent}>{inputJson}</pre>
              </div>

              {/* Output JSON */}
              <div style={styles.jsonPanel}>
                <div style={styles.jsonPanelHeader}>
                  <h4 style={styles.jsonPanelTitle}>Resulting Output JSON</h4>
                </div>
                <pre style={styles.jsonContent}>{outputJson}</pre>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div style={styles.errorBox}>
            <p style={styles.errorText}>{error}</p>
          </div>
        )}

        {/* CTA Section */}
        <div style={styles.ctaSection}>
          <h3 style={styles.ctaTitle}>
            Why Sign In? (The Advanced Developer Experience)
          </h3>
          <p style={styles.ctaDescription}>
            Unlock the full power of the Spontaneity Engine to build, test, and deploy mission-critical travel solutions. Signing in grants you: <strong>Unlimited Enterprise Testing</strong>, <strong>Deep Logic Access</strong>, and <strong>B2B Tools Preview</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: '100%',
    padding: '0',
  },
  card: {
    backgroundColor: colors.bgPrimary,
    border: `1px solid ${colors.border}`,
    borderRadius: '0.75rem',
    padding: '1.5rem',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: '1rem',
    color: colors.textMuted,
  },
  logoutButton: {
    padding: '0.75rem 1.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    backgroundColor: colors.bgBase,
    color: colors.textMuted,
    border: `2px solid ${colors.border}`,
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none',
    flexShrink: 0,
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2.5rem',
    padding: '1.5rem',
    backgroundColor: colors.bgBase,
    borderRadius: '8px',
  },
  featureColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  featureColumnTitle: {
    fontSize: '1.125rem',
    fontWeight: '700',
    color: colors.primary,
    marginBottom: '0.5rem',
  },
  featureList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  featureItem: {
    fontSize: '0.9375rem',
    color: colors.textPrimary,
    lineHeight: '1.5',
    paddingLeft: '1.5rem',
    position: 'relative',
  },
  scenariosSection: {
    marginBottom: '2.5rem',
  },
  sectionTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: '0.5rem',
  },
  sectionDescription: {
    fontSize: '0.9375rem',
    color: colors.textMuted,
    marginBottom: '1.5rem',
    lineHeight: '1.6',
  },
  scenariosGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  scenarioButton: {
    width: '100%',
    padding: '1.25rem',
    backgroundColor: colors.bgPrimary,
    border: `2px solid ${colors.border}`,
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s',
    outline: 'none',
  },
  scenarioButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.bgAccent,
    boxShadow: `0 0 0 3px rgba(15, 82, 186, 0.1)`,
  },
  scenarioHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  scenarioName: {
    fontSize: '1.125rem',
    fontWeight: '700',
    color: colors.textPrimary,
    margin: 0,
  },
  scenarioBadge: {
    fontSize: '0.8125rem',
    fontWeight: '600',
    color: colors.primary,
    backgroundColor: colors.bgAccent,
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
  },
  scenarioCoreFunction: {
    fontSize: '0.875rem',
    color: colors.textMuted,
    margin: 0,
    lineHeight: '1.5',
  },
  jsonComparisonSection: {
    marginBottom: '2.5rem',
  },
  jsonComparison: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.5rem',
  },
  jsonPanel: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: colors.bgBase,
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    overflow: 'hidden',
  },
  jsonPanelHeader: {
    padding: '0.75rem 1rem',
    backgroundColor: colors.primary,
    borderBottom: `1px solid ${colors.border}`,
  },
  jsonPanelTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: colors.textInverse,
    margin: 0,
  },
  jsonContent: {
    fontSize: '0.8125rem',
    fontFamily: 'monospace',
    backgroundColor: colors.bgPrimary,
    padding: '1rem',
    margin: 0,
    overflow: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    maxHeight: '600px',
    lineHeight: '1.5',
  },
  errorBox: {
    backgroundColor: '#fee',
    border: '1px solid #fcc',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1.5rem',
  },
  errorText: {
    color: colors.error,
    margin: 0,
    fontSize: '0.875rem',
  },
  ctaSection: {
    padding: '2rem',
    backgroundColor: colors.bgAccent,
    borderRadius: '8px',
    border: `2px solid ${colors.primary}`,
    textAlign: 'center',
  },
  ctaTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: colors.primary,
    marginBottom: '1rem',
  },
  ctaDescription: {
    fontSize: '1rem',
    color: colors.textPrimary,
    lineHeight: '1.6',
    margin: 0,
  },
};

// Add responsive styles and hover effects
if (typeof document !== 'undefined') {
  const styleId = 'developer-sandbox-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Feature columns: stack on mobile */
      @media (max-width: 767px) {
        [data-demo-card] [style*="gridTemplateColumns"] {
          grid-template-columns: 1fr !important;
        }
      }
      
      /* JSON comparison: stack on mobile */
      @media (max-width: 639px) {
        [data-demo-card] [style*="jsonComparison"] {
          grid-template-columns: 1fr !important;
        }
      }
      
      /* Scenario button hover */
      button[aria-pressed="false"]:not(:disabled):hover {
        border-color: ${colors.hover} !important;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1) !important;
      }
      
      button[aria-pressed="true"]:not(:disabled):hover {
        border-color: ${colors.primary} !important;
        box-shadow: 0 0 0 3px rgba(15, 82, 186, 0.15) !important;
      }
      
      /* Logout button hover */
      button[style*="logoutButton"]:not(:disabled):hover {
        background-color: ${colors.bgHover} !important;
        border-color: ${colors.textMuted} !important;
      }
      
      /* Feature item bullet points */
      [data-demo-card] [style*="featureItem"]::before {
        content: '✓';
        position: absolute;
        left: 0;
        color: ${colors.focus};
        font-weight: bold;
      }
    `;
    if (document.head) {
      document.head.appendChild(style);
    }
  }
}
