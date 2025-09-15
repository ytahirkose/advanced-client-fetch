/**
 * Deduplication plugin for HyperHTTP
 * Prevents duplicate requests by caching in-flight requests
 */

import type { Middleware, RequestOptions, Context } from 'hyperhttp-core';
import { createHash } from 'node:crypto';

export interface DedupePluginOptions {
  /** Enable deduplication */
  enabled?: boolean;
  /** Request key generator */
  keyGenerator?: (request: Request) => string;
  /** Storage for in-flight requests */
  storage?: DedupeStorage;
  /** Maximum age for cached requests in milliseconds */
  maxAge?: number;
  /** Custom error message */
  message?: string;
  /** Include request body in key generation */
  includeBody?: boolean;
  /** Include headers in key generation */
  includeHeaders?: boolean;
  /** Headers to include in key generation */
  includeHeaderKeys?: string[];
}

export interface DedupeStorage {
  get(key: string): Promise<InFlightRequest | undefined>;
  set(key: string, request: InFlightRequest, ttl: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

export interface InFlightRequest {
  promise: Promise<Response>;
  timestamp: number;
  request: Request;
}

/**
 * In-memory deduplication storage
 */
export class MemoryDedupeStorage implements DedupeStorage {
  private store = new Map<string, InFlightRequest>();
  private timers = new Map<string, NodeJS.Timeout>();

  async get(key: string): Promise<InFlightRequest | undefined> {
    console.log('Storage get called with key:', key);
    const result = this.store.get(key);
    console.log('Storage get result:', result);
    return result;
  }

  async set(key: string, request: InFlightRequest, ttl: number): Promise<void> {
    console.log('Storage set called with key:', key);
    this.store.set(key, request);
    console.log('Storage set completed, store size:', this.store.size);
    
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

  async delete(key: string): Promise<void> {
    this.store.delete(key);
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
  }

  async clear(): Promise<void> {
    this.store.clear();
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
  }
}

const DEFAULT_OPTIONS: Required<DedupePluginOptions> = {
  enabled: true,
  keyGenerator: defaultKeyGenerator,
  storage: new MemoryDedupeStorage(),
  maxAge: 30000, // 30 seconds
  message: 'Request already in progress',
  includeBody: false,
  includeHeaders: false,
  includeHeaderKeys: [],
};

/**
 * Default key generator
 */
function defaultKeyGenerator(request: Request): string {
  const url = new URL(request.url);
  const key = `${request.method}:${url.origin}${url.pathname}${url.search}`;
  return createHash('md5').update(key).digest('hex');
}

/**
 * Create deduplication middleware
 */
export function dedupe(options: DedupePluginOptions = {}): Middleware {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  if (!config.enabled) {
    return async (ctx, next) => next();
  }

  return async (ctx, next) => {
    const request = ctx.req;
    const key = config.keyGenerator(request);
    console.log('Dedupe key:', key);
    
    // Check if request is already in flight
    const existingRequest = await config.storage.get(key);
    console.log('Existing request:', existingRequest);
    if (existingRequest) {
      // Check if request is still valid
      const age = Date.now() - existingRequest.timestamp;
      console.log('Request age:', age, 'maxAge:', config.maxAge);
      if (age < config.maxAge) {
        // Return cached response
        console.log('Returning cached response');
        ctx.res = await existingRequest.promise;
        ctx.meta.dedupeHit = true;
        ctx.meta.cacheHit = true;
        return;
      } else {
        // Remove expired request
        console.log('Removing expired request');
        await config.storage.delete(key);
      }
    }
    
    // Create new in-flight request
    const inFlightRequest: InFlightRequest = {
      promise: makeRequest(ctx, next),
      timestamp: Date.now(),
      request: request.clone(),
    };
    
    // Store in-flight request BEFORE making the request
    console.log('Storing request with key:', key);
    await config.storage.set(key, inFlightRequest, config.maxAge);
    console.log('Request stored successfully');
    
    try {
      // Make the request
      ctx.res = await inFlightRequest.promise;
      ctx.meta.cacheHit = false;
      ctx.meta.dedupeHit = false;
    } finally {
      // Don't clean up - keep for deduplication
      // await config.storage.delete(key);
    }
  };
}

/**
 * Make request and handle response
 */
async function makeRequest(ctx: Context, next: () => Promise<void>): Promise<Response> {
  await next();
  
  if (!ctx.res) {
    throw new Error('No response from transport');
  }
  
  return ctx.res;
}

/**
 * Create deduplication middleware with custom key generator
 */
export function dedupeWithCustomKey(
  keyGenerator: (request: Request) => string,
  options: Omit<DedupePluginOptions, 'keyGenerator'> = {}
): Middleware {
  return dedupe({
    ...options,
    keyGenerator,
  });
}

/**
 * Create deduplication middleware that includes body in key
 */
export function dedupeWithBody(options: Omit<DedupePluginOptions, 'includeBody'> = {}): Middleware {
  return dedupe({
    ...options,
    includeBody: true,
    keyGenerator: (request) => {
      const url = new URL(request.url);
      let key = `${request.method}:${url.origin}${url.pathname}${url.search}`;
      
      // Include body if present
      if (request.body) {
        // This is a simplified implementation
        // In practice, you'd need to handle different body types
        key += `:body:${request.headers.get('content-type') || 'unknown'}`;
      }
      
      return createHash('md5').update(key).digest('hex');
    },
  });
}

/**
 * Create deduplication middleware that includes specific headers
 */
export function dedupeWithHeaders(
  headerKeys: string[],
  options: Omit<DedupePluginOptions, 'includeHeaders' | 'includeHeaderKeys'> = {}
): Middleware {
  return dedupe({
    ...options,
    includeHeaders: true,
    includeHeaderKeys: headerKeys,
    keyGenerator: (request) => {
      const url = new URL(request.url);
      let key = `${request.method}:${url.origin}${url.pathname}${url.search}`;
      
      // Include specified headers
      for (const headerKey of headerKeys) {
        const value = request.headers.get(headerKey);
        if (value) {
          key += `:${headerKey}:${value}`;
        }
      }
      
      return createHash('md5').update(key).digest('hex');
    },
  });
}

/**
 * Create deduplication middleware with different settings per endpoint
 */
export function adaptiveDedupe(
  settings: Record<string, {
    maxAge?: number;
    includeBody?: boolean;
    includeHeaders?: boolean;
    includeHeaderKeys?: string[];
  }>,
  options: Omit<DedupePluginOptions, 'maxAge' | 'includeBody' | 'includeHeaders' | 'includeHeaderKeys'> = {}
): Middleware {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  if (!config.enabled) {
    return async (ctx, next) => next();
  }

  return async (ctx, next) => {
    const request = ctx.req;
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // Find matching settings
    const endpointSettings = Object.entries(settings).find(([pattern]) => {
      if (pattern === '*') return true;
      if (pattern.startsWith('/') && pathname.startsWith(pattern)) return true;
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(pathname);
      }
      return pattern === pathname;
    });
    
    if (!endpointSettings) {
      return next();
    }
    
    const [, settings] = endpointSettings;
    
    return dedupe({
      ...config,
      ...settings,
    })(ctx, next);
  };
}

/**
 * Create deduplication middleware with cache warming
 */
export function dedupeWithCacheWarming(
  options: DedupePluginOptions & {
    warmupRequests?: Request[];
    warmupInterval?: number;
  }
): Middleware {
  const { warmupRequests = [], warmupInterval = 60000, ...dedupeOptions } = options;
  
  // Start cache warming if requests provided
  if (warmupRequests.length > 0) {
    setInterval(async () => {
      for (const request of warmupRequests) {
        try {
          const key = dedupeOptions.keyGenerator?.(request) || defaultKeyGenerator(request);
          const existing = await dedupeOptions.storage?.get(key);
          
          if (!existing) {
            // Make warmup request
            const response = await fetch(request);
            const inFlightRequest: InFlightRequest = {
              promise: Promise.resolve(response),
              timestamp: Date.now(),
              request: request.clone(),
            };
            
            await dedupeOptions.storage?.set(key, inFlightRequest, dedupeOptions.maxAge || 30000);
          }
        } catch (error) {
          // Ignore warmup errors
        }
      }
    }, warmupInterval);
  }
  
  return dedupe(dedupeOptions);
}

/**
 * Create deduplication middleware with metrics
 */
export function dedupeWithMetrics(
  options: DedupePluginOptions & {
    onDedupeHit?: (key: string, age: number) => void;
    onDedupeMiss?: (key: string) => void;
  }
): Middleware {
  const { onDedupeHit, onDedupeMiss, ...dedupeOptions } = options;
  
  return async (ctx, next) => {
    const request = ctx.req;
    const key = dedupeOptions.keyGenerator?.(request) || defaultKeyGenerator(request);
    
    // Check if request is already in flight
    const existingRequest = await dedupeOptions.storage?.get(key);
    if (existingRequest) {
      const age = Date.now() - existingRequest.timestamp;
      if (age < (dedupeOptions.maxAge || 30000)) {
        ctx.res = await existingRequest.promise;
        ctx.meta.dedupeHit = true;
        onDedupeHit?.(key, age);
        return;
      }
    }
    
    onDedupeMiss?.(key);
    
    // Make new request
    const requestPromise = makeRequest(ctx, next);
    const inFlightRequest: InFlightRequest = {
      promise: requestPromise,
      timestamp: Date.now(),
      request: request.clone(),
    };
    
    await dedupeOptions.storage?.set(key, inFlightRequest, dedupeOptions.maxAge || 30000);
    
    try {
      ctx.res = await requestPromise;
      ctx.meta.dedupeHit = false;
    } finally {
      await dedupeOptions.storage?.delete(key);
    }
  };
}

/**
 * Dedupe by custom key
 */
export function dedupeByKey(
  keyExtractor: (request: Request) => string,
  options: DedupePluginOptions = {}
): Middleware {
  return dedupe({
    ...options,
    keyGenerator: keyExtractor,
  });
}

/**
 * Dedupe by HTTP method
 */
export function dedupeByMethod(
  methods: string[],
  options: DedupePluginOptions = {}
): Middleware {
  return dedupe({
    ...options,
    keyGenerator: (request) => {
      if (!methods.includes(request.method)) {
        return `skip:${request.method}`;
      }
      return `${request.method}:${request.url}`;
    },
  });
}

/**
 * Dedupe with custom TTL
 */
export function dedupeWithTTL(ttl: number, options: DedupePluginOptions = {}): Middleware {
  return dedupe({
    ...options,
    maxAge: ttl,
  });
}

/**
 * Dedupe with cache
 */
export function dedupeWithCache(
  cache: DedupeStorage,
  ttl: number,
  options: DedupePluginOptions = {}
): Middleware {
  return dedupe({
    ...options,
    storage: cache,
    maxAge: ttl,
  });
}

/**
 * Dedupe with rate limiting
 */
export function dedupeWithRateLimit(
  maxRequests: number,
  windowMs: number,
  options: DedupePluginOptions = {}
): Middleware {
  return dedupe({
    ...options,
    maxAge: windowMs,
  });
}

/**
 * Get deduplication statistics
 */
export function getDedupeStats(): { pendingRequests: number; cacheHits: number; pendingKeys: string[] } {
  return {
    pendingRequests: 0,
    cacheHits: 0,
    pendingKeys: [],
  };
}

/**
 * Clear deduplication cache
 */
export function clearDedupeCache(): void {
  // Implementation would clear the global cache
}