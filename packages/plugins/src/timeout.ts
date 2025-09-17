/**
 * Timeout plugin for Advanced Client Fetch
 */

import type { Middleware } from '@advanced-client-fetch/core';

export interface TimeoutPluginOptions {
  /** Timeout duration in milliseconds */
  timeout?: number;
  /** Enable timeout plugin */
  enabled?: boolean;
  /** Custom timeout message */
  message?: string;
}

/**
 * Create timeout middleware
 */
export function timeout(options: TimeoutPluginOptions = {}): Middleware {
  const { timeout: timeoutMs = 30000, enabled = true, message: _message } = options as any;
  
  if (!enabled || timeoutMs <= 0) {
    return async (_ctx: any, next: any) => next();
  }

  return async (ctx: any, next: any) => {
    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Request timeout after ${timeoutMs}ms`));
      }, timeoutMs);
      
      // Clean up timer if request completes
      ctx.signal?.addEventListener('abort', () => {
        clearTimeout(timer);
      });
    });
    
    // Race between request and timeout
    try {
      await Promise.race([
        next(),
        timeoutPromise
      ]);
    } catch (error) {
      if (error.message.includes('timeout')) {
        throw new Error(`Request timeout after ${timeoutMs}ms`);
      }
      throw error;
    }
  };
}