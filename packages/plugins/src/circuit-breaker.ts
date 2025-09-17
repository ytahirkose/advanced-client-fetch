/**
 * Circuit breaker plugin for Advanced Client Fetch
 */

import type { Middleware } from '@advanced-client-fetch/core';

export interface CircuitBreakerPluginOptions {
  /** Number of failures before opening circuit */
  failureThreshold: number;
  /** Time window for counting failures */
  window: number;
  /** Time to wait before trying again */
  resetTimeout: number;
  /** Key generator for circuit breaking */
  keyGenerator?: (req: Request) => string;
  /** Callback when circuit state changes */
  onStateChange?: (key: string, state: 'closed' | 'open' | 'half-open') => void;
  /** Enable circuit breaker */
  enabled?: boolean;
}

// Simple in-memory storage for circuit breaker
const circuitBreakerStorage = new Map<string, {
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  lastFailureTime: number;
  nextAttemptTime: number;
}>();

/**
 * Create circuit breaker middleware
 */
export function circuitBreaker(options: CircuitBreakerPluginOptions): Middleware {
  const {
    failureThreshold,
    window: _window,
    resetTimeout,
    keyGenerator = (req: Request) => req.url,
    onStateChange,
    enabled = true,
  } = options as any;

  if (!enabled) {
    return async (_ctx: any, next: any) => next();
  }

  return async (ctx: any, next: any) => {
    const key = keyGenerator(ctx.req);
    const now = Date.now();
    
    // Get current circuit breaker info
    let info = circuitBreakerStorage.get(key);
    
    if (!info) {
      info = {
        state: 'closed',
        failureCount: 0,
        lastFailureTime: 0,
        nextAttemptTime: 0
      };
    }
    
    // Check if circuit is open
    if (info.state === 'open') {
      if (now < info.nextAttemptTime) {
        throw new Error('Circuit breaker is open');
      }
      // Move to half-open state
      info.state = 'half-open';
      circuitBreakerStorage.set(key, info);
      if (onStateChange) {
        onStateChange(key, 'half-open');
      }
    }
    
    try {
      // Make the request
      await next();
      
      // Success - reset circuit breaker
      if (info.state === 'half-open') {
        info.state = 'closed';
        info.failureCount = 0;
        circuitBreakerStorage.set(key, info);
        if (onStateChange) {
          onStateChange(key, 'closed');
        }
      }
      
    } catch (error) {
      // Failure - increment counter
      info.failureCount++;
      info.lastFailureTime = now;
      
      // Check if we should open the circuit
      if (info.failureCount >= failureThreshold) {
        info.state = 'open';
        info.nextAttemptTime = now + resetTimeout;
        circuitBreakerStorage.set(key, info);
        if (onStateChange) {
          onStateChange(key, 'open');
        }
      }
      
      throw error;
    }
  };
}