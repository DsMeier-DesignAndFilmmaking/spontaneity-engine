# Testing Guide for fetchSpontaneousRecommendation()

## Quick Test

### Option 1: Test Page (Recommended)

Navigate to: **`/test-spontaneity`**

This provides a full UI for testing with:
- Input fields for location, time, and vibes
- Real-time validation
- Response display with field checks
- Full JSON view

### Option 2: Browser Console

Open browser DevTools console and run:

```javascript
// Import the test function (if available)
// Or use the test page's built-in test

// Direct API call example
import { fetchSpontaneousRecommendation } from '@/lib/api/spontaneity';

const result = await fetchSpontaneousRecommendation({
  location: "Washington DC",
  timeAvailable: "2 hours",
  vibes: ["creative", "outdoor", "low budget"]
});

console.log(result);
```

### Option 3: Test Script

Run the test file:

```bash
# If using Jest
npm test -- spontaneity.test.ts

# Or use the test page at /test-spontaneity
```

## Test Input Format

The function supports multiple input formats:

### Format 1: Standard
```typescript
{
  vibe: "creative, outdoor, low budget",
  time: "2 hours",
  location: "Washington DC"
}
```

### Format 2: Alternative (as specified)
```typescript
{
  location: "Washington DC",
  timeAvailable: "2 hours",
  vibes: ["creative", "outdoor", "low budget"]
}
```

Both formats work! The function automatically normalizes the input.

## Expected Response Structure

A valid response should include:

✅ **Title** - Short, engaging title  
✅ **Description** - Detailed description  
✅ **Recommendation** - Main recommendation text  
✅ **Duration** - Time estimate  
✅ **Vibe Tags** - In `vibe` field or `activities[].type`  
✅ **Location** - Location context  
✅ **Trust Metadata** - Trust badge and signals  

## Verification Checklist

When testing, verify:

- [ ] API returns valid recommendation (no errors)
- [ ] Response includes `title` or `recommendation` field
- [ ] Response includes `description` field
- [ ] Response includes `duration` field
- [ ] Response includes vibe tags (in `vibe` field or activities)
- [ ] Works in browser (desktop)
- [ ] Works in mobile widget (responsive)

## Sample Test Input

```typescript
const testInput = {
  location: "Washington DC",
  timeAvailable: "2 hours",
  vibes: ["creative", "outdoor", "low budget"]
};

const result = await fetchSpontaneousRecommendation(testInput);
```

## Troubleshooting

### "API request failed"
- Check that your dev server is running
- Verify `/api/demo/spontaneity` endpoint is accessible
- Check browser console for detailed error messages

### "Missing fields in response"
- The API may return different fields based on AI response
- Check the full JSON response for all available fields
- Some fields are optional (duration, cost, etc.)

### "Network error"
- Ensure OpenAI API key is configured in `.env.local`
- Check server logs for API errors
- Verify internet connection

## Mobile Testing

To test on mobile:

1. Use browser DevTools device emulation
2. Or access `/test-spontaneity` on a mobile device
3. Or test the main demo widget at `/demo`

The function works identically on mobile and desktop since it's a client-side API call.

