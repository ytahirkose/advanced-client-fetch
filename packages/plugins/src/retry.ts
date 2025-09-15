/**
 * Retry plugin for HyperHTTP
 * Implements exponential backoff, jitter, and Retry-After header support
 */

import type { Middleware, RetryOptions, HttpMethod } from 'hyperhttp-core';
import { HyperAbortError, RetryError } from 'hyperhttp-core';
import { 
  isRetryableError,
  isRetryableResponse,
  calculateRetryDelay,
  waitForRetry,
  createAttemptSignal
} from 'hyperhttp-core';

export interface RetryPluginOptions extends RetryOptions {
  /** Enable retry plugin */
  enabled?: boolean;
}

const DEFAULT_OPTIONS: Required<RetryPluginOptions> = {
  enabled: true,
  retries: 3,
  methods: ['GET', 'HEAD', 'OPTIONS'],
  minDelay: 100,
  maxDelay: 2000,
  factor: 2,
  jitter: true,
  timeoutPerAttempt: 0,
  totalTimeout: 0,
  respectRetryAfter: true,
  retryAfterCap: 30000,
  retryOn: (error) => isRetryableError(error),
  onRetry: () => {},
};

/**
 * Create retry middleware
 */
export function retry(options: RetryPluginOptions = {}): Middleware {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  if (!config.enabled) {
    return async (_ctx, next) => next();
  }

  return async (ctx, next) => {
    const method = (ctx.req.method || 'GET').toUpperCase() as HttpMethod;
    const canRetryMethod = config.methods.includes(method);
    
    // Early return if method cannot be retried
    if (!canRetryMethod) {
      return next();
    }
    
    const maxAttempts = config.retries + 1;
    let lastError: Error | undefined;
    let lastResponse: Response | undefined;
    let attempt = 0;
    
    const startTime = Date.now();
    
    while (attempt < maxAttempts) {
      attempt++;
      
      try {
        // Check if we have time left for this attempt
        if (config.totalTimeout > 0) {
          const elapsed = Date.now() - startTime;
          const remaining = config.totalTimeout - elapsed;
          
          if (remaining <= 0) {
            throw new HyperAbortError('Total timeout exceeded', 'timeout');
          }
        }
        
        // Create attempt-specific signal
        const attemptSignal = createAttemptSignal(ctx.signal, config.timeoutPerAttempt);
        
        // Clone request with attempt signal
        const attemptRequest = new Request(ctx.req, { signal: attemptSignal });
        
        // Make the request
        ctx.req = attemptRequest;
        
        try {
          // Make the request directly
          const response = await fetch(attemptRequest);
          ctx.res = response;
          
          // Check if response is retryable
          if (ctx.res && isRetryableResponse(ctx.res)) {
            lastResponse = ctx.res;
            
            if (attempt < maxAttempts) {
              const delay = calculateRetryDelay(attempt, lastResponse, config);
              await waitForRetry(delay, ctx.signal);
              continue;
            }
          }
          
          // Success or non-retryable response
          return;
        } catch (error) {
          // If fetch throws, treat as network error
          throw error;
        }
        
      } catch (error) {
        lastError = error as Error;
        
        // Check if error is retryable
        if (!config.retryOn(error as Error) || attempt >= maxAttempts) {
          throw error;
        }
        
        // Calculate delay for next attempt
        const delay = calculateRetryDelay(attempt, lastResponse, config);
        
        // Call retry callback
        config.onRetry({
          attempt,
          delay,
          error: lastError,
          response: lastResponse,
          totalAttempts: maxAttempts,
        });
        
        // Wait before retry
        await waitForRetry(delay, ctx.signal);
      }
    }
    
    // All attempts failed
    throw new RetryError(
      `Request failed after ${attempt} attempts`,
      attempt,
      lastError || new Error('Unknown error')
    );
  };
}

/**
 * Create retry middleware with custom options
 */
export function createRetryMiddleware(options: RetryPluginOptions): Middleware {
  return retry(options);
}

/**
 * Retry only idempotent methods
 */
export function retryIdempotent(options: Omit<RetryPluginOptions, 'methods'> = {}): Middleware {
  return retry({
    ...options,
    methods: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE'],
  });
}

/**
 * Retry all methods
 */
export function retryAll(options: Omit<RetryPluginOptions, 'methods'> = {}): Middleware {
  return retry({
    ...options,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
  });
}

/**
 * Aggressive retry with more attempts and longer delays
 */
export function retryAggressive(options: Omit<RetryPluginOptions, 'retries' | 'maxDelay'> = {}): Middleware {
  return retry({
    ...options,
    retries: 5,
    maxDelay: 10000,
  });
}

/**
 * Conservative retry with fewer attempts and shorter delays
 */
export function retryConservative(options: Omit<RetryPluginOptions, 'retries' | 'maxDelay'> = {}): Middleware {
  return retry({
    ...options,
    retries: 1,
    maxDelay: 1000,
  });
}