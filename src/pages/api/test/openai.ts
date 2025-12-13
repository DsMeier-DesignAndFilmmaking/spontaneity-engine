/**
 * test/openai.ts
 * Test endpoint for OpenAI API integration.
 * 
 * Lightweight test function to verify OpenAI API is working.
 * Only accessible in development mode.
 */

import type { NextApiRequest, NextApiResponse } from 'next';

interface TestResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * GET /api/test/openai
 * 
 * Tests OpenAI API integration with a simple request.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TestResponse>
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
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      return res.status(400).json({
        success: false,
        error: 'OPENAI_API_KEY not configured in environment variables.',
      });
    }

    // Test OpenAI API call
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { 
            role: 'system', 
            content: 'You are a travel recommendation assistant. Respond with a brief, friendly message.' 
          },
          { 
            role: 'user', 
            content: 'Generate one spontaneous local activity for a user in downtown Washington DC.' 
          }
        ],
        max_tokens: 150,
        temperature: 0.7,
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        success: false,
        error: `OpenAI API error: ${response.status} ${response.statusText}. ${errorData.error?.message || ''}`,
      });
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content;

    return res.status(200).json({
      success: true,
      data: {
        response: generatedText,
        model: data.model,
        usage: data.usage,
        full_response: data,
      },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('OpenAI test failed:', error);
    
    return res.status(500).json({
      success: false,
      error: `OpenAI test failed: ${errorMessage}`,
    });
  }
}

