/**
 * test-spontaneity.tsx
 * Test page for fetchSpontaneousRecommendation function
 * 
 * Access at: /test-spontaneity
 * 
 * This page provides a UI for testing the API function with sample inputs
 * and verifying the response structure.
 */

import React, { useState } from 'react';
import { fetchSpontaneousRecommendation } from '@/lib/api/spontaneity';
import type { RecommendationResult } from '@/lib/api/spontaneity';
import colors from '@/lib/design/colors';

export default function TestSpontaneityPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testInput, setTestInput] = useState({
    location: 'Washington DC',
    timeAvailable: '2 hours',
    vibes: ['creative', 'outdoor', 'low budget'],
  });

  const handleTest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Map test input to function's expected format
      const userContext = {
        location: testInput.location,
        time: testInput.timeAvailable,
        vibe: testInput.vibes.join(', '),
      };

      const recommendationResult = await fetchSpontaneousRecommendation(
        userContext,
        {
          temperature: 0.7,
          maxTokens: 800,
        },
        true // Use demo endpoint
      );

      setResult(recommendationResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    title: {
      fontSize: '2rem',
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginBottom: '1rem',
    },
    section: {
      marginBottom: '2rem',
      padding: '1.5rem',
      backgroundColor: colors.bgPrimary,
      borderRadius: '8px',
      border: `1px solid ${colors.border}`,
    },
    sectionTitle: {
      fontSize: '1.25rem',
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: '1rem',
    },
    inputGroup: {
      marginBottom: '1rem',
    },
    label: {
      display: 'block',
      fontSize: '0.875rem',
      fontWeight: '500',
      color: colors.textSecondary,
      marginBottom: '0.5rem',
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      fontSize: '1rem',
      border: `1px solid ${colors.border}`,
      borderRadius: '4px',
      color: colors.textPrimary,
      backgroundColor: colors.bgPrimary,
    },
    tagInput: {
      display: 'flex',
      gap: '0.5rem',
      flexWrap: 'wrap' as const,
      marginTop: '0.5rem',
    },
    tag: {
      padding: '0.25rem 0.75rem',
      backgroundColor: colors.bgAccent,
      color: colors.primary,
      borderRadius: '4px',
      fontSize: '0.875rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    },
    removeTag: {
      cursor: 'pointer',
      fontWeight: 'bold',
      color: colors.textSecondary,
    },
    button: {
      padding: '0.75rem 1.5rem',
      fontSize: '1rem',
      fontWeight: '600',
      color: colors.textInverse,
      backgroundColor: colors.primary,
      border: 'none',
      borderRadius: '4px',
      cursor: loading ? 'not-allowed' : 'pointer',
      opacity: loading ? 0.6 : 1,
    },
    result: {
      padding: '1rem',
      backgroundColor: colors.bgAccent,
      borderRadius: '4px',
      marginTop: '1rem',
    },
    resultTitle: {
      fontSize: '1.125rem',
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: '0.5rem',
    },
    resultField: {
      marginBottom: '0.75rem',
    },
    resultLabel: {
      fontSize: '0.875rem',
      fontWeight: '500',
      color: colors.textSecondary,
      marginBottom: '0.25rem',
    },
    resultValue: {
      fontSize: '1rem',
      color: colors.textPrimary,
    },
    error: {
      padding: '1rem',
      backgroundColor: '#FEE2E2',
      color: '#DC2626',
      borderRadius: '4px',
      marginTop: '1rem',
    },
    jsonView: {
      marginTop: '1rem',
      padding: '1rem',
      backgroundColor: '#1E1E1E',
      color: '#D4D4D4',
      borderRadius: '4px',
      fontSize: '0.875rem',
      fontFamily: 'monospace',
      overflow: 'auto',
      maxHeight: '400px',
    },
    validation: {
      marginTop: '1rem',
      padding: '1rem',
      borderRadius: '4px',
    },
    validationPass: {
      backgroundColor: '#D1FAE5',
      color: '#065F46',
    },
    validationFail: {
      backgroundColor: '#FEE2E2',
      color: '#DC2626',
    },
    checkmark: {
      display: 'inline-block',
      marginRight: '0.5rem',
    },
  };

  const validateResult = (result: RecommendationResult) => {
    const checks = {
      hasTitle: !!result.title,
      hasDescription: !!result.description,
      hasRecommendation: !!result.recommendation,
      hasDuration: !!result.duration,
      hasVibeTags: !!(result.vibe || result.activities?.some(a => a.type)),
    };

    const allPassed = Object.values(checks).every(v => v);
    return { checks, allPassed };
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🧪 Test Spontaneity API</h1>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Test Input</h2>
        
        <div style={styles.inputGroup}>
          <label style={styles.label}>Location</label>
          <input
            type="text"
            value={testInput.location}
            onChange={(e) => setTestInput({ ...testInput, location: e.target.value })}
            style={styles.input}
            placeholder="Washington DC"
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Time Available</label>
          <input
            type="text"
            value={testInput.timeAvailable}
            onChange={(e) => setTestInput({ ...testInput, timeAvailable: e.target.value })}
            style={styles.input}
            placeholder="2 hours"
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Vibes</label>
          <div style={styles.tagInput}>
            {testInput.vibes.map((vibe, index) => (
              <div key={index} style={styles.tag}>
                {vibe}
                <span
                  style={styles.removeTag}
                  onClick={() => {
                    setTestInput({
                      ...testInput,
                      vibes: testInput.vibes.filter((_, i) => i !== index),
                    });
                  }}
                >
                  ×
                </span>
              </div>
            ))}
          </div>
          <input
            type="text"
            style={styles.input}
            placeholder="Add a vibe tag"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const input = e.currentTarget;
                const value = input.value.trim();
                if (value && !testInput.vibes.includes(value)) {
                  setTestInput({
                    ...testInput,
                    vibes: [...testInput.vibes, value],
                  });
                  input.value = '';
                }
              }
            }}
          />
        </div>

        <button
          onClick={handleTest}
          disabled={loading}
          style={styles.button}
        >
          {loading ? 'Testing...' : 'Run Test'}
        </button>
      </div>

      {error && (
        <div style={styles.error}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Test Results</h2>
          
          {(() => {
            const validation = validateResult(result);
            return (
              <div
                style={{
                  ...styles.validation,
                  ...(validation.allPassed ? styles.validationPass : styles.validationFail),
                }}
              >
                <strong>
                  {validation.allPassed ? '✅ Validation: PASSED' : '❌ Validation: FAILED'}
                </strong>
                <div style={{ marginTop: '0.5rem' }}>
                  {Object.entries(validation.checks).map(([key, passed]) => (
                    <div key={key}>
                      {passed ? '✅' : '❌'} {key.replace('has', '').replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          <div style={styles.result}>
            {result.title && (
              <div style={styles.resultField}>
                <div style={styles.resultLabel}>Title</div>
                <div style={styles.resultValue}>{result.title}</div>
              </div>
            )}

            {result.description && (
              <div style={styles.resultField}>
                <div style={styles.resultLabel}>Description</div>
                <div style={styles.resultValue}>{result.description}</div>
              </div>
            )}

            {result.recommendation && (
              <div style={styles.resultField}>
                <div style={styles.resultLabel}>Recommendation</div>
                <div style={styles.resultValue}>{result.recommendation}</div>
              </div>
            )}

            {result.duration && (
              <div style={styles.resultField}>
                <div style={styles.resultLabel}>Duration</div>
                <div style={styles.resultValue}>{result.duration}</div>
              </div>
            )}

            {result.vibe && (
              <div style={styles.resultField}>
                <div style={styles.resultLabel}>Vibe Tags</div>
                <div style={styles.resultValue}>{result.vibe}</div>
              </div>
            )}

            {result.location && (
              <div style={styles.resultField}>
                <div style={styles.resultLabel}>Location</div>
                <div style={styles.resultValue}>{result.location}</div>
              </div>
            )}

            {result.activities && result.activities.length > 0 && (
              <div style={styles.resultField}>
                <div style={styles.resultLabel}>Activities</div>
                {result.activities.map((activity, index) => (
                  <div key={index} style={{ marginTop: '0.5rem' }}>
                    <strong>{activity.name || 'Activity'}</strong>
                    {activity.type && <span> ({activity.type})</span>}
                    {activity.duration && <span> - {activity.duration}</span>}
                    {activity.description && <div>{activity.description}</div>}
                  </div>
                ))}
              </div>
            )}

            {result.trust && (
              <div style={styles.resultField}>
                <div style={styles.resultLabel}>Trust Metadata</div>
                <div style={styles.resultValue}>
                  Badge: {result.trust.badge || 'N/A'}
                  {result.trust.confidence_level && (
                    <> | Confidence: {result.trust.confidence_level}</>
                  )}
                </div>
              </div>
            )}
          </div>

          <details style={{ marginTop: '1rem' }}>
            <summary style={{ cursor: 'pointer', fontWeight: '600', marginBottom: '0.5rem' }}>
              View Full JSON Response
            </summary>
            <pre style={styles.jsonView}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Test Instructions</h2>
        <ol style={{ lineHeight: '1.8' }}>
          <li>Fill in the test input fields (or use defaults)</li>
          <li>Click "Run Test" to call the API</li>
          <li>Verify the response includes:
            <ul>
              <li>✅ Title</li>
              <li>✅ Description</li>
              <li>✅ Duration</li>
              <li>✅ Vibe tags</li>
            </ul>
          </li>
          <li>Check the validation status</li>
          <li>View the full JSON response for debugging</li>
        </ol>
      </div>
    </div>
  );
}

