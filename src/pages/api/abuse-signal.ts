/**
 * abuse-signal.ts
 * Abuse Signal Feedback Loop API endpoint.
 * 
 * Captures safety signals without exposing moderation UX.
 * Signals affect future ranking, no immediate removal.
 */

import type { NextApiRequest, NextApiResponse } from 'next';

interface AbuseSignalRequest {
  reason: 'irrelevant' | 'outdated' | 'unsafe';
  recommendation_id: string;
  session_id: string;
  timestamp: string; // ISO-8601
}

interface AbuseSignalResponse {
  success: boolean;
  error?: string;
}

/**
 * POST /api/abuse-signal
 * 
 * Captures abuse signals for future ranking adjustments.
 * No immediate removal, threshold-based suppression only.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AbuseSignalResponse>
) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.',
    });
  }

  try {
    const { reason, recommendation_id, session_id, timestamp }: AbuseSignalRequest = req.body;

    // Validate required fields
    if (!reason || !recommendation_id || !session_id || !timestamp) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: reason, recommendation_id, session_id, timestamp',
      });
    }

    // Validate reason enum
    if (!['irrelevant', 'outdated', 'unsafe'].includes(reason)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid reason. Must be: irrelevant, outdated, or unsafe',
      });
    }

    // STUB: Store abuse signal (in production, store in database)
    // For MVaP, we'll log it and structure for future ranking
    console.log('[Abuse Signal] Captured:', {
      reason,
      recommendation_id,
      session_id,
      timestamp,
      processed_at: new Date().toISOString(),
    });

    // In production, you would:
    // 1. Store signal in database with recommendation_id
    // 2. Aggregate signals per recommendation
    // 3. Apply threshold-based suppression (e.g., suppress if >5 signals)
    // 4. Use signals to adjust ranking in future queries
    // 5. No immediate removal - only affects future ranking

    // Return success (no user feedback)
    return res.status(200).json({
      success: true,
    });

  } catch (error) {
    // Silent fail - return success to avoid exposing errors
    console.error('[Abuse Signal] Error:', error);
    return res.status(200).json({
      success: true,
    });
  }
}

