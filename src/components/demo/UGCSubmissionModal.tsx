/**
 * UGCSubmissionModal.tsx
 * User-generated content submission modal for "Share Your Spontaneous Idea" feature.
 * 
 * Features:
 * - Supports both anonymous (demo mode) and authenticated users
 * - Auto-populates location from browser geolocation
 * - Generates OpenAI embeddings for AI-powered similarity search
 * - Graceful fallback if OpenAI API fails (idea still saves without embedding)
 * - Respects Supabase Row-Level Security policies
 * - Resets form after successful submission
 * - Shows loading state during submission
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/db/supabase';
import { useAuth } from '@/stores/auth';
import colors from '@/lib/design/colors';

export interface UGCSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultLocation?: string;
}

interface GeolocationData {
  latitude: number | null;
  longitude: number | null;
  locationName: string;
  city: string | null;
  country: string;
}

/**
 * UGCSubmissionModal component
 * 
 * DEMO MODE (Anonymous):
 * - user_id is null
 * - is_anonymous is true
 * - RLS policy allows anonymous inserts
 * 
 * AUTHENTICATED MODE:
 * - user_id is set from auth session
 * - is_anonymous is false
 * - User can later manage their own submissions
 * 
 * OPENAI EMBEDDING FALLBACK:
 * - If OpenAI API fails (rate limit, network error, etc.), the idea still saves
 * - embedding field is set to null
 * - Idea is still searchable by text fields (headline, description, tags)
 * - Future: Can regenerate embeddings via admin tool
 */
export default function UGCSubmissionModal({
  isOpen,
  onClose,
  defaultLocation = '',
}: UGCSubmissionModalProps) {
  const { user, authStatus } = useAuth();
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(defaultLocation);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [geolocation, setGeolocation] = useState<GeolocationData>({
    latitude: null,
    longitude: null,
    locationName: defaultLocation || '',
    city: null,
    country: 'US',
  });
  const [geolocationError, setGeolocationError] = useState<string | null>(null);

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

  // Get browser geolocation on mount (if available)
  useEffect(() => {
    if (!isOpen || !navigator.geolocation) {
      return;
    }

    // Only request geolocation if location is not already set
    if (!location || location.trim() === '') {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // Reverse geocode to get location name (optional - can use a geocoding service)
            // For now, we'll just store the coordinates and let the user provide location name
            setGeolocation({
              latitude,
              longitude,
              locationName: location || 'Current Location',
              city: null, // Could be populated via reverse geocoding API
              country: 'US', // Default, could be determined from coordinates
            });
          } catch (error) {
            console.warn('Geolocation reverse lookup failed:', error);
            // Still use coordinates even if reverse lookup fails
            setGeolocation({
              latitude,
              longitude,
              locationName: location || 'Current Location',
              city: null,
              country: 'US',
            });
          }
        },
        (error) => {
          // User denied geolocation or error occurred - silently continue
          console.warn('Geolocation error:', error.message);
          setGeolocationError(error.message);
          setGeolocation({
            latitude: null,
            longitude: null,
            locationName: location || '',
            city: null,
            country: 'US',
          });
        },
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 300000, // Cache for 5 minutes
        }
      );
    }
  }, [isOpen, location]);

  // Update location name when user types
  useEffect(() => {
    if (location) {
      setGeolocation(prev => ({
        ...prev,
        locationName: location,
      }));
    }
  }, [location]);

  if (!isOpen) return null;

  /**
   * Generate OpenAI embedding for the headline
   * Falls back gracefully if API fails
   */
  const generateEmbedding = async (text: string): Promise<number[] | null> => {
    try {
      const response = await fetch('/api/openai-embedding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        console.warn('[UGC] OpenAI embedding generation failed:', response.status);
        return null; // Fallback: continue without embedding
      }

      const data = await response.json();
      
      // Handle new response format: { embedding: number[] } or { embedding: null, error: string }
      if (data.embedding && Array.isArray(data.embedding)) {
        return data.embedding;
      }

      // If embedding is null, log the error but continue without blocking
      if (data.error) {
        console.warn('[UGC] OpenAI embedding error:', data.error);
      }

      return null; // Fallback: continue without embedding
    } catch (error) {
      console.warn('[UGC] OpenAI embedding generation error:', error);
      return null; // Fallback: continue without embedding
    }
  };

  /**
   * Handle form submission
   * 
   * Flow:
   * 1. Validate required fields
   * 2. Generate OpenAI embedding (with fallback)
   * 3. Insert into Supabase spontaneous_ideas table
   * 4. Handle RLS policies (anonymous insert allowed)
   * 5. Reset form and show success message
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!headline.trim() || headline.trim().length < 3) {
      setToastMessage('Headline must be at least 3 characters');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    if (headline.trim().length > 200) {
      setToastMessage('Headline must be 200 characters or less');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Generate embedding (with fallback)
      // This runs in parallel with other prep work, but we wait for it before inserting
      const embeddingPromise = generateEmbedding(headline.trim());

      // Step 2: Prepare data for insertion
      const isAnonymous = !user || authStatus !== 'LOGGED_IN';
      
      // Prepare location data
      const locationName = geolocation.locationName || location || 'Unknown Location';
      const city = geolocation.city || null;
      const country = geolocation.country || 'US';

      // Wait for embedding (or null if it fails)
      const embedding = await embeddingPromise;

      // Step 3: Insert into Supabase
      // RLS Policy: "Anyone can submit ideas" allows anonymous inserts
      const { data, error } = await supabase
        .from('spontaneous_ideas')
        .insert({
          // User identity
          user_id: user?.id || null,
          is_anonymous: isAnonymous,
          user_display_name: user?.user_metadata?.full_name || null,

          // Core content
          headline: headline.trim(),
          description: description.trim() || null,

          // Location fields
          location_name: locationName,
          city: city,
          country: country,
          latitude: geolocation.latitude,
          longitude: geolocation.longitude,

          // Time fields (optional - can be enhanced later)
          starts_at: null,
          ends_at: null,
          is_flexible_time: true,

          // AI fields
          embedding: embedding, // null if OpenAI failed - that's okay!
          tags: [], // Can be enhanced to extract tags from headline/description
          vibe: null, // Can be enhanced to extract vibe from content

          // Status & visibility
          status: 'pending', // Will be auto-approved or moderated
          is_public: true,
          is_featured: false,

          // Metadata
          submission_source: 'demo',
        })
        .select()
        .single();

      if (error) {
        console.error('[UGC] Supabase insert error:', error);
        
        // Check if it's an RLS policy error
        if (error.code === '42501' || error.message.includes('permission denied')) {
          setToastMessage('Unable to submit. Please try again later.');
        } else {
          setToastMessage('Submission failed. Please try again.');
        }
        
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        setIsSubmitting(false);
        return;
      }

      // Success!
      setToastMessage('Thanks! Your idea has been submitted.');
      setShowToast(true);

      // Reset form after a brief delay
      setTimeout(() => {
        setHeadline('');
        setDescription('');
        setLocation(defaultLocation);
        setGeolocation({
          latitude: null,
          longitude: null,
          locationName: defaultLocation || '',
          city: null,
          country: 'US',
        });
        setShowToast(false);
        setIsSubmitting(false);
        onClose();
      }, 2000);

    } catch (error) {
      console.error('[UGC] Unexpected submission error:', error);
      setToastMessage('An error occurred. Please try again.');
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        setIsSubmitting(false);
      }, 3000);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  // Combine modal styles with mobile-specific adjustments
  const modalStyles: React.CSSProperties = {
    ...styles.modal,
    ...(isMobile ? styles.modalMobile : {}),
  };

  const backdropStyles: React.CSSProperties = {
    ...styles.backdrop,
    ...(isMobile ? styles.backdropMobile : {}),
  };

  const modalContent = (
    <>
      {/* Backdrop */}
      <div
        style={backdropStyles}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div style={modalStyles} role="dialog" aria-labelledby="ugc-modal-title">
        <div style={styles.modalHeader}>
          <div style={styles.headerContent}>
            <h2 id="ugc-modal-title" style={styles.modalTitle}>
              Share Your Spontaneous Idea
            </h2>
            <p style={styles.modalSubtext}>
              Help others spark their next adventure. Submit a quick activity for the community to discover.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={styles.closeButton}
            aria-label="Close"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
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

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Field 1: Spontaneous Headline (required) */}
          <div style={styles.fieldGroup}>
            <label htmlFor="ugc-headline" style={styles.label}>
              Spontaneous Headline <span style={styles.required}>*</span>
            </label>
            <textarea
              id="ugc-headline"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Example: Sunset view from the hill behind the old fort"
              style={styles.textarea}
              maxLength={200}
              rows={3}
              required
              disabled={isSubmitting}
            />
            <div style={styles.characterCount}>
              {headline.length}/200
            </div>
          </div>

          {/* Field 2: Description (optional) */}
          <div style={styles.fieldGroup}>
            <label htmlFor="ugc-description" style={styles.label}>
              Description <span style={styles.optional}>(optional)</span>
            </label>
            <textarea
              id="ugc-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details about this spontaneous idea..."
              style={styles.textarea}
              maxLength={500}
              rows={4}
              disabled={isSubmitting}
            />
            <div style={styles.characterCount}>
              {description.length}/500
            </div>
          </div>

          {/* Field 3: Location (auto-populated from geolocation) */}
          <div style={styles.fieldGroup}>
            <label htmlFor="ugc-location" style={styles.label}>
              Location
            </label>
            <input
              id="ugc-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={geolocation.latitude ? "Auto-filled from your location" : "Enter location or allow geolocation"}
              style={styles.input}
              disabled={isSubmitting}
            />
            {geolocation.latitude && geolocation.longitude && (
              <p style={styles.geolocationHint}>
                📍 Using your current location ({geolocation.latitude.toFixed(4)}, {geolocation.longitude.toFixed(4)})
              </p>
            )}
          </div>

          {/* Auth status indicator (optional, for debugging) */}
          {process.env.NODE_ENV === 'development' && (
            <p style={styles.debugText}>
              Mode: {user ? `Authenticated (${user.email})` : 'Anonymous (Demo)'}
            </p>
          )}

          {/* Safety Microcopy */}
          <p style={styles.safetyText}>
            Suggestions are reviewed automatically for safety and relevance.
          </p>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!headline.trim() || headline.trim().length < 3 || isSubmitting}
            style={{
              ...styles.submitButton,
              ...((!headline.trim() || headline.trim().length < 3 || isSubmitting) ? styles.submitButtonDisabled : {}),
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit idea'}
          </button>
        </form>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div style={styles.toast} role="status" aria-live="polite">
          {toastMessage || 'Thanks — your idea may help others discover something local.'}
        </div>
      )}
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
  },
  backdropMobile: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modal: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: colors.bgPrimary,
    borderRadius: '12px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
    zIndex: 9999,
    maxWidth: '540px',
    width: '90%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
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
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '1.5rem',
    borderBottom: `1px solid ${colors.border}`,
    gap: '1rem',
  },
  headerContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  modalTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: colors.textPrimary,
    margin: 0,
  },
  modalSubtext: {
    fontSize: '0.875rem',
    color: colors.textSecondary,
    lineHeight: '1.5',
    margin: 0,
  },
  closeButton: {
    backgroundColor: 'transparent',
    border: 'none',
    padding: '0.5rem',
    cursor: 'pointer',
    color: colors.textMuted,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '0.375rem',
    transition: 'background-color 0.2s',
    outline: 'none',
  },
  form: {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    overflowY: 'auto',
    flex: 1,
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: colors.textPrimary,
  },
  required: {
    color: colors.error || '#DC2626',
  },
  optional: {
    fontSize: '0.875rem',
    fontWeight: '400',
    color: colors.textMuted,
  },
  textarea: {
    padding: '0.75rem',
    fontSize: '1rem',
    border: `2px solid ${colors.border}`,
    borderRadius: '0.5rem',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'inherit',
    resize: 'vertical',
    backgroundColor: colors.bgPrimary,
    color: colors.textPrimary,
  },
  input: {
    padding: '0.75rem',
    fontSize: '1rem',
    border: `2px solid ${colors.border}`,
    borderRadius: '0.5rem',
    outline: 'none',
    transition: 'border-color 0.2s',
    backgroundColor: colors.bgPrimary,
    color: colors.textPrimary,
  },
  characterCount: {
    fontSize: '0.75rem',
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: '-0.25rem',
  },
  geolocationHint: {
    fontSize: '0.75rem',
    color: colors.textMuted,
    margin: 0,
    marginTop: '-0.25rem',
  },
  debugText: {
    fontSize: '0.75rem',
    color: colors.textMuted,
    fontStyle: 'italic',
    margin: 0,
  },
  safetyText: {
    fontSize: '0.8125rem',
    color: colors.textMuted,
    margin: 0,
    lineHeight: '1.5',
    fontStyle: 'italic',
  },
  submitButton: {
    padding: '0.875rem 2rem',
    fontSize: '1rem',
    fontWeight: '600',
    backgroundColor: colors.primary,
    color: colors.textInverse,
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    outline: 'none',
    marginTop: '0.5rem',
  },
  submitButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  toast: {
    position: 'fixed',
    bottom: '1rem',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '1rem 1.5rem',
    backgroundColor: colors.textPrimary,
    color: colors.textInverse,
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    zIndex: 10000,
    fontSize: '0.875rem',
    maxWidth: '90vw',
    textAlign: 'center',
  },
};

// Add hover and focus styles
if (typeof document !== 'undefined') {
  const styleId = 'ugc-submission-modal-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      #ugc-headline:focus,
      #ugc-description:focus,
      #ugc-location:focus {
        border-color: ${colors.primary} !important;
        box-shadow: 0 0 0 3px rgba(29, 66, 137, 0.1) !important;
      }
      button[aria-label="Close"]:hover:not(:disabled) {
        background-color: ${colors.bgHover} !important;
      }
      button[type="submit"]:not(:disabled):hover {
        background-color: ${colors.hover} !important;
      }
    `;
    if (document.head) {
      document.head.appendChild(style);
    }
  }
}
