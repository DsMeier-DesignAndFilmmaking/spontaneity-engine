/**
 * spontaneity.test.ts
 * Test suite for fetchSpontaneousRecommendation function
 * 
 * Run with: npm test or jest
 */

import { fetchSpontaneousRecommendation, validateUserContext } from '../spontaneity';
import type { UserContext } from '../spontaneity';

/**
 * Test helper to check if recommendation has required fields
 */
function validateRecommendationResult(result: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!result) {
    errors.push('Result is null or undefined');
    return { isValid: false, errors };
  }
  
  // Check for title or recommendation (at least one should exist)
  if (!result.title && !result.recommendation) {
    errors.push('Missing title or recommendation field');
  }
  
  // Check for description (recommended but not required)
  // Duration and vibe tags are optional but should be checked if present
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Test function - can be called from browser console or test runner
 */
export async function testFetchSpontaneousRecommendation() {
  console.log('🧪 Testing fetchSpontaneousRecommendation()...\n');
  
  // Test input matching user's format
  const testInput = {
    location: 'Washington DC',
    timeAvailable: '2 hours', // Note: our function expects 'time', we'll map this
    vibes: ['creative', 'outdoor', 'low budget'], // Note: our function expects 'vibe' as string
  };
  
  // Map to our function's expected format
  const userContext: UserContext = {
    location: testInput.location,
    time: testInput.timeAvailable,
    vibe: testInput.vibes.join(', '), // Convert array to comma-separated string
  };
  
  console.log('📥 Input:', JSON.stringify(testInput, null, 2));
  console.log('📤 Mapped Context:', JSON.stringify(userContext, null, 2));
  console.log('\n⏳ Calling API...\n');
  
  try {
    const result = await fetchSpontaneousRecommendation(
      userContext,
      {
        temperature: 0.7,
        maxTokens: 800,
      },
      true // Use demo endpoint
    );
    
    console.log('✅ API Response Received!\n');
    console.log('📋 Result:', JSON.stringify(result, null, 2));
    
    // Validate result
    const validation = validateRecommendationResult(result);
    
    if (validation.isValid) {
      console.log('\n✅ Validation: PASSED');
    } else {
      console.log('\n❌ Validation: FAILED');
      console.log('Errors:', validation.errors);
    }
    
    // Check for specific fields
    console.log('\n📊 Field Check:');
    console.log(`  Title: ${result.title ? '✅ Present' : '⚠️  Missing'}`);
    console.log(`  Description: ${result.description ? '✅ Present' : '⚠️  Missing'}`);
    console.log(`  Recommendation: ${result.recommendation ? '✅ Present' : '⚠️  Missing'}`);
    console.log(`  Duration: ${result.duration ? '✅ Present' : '⚠️  Missing'}`);
    console.log(`  Vibe: ${result.vibe ? '✅ Present' : '⚠️  Missing'}`);
    console.log(`  Location: ${result.location ? '✅ Present' : '⚠️  Missing'}`);
    console.log(`  Trust Metadata: ${result.trust ? '✅ Present' : '⚠️  Missing'}`);
    
    // Check if vibe tags are present (could be in vibe field or activities)
    const hasVibeTags = result.vibe || 
                       result.activities?.some((a: any) => a.type) ||
                       false;
    console.log(`  Vibe Tags: ${hasVibeTags ? '✅ Present' : '⚠️  Missing'}`);
    
    return {
      success: true,
      result,
      validation,
    };
    
  } catch (error) {
    console.error('\n❌ Test Failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Browser console test function
 * Can be called from browser DevTools console
 */
if (typeof window !== 'undefined') {
  (window as any).testSpontaneityAPI = testFetchSpontaneousRecommendation;
  console.log('💡 Test function available: Call testSpontaneityAPI() in console');
}

