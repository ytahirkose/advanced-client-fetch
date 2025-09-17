/**
 * Rate limiting plugin for Advanced Client Fetch
 */

import type { Middleware, Request } from '@advanced-client-fetch/core';

export interface RateLimitPluginOptions {
  /** Number of requests allowed */
  requests: number;
  /** Time window in milliseconds */
  window: number;
  /** Key generator for rate limiting */
  keyGenerator?: (req: Request) => string;
  /** Callback when limit is reached */
  onLimitReached?: (key: string, limit: number) => void;
  /** Enable rate limiting */
  enabled?: boolean;
}

// Simple in-memory storage for rate limiting
const rateLimitStorage = new Map<string, { count: number; resetTime: number }>();

/**
 * Create rate limit middleware
 */
export function rateLimit(options: RateLimitPluginOptions): Middleware {
  const {
    requests,
    window,
    keyGenerator = (req: Request) => req.url,
    onLimitReached,
    enabled = true,
  } = options as any;

  if (!enabled) {
    return async (_ctx: any, next: any) => next();
  }

  return async (ctx: any, next: any) => {
    const key = keyGenerator(ctx.req);
    const now = Date.now();
    
    // Get current rate limit info
    let info = rateLimitStorage.get(key);
    
    // Reset if window has passed
    if (!info || now >= info.resetTime) {
      info = {
        count: 0,
        resetTime: now + window
      };
    }
    
    // Check if limit exceeded
    if (info.count >= requests) {
      if (onLimitReached) {
        onLimitReached(key, requests);
      }
      throw new Error(`Rate limit exceeded: ${requests} requests per ${window}ms`);
    }
    
    // Increment counter
    info.count++;
    rateLimitStorage.set(key, info);
    
    // Continue with request
    await next();
  };
}