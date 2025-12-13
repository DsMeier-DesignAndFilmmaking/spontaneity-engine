/**
 * audit-logs.ts
 * Admin API endpoint for retrieving compliance audit logs.
 * 
 * API-ONLY: Not accessible from widget UI.
 * ADMIN/PARTNER SCOPED: Requires authentication and proper access level.
 * 
 * GET /api/admin/audit-logs
 * 
 * Query parameters:
 * - partner_id (optional): Scope results to specific partner
 * - limit (optional): Maximum number of logs to return (default: 100, max: 1000)
 * - start_after (optional): ISO-8601 timestamp for pagination
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { retrieveAuditLogs } from '@/lib/moderation/auditLog';
import { validateSupabaseConfig } from '@/lib/db/supabase';

interface AuditLogsResponse {
  success: boolean;
  logs?: any[];
  error?: string;
  pagination?: {
    count: number;
    has_more: boolean;
    next_start_after?: string;
  };
}

/**
 * Validates admin/partner access
 * 
 * In production, implement proper role-based access control:
 * - Check user role (admin vs partner)
 * - Verify partner_id matches user's partner association
 * - Implement rate limiting
 */
async function validateAdminAccess(
  req: NextApiRequest,
  partnerId?: string
): Promise<{ authorized: boolean; userId?: string; error?: string }> {
  try {
    validateSupabaseConfig();
    
    // Get authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        authorized: false,
        error: 'Unauthorized. Valid authentication token required.',
      };
    }

    const token = authHeader.substring(7);

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return {
        authorized: false,
        error: 'Server configuration error',
      };
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Verify token and get user
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return {
        authorized: false,
        error: 'Invalid authentication token',
      };
    }

    // TODO: In production, check user role and partner association
    // For MVaP, we'll allow any authenticated user
    // In production:
    // - Check user metadata for 'role' field (admin/partner)
    // - If partner role, verify partner_id matches user's partner_id
    // - If admin role, allow access to all logs

    return {
      authorized: true,
      userId: user.id,
    };
  } catch (error) {
    console.error('[Audit Logs] Error validating access:', error);
    return {
      authorized: false,
      error: 'Error validating access',
    };
  }
}

/**
 * GET /api/admin/audit-logs
 * 
 * Retrieves audit logs for compliance review.
 * Requires authentication and appropriate access level.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AuditLogsResponse>
) {
  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET.',
    });
  }

  try {
    // Extract query parameters
    const partnerId = req.query.partner_id as string | undefined;
    const limitParam = req.query.limit as string | undefined;
    const startAfter = req.query.start_after as string | undefined;

    // Validate and parse limit
    let limitCount = 100; // Default
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1) {
        return res.status(400).json({
          success: false,
          error: 'Invalid limit parameter. Must be a positive integer.',
        });
      }
      // Cap at 1000 for performance
      limitCount = Math.min(parsedLimit, 1000);
    }

    // Validate start_after timestamp if provided
    if (startAfter) {
      const startAfterDate = new Date(startAfter);
      if (isNaN(startAfterDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid start_after parameter. Must be a valid ISO-8601 timestamp.',
        });
      }
    }

    // Validate admin/partner access
    const accessCheck = await validateAdminAccess(req, partnerId);
    if (!accessCheck.authorized) {
      return res.status(401).json({
        success: false,
        error: accessCheck.error || 'Unauthorized',
      });
    }

    // Retrieve audit logs
    const logs = await retrieveAuditLogs(partnerId, limitCount, startAfter);

    // Determine if there are more logs (for pagination)
    // If we got exactly the limit, there might be more
    const hasMore = logs.length === limitCount;

    // Get the last log's timestamp for pagination
    const nextStartAfter = hasMore && logs.length > 0
      ? logs[logs.length - 1].generated_at
      : undefined;

    return res.status(200).json({
      success: true,
      logs,
      pagination: {
        count: logs.length,
        has_more: hasMore,
        next_start_after: nextStartAfter,
      },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Audit Logs] Error retrieving logs:', error);

    return res.status(500).json({
      success: false,
      error: `Internal server error: ${errorMessage}`,
    });
  }
}

