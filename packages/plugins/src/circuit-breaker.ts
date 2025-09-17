/**
 * Circuit breaker plugin for Advanced Client Fetch
 */

import type { Middleware, Request } from '@advanced-client-fetch/core';
import { CircuitBreakerError } from '@advanced-client-fetch/core';
import { defaultKeyGenerator } from '@advanced-client-fetch/core';

export interface CircuitBreakerPluginOptions {
  /** Number of failures before opening circuit */
  failureThreshold: number;
  /** Time window for failure counting in milliseconds */
  window: number;
  /** Time to wait before attempting reset in milliseconds */
  resetTimeout: number;
  /** Key generator for circuit breaking */
  keyGenerator?: (req: Request) => string;
  /** Callback when circuit state changes */
  onStateChange?: (key: string, state: CircuitBreakerState, failures: number) => void;
  /** Enable circuit breaker */
  enabled?: boolean;
}

export type CircuitBreakerState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerStorage {
  get(key: string): Promise<CircuitBreakerInfo | undefined>;
  set(key: string, info: CircuitBreakerInfo): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

export interface CircuitBreakerInfo {
  state: CircuitBreakerState;
  failures: number;
  lastFailureTime?: number;
  nextAttemptTime?: number;
  successCount: number;
}

/**
 * In-memory circuit breaker storage
 */
export class MemoryCircuitBreakerStorage implements CircuitBreakerStorage {
  private storage = new Map<string, CircuitBreakerInfo>();

  async get(key: string): Promise<CircuitBreakerInfo | undefined> {
    return this.storage.get(key);
  }

  async set(key: string, info: CircuitBreakerInfo): Promise<void> {
    this.storage.set(key, info);
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async clear(): Promise<void> {
    this.storage.clear();
  }
}

/**
 * Create circuit breaker middleware
 */
export function circuitBreaker(options: CircuitBreakerPluginOptions): Middleware {
  const {
    failureThreshold,
    window,
    resetTimeout,
    keyGenerator = defaultKeyGenerator,
    onStateChange,
    enabled = true,
  } = options as any;

  if (!enabled) {
    return async (ctx: any, next: any) => next();
  }

  const storage = new MemoryCircuitBreakerStorage();

  return async (ctx: any, next: any) => {
    const key = keyGenerator(ctx.req);
    const now = Date.now();

    // Get current circuit breaker info
    let info = await storage.get(key);
    if (!info) {
      info = {
        state: 'closed',
        failures: 0,
        successCount: 0,
      };
    }

    // Check if circuit is open
    if (info.state === 'open') {
      if (info.nextAttemptTime && now < info.nextAttemptTime) {
        throw new CircuitBreakerError(
          `Circuit breaker is open for ${key}`,
          'open',
          info.failures,
          info.nextAttemptTime
        );
      } else {
        // Move to half-open state
        info.state = 'half-open';
        info.successCount = 0;
        await storage.set(key, info);
        
        if (onStateChange) {
          onStateChange(key, 'half-open', info.failures);
        }
      }
    }

    try {
      await next();
      
      // Success - reset failures if circuit was half-open
      if (info.state === 'half-open') {
        info.successCount++;
        if (info.successCount >= 3) { // Require 3 successes to close
          info.state = 'closed';
          info.failures = 0;
          info.successCount = 0;
          await storage.set(key, info);
          
          if (onStateChange) {
            onStateChange(key, 'closed', 0);
          }
        } else {
          await storage.set(key, info);
        }
      } else if (info.state === 'closed') {
        // Reset failure count on success
        info.failures = 0;
        await storage.set(key, info);
      }
    } catch (error) {
      // Failure - increment failure count
      info.failures++;
      info.lastFailureTime = now;
      
      if (info.state === 'half-open') {
        // Move back to open state
        info.state = 'open';
        info.nextAttemptTime = now + resetTimeout;
        await storage.set(key, info);
        
        if (onStateChange) {
          onStateChange(key, 'open', info.failures);
        }
      } else if (info.state === 'closed' && info.failures >= failureThreshold) {
        // Move to open state
        info.state = 'open';
        info.nextAttemptTime = now + resetTimeout;
        await storage.set(key, info);
        
        if (onStateChange) {
          onStateChange(key, 'open', info.failures);
        }
      } else {
        await storage.set(key, info);
      }
      
      throw error;
    }
  };
}

/**
 * Create circuit breaker with custom failure detection
 */
export function circuitBreakerWithCustomDetection(
  options: CircuitBreakerPluginOptions & {
    isFailure?: (error: Error, response?: Response) => boolean;
  }
): Middleware {
  const { isFailure = () => true, ...circuitOptions } = options as any;
  
  return async (ctx: any, next: any) => {
    try {
      await circuitBreaker(circuitOptions)(ctx, next);
    } catch (error) {
      if (isFailure(error as Error, ctx.res)) {
        throw error;
      }
      // If not considered a failure, don't count it
    }
  };
}

/**
 * Create adaptive circuit breaker
 */
export function adaptiveCircuitBreaker(
  baseThreshold: number,
  window: number,
  resetTimeout: number,
  options: Omit<CircuitBreakerPluginOptions, 'failureThreshold' | 'window' | 'resetTimeout'> = {}
): Middleware {
  const keyGenerator = options.keyGenerator || defaultKeyGenerator;
  const storage = new Map<string, { threshold: number; lastAdjustment: number }>();

  return async (ctx: any, next: any) => {
    const key = keyGenerator(ctx.req);
    const now = Date.now();
    
    let info = storage.get(key);
    if (!info) {
      info = { threshold: baseThreshold, lastAdjustment: now };
      storage.set(key, info);
    }

    // Adjust threshold based on recent performance
    if (now - info.lastAdjustment > window) {
      // Reset adjustment period
      info.lastAdjustment = now;
      // Could implement more sophisticated adjustment logic here
    }

    return circuitBreaker({
      ...options,
      failureThreshold: info.threshold,
      window,
      resetTimeout,
      keyGenerator,
    })(ctx, next);
  };
}