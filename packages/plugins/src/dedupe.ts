/**
 * Deduplication plugin for Advanced Client Fetch
 */

import type { Middleware, Request, Response } from '@advanced-client-fetch/core';
import { defaultKeyGenerator } from '@advanced-client-fetch/core';

export interface DedupePluginOptions {
  /** Maximum age for deduplication in milliseconds */
  maxAge?: number;
  /** Maximum number of pending requests */
  maxPending?: number;
  /** Key generator for deduplication */
  keyGenerator?: (req: Request) => string;
  /** Callback when request is deduplicated */
  onDedupe?: (key: string) => void;
  /** Enable deduplication */
  enabled?: boolean;
}

export interface DedupeStorage {
  get(key: string): Promise<DedupeEntry | undefined>;
  set(key: string, entry: DedupeEntry): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

export interface DedupeEntry {
  promise: Promise<Response>;
  timestamp: number;
}

export interface InFlightRequest {
  promise: Promise<Response>;
  timestamp: number;
  key: string;
}

/**
 * In-memory deduplication storage
 */
export class MemoryDedupeStorage implements DedupeStorage {
  private storage = new Map<string, DedupeEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanup();
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 30000); // Clean up every 30 seconds
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.storage.entries()) {
      if (now - entry.timestamp > 300000) { // 5 minutes
        this.storage.delete(key);
      }
    }
  }

  async get(key: string): Promise<DedupeEntry | undefined> {
    const entry = this.storage.get(key);
    if (!entry) return undefined;

    const now = Date.now();
    if (now - entry.timestamp > 300000) { // 5 minutes
      this.storage.delete(key);
      return undefined;
    }

    return entry;
  }

  async set(key: string, entry: DedupeEntry): Promise<void> {
    this.storage.set(key, entry);
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
 * Create deduplication middleware
 */
export function dedupe(options: DedupePluginOptions = {}): Middleware {
  const {
    maxAge = 30000, // 30 seconds
    maxPending = 10,
    keyGenerator = defaultKeyGenerator,
    onDedupe,
    enabled = true,
  } = options as any;

  if (!enabled) {
    return async (ctx: any, next: any) => next();
  }

  const storage = new MemoryDedupeStorage();
  const pendingRequests = new Map<string, InFlightRequest>();

  return async (ctx: any, next: any) => {
    const key = keyGenerator(ctx.req);
    const now = Date.now();

    // Check if request is already in flight
    const pendingRequest = pendingRequests.get(key);
    if (pendingRequest) {
      if (onDedupe) {
        onDedupe(key);
      }
      
      // Return the existing promise
      ctx.res = await pendingRequest.promise;
      return;
    }

    // Check if we have a cached response
    const cachedEntry = await storage.get(key);
    if (cachedEntry && (now - cachedEntry.timestamp) < maxAge) {
      if (onDedupe) {
        onDedupe(key);
      }
      
      ctx.res = await cachedEntry.promise;
      return;
    }

    // Check if we have too many pending requests
    if (pendingRequests.size >= maxPending) {
      // Remove oldest pending request
      const oldestKey = pendingRequests.keys().next().value;
      pendingRequests.delete(oldestKey);
    }

    // Create new request
    const requestPromise = (async () => {
      try {
        await next();
        return ctx.res!;
      } finally {
        // Remove from pending requests
        pendingRequests.delete(key);
      }
    })();

    // Store as pending request
    pendingRequests.set(key, {
      promise: requestPromise,
      timestamp: now,
      key,
    });

    // Wait for request to complete
    ctx.res = await requestPromise;

    // Cache the response
    await storage.set(key, {
      promise: Promise.resolve(ctx.res),
      timestamp: now,
    });
  };
}

/**
 * Create deduplication middleware with custom key
 */
export function dedupeWithCustomKey(
  keyGenerator: (req: Request) => string,
  options: Omit<DedupePluginOptions, 'keyGenerator'> = {}
): Middleware {
  return dedupe({
    ...options,
    keyGenerator,
  });
}

/**
 * Create deduplication middleware that includes request body
 */
export function dedupeWithBody(options: Omit<DedupePluginOptions, 'keyGenerator'> = {}): Middleware {
  return dedupe({
    ...options,
    keyGenerator: (req) => {
      const baseKey = defaultKeyGenerator(req);
      const bodyKey = req.body ? JSON.stringify(req.body) : '';
      return `${baseKey}:body:${bodyKey}`;
    },
  });
}

/**
 * Create deduplication middleware that includes specific headers
 */
export function dedupeWithHeaders(
  headers: string[],
  options: Omit<DedupePluginOptions, 'keyGenerator'> = {}
): Middleware {
  return dedupe({
    ...options,
    keyGenerator: (req) => {
      const baseKey = defaultKeyGenerator(req);
      const headerKey = headers
        .map(h => `${h}:${req.headers.get(h) || ''}`)
        .join('|');
      return `${baseKey}:headers:${headerKey}`;
    },
  });
}

/**
 * Get deduplication statistics
 */
export function getDedupeStats(storage: DedupeStorage): Promise<{
  totalEntries: number;
  pendingRequests: number;
  cacheHits: number;
}> {
  // This would need to be implemented in the storage class
  return Promise.resolve({
    totalEntries: 0,
    pendingRequests: 0,
    cacheHits: 0,
  });
}

/**
 * Clear deduplication cache
 */
export function clearDedupeCache(storage: DedupeStorage): Promise<void> {
  return storage.clear();
}