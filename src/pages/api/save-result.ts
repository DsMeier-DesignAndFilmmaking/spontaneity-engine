/**
 * save-result.ts
 * API endpoint for saving results and generating shareable URLs.
 * 
 * Creates a short-lived result object (24-hour expiration) and returns
 * a shareable URL. Uses server-generated record or signed JWT token.
 * 
 * STUB — Replace in production with actual database storage.
 */

import type { NextApiRequest, NextApiResponse } from 'next';

interface SaveResultRequest {
  result_id: string;
  result_data: string;
}

interface SaveResultResponse {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Generate a short-lived token for the result URL
 * In production, store this in a database with expiration
 */
function generateResultToken(resultId: string): string {
  // STUB — Replace with proper JWT signing or database record
  // For now, use a simple base64-encoded token with expiration
  const expiration = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  const token = Buffer.from(`${resultId}:${expiration}`).toString('base64');
  return token;
}

/**
 * POST /api/save-result
 * 
 * Saves a result and returns a shareable URL with 24-hour expiration.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SaveResultResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.',
    });
  }

  try {
    const { result_id, result_data }: SaveResultRequest = req.body;

    if (!result_id || !result_data) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: result_id, result_data',
      });
    }

    // STUB — In production, store result_data in database
    // For now, we'll generate a token-based URL
    // In production, you would:
    // 1. Store result_data in database (Firestore/Supabase) with expiration
    // 2. Generate a unique token/ID
    // 3. Return URL like `/r/${token}`
    
    const token = generateResultToken(result_id);
    const url = `/r/${token}`;

    // STUB — Log to console (replace with database write)
    console.log('[save-result] Saved result:', {
      result_id,
      token,
      expires_in: '24 hours',
    });

    return res.status(200).json({
      success: true,
      url,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[save-result] Error:', errorMessage);
    
    return res.status(500).json({
      success: false,
      error: `Internal server error: ${errorMessage}`,
    });
  }
}

