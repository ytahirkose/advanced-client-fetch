/**
 * Timeout plugin for HyperHTTP
 * Provides per-request and global timeout functionality
 */

import type { Middleware, RequestOptions } from 'hyperhttp-core';
import { HyperAbortError, TimeoutError } from 'hyperhttp-core';
import { combineTimeoutAndSignal } from 'hyperhttp-core';

export interface TimeoutPluginOptions {
  /** Enable timeout plugin */
  enabled?: boolean;
  /** Default timeout in milliseconds */
  timeout?: number;
  /** Per-request timeout in milliseconds */
  requestTimeout?: number;
  /** Global timeout in milliseconds */
  globalTimeout?: number;
  /** Timeout error message */
  message?: string;
}

const DEFAULT_OPTIONS: Required<TimeoutPluginOptions> = {
  enabled: true,
  timeout: 30000, // 30 seconds
  requestTimeout: 0,
  globalTimeout: 0,
  message: 'Request timeout',
};

/**
 * Create timeout middleware
 */
export function timeout(options: TimeoutPluginOptions = {}): Middleware {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  if (!config.enabled) {
    return async (ctx, next) => next();
  }

  return async (ctx, next) => {
    const requestOptions = ctx.options as RequestOptions;
    const requestTimeout = requestOptions.timeout || config.requestTimeout || config.timeout;
    const globalTimeout = config.globalTimeout;
    
    // Use global timeout if specified, otherwise use request timeout
    const timeoutMs = globalTimeout > 0 ? globalTimeout : requestTimeout;
    
    if (timeoutMs <= 0) {
      return next();
    }

    // Create timeout signal and combine with existing signal
    const { signal: combinedSignal, cleanup } = combineTimeoutAndSignal(ctx.signal, timeoutMs);
    
    try {
      // Update context with combined signal
      ctx.signal = combinedSignal;
      
      // Clone request with new signal
      ctx.req = new Request(ctx.req, { signal: combinedSignal });
      
      await next();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new TimeoutError(timeoutMs, combinedSignal);
      }
      throw error;
    } finally {
      cleanup?.();
    }
  };
}

/**
 * Create timeout middleware with per-request timeout
 */
export function requestTimeout(timeoutMs: number): Middleware {
  return timeout({ requestTimeout: timeoutMs });
}

/**
 * Create timeout middleware with global timeout
 */
export function globalTimeout(timeoutMs: number): Middleware {
  return timeout({ globalTimeout: timeoutMs });
}

/**
 * Create timeout middleware with custom message
 */
export function timeoutWithMessage(timeoutMs: number, message: string): Middleware {
  return timeout({ 
    timeout: timeoutMs, 
    message 
  });
}

/**
 * Create timeout middleware that only applies to specific methods
 */
export function timeoutForMethods(
  methods: string[], 
  timeoutMs: number
): Middleware {
  return async (ctx, next) => {
    const method = ctx.req.method.toUpperCase();
    
    if (methods.includes(method)) {
      return timeout({ timeout: timeoutMs })(ctx, next);
    }
    
    return next();
  };
}

/**
 * Create timeout middleware with exponential backoff
 */
export function timeoutWithBackoff(
  baseTimeout: number,
  maxTimeout: number = 300000,
  factor: number = 1.5
): Middleware {
  return async (ctx, next) => {
    const attempt = ctx.meta.retryAttempt || 1;
    const timeoutMs = Math.min(baseTimeout * Math.pow(factor, attempt - 1), maxTimeout);
    
    return timeout({ timeout: timeoutMs })(ctx, next);
  };
}

/**
 * Create timeout middleware that respects Retry-After header
 */
export function timeoutWithRetryAfter(
  defaultTimeout: number,
  maxTimeout: number = 300000
): Middleware {
  return async (ctx, next) => {
    let timeoutMs = defaultTimeout;
    
    // Check if we have a Retry-After header from previous response
    const retryAfter = ctx.meta.retryAfter;
    if (retryAfter) {
      timeoutMs = Math.min(retryAfter, maxTimeout);
    }
    
    return timeout({ timeout: timeoutMs })(ctx, next);
  };
}

/**
 * Create timeout middleware with circuit breaker integration
 */
export function timeoutWithCircuitBreaker(
  timeoutMs: number,
  failureThreshold: number = 5
): Middleware {
  return async (ctx, next) => {
    const state = ctx.state;
    const key = `timeout_${ctx.req.url}`;
    
    // Initialize failure count
    if (!state[key]) {
      state[key] = { failures: 0, lastFailure: 0 };
    }
    
    const circuitState = state[key];
    const now = Date.now();
    
    // Reset failure count if enough time has passed
    if (now - circuitState.lastFailure > 60000) { // 1 minute
      circuitState.failures = 0;
    }
    
    // If too many failures, use shorter timeout
    const effectiveTimeout = circuitState.failures >= failureThreshold 
      ? Math.min(timeoutMs, 5000) 
      : timeoutMs;
    
    try {
      return await timeout({ timeout: effectiveTimeout })(ctx, next);
    } catch (error) {
      if (error instanceof TimeoutError) {
        circuitState.failures++;
        circuitState.lastFailure = now;
      }
      throw error;
    }
  };
}

/**
 * Timeout per attempt
 */
export function timeoutPerAttempt(timeoutMs: number): Middleware {
  return timeout({ requestTimeout: timeoutMs });
}

/**
 * Total timeout for all attempts
 */
export function totalTimeout(timeoutMs: number): Middleware {
  return timeout({ globalTimeout: timeoutMs });
}

/**
 * Timeout by HTTP method
 */
export function timeoutByMethod(timeouts: Record<string, number>): Middleware {
  return async (ctx, next) => {
    const method = ctx.req.method;
    const timeoutMs = timeouts[method] || timeouts['*'] || 30000;
    return timeout({ timeout: timeoutMs })(ctx, next);
  };
}
