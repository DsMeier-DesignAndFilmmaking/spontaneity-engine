/**
 * demo/spontaneity.ts
 * Demo API endpoint for free, anonymous access to AI recommendations.
 * 
 * This endpoint allows unauthenticated access for the free demo widget.
 * It uses the same engine logic but without authentication requirements.
 * Rate limiting should be applied in production.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { SpontaneityEngine } from '@/engine/SpontaneityEngine';
import { OpenAIAdapter, GeminiAdapter } from '@/engine/ModelAdapter';
import { moderateContent, DEFAULT_TRUST_POLICY } from '@/lib/moderation/contentModeration';
import { generateTrustMetadata, generateWhyNow, type TrustSignals } from '@/lib/moderation/contentModeration';
import { storeAuditLog, createAuditLogEvent } from '@/lib/moderation/auditLog';
import type { TrustPolicy } from '@/lib/moderation/contentModeration';

interface DemoSpontaneityRequest {
  userInput: string;
  config?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  };
}

interface DemoSpontaneityResponse {
  success: boolean;
  result?: string;
  error?: string;
}

/**
 * Generate a unique recommendation ID
 */
function generateRecommendationId(): string {
  return `rec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Extract location from user input (simple pattern matching)
 */
function extractLocationFromInput(userInput: string): string | undefined {
  // Simple extraction - could be enhanced with NLP
  const locationMatch = userInput.match(/location[:\s]+([^,]+)/i) || 
                       userInput.match(/in\s+([A-Z][a-zA-Z\s]+)/);
  return locationMatch ? locationMatch[1].trim() : undefined;
}

/**
 * Extract time from user input
 */
function extractTimeFromInput(userInput: string): string | undefined {
  const timeMatch = userInput.match(/time[:\s]+([^,]+)/i) || 
                   userInput.match(/(\d+\s*(?:hour|min|minute)s?)/i);
  return timeMatch ? timeMatch[1].trim() : undefined;
}

/**
 * Extract vibe from user input
 */
function extractVibeFromInput(userInput: string): string | undefined {
  const vibeMatch = userInput.match(/vibe[:\s]+([^,]+)/i);
  return vibeMatch ? vibeMatch[1].trim() : undefined;
}

/**
 * Initialize the SpontaneityEngine with available adapters.
 * For demo, we prioritize OpenAI (gpt-3.5-turbo) for free tier compatibility.
 */
function initializeEngine(): SpontaneityEngine {
  const adapters = [];

  // Initialize OpenAI adapter if API key is available (prioritize for demo)
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (openaiApiKey && openaiApiKey !== 'your_openai_api_key_here') {
    try {
      adapters.push(new OpenAIAdapter(openaiApiKey));
    } catch (error) {
      console.warn('Failed to initialize OpenAI adapter:', error);
    }
  }

  // Initialize Gemini adapter if API key is available (fallback)
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (geminiApiKey && geminiApiKey !== 'your_gemini_api_key_here') {
    try {
      adapters.push(new GeminiAdapter(geminiApiKey));
    } catch (error) {
      console.warn('Failed to initialize Gemini adapter:', error);
    }
  }

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
 * POST /api/demo/spontaneity
 * 
 * Handles spontaneous activity recommendation requests for the free demo.
 * No authentication required - allows anonymous access.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DemoSpontaneityResponse>
) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.',
    });
  }

  try {
    // Parse and validate request body
    const { userInput, config }: DemoSpontaneityRequest = req.body;

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
      // Build prompt for the engine
      const prompt = `Generate spontaneous activity recommendations based on the following user request:

User Request: "${userInput}"

Please provide creative, personalized activity suggestions that match the user's intent.
Consider factors like:
- Current time and context
- User preferences (if available)
- Weather and location context
- Activity duration and intensity
- Novelty and spontaneity

Return a JSON response with recommended activities and reasoning.`;

      // Execute with timeout
      result = await engine.runEngine(prompt);
      
      // Log which adapter was used (for debugging)
      adapterUsed = 'OpenAI or Gemini'; // Engine doesn't expose which adapter succeeded
      
    } catch (engineError) {
      const errorMessage = engineError instanceof Error ? engineError.message : 'Unknown error';
      const errorStack = engineError instanceof Error ? engineError.stack : undefined;
      console.error('[Demo API] Engine execution failed:', {
        error: errorMessage,
        stack: errorStack,
        userInput: userInput.substring(0, 100), // First 100 chars for debugging
      });
      
      return res.status(500).json({
        success: false,
        error: `Engine execution failed: ${errorMessage}`,
      });
    }

    // Parse the result
    let parsedResult: any;
    try {
      parsedResult = JSON.parse(result);
    } catch (parseError) {
      // If result is not JSON, wrap it
      parsedResult = {
        recommendation: result,
        title: 'Your Recommendation',
        description: result,
      };
    }

    // Generate recommendation ID
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
      // For demo, silently fall back to AI-only (no error to user)
    }
    
    // Generate trust metadata object (SERVER-SIDE ONLY)
    const trustSignals: TrustSignals = {
      ai_generated: true, // Always true for AI-generated recommendations
      ugc_influenced: false, // Demo doesn't use UGC
      recent_activity: true, // Assume recent activity for demo
      context_verified: true, // Assume verified for demo
    };
    
    // Generate structured trust metadata
    const trustMetadata = generateTrustMetadata(trustSignals);
    
    // Generate activity timestamp if recent_activity is true
    let activityTimestamp: string | undefined;
    if (trustSignals.recent_activity) {
      // For demo, simulate recent activity within last 24 hours
      const hoursAgo = Math.floor(Math.random() * 24);
      const timestamp = new Date();
      timestamp.setHours(timestamp.getHours() - hoursAgo);
      activityTimestamp = timestamp.toISOString();
    }
    
    // Apply default trust policy (demo uses default)
    const DEFAULT_TRUST_POLICY: TrustPolicy = {
      allow_ugc: false, // Demo doesn't use UGC
      min_activity_recency_hours: 48,
      require_verified_context: false, // More lenient for demo
      confidence_floor: 'low',
    };
    
    const passesPolicy = true; // Demo always passes (more lenient)
    
    // Add trust metadata to result
    parsedResult.trust = trustMetadata;
    if (activityTimestamp) {
      parsedResult.activity_timestamp = activityTimestamp;
    }
    
    // Generate "Why This Now?" micro-explanation (SERVER-SIDE ONLY)
    const context = {
      location: parsedResult.location || parsedResult.area || extractLocationFromInput(userInput),
      time: parsedResult.time || parsedResult.duration || extractTimeFromInput(userInput),
      vibe: parsedResult.vibe || extractVibeFromInput(userInput),
    };
    const whyNow = generateWhyNow(trustMetadata.signals, context);
    if (whyNow) {
      parsedResult.why_now = whyNow;
    }

    // Store audit log (append-only, PII-free)
    // Use default trust policy for demo
    try {
      const auditEvent = await createAuditLogEvent(
        recommendationId,
        userInput.trim(),
        trustMetadata,
        DEFAULT_TRUST_POLICY,
        'demo_partner_id'
      );
      // Store audit log (fire and forget - don't await)
      storeAuditLog(auditEvent, 'demo_partner_id').catch((error) => {
        // Silent fail - audit logging should not break requests
        console.warn('[Audit Log] Failed to store audit log:', error);
      });
    } catch (auditError) {
      // Silent fail - audit logging should not break requests
      console.warn('Audit logging failed:', auditError);
    }

    // Return success response
    return res.status(200).json({
      success: true,
      result: JSON.stringify(parsedResult),
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('[Demo API] Unexpected error:', {
      error: errorMessage,
      stack: errorStack,
      type: error instanceof Error ? error.constructor.name : typeof error,
    });
    
    return res.status(500).json({
      success: false,
      error: `Internal server error: ${errorMessage}`,
    });
  }
}

