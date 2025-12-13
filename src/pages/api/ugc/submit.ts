/**
 * submit.ts
 * UGC Submission API endpoint.
 * 
 * Handles user-generated content submission with automatic moderation.
 * MVaP-safe: No public moderation UI, silent failures.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { moderateContent } from '@/lib/moderation/contentModeration';

interface UGCSubmitRequest {
  idea: string;
  location: string;
  timing?: string;
}

interface UGCSubmitResponse {
  success: boolean;
  error?: string;
}

/**
 * POST /api/ugc/submit
 * 
 * Submits UGC with automatic moderation.
 * Returns success even if content is rejected (silent fail for MVaP).
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UGCSubmitResponse>
) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.',
    });
  }

  try {
    // Check if UGC is enabled (kill switch)
    const ugcEnabled = process.env.UGC_ENABLED !== 'false';
    if (!ugcEnabled) {
      // Silent fail - return success but don't process
      return res.status(200).json({
        success: true,
      });
    }

    const { idea, location, timing }: UGCSubmitRequest = req.body;

    // Validate required fields
    if (!idea || typeof idea !== 'string' || idea.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Idea is required',
      });
    }

    if (idea.length > 200) {
      return res.status(400).json({
        success: false,
        error: 'Idea must be 200 characters or less',
      });
    }

    // Layer 1: AI Pre-Filter
    const preFilterResult = moderateContent(idea, {
      location: location || undefined,
      time: timing || undefined,
    });

    if (!preFilterResult.passed) {
      // Silent fail - return success but don't store
      console.warn('[UGC] Content failed pre-filter:', preFilterResult.reason);
      return res.status(200).json({
        success: true,
      });
    }

    // Layer 2: Contextual Validity Check
    // Already done in moderateContent, but we can add additional checks here
    if (idea.trim().length < 10) {
      // Too short to be meaningful
      return res.status(200).json({
        success: true,
      });
    }

    // Layer 3: Location validation (basic)
    // Check for private addresses
    const privateAddressPattern = /\d+\s+[a-z]+\s+(street|st|avenue|ave|road|rd|drive|dr|lane|ln|way|blvd|boulevard)/i;
    if (privateAddressPattern.test(location)) {
      // Contains private address - reject silently
      return res.status(200).json({
        success: true,
      });
    }

    // STUB: Store UGC (in production, store in database)
    // For MVaP, we'll just log it
    console.log('[UGC] Accepted submission:', {
      idea: idea.substring(0, 50) + '...',
      location: location || 'Nearby',
      timing: timing || 'Not specified',
      timestamp: new Date().toISOString(),
    });

    // In production, you would:
    // 1. Store in database (Firestore/Supabase)
    // 2. Queue for AI processing to influence recommendations
    // 3. Track soft community signals

    return res.status(200).json({
      success: true,
    });

  } catch (error) {
    // Silent fail - return success to avoid exposing errors
    console.error('[UGC] Submission error:', error);
    return res.status(200).json({
      success: true,
    });
  }
}

