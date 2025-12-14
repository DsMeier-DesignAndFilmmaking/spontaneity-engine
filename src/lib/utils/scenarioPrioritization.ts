/**
 * scenarioPrioritization.ts
 * Utility functions for context-aware scenario prioritization and active state detection.
 */

export type MotivationCategory = 'RechargeAndUnwind' | 'ConnectAndSocialize' | 'DiscoverAndCreate';

export interface UserHistory {
  recentScenarios?: string[];
  preferredCategories?: MotivationCategory[];
  lastActivityTime?: Date;
  moodHistory?: string[];
}

export interface ScenarioPreset {
  id: string;
  name: string;
  motivation_category: MotivationCategory;
  parameters: {
    vibe?: string;
    time?: string;
    location?: string;
    budget?: 'low' | 'medium' | 'high';
    outdoor?: boolean;
    groupActivity?: boolean;
    creative?: boolean;
    relaxing?: boolean;
  };
}

/**
 * Prioritizes scenario categories based on real-time context.
 * 
 * Logic:
 * - Friday/Saturday evening or Public Holiday → Prioritize ConnectAndSocialize
 * - Sunday morning or UserHistory is Relaxed → Prioritize RechargeAndUnwind
 * - Default → Recharge → Connect → Discover
 */
export function prioritizeScenariosByContext(
  userHistory?: UserHistory,
  currentTime?: Date,
  location?: string
): MotivationCategory[] {
  const now = currentTime || new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 5 = Friday, 6 = Saturday
  const hour = now.getHours();

  // Check if it's Friday/Saturday evening (5 PM - 11 PM)
  const isWeekendEvening = (dayOfWeek === 5 || dayOfWeek === 6) && hour >= 17 && hour < 23;

  // Check if it's a public holiday (simplified - could be enhanced with actual holiday calendar)
  // For now, we'll check if it's a common holiday period (e.g., Dec 24-26, Jan 1, July 4)
  const month = now.getMonth();
  const date = now.getDate();
  const isPublicHoliday = 
    (month === 11 && (date === 24 || date === 25 || date === 26)) || // Dec 24-26
    (month === 0 && date === 1) || // Jan 1
    (month === 6 && date === 4); // July 4

  // Check if it's Sunday morning (6 AM - 12 PM)
  const isSundayMorning = dayOfWeek === 0 && hour >= 6 && hour < 12;

  // Check user history for relaxed mood
  const hasRelaxedHistory = userHistory?.moodHistory?.some(mood => 
    mood.toLowerCase().includes('relaxed') || mood.toLowerCase().includes('relax')
  ) || false;

  // Priority logic
  if (isWeekendEvening || isPublicHoliday) {
    // Prioritize ConnectAndSocialize
    return ['ConnectAndSocialize', 'RechargeAndUnwind', 'DiscoverAndCreate'];
  } else if (isSundayMorning || hasRelaxedHistory) {
    // Prioritize RechargeAndUnwind
    return ['RechargeAndUnwind', 'ConnectAndSocialize', 'DiscoverAndCreate'];
  } else {
    // Default order
    return ['RechargeAndUnwind', 'ConnectAndSocialize', 'DiscoverAndCreate'];
  }
}

/**
 * Checks if the current filter state matches a preset's parameters.
 * Performs a deep, non-order-dependent comparison.
 */
export function checkForActiveScenario(
  currentState: {
    vibe?: string;
    time?: string;
    location?: string;
    budget?: 'low' | 'medium' | 'high' | '';
    outdoor?: boolean;
    groupActivity?: boolean;
    creative?: boolean;
    relaxing?: boolean;
  },
  preset: ScenarioPreset
): boolean {
  const params = preset.parameters;

  // Normalize vibe strings for comparison (case-insensitive, order-independent)
  const normalizeVibes = (vibeStr: string | undefined): string[] => {
    if (!vibeStr) return [];
    return vibeStr
      .split(',')
      .map(v => v.trim().toLowerCase())
      .filter(v => v.length > 0)
      .sort();
  };

  const currentVibes = normalizeVibes(currentState.vibe);
  const presetVibes = normalizeVibes(params.vibe);

  // Compare vibes (order-independent)
  const vibesMatch = 
    currentVibes.length === presetVibes.length &&
    currentVibes.every(v => presetVibes.includes(v));

  // Compare time (exact match)
  const timeMatch = (!currentState.time && !params.time) || 
                    (currentState.time === params.time);

  // Compare location (case-insensitive)
  const locationMatch = 
    (!currentState.location && !params.location) ||
    (currentState.location?.toLowerCase().trim() === params.location?.toLowerCase().trim());

  // Compare budget
  const budgetMatch = 
    (!currentState.budget && !params.budget) ||
    (currentState.budget === params.budget);

  // Compare boolean flags
  const outdoorMatch = (currentState.outdoor ?? false) === (params.outdoor ?? false);
  const groupActivityMatch = (currentState.groupActivity ?? false) === (params.groupActivity ?? false);
  const creativeMatch = (currentState.creative ?? false) === (params.creative ?? false);
  const relaxingMatch = (currentState.relaxing ?? false) === (params.relaxing ?? false);

  // All parameters must match
  return (
    vibesMatch &&
    timeMatch &&
    locationMatch &&
    budgetMatch &&
    outdoorMatch &&
    groupActivityMatch &&
    creativeMatch &&
    relaxingMatch
  );
}

