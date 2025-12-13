/**
 * spontaneity.ts
 * Client-side API utilities for fetching spontaneous recommendations.
 * 
 * Reusable functions for the "Try it instantly" module and other components.
 * All OpenAI API calls are handled server-side - this module only calls our API endpoints.
 */

/**
 * User context interface for recommendation requests
 * 
 * Supports multiple input formats:
 * - Standard: { vibe: string, time: string, location: string }
 * - Alternative: { vibes: string[], timeAvailable: string, location: string }
 */
export interface UserContext {
  vibe?: string;
  time?: string;
  location?: string;
  role?: string;
  mood?: string;
  group_size?: string;
  // Alternative format support
  vibes?: string[]; // Array of vibe tags
  timeAvailable?: string; // Alternative to 'time'
  [key: string]: string | string[] | undefined;
}

/**
 * Recommendation configuration options
 */
export interface RecommendationConfig {
  temperature?: number;
  maxTokens?: number; // Default: 300 for MVaP speed (reduced from 800)
  topP?: number;
}

/**
 * Recommendation result interface
 */
export interface RecommendationResult {
  result_id?: string;
  title?: string;
  recommendation?: string;
  description?: string;
  activities?: Array<{
    name?: string;
    type?: string;
    duration?: string;
    description?: string;
  }>;
  duration?: string;
  cost?: string;
  location?: string;
  indoorOutdoor?: string;
  groupFriendly?: boolean;
  vibe?: string;
  time?: string;
  trust?: {
    badge?: string;
    signals?: {
      ai_generated?: boolean;
      ugc_influenced?: boolean;
      recent_activity?: boolean;
      context_verified?: boolean;
    };
    confidence_level?: string;
    generated_at?: string;
  };
  why_now?: string;
  [key: string]: any;
}

/**
 * API response interface
 */
interface SpontaneityApiResponse {
  success: boolean;
  result?: string;
  error?: string;
}

/**
 * Generates a placeholder recommendation when API fails.
 * This ensures the UI never breaks and users always see something.
 */
function generatePlaceholderRecommendation(userContext: UserContext): RecommendationResult {
  const vibe = userContext.vibe || userContext.vibes?.join(', ') || 'spontaneous';
  const time = userContext.time || userContext.timeAvailable || 'a few hours';
  const location = userContext.location || 'your area';
  
  const vibeWords = vibe.split(',').map(v => v.trim()).filter(v => v.length > 0);
  const primaryVibe = vibeWords[0] || 'spontaneous';
  
  // Generate a simple title
  const title = `${primaryVibe.charAt(0).toUpperCase() + primaryVibe.slice(1)} ${time} adventure in ${location}`;
  
  return {
    title,
    recommendation: `Explore ${location} with a ${vibe} ${time} experience. Discover local spots, hidden gems, and spontaneous activities that match your vibe.`,
    description: `A curated ${vibe} experience designed for ${time} in ${location}. Perfect for spontaneous exploration and discovering something new.`,
    duration: time,
    location,
    vibe,
    cost: 'Varies',
    indoorOutdoor: 'Mixed',
    groupFriendly: true,
    activities: [
      {
        name: 'Local Exploration',
        type: vibeWords[0] || 'outdoor',
        duration: time,
        description: `Discover ${location} through a ${vibe} lens`,
      },
    ],
    trust: {
      badge: 'ai_curated',
      signals: {
        ai_generated: false, // Placeholder, not AI-generated
        ugc_influenced: false,
        recent_activity: false,
        context_verified: false,
      },
      confidence_level: 'low',
      generated_at: new Date().toISOString(),
    },
    _isPlaceholder: true, // Flag to indicate this is a fallback
  };
}

/**
 * Fetches a spontaneous recommendation based on user context.
 * 
 * This function calls our API endpoint which handles OpenAI integration server-side.
 * The API key is never exposed to the client.
 * 
 * If the API fails, returns a placeholder recommendation instead of throwing.
 * This ensures the UI never breaks and users always see something.
 * 
 * @param userContext - User context object with vibe, time, location, etc.
 * @param config - Optional configuration for the recommendation (temperature, maxTokens, etc.)
 * @param useDemoEndpoint - Whether to use the demo endpoint (no auth) or authenticated endpoint
 * @returns Promise resolving to a RecommendationResult object (never throws - returns placeholder on error)
 * 
 * @example
 * ```typescript
 * const result = await fetchSpontaneousRecommendation({
 *   vibe: 'adventurous, outdoor',
 *   time: '2 hours',
 *   location: 'Washington DC'
 * });
 * console.log(result.title); // "Adventurous 2 hours adventure in Washington DC"
 * 
 * // Check if it's a placeholder
 * if (result._isPlaceholder) {
 *   console.log('API failed, showing placeholder');
 * }
 * ```
 */
export async function fetchSpontaneousRecommendation(
  userContext: UserContext,
  config: RecommendationConfig = {},
  useDemoEndpoint: boolean = true
): Promise<RecommendationResult> {
  try {
    // Normalize user context (support multiple input formats)
    const normalizedContext: UserContext = { ...userContext };
    
    // Handle alternative format: vibes array -> vibe string
    if (userContext.vibes && Array.isArray(userContext.vibes) && !userContext.vibe) {
      normalizedContext.vibe = userContext.vibes.join(', ');
    }
    
    // Handle alternative format: timeAvailable -> time
    if (userContext.timeAvailable && !userContext.time) {
      normalizedContext.time = userContext.timeAvailable;
    }
    
    // Build user input string from normalized context
    const contextParts: string[] = [];
    
    if (normalizedContext.vibe) contextParts.push(`Vibe: ${normalizedContext.vibe}`);
    if (normalizedContext.time) contextParts.push(`Time: ${normalizedContext.time}`);
    if (normalizedContext.location) contextParts.push(`Location: ${normalizedContext.location}`);
    
    // Add optional context metadata
    const contextMetadata: string[] = [];
    if (normalizedContext.role) contextMetadata.push(`Role=${normalizedContext.role}`);
    if (normalizedContext.mood) contextMetadata.push(`Mood=${normalizedContext.mood}`);
    if (normalizedContext.group_size) contextMetadata.push(`Group=${normalizedContext.group_size}`);
    
    let userInput = contextParts.join(', ');
    if (contextMetadata.length > 0) {
      userInput += ` [Context: ${contextMetadata.join(', ')}]`;
    }
    
    // If no context provided, use a default prompt
    if (!userInput.trim()) {
      userInput = 'Generate a spontaneous local activity recommendation';
    }
    
    // Determine which endpoint to use
    const endpoint = useDemoEndpoint 
      ? '/api/demo/spontaneity' 
      : '/api/engine/spontaneity';
    
    // Make API request
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // For authenticated endpoint, you would add Authorization header here
        // For demo endpoint, no auth is required
      },
      body: JSON.stringify({
        userInput,
        config: {
          temperature: config.temperature ?? 0.7,
          maxTokens: config.maxTokens ?? 300, // Reduced for MVaP speed (was 800)
          topP: config.topP ?? 1,
        },
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || 
        `API request failed with status ${response.status}: ${response.statusText}`;
      
      // Log error for debugging (console only, not user-facing)
      console.error('[Spontaneity API] Request failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData.error,
        endpoint,
        userContext: {
          location: userContext.location,
          time: userContext.time || userContext.timeAvailable,
          vibe: userContext.vibe || userContext.vibes,
        },
      });
      
      // Return placeholder instead of throwing - UI never breaks
      return generatePlaceholderRecommendation(userContext);
    }
    
    const apiData: SpontaneityApiResponse = await response.json();
    
    if (!apiData.success || !apiData.result) {
      const errorMessage = apiData.error || 'Invalid API response';
      
      // Log error for debugging
      console.error('[Spontaneity API] Invalid response:', {
        success: apiData.success,
        error: apiData.error,
        hasResult: !!apiData.result,
        endpoint,
      });
      
      // Return placeholder instead of throwing
      return generatePlaceholderRecommendation(userContext);
    }
    
    // Parse the result JSON
    let parsedResult: RecommendationResult;
    try {
      parsedResult = JSON.parse(apiData.result);
    } catch (parseError) {
      // Log parse error for debugging
      console.error('[Spontaneity API] JSON parse error:', {
        error: parseError,
        rawResult: apiData.result?.substring(0, 200), // First 200 chars for debugging
        endpoint,
      });
      
      // If result is not JSON, wrap it in a structured format
      parsedResult = {
        recommendation: apiData.result,
        title: 'Your Recommendation',
        description: apiData.result,
      };
    }
    
    // Ensure user context is preserved in result
    if (normalizedContext.vibe) parsedResult.vibe = normalizedContext.vibe;
    if (normalizedContext.time) parsedResult.time = normalizedContext.time;
    if (normalizedContext.location) parsedResult.location = normalizedContext.location;
    
    return parsedResult;
    
  } catch (error) {
    // Catch any unexpected errors (network, timeout, etc.)
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Determine endpoint for logging (may not be set if error occurs early)
    const endpoint = useDemoEndpoint 
      ? '/api/demo/spontaneity' 
      : '/api/engine/spontaneity';
    
    // Log error for debugging
    console.error('[Spontaneity API] Unexpected error:', {
      error: errorMessage,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      endpoint,
      userContext: {
        location: userContext.location,
        time: userContext.time || userContext.timeAvailable,
        vibe: userContext.vibe || userContext.vibes,
      },
    });
    
    // Return placeholder instead of throwing - UI never breaks
    return generatePlaceholderRecommendation(userContext);
  }
}

/**
 * Fetches a spontaneous recommendation with a simple prompt string.
 * 
 * Convenience function for simpler use cases.
 * 
 * @param prompt - Simple prompt string (e.g., "adventurous 2 hours in Washington DC")
 * @param config - Optional configuration
 * @param useDemoEndpoint - Whether to use demo endpoint
 * @returns Promise resolving to a RecommendationResult object
 * 
 * @example
 * ```typescript
 * const result = await fetchSpontaneousRecommendationFromPrompt(
 *   'adventurous 2 hours in Washington DC'
 * );
 * ```
 */
export async function fetchSpontaneousRecommendationFromPrompt(
  prompt: string,
  config: RecommendationConfig = {},
  useDemoEndpoint: boolean = true
): Promise<RecommendationResult> {
  // Parse simple prompt into context (basic pattern matching)
  const context: UserContext = {};
  
  // Try to extract vibe
  const vibeMatch = prompt.match(/(adventurous|relaxed|creative|active|chill|social|foodie|outdoor|indoor)/i);
  if (vibeMatch) context.vibe = vibeMatch[1];
  
  // Try to extract time
  const timeMatch = prompt.match(/(\d+\s*(?:hour|min|minute|hr)s?)/i);
  if (timeMatch) context.time = timeMatch[1];
  
  // Try to extract location (look for "in [location]" pattern)
  const locationMatch = prompt.match(/in\s+([A-Z][a-zA-Z\s]+)/);
  if (locationMatch) context.location = locationMatch[1].trim();
  
  // If no structured context found, use the prompt as-is
  if (Object.keys(context).length === 0) {
    context.vibe = prompt;
  }
  
  return fetchSpontaneousRecommendation(context, config, useDemoEndpoint);
}

/**
 * Validates user context before making an API call.
 * 
 * @param userContext - User context to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export function validateUserContext(userContext: UserContext): {
  isValid: boolean;
  error?: string;
} {
  // At minimum, we need some context
  const hasAnyContext = 
    userContext.vibe?.trim() ||
    userContext.time?.trim() ||
    userContext.location?.trim() ||
    Object.values(userContext).some(v => v && v.trim());
  
  if (!hasAnyContext) {
    return {
      isValid: false,
      error: 'User context is required. Please provide at least one of: vibe, time, or location.',
    };
  }
  
  return { isValid: true };
}

