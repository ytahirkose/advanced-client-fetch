/**
 * Timeout plugin for Advanced Client Fetch
 */

import type { Middleware, Context } from '@advanced-client-fetch/core';
import { TimeoutError } from '@advanced-client-fetch/core';
import { combineTimeoutAndSignal } from '@advanced-client-fetch/core';

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
  const { timeout: timeoutMs = 30000, enabled = true, message } = options as any;
  
  if (!enabled || timeoutMs <= 0) {
    return async (_ctx: any, next: any) => next();
  }

  return async (ctx: any, next: any) => {
    const { signal, cleanup } = combineTimeoutAndSignal(ctx.signal, timeoutMs);
    
    try {
      // Update context with new signal
      ctx.signal = signal;
      
      await next();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new TimeoutError(timeoutMs, signal);
      }
      throw error;
    } finally {
      cleanup?.();
    }
  };
}

/**
 * Create request timeout middleware
 */
export function requestTimeout(timeoutMs: number): Middleware {
  return timeout({ timeout: timeoutMs });
}

/**
 * Create global timeout middleware
 */
export function globalTimeout(timeoutMs: number): Middleware {
  return timeout({ timeout: timeoutMs });
}

/**
 * Create timeout middleware with custom message
 */
export function timeoutWithMessage(timeoutMs: number, message: string): Middleware {
  return timeout({ timeout: timeoutMs, message });
}

/**
 * Create timeout middleware for specific methods
 */
export function timeoutForMethods(
  timeoutMs: number,
  methods: string[]
): Middleware {
  return async (ctx: any, next: any) => {
    if (methods.includes(ctx.req.method)) {
      return timeout({ timeout: timeoutMs })(ctx, next);
    }
    return next();
  };
}

/**
 * Create timeout middleware with backoff
 */
export function timeoutWithBackoff(
  baseTimeout: number,
  maxTimeout: number = baseTimeout * 4
): Middleware {
  return async (ctx: any, next: any) => {
    const attempt = ctx.meta.retryAttempt || 1;
    const timeoutMs = Math.min(baseTimeout * attempt, maxTimeout);
    
    return timeout({ timeout: timeoutMs })(ctx, next);
  };
}

/**
 * Create timeout middleware that respects Retry-After header
 */
export function timeoutWithRetryAfter(
  defaultTimeout: number
): Middleware {
  return async (ctx: any, next: any) => {
    let timeoutMs = defaultTimeout;
    
    // Check for Retry-After header in previous response
    if (ctx.res?.headers.get('retry-after')) {
      const retryAfter = ctx.res.headers.get('retry-after');
      if (retryAfter) {
        const retryMs = parseInt(retryAfter, 10) * 1000;
        if (!isNaN(retryMs)) {
          timeoutMs = Math.min(retryMs, defaultTimeout * 2);
        }
      }
    }
    
    return timeout({ timeout: timeoutMs })(ctx, next);
  };
}

/**
 * Create timeout middleware with circuit breaker
 */
export function timeoutWithCircuitBreaker(
  timeoutMs: number,
  failureThreshold: number = 5
): Middleware {
  let failures = 0;
  let lastFailureTime = 0;
  
  return async (ctx: any, next: any) => {
    const now = Date.now();
    
    // Reset failures if enough time has passed
    if (now - lastFailureTime > 60000) { // 1 minute
      failures = 0;
    }
    
    // Use shorter timeout if circuit is open
    const effectiveTimeout = failures >= failureThreshold ? timeoutMs / 2 : timeoutMs;
    
    try {
      return await timeout({ timeout: effectiveTimeout })(ctx, next);
    } catch (error) {
      if (error instanceof TimeoutError) {
        failures++;
        lastFailureTime = now;
      }
      throw error;
    }
  };
}

/**
 * Create per-attempt timeout middleware
 */
export function timeoutPerAttempt(timeoutMs: number): Middleware {
  return async (ctx: any, next: any) => {
    const attempt = ctx.meta.retryAttempt || 1;
    const attemptTimeout = timeoutMs * attempt;
    
    return timeout({ timeout: attemptTimeout })(ctx, next);
  };
}

/**
 * Create total timeout middleware
 */
export function totalTimeout(timeoutMs: number): Middleware {
  return async (ctx: any, next: any) => {
    const startTime = ctx.meta.startTime || Date.now();
    const elapsed = Date.now() - startTime;
    const remaining = timeoutMs - elapsed;
    
    if (remaining <= 0) {
      throw new TimeoutError(timeoutMs);
    }
    
    return timeout({ timeout: remaining })(ctx, next);
  };
}

/**
 * Create timeout middleware that varies by HTTP method
 */
export function timeoutByMethod(timeouts: Record<string, number>): Middleware {
  return async (ctx: any, next: any) => {
    const method = ctx.req.method;
    const timeoutMs = timeouts[method] || timeouts.default || 30000;
    
    return timeout({ timeout: timeoutMs })(ctx, next);
  };
}