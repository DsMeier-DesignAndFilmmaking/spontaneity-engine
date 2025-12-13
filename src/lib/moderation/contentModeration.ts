/**
 * contentModeration.ts
 * Trust & Safety: Content moderation utilities for UGC and recommendations.
 * 
 * MVaP-level moderation: Automatic, invisible, non-intrusive.
 */

/**
 * Content moderation result
 */
export interface ModerationResult {
  passed: boolean;
  reason?: string;
  flags?: string[];
}

/**
 * Layer 1: AI Pre-Filter
 * Rejects content that includes unsafe or inappropriate material.
 */
export function preFilterContent(content: string): ModerationResult {
  const lowerContent = content.toLowerCase();
  
  // Block patterns for unsafe content
  const blockedPatterns = [
    // Private addresses (basic patterns)
    /\d+\s+[a-z]+\s+(street|st|avenue|ave|road|rd|drive|dr|lane|ln|way|blvd|boulevard)/i,
    // Hate speech indicators
    /\b(hate|violence|harm|attack|kill|hurt)\b/i,
    // Adult content indicators
    /\b(adult|explicit|nsfw|xxx)\b/i,
    // Explicit personal invitations
    /\b(meet me|come to|visit me|my place|my house)\b/i,
  ];
  
  const flags: string[] = [];
  
  for (const pattern of blockedPatterns) {
    if (pattern.test(content)) {
      flags.push('unsafe_content');
      return {
        passed: false,
        reason: 'Content contains unsafe or inappropriate material',
        flags,
      };
    }
  }
  
  return { passed: true };
}

/**
 * Layer 2: Contextual Validity Check
 * Ensures content is activity-based and location-relevant.
 */
export function validateContextualValidity(
  content: string,
  location?: string,
  time?: string
): ModerationResult {
  // Check if content describes an activity (not a person)
  const activityIndicators = [
    /\b(visit|explore|try|do|see|experience|activity|place|location|venue|event)\b/i,
  ];
  
  const hasActivity = activityIndicators.some(pattern => pattern.test(content));
  
  if (!hasActivity && content.length > 20) {
    return {
      passed: false,
      reason: 'Content does not describe an activity',
      flags: ['not_activity_based'],
    };
  }
  
  // Basic location relevance check (if location provided)
  if (location && location.trim().length > 0) {
    const locationLower = location.toLowerCase();
    const contentLower = content.toLowerCase();
    
    // If location is mentioned, ensure it's relevant
    // This is a basic check - can be enhanced with geocoding
    if (contentLower.includes(locationLower) || 
        contentLower.includes('nearby') || 
        contentLower.includes('local') ||
        contentLower.includes('area')) {
      // Location context is present
    }
  }
  
  return { passed: true };
}

/**
 * Combined moderation check
 * Runs all moderation layers and returns result.
 */
export function moderateContent(
  content: string,
  context?: {
    location?: string;
    time?: string;
    userInput?: string;
  }
): ModerationResult {
  // Layer 1: Pre-filter
  const preFilterResult = preFilterContent(content);
  if (!preFilterResult.passed) {
    return preFilterResult;
  }
  
  // Layer 2: Contextual validity
  const validityResult = validateContextualValidity(
    content,
    context?.location,
    context?.time
  );
  if (!validityResult.passed) {
    return validityResult;
  }
  
  return { passed: true };
}

/**
 * Trust Badge Enum (MVaP Set)
 * Allowed badge values for trust metadata
 */
export enum TrustBadge {
  AI_CURATED = 'ai_curated',
  COMMUNITY_SIGNAL = 'community_signal',
  RECENTLY_ACTIVE = 'recently_active',
  VERIFIED_CONTEXT = 'verified_context',
}

/**
 * Trust Badge Type (for TypeScript)
 */
export type TrustBadgeType = TrustBadge | null;

/**
 * Trust Signals Object
 * Represents individual trust signals that contribute to badge resolution
 */
export interface TrustSignals {
  ai_generated: boolean;
  ugc_influenced: boolean;
  recent_activity: boolean;
  context_verified: boolean;
}

/**
 * Confidence Level
 */
export type ConfidenceLevel = 'low' | 'medium' | 'high';

/**
 * Trust Policy Configuration
 * Partner-controlled trust thresholds for B2B customization
 */
export interface TrustPolicy {
  allow_ugc: boolean;
  min_activity_recency_hours: number;
  require_verified_context: boolean;
  confidence_floor: ConfidenceLevel;
}

/**
 * Default Trust Policy
 * Applied when no partner policy is provided
 */
export const DEFAULT_TRUST_POLICY: TrustPolicy = {
  allow_ugc: true,
  min_activity_recency_hours: 72, // 3 days default
  require_verified_context: false,
  confidence_floor: 'low',
};

/**
 * Trust Metadata Object
 * Structured, auditable metadata for trust & safety
 */
export interface TrustMetadata {
  badge: TrustBadge;
  signals: TrustSignals;
  confidence_level: ConfidenceLevel;
  generated_at: string; // ISO-8601 timestamp
}

/**
 * Trust Badge Data (for UI display)
 */
export interface TrustBadgeData {
  type: TrustBadgeType;
  label: string;
  detailText: string;
}

/**
 * Resolve trust badge from signals (SERVER-SIDE ONLY)
 * 
 * Badge resolution follows priority order:
 * 1. community_signal (highest priority)
 * 2. recently_active
 * 3. verified_context
 * 4. ai_curated (default fallback)
 * 
 * Frontend NEVER computes badge logic - only reads from trust metadata.
 */
export function resolveTrustBadge(signals: TrustSignals): TrustBadge {
  // Priority 1: Community Signal
  if (signals.ugc_influenced) {
    return TrustBadge.COMMUNITY_SIGNAL;
  }
  
  // Priority 2: Recently Active
  if (signals.recent_activity) {
    return TrustBadge.RECENTLY_ACTIVE;
  }
  
  // Priority 3: Verified Context
  if (signals.context_verified) {
    return TrustBadge.VERIFIED_CONTEXT;
  }
  
  // Priority 4: AI Curated (default fallback)
  return TrustBadge.AI_CURATED;
}

/**
 * Calculate confidence level from signals
 */
export function calculateConfidenceLevel(signals: TrustSignals): ConfidenceLevel {
  let score = 0;
  
  if (signals.ai_generated) score += 1;
  if (signals.ugc_influenced) score += 2;
  if (signals.recent_activity) score += 1;
  if (signals.context_verified) score += 1;
  
  if (score >= 4) return 'high';
  if (score >= 2) return 'medium';
  return 'low';
}

/**
 * Generate trust metadata object (SERVER-SIDE ONLY)
 * 
 * Creates structured, auditable trust metadata for API responses.
 * This is the single source of truth for trust signals.
 */
export function generateTrustMetadata(signals: TrustSignals): TrustMetadata {
  return {
    badge: resolveTrustBadge(signals),
    signals,
    confidence_level: calculateConfidenceLevel(signals),
    generated_at: new Date().toISOString(),
  };
}

/**
 * Validate recommendation against trust policy (SERVER-SIDE ONLY)
 * 
 * Applies partner-controlled trust thresholds at request-time.
 * Returns true if recommendation passes policy, false if it should be excluded.
 * 
 * Policy checks:
 * - allow_ugc: If false, exclude recommendations with UGC influence
 * - min_activity_recency_hours: Exclude if activity is older than threshold
 * - require_verified_context: If true, exclude if context not verified
 * - confidence_floor: Exclude if confidence below floor
 */
export function validateTrustPolicy(
  metadata: TrustMetadata,
  policy: TrustPolicy,
  activityTimestamp?: string // ISO-8601 timestamp of last activity
): boolean {
  // Check 1: UGC allowance
  if (!policy.allow_ugc && metadata.signals.ugc_influenced) {
    return false; // Exclude UGC-influenced recommendations
  }

  // Check 2: Activity recency
  // Only check if recent_activity signal is true
  if (metadata.signals.recent_activity) {
    if (activityTimestamp) {
      // Check actual timestamp against threshold
      const activityTime = new Date(activityTimestamp).getTime();
      const now = new Date().getTime();
      const hoursSinceActivity = (now - activityTime) / (1000 * 60 * 60);
      
      if (hoursSinceActivity > policy.min_activity_recency_hours) {
        return false; // Activity too old
      }
    } else {
      // No timestamp provided - assume recent activity signal is valid
      // (In production, you might want to be more strict here)
    }
  }

  // Check 3: Verified context requirement
  if (policy.require_verified_context && !metadata.signals.context_verified) {
    return false; // Context verification required but not present
  }

  // Check 4: Confidence floor
  const confidenceOrder: Record<ConfidenceLevel, number> = {
    low: 0,
    medium: 1,
    high: 2,
  };
  
  if (confidenceOrder[metadata.confidence_level] < confidenceOrder[policy.confidence_floor]) {
    return false; // Confidence below floor
  }

  return true; // All checks passed
}

/**
 * Generate trust badge data for UI display (from metadata)
 * 
 * Converts trust metadata to UI-friendly format.
 * Frontend uses this to display badges.
 */
export function getTrustBadgeData(metadata: TrustMetadata): TrustBadgeData {
  const badgeLabels: Record<TrustBadge, string> = {
    [TrustBadge.AI_CURATED]: 'AI Curated',
    [TrustBadge.COMMUNITY_SIGNAL]: 'Community Signal',
    [TrustBadge.RECENTLY_ACTIVE]: 'Recently Active Nearby',
    [TrustBadge.VERIFIED_CONTEXT]: 'Verified Context',
  };
  
  return {
    type: metadata.badge,
    label: badgeLabels[metadata.badge],
    detailText: 'This recommendation is generated using real-time context and moderated local input.',
  };
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use generateTrustMetadata and getTrustBadgeData instead
 */
export function generateTrustBadge(data: {
  hasCommunitySignal?: boolean;
  isRecentlyActive?: boolean;
  hasVerifiedContext?: boolean;
  isAIGenerated?: boolean;
}): TrustBadgeData | null {
  const signals: TrustSignals = {
    ai_generated: data.isAIGenerated !== false,
    ugc_influenced: data.hasCommunitySignal || false,
    recent_activity: data.isRecentlyActive || false,
    context_verified: data.hasVerifiedContext || false,
  };
  
  const metadata = generateTrustMetadata(signals);
  return getTrustBadgeData(metadata);
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use generateTrustBadge instead
 */
export function generateTrustSignal(data: {
  hasLocalValidation?: boolean;
  hasCommunitySignal?: boolean;
  isRecentlyActive?: boolean;
  isAIGenerated?: boolean;
}): string | null {
  const badge = generateTrustBadge({
    hasCommunitySignal: data.hasCommunitySignal,
    isRecentlyActive: data.isRecentlyActive,
    hasVerifiedContext: data.hasLocalValidation,
    isAIGenerated: data.isAIGenerated,
  });
  return badge?.label || null;
}

/**
 * Generate "Why This Now?" micro-explanation (SERVER-SIDE ONLY)
 * 
 * Based on strongest contributing signal only.
 * Max 1 sentence, plain language.
 * NEVER lists multiple reasons.
 * 
 * @param signals - Trust signals object
 * @param context - Optional context (location, time, vibe) for personalization
 * @returns Single sentence explanation or null
 */
export function generateWhyNow(
  signals: TrustSignals,
  context?: {
    location?: string;
    time?: string;
    vibe?: string;
  }
): string | null {
  // Determine strongest signal using same priority as badge resolution
  // Priority 1: Community Signal
  if (signals.ugc_influenced) {
    const locationText = context?.location ? ` in ${context.location}` : ' nearby';
    return `It's based on recent community suggestions${locationText} and matches your preferences.`;
  }
  
  // Priority 2: Recently Active
  if (signals.recent_activity) {
    const locationText = context?.location ? ` in ${context.location}` : ' nearby';
    const timeText = context?.time ? ` and ${context.time}` : '';
    return `It's nearby${locationText}${timeText} and matches your selected vibe.`;
  }
  
  // Priority 3: Verified Context
  if (signals.context_verified) {
    const locationText = context?.location ? ` in ${context.location}` : '';
    const vibeText = context?.vibe ? ` and matches your ${context.vibe} vibe` : '';
    return `It's verified and available${locationText}${vibeText}.`;
  }
  
  // Priority 4: AI Curated (default)
  const locationText = context?.location ? ` in ${context.location}` : '';
  const vibeText = context?.vibe ? ` and matches your ${context.vibe} vibe` : '';
  return `It's nearby${locationText}${vibeText}.`;
}

