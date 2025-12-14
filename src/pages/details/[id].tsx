/**
 * Details Page - Dynamic route for recommendation details
 * Route: /details/[id]
 * 
 * Loads recommendation data by ID and displays the GeneratedRecommendationDetailsPage component.
 */

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import GeneratedRecommendationDetailsPage from '@/components/demo/GeneratedRecommendationDetailsPage';
import colors from '@/lib/design/colors';

export default function RecommendationDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [recommendationData, setRecommendationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load recommendation data from localStorage or API
  useEffect(() => {
    if (!id || typeof id !== 'string') {
      return;
    }

    const loadRecommendationData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to load from localStorage first (for recent results)
        if (typeof window !== 'undefined') {
          // Check both possible storage keys
          const storageKeys = ['demo_recent_results', 'spontaneity_recent_results'];
          let found = null;
          
          for (const storageKey of storageKeys) {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
              try {
                const recentResults = JSON.parse(stored);
                const result = recentResults.find((r: any) => r.id === id);
                if (result && result.data) {
                  found = result;
                  break;
                }
              } catch (e) {
                console.warn(`Failed to parse recent results from ${storageKey}:`, e);
              }
            }
          }
          
          if (found && found.data) {
            // Parse the stored JSON string
            const parsedData = typeof found.data === 'string' 
              ? JSON.parse(found.data) 
              : found.data;
            setRecommendationData(parsedData);
            setLoading(false);
            return;
          }

          // Also check sessionStorage (for data passed from modal)
          const sessionKey = `recommendation_${id}`;
          const sessionData = sessionStorage.getItem(sessionKey);
          if (sessionData) {
            try {
              const parsedData = JSON.parse(sessionData);
              setRecommendationData(parsedData);
              setLoading(false);
              // Clean up sessionStorage after use
              sessionStorage.removeItem(sessionKey);
              return;
            } catch (e) {
              console.warn('Failed to parse sessionStorage data:', e);
            }
          }

          // If not found in localStorage or sessionStorage, try to fetch from API
          // This would require an API endpoint to fetch by ID
          // For now, we'll show an error if not found
          setError('Recommendation not found. It may have expired or been cleared.');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading recommendation:', err);
        setError('Failed to load recommendation details.');
        setLoading(false);
      }
    };

    loadRecommendationData();
  }, [id]);

  const handleCommitAdventure = () => {
    // Log commit action
    console.log('Adventure committed:', id);
    // Could navigate back or show success message
    router.back();
  };

  const handleRefineAdventure = () => {
    // Navigate back to main demo page with refine modal open
    router.push('/demo?refine=true');
  };

  const handleClose = () => {
    router.back();
  };

  if (loading) {
    return (
      <div style={loadingStyles.container}>
        <div style={loadingStyles.spinner}>⟳</div>
        <p style={loadingStyles.text}>Loading recommendation details...</p>
      </div>
    );
  }

  if (error || !recommendationData) {
    return (
      <div style={errorStyles.container}>
        <h1 style={errorStyles.title}>Recommendation Not Found</h1>
        <p style={errorStyles.message}>{error || 'The recommendation you\'re looking for could not be found.'}</p>
        <button
          type="button"
          onClick={() => router.push('/demo')}
          style={errorStyles.button}
        >
          Back to Demo
        </button>
      </div>
    );
  }

  // Extract data for the details page component
  const detailsData = {
    title: recommendationData.title,
    activityName: recommendationData.activity_name || recommendationData.title,
    address: recommendationData.address || recommendationData.location,
    location: recommendationData.location,
    mapLink: recommendationData.map_link || recommendationData.mapLink,
    activityRealtimeStatus: recommendationData.activity_realtime_status || recommendationData.activityRealtimeStatus,
    activityRatingAggregate: recommendationData.activity_rating_aggregate || recommendationData.activityRatingAggregate,
    reviewCount: recommendationData.review_count || recommendationData.reviewCount,
    activityDurationEstimate: recommendationData.activity_duration_estimate || recommendationData.activityDurationEstimate,
    duration: recommendationData.duration,
    activityPriceTier: recommendationData.activity_price_tier || recommendationData.activityPriceTier,
    cost: recommendationData.cost,
    tags: recommendationData.tags || (recommendationData.vibe ? recommendationData.vibe.split(',').map((t: string) => t.trim()) : []),
    vibe: recommendationData.vibe,
    activityImageUrl: recommendationData.activity_image_url || recommendationData.activityImageUrl,
    activityDistanceMi: recommendationData.activity_distance_mi || recommendationData.activityDistanceMi,
    activityDriveTimeMin: recommendationData.activity_drive_time_min || recommendationData.activityDriveTimeMin,
  };

  return (
    <div style={pageStyles.container}>
      <GeneratedRecommendationDetailsPage
        data={detailsData}
        onCommitAdventure={handleCommitAdventure}
        onRefineAdventure={handleRefineAdventure}
        onClose={handleClose}
      />
    </div>
  );
}

const pageStyles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    backgroundColor: 'var(--sdk-bg-color, ' + colors.bgPrimary + ')',
  },
};

const loadingStyles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    gap: '1rem',
  },
  spinner: {
    fontSize: '2rem',
    animation: 'spin 1s linear infinite',
  },
  text: {
    fontSize: '1rem',
    color: 'var(--sdk-text-secondary, ' + colors.textSecondary + ')',
  },
};

const errorStyles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '2rem',
    textAlign: 'center',
    gap: '1.5rem',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: 'var(--sdk-text-color, ' + colors.textPrimary + ')',
    margin: 0,
  },
  message: {
    fontSize: '1rem',
    color: 'var(--sdk-text-secondary, ' + colors.textSecondary + ')',
    margin: 0,
  },
  button: {
    padding: '0.875rem 1.5rem',
    fontSize: '1rem',
    fontWeight: '600',
    backgroundColor: 'var(--sdk-primary-color, ' + colors.primary + ')',
    color: 'var(--sdk-text-inverse, ' + colors.textInverse + ')',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none',
  },
};

// Add spin animation
if (typeof document !== 'undefined') {
  const styleId = 'details-page-spinner';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    if (document.head) {
      document.head.appendChild(style);
    }
  }
}

