/**
 * Simple Retry plugin for Advanced Client Fetch
 */

import type { Middleware, RetryOptions, HttpMethod } from '@advanced-client-fetch/core';

export interface RetryPluginOptions extends RetryOptions {
  /** Enable retry plugin */
  enabled?: boolean;
}

const DEFAULT_OPTIONS: any = {
  enabled: true,
  retries: 3,
  methods: ['GET', 'HEAD', 'OPTIONS'],
  minDelay: 100,
  maxDelay: 2000,
  factor: 2,
  jitter: true,
  retryOn: (error: any) => error.status >= 500,
  onRetry: () => {},
};

/**
 * Create retry middleware
 */
export function retry(options: RetryPluginOptions = {}): Middleware {
  const config = { ...DEFAULT_OPTIONS, ...options } as any;
  
  if (!config.enabled) {
    return async (_ctx: any, next: any) => next();
  }

  return async (ctx: any, next: any) => {
    const method = (ctx.req.method || 'GET').toUpperCase() as HttpMethod;
    const canRetryMethod = config.methods.includes(method);
    
    // Early return if method cannot be retried
    if (!canRetryMethod) {
      return next();
    }
    
    const maxAttempts = config.retries + 1;
    let lastError: Error | undefined;
    let attempt = 0;
    
    while (attempt < maxAttempts) {
      attempt++;
      
      try {
        // Make the request
        await next();
        
        // Success
        return;
        
      } catch (error) {
        lastError = error as Error;
        
        // Check if error is retryable
        if (!config.retryOn(error) || attempt >= maxAttempts) {
          throw error;
        }
        
        // Calculate delay for next attempt
        const baseDelay = config.minDelay * Math.pow(config.factor, attempt - 1);
        const jitter = config.jitter ? Math.random() * 0.1 * baseDelay : 0;
        const delay = Math.min(baseDelay + jitter, config.maxDelay);
        
        // Call retry callback
        config.onRetry({
          attempt,
          delay,
          error: lastError,
          totalAttempts: maxAttempts,
        });
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };
}

export function retryIdempotent(options: Omit<RetryPluginOptions, 'methods'> = {}): Middleware {
  return retry({
    ...options,
    methods: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE'],
  } as any);
}

export function retryAll(options: Omit<RetryPluginOptions, 'methods'> = {}): Middleware {
  return retry({
    ...options,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
  } as any);
}

export function retryAggressive(options: Omit<RetryPluginOptions, 'retries' | 'maxDelay'> = {}): Middleware {
  return retry({
    ...options,
    retries: 5,
    maxDelay: 10000,
  } as any);
}

export function retryConservative(options: Omit<RetryPluginOptions, 'retries' | 'maxDelay'> = {}): Middleware {
  return retry({
    ...options,
    retries: 1,
    maxDelay: 1000,
  } as any);
}