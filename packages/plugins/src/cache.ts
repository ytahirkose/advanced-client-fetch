/**
 * Cache plugin for Advanced Client Fetch
 * Implements RFC 9111 compliant HTTP caching
 */

import type { Middleware, CacheOptions, CacheStorage } from '@advanced-client-fetch/core';
// @ts-ignore
declare const Request: any;
// @ts-ignore
declare const Response: any;
// @ts-ignore
import { isJSONResponse, getContentType, defaultKeyGenerator } from '@advanced-client-fetch/core';

export interface CachePluginOptions extends CacheOptions {
  /** Enable cache plugin */
  enabled?: boolean;
  /** Cache only GET requests by default */
  cacheOnlyGET?: boolean;
  /** Cache key generator */
  keyGenerator?: (request: Request) => string;
  /** Cache validation */
  validateResponse?: (response: Response) => boolean;
}

/**
 * In-memory cache storage implementation
 */
export class MemoryCacheStorage implements CacheStorage {
  private cache = new Map<string, { response: Response; expires: number }>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private maxSize = 1000; // Prevent memory leaks
  
  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
    this.startCleanup();
  }
  
  private startCleanup(): void {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }
  
  private cleanup(): void {
    const now = performance.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(key);
      }
    }
    
    // If cache is too large, remove oldest entries
    if (this.cache.size > this.maxSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].expires - b[1].expires);
      const toRemove = entries.slice(0, this.cache.size - this.maxSize);
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }
  
  async get(key: string): Promise<Response | undefined> {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    
    if (performance.now() > entry.expires) {
      this.cache.delete(key);
      return undefined;
    }
    
    return entry.response;
  }
  
  async set(key: string, response: Response, ttl: number = 300000): Promise<void> {
    const expires = performance.now() + ttl;
    this.cache.set(key, { response, expires });
    
    // Trigger cleanup if cache is getting large
    if (this.cache.size > this.maxSize * 0.8) {
      this.cleanup();
    }
  }
  
  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }
  
  async clear(): Promise<void> {
    this.cache.clear();
  }
  
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }
  
  size(): number {
    return this.cache.size;
  }
}

/**
 * Create cache middleware
 */
export function cache(options: CachePluginOptions = {}): Middleware {
  const {
    enabled = true,
    ttl = 300000, // 5 minutes
    storage = new MemoryCacheStorage(),
    cacheOnlyGET = true,
    keyGenerator = createCacheKeyGenerator(),
    validateResponse = defaultValidateResponse,
  } = options as any;
  
  if (!enabled) {
    return async (_ctx: any, next: any) => next();
  }

  return async (ctx: any, next: any) => {
    const request = ctx.req;
    
    // Only cache GET requests by default
    if (cacheOnlyGET && request.method !== 'GET') {
      return next();
    }
    
    // Generate cache key
    const cacheKey = keyGenerator(request);
    
    // Check cache first
    const cachedResponse = await storage.get(cacheKey);
    if (cachedResponse) {
      ctx.res = cachedResponse;
      ctx.meta.cacheHit = true;
      return;
    }
    
    // Set cache miss
    ctx.meta.cacheHit = false;
    
    // Add cache headers for validation
    addCacheHeaders(request);
    
    // Make request
    await next();
    
    if (!ctx.res) return;
    
    // Validate response
    if (!validateResponse(ctx.res)) {
      return;
    }
    
    // Calculate TTL from response headers
    const responseTTL = calculateTTL(ctx.res, ttl);
    
    // Store in cache
    if (responseTTL > 0) {
      // Clone response to avoid body consumption issues
      const clonedResponse = ctx.res.clone();
      await storage.set(cacheKey, clonedResponse, responseTTL);
    }
    
    ctx.meta.cacheHit = false;
  };
}

/**
 * Cache key generator with optimization and memory management
 */
class KeyCacheManager {
  private cache = new Map<string, string>();
  private maxSize = 1000;
  private accessOrder: string[] = [];

  generateKey(request: Request): string {
    // Normalize URL to handle trailing slashes consistently
    const url = new URL(request.url);
    const normalizedUrl = url.toString();
    const method = request.method;
    
    // Use a simple hash for better performance
    const key = `${method}:${normalizedUrl}`;
    
    if (this.cache.has(key)) {
      // Move to end (most recently used)
      this.moveToEnd(key);
      return this.cache.get(key)!;
    }
    
    const hashedKey = btoa(key);
    this.cache.set(key, hashedKey);
    this.accessOrder.push(key);
    
    // LRU eviction if cache is too large
    if (this.cache.size > this.maxSize) {
      const lruKey = this.accessOrder.shift();
      if (lruKey) {
        this.cache.delete(lruKey);
      }
    }
    
    return hashedKey;
  }

  private moveToEnd(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
      this.accessOrder.push(key);
    }
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  size(): number {
    return this.cache.size;
  }
}

const keyCacheManager = new KeyCacheManager();

function createCacheKeyGenerator(): (request: Request) => string {
  return (request: Request): string => {
    return keyCacheManager.generateKey(request);
  };
}

/**
 * Default response validator
 */
function defaultValidateResponse(response: Response): boolean {
  // Only cache successful responses
  if (!response.ok) return false;
  
  // Don't cache responses with no-store
  const cacheControl = response.headers.get('cache-control');
  if (cacheControl?.includes('no-store')) return false;
  
  // Don't cache responses with private
  if (cacheControl?.includes('private')) return false;
  
  return true;
}

/**
 * Add cache headers to request
 */
function addCacheHeaders(request: Request): void {
  // Add If-None-Match if we have ETag
  const etag = request.headers.get('if-none-match');
  if (etag) {
    request.headers.set('if-none-match', etag);
  }
  
  // Add If-Modified-Since if we have Last-Modified
  const lastModified = request.headers.get('if-modified-since');
  if (lastModified) {
    request.headers.set('if-modified-since', lastModified);
  }
}

/**
 * Calculate TTL from response headers
 */
function calculateTTL(response: Response, defaultTTL: number): number {
  const cacheControl = response.headers.get('cache-control');
  if (!cacheControl) return defaultTTL;
  
  // Parse max-age
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
  if (maxAgeMatch) {
    return parseInt(maxAgeMatch[1], 10) * 1000;
  }
  
  // Parse s-maxage
  const sMaxAgeMatch = cacheControl.match(/s-maxage=(\d+)/);
  if (sMaxAgeMatch) {
    return parseInt(sMaxAgeMatch[1], 10) * 1000;
  }
  
  // Check for no-cache
  if (cacheControl.includes('no-cache')) {
    return 0;
  }
  
  // Check for no-store
  if (cacheControl.includes('no-store')) {
    return 0;
  }
  
  return defaultTTL;
}

/**
 * Create cache middleware with stale-while-revalidate
 */
export function cacheWithSWR(options: CachePluginOptions = {}): Middleware {
  const {
    enabled = true,
    ttl = 300000,
    storage = new MemoryCacheStorage(),
    staleWhileRevalidate = true,
  } = options as any;
  
  if (!enabled) {
    return async (_ctx: any, next: any) => next();
  }

  return async (ctx: any, next: any) => {
    const request = ctx.req;
    
    if (request.method !== 'GET') {
      return next();
    }
    
    const cacheKey = createCacheKeyGenerator()(request);
    const cachedResponse = await storage.get(cacheKey);
    
    if (cachedResponse) {
      // Check if response is stale
      const age = Date.now() - (cachedResponse.headers.get('x-cache-timestamp') ? 
        parseInt(cachedResponse.headers.get('x-cache-timestamp')!, 10) : 0);
      
      if (age < ttl) {
        // Fresh response
        ctx.res = cachedResponse;
        ctx.meta.cacheHit = true;
        return;
      } else if (staleWhileRevalidate) {
        // Stale response - serve it but revalidate in background
        ctx.res = cachedResponse;
        ctx.meta.cacheHit = true;
        ctx.meta.staleWhileRevalidate = true;
        
        // Revalidate in background
        Promise.resolve().then(async () => {
          try {
            const newRequest = new (Request as any)(request);
            const newResponse = await fetch(newRequest);
            if (newResponse.ok) {
              await storage.set(cacheKey, newResponse, ttl);
            }
          } catch (error) {
            // Ignore background revalidation errors
          }
        });
        
        return;
      }
    }
    
    // No cache or stale without SWR - make request
    ctx.meta.cacheHit = false;
    await next();
    
    if (!ctx.res) return;
    
    if (ctx.res.ok) {
      // Add timestamp header
      const responseWithTimestamp = new (Response as any)(ctx.res.body, {
        status: ctx.res.status,
        statusText: ctx.res.statusText,
        headers: {
          ...Object.fromEntries(ctx.res.headers.entries()),
          'x-cache-timestamp': Date.now().toString(),
        },
      });
      
      await storage.set(cacheKey, responseWithTimestamp, ttl);
      ctx.res = responseWithTimestamp;
    }
    
    ctx.meta.cacheHit = false;
  };
}

/**
 * Create cache middleware for specific content types
 */
export function cacheByContentType(
  contentTypes: string[],
  options: CachePluginOptions = {}
): Middleware {
  return async (ctx: any, next: any) => {
    const request = ctx.req;
    
    if (request.method !== 'GET') {
      return next();
    }
    
    // Use regular cache middleware which will handle content type after response
    return cache({
      ...options,
      validateResponse: (response: Response) => {
        // First check default validation
        const defaultValidator = options.validateResponse || defaultValidateResponse;
        if (!defaultValidator(response)) {
          return false;
        }
        
        // Check content type
        const contentType = getContentType(response);
        if (!contentType || !contentTypes.some(type => contentType.includes(type))) {
          return false;
        }
        
        return true;
      }
    })(ctx, next);
  };
}

/**
 * Create cache middleware with custom TTL per response
 */
export function cacheWithCustomTTL(
  ttlCalculator: (response: Response) => number,
  options: Omit<CachePluginOptions, 'ttl'> = {}
): Middleware {
  return async (ctx: any, next: any) => {
    const request = ctx.req;
    
    if (request.method !== 'GET') {
      return next();
    }
    
    const cacheKey = createCacheKeyGenerator()(request);
    const cachedResponse = await (options as any).storage?.get(cacheKey);
    
    if (cachedResponse) {
      ctx.res = cachedResponse;
      ctx.meta.cacheHit = true;
      return;
    }
    
    await next();
    
    if (!ctx.res) return;
    
    if (ctx.res.ok) {
      const ttl = ttlCalculator(ctx.res);
      if (ttl > 0) {
        await (options as any).storage?.set(cacheKey, ctx.res, ttl);
      }
    }
    
    ctx.meta.cacheHit = false;
  };
}