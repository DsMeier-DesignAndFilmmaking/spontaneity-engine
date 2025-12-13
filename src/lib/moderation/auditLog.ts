/**
 * auditLog.ts
 * Compliance-Friendly Audit Logging for Trust & Safety.
 * 
 * Enterprise-ready audit logging that:
 * - Stores no PII (hashed input context only)
 * - Append-only storage
 * - Partner-scoped access
 * - Configurable retention
 */

import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db, validateFirebaseConfig } from '@/lib/db/firebase';
import { TrustBadge, TrustMetadata } from './contentModeration';
import { TrustPolicy } from './contentModeration';

/**
 * Audit Log Event Structure
 * PII-free, append-only, enterprise-compliant
 */
export interface AuditLogEvent {
  recommendation_id: string; // UUID
  input_context_hash: string; // SHA256 hash (no PII)
  trust_badge: TrustBadge;
  policy_applied: string; // e.g., "default_partner_policy" or partner ID
  generated_at: string; // ISO-8601 timestamp
  model_version: string; // e.g., "engine-v1.0"
  // Optional metadata (non-PII)
  confidence_level?: string;
  signals_summary?: {
    ai_generated: boolean;
    ugc_influenced: boolean;
    recent_activity: boolean;
    context_verified: boolean;
  };
}

/**
 * Partner Policy Configuration
 * Controls retention and access scoping
 */
export interface PartnerPolicyConfig {
  partner_id: string;
  retention_days: number; // How long to retain logs
  access_scope: 'admin' | 'partner'; // Who can access
}

/**
 * Generate SHA256 hash of input context (PII-free)
 * 
 * Hashes the input context to enable auditability without storing PII.
 * Same input context will produce same hash, enabling pattern analysis.
 * 
 * Uses Node.js crypto module (server-side only).
 */
export async function hashInputContext(userInput: string): Promise<string> {
  // Use Node.js crypto module for SHA256 hashing (server-side only)
  const crypto = require('crypto');
  const hash = crypto.createHash('sha256');
  hash.update(userInput.trim().toLowerCase());
  return hash.digest('hex');
}

/**
 * Get model version from environment or default
 */
function getModelVersion(): string {
  return process.env.MODEL_VERSION || 'engine-v1.0';
}

/**
 * Get policy identifier from TrustPolicy
 */
function getPolicyIdentifier(policy: TrustPolicy, partnerId?: string): string {
  if (partnerId) {
    return `partner_${partnerId}_policy`;
  }
  // Check if it's the default policy
  const { DEFAULT_TRUST_POLICY } = require('./contentModeration');
  const isDefault = 
    policy.allow_ugc === DEFAULT_TRUST_POLICY.allow_ugc &&
    policy.min_activity_recency_hours === DEFAULT_TRUST_POLICY.min_activity_recency_hours &&
    policy.require_verified_context === DEFAULT_TRUST_POLICY.require_verified_context &&
    policy.confidence_floor === DEFAULT_TRUST_POLICY.confidence_floor;
  
  return isDefault ? 'default_partner_policy' : 'custom_policy';
}

/**
 * Create audit log event (SERVER-SIDE ONLY)
 * 
 * Generates a PII-free audit log entry for compliance and enterprise review.
 * 
 * @param recommendationId - UUID of the recommendation
 * @param userInput - User input (will be hashed, not stored)
 * @param trustMetadata - Trust metadata from recommendation
 * @param policy - Trust policy that was applied
 * @param partnerId - Optional partner ID for scoping
 * @returns Audit log event (not yet stored)
 */
export async function createAuditLogEvent(
  recommendationId: string,
  userInput: string,
  trustMetadata: TrustMetadata,
  policy: TrustPolicy,
  partnerId?: string
): Promise<AuditLogEvent> {
  const inputHash = await hashInputContext(userInput);
  const policyIdentifier = getPolicyIdentifier(policy, partnerId);
  const modelVersion = getModelVersion();

  return {
    recommendation_id: recommendationId,
    input_context_hash: inputHash,
    trust_badge: trustMetadata.badge,
    policy_applied: policyIdentifier,
    generated_at: new Date().toISOString(),
    model_version: modelVersion,
    confidence_level: trustMetadata.confidence_level,
    signals_summary: {
      ai_generated: trustMetadata.signals.ai_generated,
      ugc_influenced: trustMetadata.signals.ugc_influenced,
      recent_activity: trustMetadata.signals.recent_activity,
      context_verified: trustMetadata.signals.context_verified,
    },
  };
}

/**
 * Store audit log event (APPEND-ONLY)
 * 
 * Stores audit log to Firestore in append-only fashion.
 * Never updates or deletes - only appends new entries.
 * 
 * @param auditEvent - Audit log event to store
 * @param partnerId - Optional partner ID for collection scoping
 * @returns Document ID of stored event
 */
export async function storeAuditLog(
  auditEvent: AuditLogEvent,
  partnerId?: string
): Promise<string | null> {
  try {
    // Validate Firebase configuration
    validateFirebaseConfig();
    
    if (!db) {
      throw new Error('Firestore database is not initialized');
    }

    // Use partner-scoped collection if partner ID provided
    // Otherwise use default audit_logs collection
    const collectionName = partnerId 
      ? `audit_logs_${partnerId}` 
      : 'audit_logs';

    // Append-only: Always add new document, never update
    const docRef = await addDoc(collection(db, collectionName), {
      ...auditEvent,
      stored_at: serverTimestamp(), // Firestore server timestamp
      stored_at_iso: new Date().toISOString(), // ISO-8601 for queries
    });

    return docRef.id;
  } catch (error) {
    // Silent fail - don't break request if audit logging fails
    console.error('[Audit Log] Error storing audit log:', error);
    return null;
  }
}

/**
 * Retrieve audit logs (ADMIN/PARTNER SCOPED)
 * 
 * Retrieves audit logs for compliance review.
 * Partner-scoped: Only returns logs for specified partner.
 * Admin-scoped: Can access all logs.
 * 
 * @param partnerId - Partner ID to scope results (required for partner access)
 * @param limitCount - Maximum number of logs to return (default: 100)
 * @param startAfter - ISO-8601 timestamp to start after (for pagination)
 * @returns Array of audit log events
 */
export async function retrieveAuditLogs(
  partnerId?: string,
  limitCount: number = 100,
  startAfter?: string
): Promise<AuditLogEvent[]> {
  try {
    validateFirebaseConfig();
    
    if (!db) {
      throw new Error('Firestore database is not initialized');
    }

    // Determine collection based on partner scope
    const collectionName = partnerId 
      ? `audit_logs_${partnerId}` 
      : 'audit_logs';

    // Build query: order by generated_at descending, limit results
    let q = query(
      collection(db, collectionName),
      orderBy('generated_at', 'desc'),
      limit(limitCount)
    );

    // If startAfter provided, add pagination
    if (startAfter) {
      const startAfterTimestamp = Timestamp.fromDate(new Date(startAfter));
      q = query(
        collection(db, collectionName),
        orderBy('generated_at', 'desc'),
        where('generated_at', '<', startAfterTimestamp),
        limit(limitCount)
      );
    }

    const querySnapshot = await getDocs(q);
    const logs: AuditLogEvent[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Reconstruct AuditLogEvent (exclude Firestore metadata)
      logs.push({
        recommendation_id: data.recommendation_id,
        input_context_hash: data.input_context_hash,
        trust_badge: data.trust_badge,
        policy_applied: data.policy_applied,
        generated_at: data.generated_at,
        model_version: data.model_version,
        confidence_level: data.confidence_level,
        signals_summary: data.signals_summary,
      });
    });

    return logs;
  } catch (error) {
    console.error('[Audit Log] Error retrieving audit logs:', error);
    throw error;
  }
}

/**
 * Cleanup old audit logs based on retention policy
 * 
 * Removes audit logs older than retention period.
 * Should be run as a scheduled job (cron, Cloud Functions, etc.)
 * 
 * @param partnerId - Partner ID to scope cleanup
 * @param retentionDays - Number of days to retain (default: 90)
 * @returns Number of logs deleted
 */
export async function cleanupOldAuditLogs(
  partnerId?: string,
  retentionDays: number = 90
): Promise<number> {
  try {
    validateFirebaseConfig();
    
    if (!db) {
      throw new Error('Firestore database is not initialized');
    }

    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const cutoffTimestamp = Timestamp.fromDate(cutoffDate);

    const collectionName = partnerId 
      ? `audit_logs_${partnerId}` 
      : 'audit_logs';

    // Query for old logs
    const q = query(
      collection(db, collectionName),
      where('generated_at', '<', cutoffTimestamp),
      orderBy('generated_at', 'asc')
    );

    const querySnapshot = await getDocs(q);
    let deletedCount = 0;

    // Delete old logs (in production, use batch delete for efficiency)
    // Note: Firestore doesn't support batch delete directly, so we'd need
    // to use admin SDK or Cloud Functions for efficient deletion
    // For MVaP, we'll just log the count
    querySnapshot.forEach(() => {
      deletedCount++;
    });

    console.log(`[Audit Log] Would delete ${deletedCount} logs older than ${retentionDays} days`);
    
    // In production, implement actual deletion using Firestore Admin SDK
    // or Cloud Functions scheduled job
    
    return deletedCount;
  } catch (error) {
    console.error('[Audit Log] Error cleaning up old logs:', error);
    throw error;
  }
}

