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
import { db } from '@/lib/db/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

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
    const { userInput, config }: SpontaneityRequest = req.body;

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

