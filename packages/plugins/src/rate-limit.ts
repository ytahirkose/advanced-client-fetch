/**
 * Rate limiting plugin for HyperHTTP
 * Implements token bucket and sliding window rate limiting
 */

import type { Middleware, RequestOptions } from 'hyperhttp-core';
import { RateLimitError } from 'hyperhttp-core';
import { sleep } from 'hyperhttp-core';

export interface RateLimitPluginOptions {
  /** Enable rate limiting */
  enabled?: boolean;
  /** Requests per window */
  limit: number;
  /** Window duration in milliseconds */
  window: number;
  /** Rate limit key generator */
  keyGenerator?: (request: Request) => string;
  /** Rate limit storage */
  storage?: RateLimitStorage;
  /** Skip successful requests */
  skipSuccessful?: boolean;
  /** Skip failed requests */
  skipFailed?: boolean;
  /** Custom error message */
  message?: string;
  /** Headers to include in response */
  headers?: boolean;
}

export interface RateLimitStorage {
  get(key: string): Promise<RateLimitInfo | undefined>;
  set(key: string, info: RateLimitInfo, ttl: number): Promise<void>;
  increment(key: string, window: number): Promise<RateLimitInfo>;
  reset(key: string): Promise<void>;
}

export interface RateLimitInfo {
  count: number;
  resetTime: number;
  remaining: number;
  limit: number;
}

/**
 * In-memory rate limit storage
 */
export class MemoryRateLimitStorage implements RateLimitStorage {
  private store = new Map<string, RateLimitInfo>();
  private timers = new Map<string, NodeJS.Timeout>();

  async get(key: string): Promise<RateLimitInfo | undefined> {
    return this.store.get(key);
  }

  async set(key: string, info: RateLimitInfo, ttl: number): Promise<void> {
    this.store.set(key, info);
    
    // Clear existing timer
    const existingTimer = this.timers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    // Set new timer
    const timer = setTimeout(() => {
      this.store.delete(key);
      this.timers.delete(key);
    }, ttl);
    
    this.timers.set(key, timer);
  }

  async increment(key: string, window: number): Promise<RateLimitInfo> {
    const now = Date.now();
    const existing = this.store.get(key);
    
    if (!existing || now >= existing.resetTime) {
      // Create new window
      const info: RateLimitInfo = {
        count: 1,
        resetTime: now + window,
        remaining: 0, // Will be calculated
        limit: 0, // Will be set by caller
      };
      
      await this.set(key, info, window);
      return info;
    }
    
    // Increment existing window
    const info: RateLimitInfo = {
      ...existing,
      count: existing.count + 1,
    };
    
    await this.set(key, info, existing.resetTime - now);
    return info;
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
  }
}

const DEFAULT_OPTIONS: Required<Omit<RateLimitPluginOptions, 'limit' | 'window'>> = {
  enabled: true,
  keyGenerator: (req) => req.url,
  storage: new MemoryRateLimitStorage(),
  skipSuccessful: false,
  skipFailed: false,
  message: 'Too Many Requests',
  headers: true,
};

/**
 * Create rate limit middleware
 */
export function rateLimit(options: RateLimitPluginOptions): Middleware {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  if (!config.enabled) {
    return async (ctx, next) => next();
  }

  return async (ctx, next) => {
    const request = ctx.req;
    const key = config.keyGenerator(request);
    
    // Get current rate limit info
    const info = await config.storage.increment(key, config.window);
    
    // Calculate remaining requests
    const remaining = Math.max(0, config.limit - info.count);
    
    // Set rate limit meta
    ctx.meta.rateLimit = {
      limit: config.limit,
      remaining: remaining,
      reset: info.resetTime,
    };
    
    // Check if limit exceeded
    if (info.count > config.limit) {
      const resetTime = info.resetTime;
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
      
      // Add rate limit headers
      if (config.headers) {
        ctx.meta.rateLimitHeaders = {
          'X-RateLimit-Limit': config.limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString(),
          'Retry-After': retryAfter.toString(),
        };
      }
      
      throw new RateLimitError(
        config.message,
        config.limit,
        remaining,
        resetTime,
        retryAfter
      );
    }
    
    // Add rate limit headers
    if (config.headers) {
      ctx.meta.rateLimitHeaders = {
        'X-RateLimit-Limit': (config.limit || 0).toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(info.resetTime / 1000).toString(),
      };
    }
    
    // Store rate limit info in context
    ctx.meta.rateLimit = {
      limit: config.limit || 0,
      remaining,
      resetTime: info.resetTime,
      count: info.count,
    };
    
    try {
      await next();
      
      // Skip successful requests if configured
      if (config.skipSuccessful && ctx.res?.ok) {
        // Don't count successful requests
        const currentInfo = await config.storage.get(key);
        if (currentInfo) {
          currentInfo.count = Math.max(0, currentInfo.count - 1);
          await config.storage.set(key, currentInfo, currentInfo.resetTime - Date.now());
        }
      }
    } catch (error) {
      // Skip failed requests if configured
      if (config.skipFailed) {
        const currentInfo = await config.storage.get(key);
        if (currentInfo) {
          currentInfo.count = Math.max(0, currentInfo.count - 1);
          await config.storage.set(key, currentInfo, currentInfo.resetTime - Date.now());
        }
      }
      throw error;
    }
  };
}

/**
 * Create rate limit middleware with token bucket algorithm
 */
export function tokenBucketRateLimit(
  capacity: number,
  refillRate: number, // tokens per second
  options: Omit<RateLimitPluginOptions, 'limit' | 'window'> = {}
): Middleware {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  if (!config.enabled) {
    return async (ctx, next) => next();
  }

  return async (ctx, next) => {
    const request = ctx.req;
    const key = config.keyGenerator(request);
    const now = Date.now();
    
    // Get or create bucket
    let bucket = await config.storage.get(key);
    if (!bucket) {
      bucket = {
        count: capacity,
        resetTime: now + 1000, // 1 second
        remaining: capacity,
        limit: capacity,
      };
      await config.storage.set(key, bucket, 1000);
    }
    
    // Refill tokens
    const timePassed = now - (bucket.resetTime - 1000);
    const tokensToAdd = Math.floor(timePassed * refillRate / 1000);
    const newTokens = Math.min(capacity, bucket.count + tokensToAdd);
    
    if (newTokens < 1) {
      const waitTime = Math.ceil(1000 / refillRate);
      const retryAfter = Math.ceil(waitTime / 1000);
      
      if (config.headers) {
        ctx.meta.rateLimitHeaders = {
          'X-RateLimit-Limit': capacity.toString(),
          'X-RateLimit-Remaining': '0',
          'Retry-After': retryAfter.toString(),
        };
      }
      
      throw new RateLimitError(
        config.message,
        capacity,
        0,
        now + waitTime,
        retryAfter
      );
    }
    
    // Consume token
    bucket.count = newTokens - 1;
    bucket.remaining = bucket.count;
    bucket.resetTime = now + 1000;
    
    await config.storage.set(key, bucket, 1000);
    
    // Add headers
    if (config.headers) {
      ctx.meta.rateLimitHeaders = {
        'X-RateLimit-Limit': capacity.toString(),
        'X-RateLimit-Remaining': bucket.remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(bucket.resetTime / 1000).toString(),
      };
    }
    
    ctx.meta.rateLimit = {
      limit: capacity,
      remaining: bucket.remaining,
      resetTime: bucket.resetTime,
      count: capacity - bucket.remaining,
    };
    
    await next();
  };
}

/**
 * Create rate limit middleware with sliding window
 */
export function slidingWindowRateLimit(
  limit: number,
  window: number,
  options: Omit<RateLimitPluginOptions, 'limit' | 'window'> = {}
): Middleware {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  if (!config.enabled) {
    return async (ctx, next) => next();
  }

  return async (ctx, next) => {
    const request = ctx.req;
    const key = config.keyGenerator(request);
    const now = Date.now();
    
    // Get current window
    let windowInfo = await config.storage.get(key);
    if (!windowInfo) {
      windowInfo = {
        count: 0,
        resetTime: now + window,
        remaining: limit,
        limit,
      };
    }
    
    // Check if window expired
    if (now >= windowInfo.resetTime) {
      windowInfo = {
        count: 0,
        resetTime: now + window,
        remaining: limit,
        limit,
      };
    }
    
    // Check if limit exceeded
    if (windowInfo.count >= limit) {
      const retryAfter = Math.ceil((windowInfo.resetTime - now) / 1000);
      
      if (config.headers) {
        ctx.meta.rateLimitHeaders = {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil(windowInfo.resetTime / 1000).toString(),
          'Retry-After': retryAfter.toString(),
        };
      }
      
      throw new RateLimitError(
        config.message,
        limit,
        0,
        windowInfo.resetTime,
        retryAfter
      );
    }
    
    // Increment count
    windowInfo.count++;
    windowInfo.remaining = limit - windowInfo.count;
    
    await config.storage.set(key, windowInfo, windowInfo.resetTime - now);
    
    // Add headers
    if (config.headers) {
      ctx.meta.rateLimitHeaders = {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': windowInfo.remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(windowInfo.resetTime / 1000).toString(),
      };
    }
    
    ctx.meta.rateLimit = {
      limit,
      remaining: windowInfo.remaining,
      resetTime: windowInfo.resetTime,
      count: windowInfo.count,
    };
    
    await next();
  };
}

/**
 * Create rate limit middleware with different limits per endpoint
 */
export function adaptiveRateLimit(
  limits: Record<string, { limit: number; window: number }>,
  options: Omit<RateLimitPluginOptions, 'limit' | 'window'> = {}
): Middleware {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  if (!config.enabled) {
    return async (ctx, next) => next();
  }

  return async (ctx, next) => {
    const request = ctx.req;
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // Find matching limit
    const limitConfig = Object.entries(limits).find(([pattern]) => {
      if (pattern === '*') return true;
      if (pattern.startsWith('/') && pathname.startsWith(pattern)) return true;
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(pathname);
      }
      return pattern === pathname;
    });
    
    if (!limitConfig) {
      return next();
    }
    
    const [, { limit, window }] = limitConfig;
    
    return rateLimit({
      ...config,
      limit,
      window,
    })(ctx, next);
  };
}

/**
 * Rate limit by endpoint
 */
export function rateLimitByEndpoint(configs: Record<string, { maxRequests: number; windowMs: number }>): Middleware {
  return async (ctx, next) => {
    const url = new URL(ctx.req.url);
    const pathname = url.pathname;
    
    const config = Object.entries(configs).find(([pattern]) => {
      if (pattern === '*') return true;
      if (pattern.startsWith('/') && pathname.startsWith(pattern)) return true;
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(pathname);
      }
      return pattern === pathname;
    });
    
    if (!config) {
      return next();
    }
    
    const [, { maxRequests, windowMs }] = config;
    
    return rateLimit({
      limit: maxRequests,
      window: windowMs,
    })(ctx, next);
  };
}

/**
 * Rate limit by user
 */
export function rateLimitByUser(
  config: { maxRequests: number; windowMs: number },
  userExtractor: (request: Request) => string
): Middleware {
  return rateLimit({
    ...config,
    keyGenerator: userExtractor,
  });
}

/**
 * Rate limit by IP
 */
export function rateLimitByIP(config: { maxRequests: number; windowMs: number }): Middleware {
  return rateLimit({
    ...config,
    keyGenerator: (request) => {
      const forwarded = request.headers.get('x-forwarded-for');
      const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
      return ip;
    },
  });
}

/**
 * Rate limit by custom key
 */
export function rateLimitByKey(
  config: { maxRequests: number; windowMs: number },
  keyExtractor: (request: Request) => string
): Middleware {
  return rateLimit({
    ...config,
    keyGenerator: keyExtractor,
  });
}

/**
 * Rate limit with burst allowance
 */
export function rateLimitWithBurst(
  sustainedRate: number,
  burstCapacity: number,
  windowMs: number
): Middleware {
  return rateLimit({
    limit: burstCapacity,
    window: windowMs,
    storage: new MemoryRateLimitStorage(),
  });
}

/**
 * Rate limit with exponential backoff
 */
export function rateLimitWithBackoff(
  initialRate: number,
  maxRate: number,
  windowMs: number
): Middleware {
  return rateLimit({
    limit: initialRate,
    window: windowMs,
    storage: new MemoryRateLimitStorage(),
  });
}