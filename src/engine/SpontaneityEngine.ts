/**
 * SpontaneityEngine.ts
 * Main engine orchestrator for the Spontaneity Core AI system.
 * Manages multiple model adapters and handles fallback logic.
 */

import { IModelAdapter, RecommendationConfig } from './ModelAdapter';

/**
 * Configuration options for the SpontaneityEngine
 */
export interface EngineConfig {
  defaultConfig?: RecommendationConfig;
  enableFallback?: boolean;
  timeoutMs?: number;
}

/**
 * Result of engine execution
 */
export interface EngineResult {
  success: boolean;
  result?: string;
  adapterUsed?: string;
  error?: string;
}

/**
 * SpontaneityEngine - Main orchestrator for AI-powered spontaneity recommendations.
 * 
 * This engine manages multiple model adapters and provides a unified interface
 * for generating spontaneous activity recommendations. It handles adapter selection,
 * error handling, and fallback logic.
 */
export class SpontaneityEngine {
  private adapters: IModelAdapter[];
  private config: EngineConfig;
  private adapterNames: Map<IModelAdapter, string>;

  /**
   * Creates a new SpontaneityEngine instance.
   * 
   * @param adapters - Array of model adapters to use (order determines priority)
   * @param config - Optional configuration for the engine
   */
  constructor(
    adapters: IModelAdapter[],
    config: EngineConfig = {}
  ) {
    if (!adapters || adapters.length === 0) {
      throw new Error('SpontaneityEngine requires at least one adapter');
    }

    this.adapters = adapters;
    this.config = {
      enableFallback: true,
      timeoutMs: 30000, // 30 second default timeout
      ...config
    };
    
    // Track adapter names for logging/debugging
    this.adapterNames = new Map();
    adapters.forEach((adapter, index) => {
      this.adapterNames.set(adapter, adapter.constructor.name || `Adapter${index + 1}`);
    });
  }

  /**
   * Executes the main spontaneity engine logic.
   * 
   * Processes user input, selects an adapter, generates recommendations,
   * and handles errors with fallback logic if enabled.
   * 
   * @param userInput - The user's input/request for spontaneous activities
   * @returns Promise resolving to a JSON string with recommendations
   * @throws Error if all adapters fail and fallback is disabled
   */
  async runEngine(userInput: string): Promise<string> {
    if (!userInput || userInput.trim().length === 0) {
      throw new Error('User input cannot be empty');
    }

    const prompt = this.buildPrompt(userInput);
    const config = this.config.defaultConfig || {};

    // Try each adapter in order until one succeeds
    for (let i = 0; i < this.adapters.length; i++) {
      const adapter = this.adapters[i];
      const adapterName = this.adapterNames.get(adapter) || 'Unknown';

      try {
        // Execute with timeout if configured
        const result = await this.executeWithTimeout(
          () => adapter.generateRecommendation(prompt, config),
          this.config.timeoutMs || 30000
        );

        // Success - return the result
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.warn(`Adapter ${adapterName} failed: ${errorMessage}`);

        // If this is the last adapter and fallback is disabled, throw
        if (i === this.adapters.length - 1 && !this.config.enableFallback) {
          throw new Error(`All adapters failed. Last error: ${errorMessage}`);
        }

        // Continue to next adapter if fallback is enabled
        if (i < this.adapters.length - 1) {
          console.log(`Falling back to next adapter...`);
          continue;
        }

        // Last adapter with fallback enabled - throw with all errors
        throw new Error(`All adapters exhausted. Last error: ${errorMessage}`);
      }
    }

    // This should never be reached, but TypeScript requires it
    throw new Error('Unexpected error in engine execution');
  }

  /**
   * Builds the prompt for the AI model based on user input.
   * 
   * @param userInput - Raw user input
   * @returns Formatted prompt string
   */
  private buildPrompt(userInput: string): string {
    return `Generate spontaneous activity recommendations based on the following user request:

User Request: "${userInput}"

Please provide creative, personalized activity suggestions that match the user's intent.
Consider factors like:
- Current time and context
- User preferences (if available)
- Weather and location context
- Activity duration and intensity
- Novelty and spontaneity

Return a JSON response with recommended activities and reasoning.`;
  }

  /**
   * Executes a promise with a timeout.
   * 
   * @param fn - Function that returns a promise
   * @param timeoutMs - Timeout in milliseconds
   * @returns Promise that resolves or rejects based on timeout
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Operation timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      })
    ]);
  }

  /**
   * Gets the number of available adapters.
   * 
   * @returns Number of adapters registered with the engine
   */
  getAdapterCount(): number {
    return this.adapters.length;
  }

  /**
   * Gets the names of all registered adapters.
   * 
   * @returns Array of adapter names
   */
  getAdapterNames(): string[] {
    return Array.from(this.adapterNames.values());
  }
}

