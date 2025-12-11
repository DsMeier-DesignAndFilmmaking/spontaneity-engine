/**
 * feedback.ts
 * API endpoint for submitting user feedback on results.
 * 
 * Stores feedback (rating + optional comment) for analytics and product iteration.
 * 
 * STUB — Replace in production with actual database storage.
 */

import type { NextApiRequest, NextApiResponse } from 'next';

interface FeedbackRequest {
  result_id: string;
  rating: 'positive' | 'negative';
  comment: string | null;
}

interface FeedbackResponse {
  success: boolean;
  error?: string;
}

/**
 * POST /api/feedback
 * 
 * Submits user feedback for a generated result.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FeedbackResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.',
    });
  }

  try {
    const { result_id, rating, comment }: FeedbackRequest = req.body;

    if (!result_id || !rating) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: result_id, rating',
      });
    }

    if (rating !== 'positive' && rating !== 'negative') {
      return res.status(400).json({
        success: false,
        error: 'Invalid rating. Must be "positive" or "negative".',
      });
    }

    // STUB — Replace in production with actual database storage
    // Examples:
    // - Firestore: await addDoc(collection(db, 'feedback'), { result_id, rating, comment, timestamp: serverTimestamp() })
    // - Supabase: await supabase.from('feedback').insert({ result_id, rating, comment })
    // - PostgreSQL: await db.query('INSERT INTO feedback ...')
    
    console.log('[feedback] STUB: Would save feedback:', {
      result_id,
      rating,
      comment: comment || '(no comment)',
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[feedback] Error:', errorMessage);
    
    return res.status(500).json({
      success: false,
      error: `Internal server error: ${errorMessage}`,
    });
  }
}

