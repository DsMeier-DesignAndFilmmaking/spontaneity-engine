/**
 * openai-embedding.ts
 * API route for generating OpenAI embeddings.
 * 
 * Generates embeddings using OpenAI's text-embedding-ada-002 model
 * for use in vector similarity search in Supabase.
 * 
 * This endpoint gracefully handles errors - if OpenAI fails or usage limits
 * are reached, it returns a non-blocking error response that allows the
 * calling code to continue saving data without the embedding.
 */

import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Request body interface
 */
interface EmbeddingRequest {
  text: string;
}

/**
 * Success response: contains the embedding vector
 */
interface EmbeddingSuccessResponse {
  embedding: number[];
}

/**
 * Error response: contains null embedding and error message
 * This format allows the calling code to continue without blocking
 */
interface EmbeddingErrorResponse {
  embedding: null;
  error: string;
}

type EmbeddingResponse = EmbeddingSuccessResponse | EmbeddingErrorResponse;

/**
 * POST /api/openai-embedding
 * 
 * Generates an embedding vector for the provided text using OpenAI's text-embedding-ada-002 model.
 * Returns a 1536-dimensional vector suitable for Supabase vector similarity search.
 * 
 * Error Handling:
 * - If OpenAI fails or usage limits are reached, returns { embedding: null, error: "..." }
 * - This non-blocking approach allows the calling code to save data without the embedding
 * 
 * @example Success Response
 * POST /api/openai-embedding
 * Body: { "text": "Sunset view from the hill behind the old fort" }
 * Response: { "embedding": [0.123, -0.456, ...] }
 * 
 * @example Error Response
 * Response: { "embedding": null, "error": "OpenAI failed or limit reached" }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EmbeddingResponse>
) {
  // Step 1: Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({
      embedding: null,
      error: 'Method not allowed. Use POST.',
    });
  }

  try {
    // Step 2: Extract and validate request body
    const { text }: EmbeddingRequest = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({
        embedding: null,
        error: 'Text is required and must be a non-empty string',
      });
    }

    // Step 3: Check if OpenAI API key is configured
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey.trim() === '' || apiKey === 'your_openai_api_key_here') {
      console.warn('[OpenAI Embedding] API key not configured');
      return res.status(200).json({
        embedding: null,
        error: 'OpenAI failed or limit reached',
      });
    }

    // Step 4: Generate embedding using OpenAI's text-embedding-ada-002 model
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: text.trim(),
      }),
    });

    // Step 5: Handle OpenAI API errors gracefully (non-blocking)
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle rate limiting (429) and service unavailable (503) errors
      if (response.status === 429 || response.status === 503) {
        console.warn('[OpenAI Embedding] Rate limit or service unavailable:', errorData);
        return res.status(200).json({
          embedding: null,
          error: 'OpenAI failed or limit reached',
        });
      }

      // Handle authentication errors (401, 403)
      if (response.status === 401 || response.status === 403) {
        console.error('[OpenAI Embedding] Authentication error:', errorData);
        return res.status(200).json({
          embedding: null,
          error: 'OpenAI failed or limit reached',
        });
      }

      // Handle quota exceeded or other API errors
      console.error('[OpenAI Embedding] API error:', response.status, errorData);
      return res.status(200).json({
        embedding: null,
        error: 'OpenAI failed or limit reached',
      });
    }

    // Step 6: Parse and validate the embedding response
    const data = await response.json();
    const embedding = data.data?.[0]?.embedding;

    if (!embedding || !Array.isArray(embedding)) {
      console.error('[OpenAI Embedding] Invalid response format:', data);
      return res.status(200).json({
        embedding: null,
        error: 'OpenAI failed or limit reached',
      });
    }

    // Step 7: Verify embedding dimension (ada-002 should return 1536 dimensions)
    if (embedding.length !== 1536) {
      console.warn(`[OpenAI Embedding] Unexpected embedding dimension: ${embedding.length}, expected 1536`);
    }

    // Step 8: Return successful response with embedding vector
    return res.status(200).json({
      embedding,
    });

  } catch (error) {
    // Step 9: Handle unexpected errors (network failures, timeouts, etc.)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[OpenAI Embedding] Unexpected error:', error);
    
    // Return non-blocking error response (200 status to allow caller to continue)
    return res.status(200).json({
      embedding: null,
      error: 'OpenAI failed or limit reached',
    });
  }
}

