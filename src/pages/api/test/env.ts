/**
 * test/env.ts
 * Test endpoint to verify environment variables are loaded.
 * Only available in development mode.
 */

import type { NextApiRequest, NextApiResponse } from 'next';

interface EnvTestResponse {
  success: boolean;
  env?: {
    hasOpenAIKey: boolean;
    hasSupabaseUrl: boolean;
    hasSupabaseAnonKey: boolean;
    openaiKeyPrefix?: string;
    supabaseUrl?: string;
  };
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EnvTestResponse>
) {
  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET.',
    });
  }

  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      error: 'Test endpoint only available in development mode.',
    });
  }

  try {
    const openaiKey = process.env.OPENAI_API_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    return res.status(200).json({
      success: true,
      env: {
        hasOpenAIKey: !!openaiKey && openaiKey !== 'your_openai_api_key_here',
        hasSupabaseUrl: !!supabaseUrl && supabaseUrl.trim() !== '',
        hasSupabaseAnonKey: !!supabaseAnonKey && supabaseAnonKey.trim() !== '',
        openaiKeyPrefix: openaiKey ? `${openaiKey.substring(0, 7)}...` : undefined,
        supabaseUrl: supabaseUrl || undefined,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      success: false,
      error: `Error checking environment: ${errorMessage}`,
    });
  }
}

