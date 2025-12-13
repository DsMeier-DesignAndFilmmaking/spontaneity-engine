# Error Handling & Fallback Implementation

## Overview

The Spontaneity Engine now includes comprehensive error handling that ensures the UI never breaks, even when API calls fail. All errors are logged for debugging while providing a smooth user experience.

## Key Features

### 1. **Never-Throwing API Function**

The `fetchSpontaneousRecommendation()` function **never throws errors**. Instead, it:
- Returns a placeholder recommendation on any failure
- Logs detailed error information to the console
- Preserves user context in the placeholder

### 2. **Placeholder Recommendations**

When the API fails, users see a contextually relevant placeholder that:
- Uses their input (vibe, time, location)
- Maintains the same data structure as real recommendations
- Is clearly marked with `_isPlaceholder: true` flag
- Includes all required fields (title, description, duration, vibe tags)

### 3. **Error Logging**

All errors are logged to the console with:
- Error type and message
- HTTP status codes (if applicable)
- User context (location, time, vibe)
- Endpoint information
- Full error stack traces

**Example log:**
```javascript
[Spontaneity API] Request failed: {
  status: 500,
  statusText: "Internal Server Error",
  error: "OpenAI API error: Rate limit exceeded",
  endpoint: "/api/demo/spontaneity",
  userContext: {
    location: "Washington DC",
    time: "2 hours",
    vibe: "creative, outdoor, low budget"
  }
}
```

### 4. **Try Again Button**

When an error occurs:
- Error message is displayed to the user
- "Try Again" button appears in the error box
- Button triggers a new API call with the same inputs
- Loading state prevents multiple simultaneous requests

### 5. **Reduced Token Usage**

For MVaP speed and cost efficiency:
- Default `maxTokens` reduced from 800 to **300**
- Faster response times
- Lower API costs
- Still sufficient for quality recommendations

## Error Flow

```
User clicks "Generate & Test"
    ↓
API call initiated
    ↓
┌─────────────────────────┐
│   API Success?          │
└─────────────────────────┘
    │              │
   YES            NO
    │              │
    ↓              ↓
Display Result   Log Error
                 Generate Placeholder
                 Show Error Message
                 Display Placeholder
                 Show "Try Again" Button
```

## Implementation Details

### API Function (`src/lib/api/spontaneity.ts`)

```typescript
// Function signature - never throws
export async function fetchSpontaneousRecommendation(
  userContext: UserContext,
  config: RecommendationConfig = {},
  useDemoEndpoint: boolean = true
): Promise<RecommendationResult> {
  try {
    // API call logic...
  } catch (error) {
    // Log error
    console.error('[Spontaneity API] Unexpected error:', {...});
    
    // Return placeholder instead of throwing
    return generatePlaceholderRecommendation(userContext);
  }
}
```

### Placeholder Generator

```typescript
function generatePlaceholderRecommendation(userContext: UserContext): RecommendationResult {
  // Uses user's input to create contextually relevant placeholder
  // Includes all required fields
  // Marked with _isPlaceholder flag
}
```

### Widget Error Handling (`src/components/demo/FreeDemoWidget.tsx`)

```typescript
const recommendationResult = await fetchSpontaneousRecommendation(...);

// Check if placeholder
if (recommendationResult._isPlaceholder) {
  setError('Unable to connect to AI service. Showing placeholder. Please try again.');
}

// Always display result (real or placeholder)
setResult(JSON.stringify(recommendationResult, null, 2));
```

## Error Types Handled

1. **Network Errors**
   - Connection failures
   - Timeouts
   - DNS resolution failures

2. **API Errors**
   - HTTP 4xx/5xx responses
   - Invalid JSON responses
   - Missing required fields

3. **OpenAI API Errors**
   - Rate limit exceeded (429)
   - Invalid API key (401)
   - Service unavailable (503)
   - Token limit exceeded

4. **Parsing Errors**
   - Invalid JSON in response
   - Missing expected fields
   - Type mismatches

## User Experience

### On Success
- Recommendation displays immediately
- No error messages
- Full recommendation data available

### On Failure
- Error message: "Unable to connect to AI service. Showing a placeholder recommendation. Please try again."
- Placeholder recommendation still displays
- "Try Again" button available
- User can retry without losing their inputs

### Error Message Display
- Non-blocking (doesn't prevent result display)
- Clear and actionable
- Includes retry option
- Dismisses on successful retry

## Rate Limiting Considerations

The free OpenAI plan has rate limits. The system handles this by:

1. **Reduced Token Usage**
   - Default 300 tokens (down from 800)
   - Faster responses
   - Lower cost per request

2. **User-Triggered Only**
   - Requests only on button click
   - No automatic/background requests
   - Prevents accidental rate limit hits

3. **Graceful Degradation**
   - Placeholder shown on rate limit
   - User can retry later
   - No broken UI state

## Testing Error Scenarios

### Simulate Network Error
```javascript
// In browser console
window.fetch = () => Promise.reject(new Error('Network error'));
```

### Simulate API Error
```javascript
// In browser console
window.fetch = () => Promise.resolve({
  ok: false,
  status: 500,
  statusText: 'Internal Server Error',
  json: () => Promise.resolve({ error: 'Test error' })
});
```

### Simulate Rate Limit
```javascript
// In browser console
window.fetch = () => Promise.resolve({
  ok: false,
  status: 429,
  statusText: 'Too Many Requests',
  json: () => Promise.resolve({ error: 'Rate limit exceeded' })
});
```

## Console Logging

All errors are logged with the prefix `[Spontaneity API]` for easy filtering:

```javascript
// Filter console logs
console.log = (function(originalLog) {
  return function(...args) {
    if (args[0]?.includes?.('[Spontaneity API]')) {
      originalLog.apply(console, args);
    }
  };
})(console.log);
```

## Best Practices

1. **Never Break UI** - Always return a result, even if it's a placeholder
2. **Log Everything** - Detailed logs help debugging without exposing to users
3. **User-Friendly Messages** - Clear, actionable error messages
4. **Retry Mechanism** - Easy way for users to try again
5. **Preserve Context** - Placeholders use user's actual inputs

## Future Enhancements

- Exponential backoff for retries
- Rate limit detection and automatic retry
- Error analytics tracking
- User feedback on placeholder quality
- Offline mode with cached recommendations

