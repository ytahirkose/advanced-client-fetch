/**
 * Rate limiting plugin for Advanced Client Fetch
 */

import type { Middleware, Request } from '@advanced-client-fetch/core';
import { RateLimitError } from '@advanced-client-fetch/core';
import { defaultKeyGenerator } from '@advanced-client-fetch/core';

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

export interface RateLimitStorage {
  get(key: string): Promise<RateLimitInfo | undefined>;
  set(key: string, info: RateLimitInfo): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

export interface RateLimitInfo {
  count: number;
  resetTime: number;
  limit: number;
}

/**
 * In-memory rate limit storage
 */
export class MemoryRateLimitStorage implements RateLimitStorage {
  private storage = new Map<string, RateLimitInfo>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanup();
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Clean up every minute
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, info] of this.storage.entries()) {
      if (now >= info.resetTime) {
        this.storage.delete(key);
      }
    }
  }

  async get(key: string): Promise<RateLimitInfo | undefined> {
    const info = this.storage.get(key);
    if (!info) return undefined;

    const now = Date.now();
    if (now >= info.resetTime) {
      this.storage.delete(key);
      return undefined;
    }

    return info;
  }

  async set(key: string, info: RateLimitInfo): Promise<void> {
    this.storage.set(key, info);
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async clear(): Promise<void> {
    this.storage.clear();
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.storage.clear();
  }
}

/**
 * Create rate limiting middleware
 */
export function rateLimit(options: RateLimitPluginOptions): Middleware {
  const {
    requests,
    window,
    keyGenerator = defaultKeyGenerator,
    onLimitReached,
    enabled = true,
  } = options as any;

  if (!enabled) {
    return async (ctx: any, next: any) => next();
  }

  const storage = new MemoryRateLimitStorage();

  return async (ctx: any, next: any) => {
    const key = keyGenerator(ctx.req);
    const now = Date.now();
    const resetTime = now + window;

    // Get current rate limit info
    let info = await storage.get(key);
    
    if (!info) {
      info = {
        count: 0,
        resetTime,
        limit: requests,
      };
    }

    // Check if limit is exceeded
    if (info.count >= requests) {
      const retryAfter = Math.ceil((info.resetTime - now) / 1000);
      
      if (onLimitReached) {
        onLimitReached(key, requests);
      }

      throw new RateLimitError(
        `Rate limit exceeded for ${key}`,
        ctx.req,
        undefined,
        retryAfter,
        requests,
        Math.max(0, requests - info.count)
      );
    }

    // Increment counter
    info.count++;
    await storage.set(key, info);

    // Add rate limit headers to response
    ctx.meta.rateLimit = {
      limit: requests,
      remaining: Math.max(0, requests - info.count),
      reset: info.resetTime,
    };

    await next();
  };
}

/**
 * Token bucket rate limiting
 */
export function tokenBucketRateLimit(
  capacity: number,
  refillRate: number, // tokens per second
  options: Omit<RateLimitPluginOptions, 'requests' | 'window'> = {}
): Middleware {
  const keyGenerator = options.keyGenerator || defaultKeyGenerator;
  const storage = new Map<string, { tokens: number; lastRefill: number }>();

  return async (ctx: any, next: any) => {
    const key = keyGenerator(ctx.req);
    const now = Date.now();
    
    let bucket = storage.get(key);
    if (!bucket) {
      bucket = { tokens: capacity, lastRefill: now };
      storage.set(key, bucket);
    }

    // Refill tokens
    const timePassed = (now - bucket.lastRefill) / 1000;
    const tokensToAdd = timePassed * refillRate;
    bucket.tokens = Math.min(capacity, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;

    // Check if we have enough tokens
    if (bucket.tokens < 1) {
      throw new RateLimitError(
        `Rate limit exceeded for ${key}`,
        ctx.req
      );
    }

    // Consume token
    bucket.tokens--;
    storage.set(key, bucket);

    await next();
  };
}

/**
 * Sliding window rate limiting
 */
export function slidingWindowRateLimit(
  requests: number,
  window: number,
  options: Omit<RateLimitPluginOptions, 'requests' | 'window'> = {}
): Middleware {
  const keyGenerator = options.keyGenerator || defaultKeyGenerator;
  const storage = new Map<string, number[]>();

  return async (ctx: any, next: any) => {
    const key = keyGenerator(ctx.req);
    const now = Date.now();
    const windowStart = now - window;

    let timestamps = storage.get(key) || [];
    
    // Remove old timestamps
    timestamps = timestamps.filter(ts => ts > windowStart);
    
    // Check if limit is exceeded
    if (timestamps.length >= requests) {
      throw new RateLimitError(
        `Rate limit exceeded for ${key}`,
        ctx.req
      );
    }

    // Add current timestamp
    timestamps.push(now);
    storage.set(key, timestamps);

    await next();
  };
}

/**
 * Adaptive rate limiting
 */
export function adaptiveRateLimit(
  baseRequests: number,
  window: number,
  options: Omit<RateLimitPluginOptions, 'requests' | 'window'> = {}
): Middleware {
  const keyGenerator = options.keyGenerator || defaultKeyGenerator;
  const storage = new Map<string, { requests: number; lastAdjustment: number; multiplier: number }>();

  return async (ctx: any, next: any) => {
    const key = keyGenerator(ctx.req);
    const now = Date.now();
    
    let info = storage.get(key);
    if (!info) {
      info = { requests: baseRequests, lastAdjustment: now, multiplier: 1 };
      storage.set(key, info);
    }

    // Adjust rate based on success/failure
    if (now - info.lastAdjustment > window) {
      // Reset adjustment period
      info.lastAdjustment = now;
      info.requests = Math.max(1, Math.floor(baseRequests * info.multiplier));
    }

    // Use adaptive rate limiting
    return rateLimit({
      ...options,
      requests: info.requests,
      window,
      keyGenerator,
    })(ctx, next);
  };
}