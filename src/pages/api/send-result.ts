/**
 * send-result.ts
 * API endpoint for sending saved results via email.
 * 
 * Sends the result data to the provided email address.
 * 
 * STUB — Replace in production with actual email service integration.
 */

import type { NextApiRequest, NextApiResponse } from 'next';

interface SendResultRequest {
  result_id: string;
  result_data: string;
  email: string;
}

interface SendResultResponse {
  success: boolean;
  error?: string;
}

/**
 * POST /api/send-result
 * 
 * Sends a saved result to the provided email address.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SendResultResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.',
    });
  }

  try {
    const { result_id, result_data, email }: SendResultRequest = req.body;

    if (!result_id || !result_data || !email) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: result_id, result_data, email',
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email address',
      });
    }

    // STUB — Replace in production with actual email service
    // Examples:
    // - SendGrid: await sgMail.send({ to: email, subject: '...', text: result_data })
    // - AWS SES: await ses.sendEmail({ ... })
    // - Resend: await resend.emails.send({ to: email, ... })
    // - Nodemailer: await transporter.sendMail({ to: email, ... })
    
    console.log('[send-result] STUB: Would send email:', {
      to: email,
      result_id,
      // In production, you would format result_data nicely
    });

    // Simulate async email sending
    await new Promise(resolve => setTimeout(resolve, 500));

    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[send-result] Error:', errorMessage);
    
    return res.status(500).json({
      success: false,
      error: `Internal server error: ${errorMessage}`,
    });
  }
}

