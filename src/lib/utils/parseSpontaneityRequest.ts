/**
 * parseSpontaneityRequest.ts
 * Parses natural language input to extract vibe, duration, and location.
 * 
 * Used by SmartInput component to programmatically update hidden legacy components.
 */

export interface ParsedSpontaneityRequest {
  vibe: string;
  duration: string;
  location: string;
}

/**
 * Parses natural language input to extract structured parameters.
 * 
 * @param input - Natural language input from user (e.g., "Something chill for an hour in Denver")
 * @returns Parsed parameters with vibe, duration, and location
 */
export function parseSpontaneityRequest(input: string): ParsedSpontaneityRequest {
  const normalizedInput = input.trim().toLowerCase();
  
  // Initialize result
  const result: ParsedSpontaneityRequest = {
    vibe: '',
    duration: '',
    location: '',
  };

  // Common vibe keywords
  const vibePatterns = [
    { pattern: /\b(adventurous|adventure|explore|exploring)\b/i, value: 'Adventurous' },
    { pattern: /\b(relaxed|relax|chill|chilling|peaceful|calm)\b/i, value: 'Relaxed' },
    { pattern: /\b(creative|art|artistic|craft|making)\b/i, value: 'Creative' },
    { pattern: /\b(social|group|friends|people|together)\b/i, value: 'Social' },
    { pattern: /\b(active|exercise|fitness|sport|sports|outdoor|outdoors)\b/i, value: 'Active' },
    { pattern: /\b(foodie|food|eat|eating|dining|restaurant|cafe)\b/i, value: 'Foodie' },
    { pattern: /\b(cultural|culture|museum|gallery|history|historical)\b/i, value: 'Cultural' },
    { pattern: /\b(nightlife|night|bar|drinks|drinking|party)\b/i, value: 'Nightlife' },
  ];

  // Duration patterns
  const durationPatterns = [
    { pattern: /\b(30\s*min|thirty\s*min|half\s*an?\s*hour)\b/i, value: '30 min' },
    { pattern: /\b(1\s*hour?|one\s*hour?|an?\s*hour)\b/i, value: '1 hour' },
    { pattern: /\b(2\s*hours?|two\s*hours?)\b/i, value: '2 hours' },
    { pattern: /\b(3\s*hours?|three\s*hours?)\b/i, value: '3 hours' },
    { pattern: /\b(half\s*day|4\s*hours?|four\s*hours?)\b/i, value: 'Half day' },
    { pattern: /\b(full\s*day|all\s*day|8\s*hours?|eight\s*hours?)\b/i, value: 'Full day' },
    { pattern: /\b(quick|fast|short|brief)\b/i, value: '30 min' },
    { pattern: /\b(afternoon|evening|morning)\b/i, value: '2 hours' },
  ];

  // Extract vibe
  for (const { pattern, value } of vibePatterns) {
    if (pattern.test(normalizedInput)) {
      result.vibe = value;
      break;
    }
  }

  // Extract duration
  for (const { pattern, value } of durationPatterns) {
    if (pattern.test(normalizedInput)) {
      result.duration = value;
      break;
    }
  }

  // Extract location - look for "in [location]", "at [location]", or location names
  // First try: "in/at/near [location]" pattern
  const locationPrepositionMatch = input.match(/\b(?:in|at|near|around)\s+([A-Z][a-zA-Z\s]+?)(?:\s|$|,|\.)/);
  if (locationPrepositionMatch && locationPrepositionMatch[1]) {
    const location = locationPrepositionMatch[1].trim();
    // Filter out common false positives
    if (!['Something', 'Tell', 'Me', 'What', 'Feel', 'Like', 'Doing', 'Example'].includes(location)) {
      result.location = location;
    }
  }

  // Second try: Look for capitalized words (likely city names) at the end
  if (!result.location) {
    const capitalizedWords = input.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g);
    if (capitalizedWords && capitalizedWords.length > 0) {
      // Use the last capitalized word/phrase (likely the location)
      const lastCapitalized = capitalizedWords[capitalizedWords.length - 1];
      if (lastCapitalized.length > 2 && !['Something', 'Tell', 'Me', 'What', 'Feel', 'Like', 'Doing'].includes(lastCapitalized)) {
        result.location = lastCapitalized;
      }
    }
  }

  return result;
}

