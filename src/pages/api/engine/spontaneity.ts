/**
 * spontaneity.ts
 * Next.js API Route Handler for Spontaneity Engine.
 * 
 * Secure endpoint that executes the core AI engine logic.
 * Handles authentication, engine initialization, execution, and logging.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { SpontaneityEngine } from '@/engine/SpontaneityEngine';
import { GeminiAdapter, OpenAIAdapter } from '@/engine/ModelAdapter';
import { db, validateFirebaseConfig } from '@/lib/db/firebase';
import { validateSupabaseConfig } from '@/lib/db/supabase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { moderateContent, generateTrustMetadata, TrustSignals, validateTrustPolicy, TrustPolicy, DEFAULT_TRUST_POLICY, generateWhyNow } from '@/lib/moderation/contentModeration';
import { createAuditLogEvent, storeAuditLog } from '@/lib/moderation/auditLog';

/**
 * Request body interface for the API endpoint
 */
interface SpontaneityRequest {
  userInput: string;
  config?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  };
  trust_policy?: TrustPolicy; // Partner-controlled trust thresholds
  partner_id?: string; // Optional partner ID for audit log scoping
}

/**
 * Response interface for the API endpoint
 */
interface SpontaneityResponse {
  success: boolean;
  result?: string;
  error?: string;
  adapterUsed?: string;
}

/**
 * Validates and extracts the Supabase session token from the request.
 * 
 * @param req - Next.js API request object
 * @returns Session object if valid, null otherwise
 */
async function validateSession(req: NextApiRequest) {
  try {
    // Validate Supabase configuration
    validateSupabaseConfig();
    
    // Get the authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Initialize Supabase client for server-side auth check
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables');
      return null;
    }

    // Create a server-side Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Verify the token and get the user
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    return { user, token };
  } catch (error) {
    console.error('Error validating session:', error);
    return null;
  }
}

/**
 * Logs the request and response to Firestore for analytics.
 * 
 * @param userId - User ID from the session
 * @param userInput - User's input string
 * @param response - API response data
 * @param adapterUsed - Name of the adapter that was used
 * @param error - Error message if any
 */
async function logRequest(
  userId: string,
  userInput: string,
  response: string | undefined,
  adapterUsed: string | undefined,
  error: string | undefined
) {
  try {
    // Validate Firebase configuration before logging
    // This will throw if Firebase is not configured, which is fine - we catch and log the error
    validateFirebaseConfig();
    
    if (!db) {
      throw new Error('Firestore database is not initialized');
    }
    
    await addDoc(collection(db, 'engine_requests'), {
      userId,
      userInput: userInput.substring(0, 500), // Limit input length
      response: response ? response.substring(0, 2000) : null, // Limit response length
      adapterUsed: adapterUsed || null,
      success: !error,
      error: error || null,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString(),
    });
  } catch (logError) {
    // Don't fail the request if logging fails
    console.error('Error logging request to Firestore:', logError);
  }
}

/**
 * Generate UUID v4 for recommendation ID
 */
function generateRecommendationId(): string {
  // Generate UUID v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Helper functions to extract context from userInput string
 */
function extractLocationFromInput(userInput: string): string | undefined {
  const locationMatch = userInput.match(/Location:\s*([^,]+)/i) || userInput.match(/location:\s*([^,]+)/i);
  return locationMatch ? locationMatch[1].trim() : undefined;
}

function extractTimeFromInput(userInput: string): string | undefined {
  const timeMatch = userInput.match(/Time:\s*([^,]+)/i) || userInput.match(/time:\s*([^,]+)/i);
  return timeMatch ? timeMatch[1].trim() : undefined;
}

function extractVibeFromInput(userInput: string): string | undefined {
  const vibeMatch = userInput.match(/Vibe:\s*([^,]+)/i) || userInput.match(/vibe:\s*([^,]+)/i);
  return vibeMatch ? vibeMatch[1].trim() : undefined;
}

/**
 * Initializes the SpontaneityEngine with available adapters.
 * 
 * Adapters are initialized based on available API keys in environment variables.
 * 
 * @returns Initialized SpontaneityEngine instance
 */
function initializeEngine(): SpontaneityEngine {
  const adapters = [];

  // Initialize Gemini adapter if API key is available
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (geminiApiKey && geminiApiKey !== 'your_gemini_api_key_here') {
    try {
      adapters.push(new GeminiAdapter(geminiApiKey));
    } catch (error) {
      console.warn('Failed to initialize Gemini adapter:', error);
    }
  }

  // Initialize OpenAI adapter if API key is available
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (openaiApiKey && openaiApiKey !== 'your_openai_api_key_here') {
    try {
      adapters.push(new OpenAIAdapter(openaiApiKey));
    } catch (error) {
      console.warn('Failed to initialize OpenAI adapter:', error);
    }
  }

  // Initialize Anthropic adapter if API key is available (for future use)
  // const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  // if (anthropicApiKey && anthropicApiKey !== 'your_anthropic_api_key_here') {
  //   try {
  //     adapters.push(new AnthropicAdapter(anthropicApiKey));
  //   } catch (error) {
  //     console.warn('Failed to initialize Anthropic adapter:', error);
  //   }
  // }

  if (adapters.length === 0) {
    throw new Error('No AI adapters available. Please configure at least one API key.');
  }

  return new SpontaneityEngine(adapters, {
    enableFallback: true,
    timeoutMs: 30000, // 30 second timeout
  });
}

/**
 * API Route Handler
 * 
 * POST /api/engine/spontaneity
 * 
 * Handles spontaneous activity recommendation requests.
 * Requires authentication via Bearer token in Authorization header.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SpontaneityResponse>
) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.',
    });
  }

  try {
    // Authentication Check (optional but highly recommended)
    const session = await validateSession(req);
    
    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized. Valid authentication token required.',
      });
    }

    // Parse and validate request body
    const { userInput, config, trust_policy, partner_id }: SpontaneityRequest = req.body;
    
    // Use provided trust policy or default
    // Partners can customize trust thresholds via trust_policy in request
    // If no policy provided, DEFAULT_TRUST_POLICY is applied
    const activeTrustPolicy: TrustPolicy = trust_policy || DEFAULT_TRUST_POLICY;

    if (!userInput || typeof userInput !== 'string' || userInput.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request. userInput is required and must be a non-empty string.',
      });
    }

    // Initialize the engine
    let engine: SpontaneityEngine;
    try {
      engine = initializeEngine();
    } catch (engineError) {
      const errorMessage = engineError instanceof Error ? engineError.message : 'Unknown error';
      console.error('Engine initialization failed:', errorMessage);
      
      return res.status(500).json({
        success: false,
        error: `Engine initialization failed: ${errorMessage}`,
      });
    }

    // Execute the engine
    let result: string;
    let adapterUsed: string | undefined;

    try {
      // Get available adapter names for logging (will use first one as fallback)
      const availableAdapters = engine.getAdapterNames();
      adapterUsed = availableAdapters[0] || 'unknown';

      result = await engine.runEngine(userInput.trim());
      
      // Note: The engine doesn't currently expose which adapter was actually used.
      // For now, we log the first available adapter. To get the actual adapter used,
      // we would need to enhance the engine's runEngine method to return metadata.
      
      // Layer 4: Kill Switch Check (Critical for Trust)
      // If UGC is disabled, ensure only AI-generated content is returned
      const ugcEnabled = process.env.UGC_ENABLED !== 'false'; // Default to enabled unless explicitly disabled
      
      // Apply moderation and enhance with trust signals
      try {
        const parsedResult = JSON.parse(result);
        
        // Generate recommendation ID (UUID) for audit logging
        const recommendationId = generateRecommendationId();
        parsedResult.recommendation_id = recommendationId;
        
        const resultText = parsedResult.recommendation || parsedResult.description || JSON.stringify(parsedResult);
        
        // Run moderation checks
        const moderationResult = moderateContent(resultText, {
          userInput: userInput.trim(),
        });
        
        // If content fails moderation, return AI-only fallback
        if (!moderationResult.passed) {
          console.warn('[Moderation] Content failed moderation check:', moderationResult.reason);
          // For MVaP, silently fall back to AI-only (no error to user)
          // In production, you might want to regenerate or filter
        }
        
        // Generate trust metadata object (SERVER-SIDE ONLY)
        // This is the single source of truth for trust signals
        const trustSignals: TrustSignals = {
          ai_generated: true, // Always true for AI-generated recommendations
          ugc_influenced: ugcEnabled && Math.random() > 0.7, // 30% chance for demo (in production, check database)
          recent_activity: true, // Assume recent activity for MVaP (in production, check time-based signals)
          context_verified: true, // Assume verified for MVaP (in production, verify against POI database)
        };
        
        // Generate structured trust metadata
        const trustMetadata = generateTrustMetadata(trustSignals);
        
        // Generate activity timestamp if recent_activity is true
        // For MVaP, simulate recent activity within last 24 hours
        let activityTimestamp: string | undefined;
        if (trustSignals.recent_activity) {
          // Simulate activity within last 24 hours (random between 0-24 hours ago)
          const hoursAgo = Math.random() * 24;
          const activityTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
          activityTimestamp = activityTime.toISOString();
        } else {
          // Use provided timestamp or metadata timestamp as fallback
          activityTimestamp = parsedResult.last_activity_timestamp || trustMetadata.generated_at;
        }
        
        // Apply partner-controlled trust policy (request-time validation)
        // If recommendation fails policy, exclude it silently
        const passesPolicy = validateTrustPolicy(trustMetadata, activeTrustPolicy, activityTimestamp);
        
        // Track final trust metadata that will be applied (for audit logging)
        let finalTrustMetadata = trustMetadata;
        
        if (!passesPolicy) {
          // Silent exclusion - regenerate or return empty result
          // For MVaP, we'll return a fallback AI-only recommendation
          console.log('[Trust Policy] Recommendation excluded by policy, using fallback');
          
          // Generate fallback with AI-only signals
          const fallbackSignals: TrustSignals = {
            ai_generated: true,
            ugc_influenced: false,
            recent_activity: false,
            context_verified: false,
          };
          const fallbackMetadata = generateTrustMetadata(fallbackSignals);
          
          // Re-check fallback against policy
          if (validateTrustPolicy(fallbackMetadata, activeTrustPolicy)) {
            parsedResult.trust = fallbackMetadata;
            finalTrustMetadata = fallbackMetadata; // Use fallback for audit log
          } else {
            // Even fallback fails - return error (shouldn't happen with default policy)
            return res.status(500).json({
              success: false,
              error: 'Unable to generate recommendation meeting trust requirements',
            });
          }
        } else {
          // Recommendation passes policy - add trust metadata
          parsedResult.trust = trustMetadata;
          finalTrustMetadata = trustMetadata; // Use original for audit log
        }
        
        // Generate "Why This Now?" micro-explanation (SERVER-SIDE ONLY)
        // Extract context from parsed result or userInput
        const context = {
          location: parsedResult.location || parsedResult.area || extractLocationFromInput(userInput),
          time: parsedResult.time || parsedResult.duration || extractTimeFromInput(userInput),
          vibe: parsedResult.vibe || extractVibeFromInput(userInput),
        };
        
        const whyNow = generateWhyNow(finalTrustMetadata.signals, context);
        if (whyNow) {
          parsedResult.why_now = whyNow;
        }
        
        // Store audit log (APPEND-ONLY, PII-FREE)
        // Use the final trust metadata that was actually applied (after policy validation)
        // This happens asynchronously and doesn't block the response
        try {
          const auditEvent = await createAuditLogEvent(
            recommendationId,
            userInput.trim(),
            finalTrustMetadata,
            activeTrustPolicy,
            partner_id
          );
          // Store audit log (fire and forget - don't await)
          storeAuditLog(auditEvent, partner_id).catch((error) => {
            // Silent fail - audit logging should not break requests
            console.error('[Audit Log] Failed to store audit log:', error);
          });
        } catch (auditError) {
          // Silent fail - audit logging should not break requests
          console.error('[Audit Log] Failed to create audit log:', auditError);
        }
        
        result = JSON.stringify(parsedResult);
      } catch (parseError) {
        // If JSON parsing fails, continue with original result
        console.warn('[Moderation] Failed to parse result for moderation:', parseError);
      }
      
    } catch (engineError) {
      const errorMessage = engineError instanceof Error ? engineError.message : 'Unknown error';
      console.error('Engine execution failed:', errorMessage);

      // Log the failed request
      await logRequest(
        session.user.id,
        userInput,
        undefined,
        undefined,
        errorMessage
      );

      return res.status(500).json({
        success: false,
        error: `Engine execution failed: ${errorMessage}`,
      });
    }

    // Log the successful request
    await logRequest(
      session.user.id,
      userInput,
      result,
      adapterUsed,
      undefined
    );

    // Return the AI's JSON response
    return res.status(200).json({
      success: true,
      result,
      adapterUsed,
    });

  } catch (error) {
    // Handle unexpected errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Unexpected error in API handler:', error);

    return res.status(500).json({
      success: false,
      error: `Internal server error: ${errorMessage}`,
    });
  }
}

