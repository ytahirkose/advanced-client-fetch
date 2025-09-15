/**
 * Tests for HyperHTTP cache plugin
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  cache, 
  cacheWithSWR, 
  cacheByContentType, 
  cacheWithCustomTTL,
  MemoryCacheStorage 
} from '../cache.js';
import type { Context } from 'hyperhttp-core';

describe('HyperHTTP Cache Plugin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('MemoryCacheStorage', () => {
    it('should store and retrieve cached responses', async () => {
      const storage = new MemoryCacheStorage();
      const response = new Response('cached data', { status: 200 });
      
      await storage.set('key1', response, 1000);
      const retrieved = await storage.get('key1');
      
      expect(retrieved).toBe(response);
    });

    it('should return undefined for expired entries', async () => {
      const storage = new MemoryCacheStorage();
      const response = new Response('cached data', { status: 200 });
      
      await storage.set('key1', response, 100);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const retrieved = await storage.get('key1');
      expect(retrieved).toBeUndefined();
    });

    it('should delete entries', async () => {
      const storage = new MemoryCacheStorage();
      const response = new Response('cached data', { status: 200 });
      
      await storage.set('key1', response, 1000);
      await storage.delete('key1');
      
      const retrieved = await storage.get('key1');
      expect(retrieved).toBeUndefined();
    });

    it('should clear all entries', async () => {
      const storage = new MemoryCacheStorage();
      const response = new Response('cached data', { status: 200 });
      
      await storage.set('key1', response, 1000);
      await storage.set('key2', response, 1000);
      await storage.clear();
      
      expect(await storage.get('key1')).toBeUndefined();
      expect(await storage.get('key2')).toBeUndefined();
    });

    it('should return storage size', () => {
      const storage = new MemoryCacheStorage();
      expect(storage.size()).toBe(0);
    });
  });

  describe('cache', () => {
    it('should cache GET requests', async () => {
      const middleware = cache({ ttl: 1000 });
      
      const context: Context = {
        req: new Request('https://example.com', { method: 'GET' }),
        options: { url: 'https://example.com', method: 'GET' },
        state: {},
        meta: {},
      };
      
      const response = new Response('cached data', { status: 200 });
      
      // First request - should not be cached
      await middleware(context, async () => {
        context.res = response;
      });
      
      expect(context.res).toBe(response);
      expect(context.meta.cacheHit).toBe(false);
      
      // Second request - should be cached
      const context2: Context = {
        req: new Request('https://example.com', { method: 'GET' }),
        options: { url: 'https://example.com', method: 'GET' },
        state: {},
        meta: {},
      };
      
      await middleware(context2, async () => {
        // This should not be called
        throw new Error('Should not be called');
      });
      
      expect(context2.res).toBe(response);
      expect(context2.meta.cacheHit).toBe(true);
    });

    it('should not cache non-GET requests by default', async () => {
      const middleware = cache({ ttl: 1000 });
      
      const context: Context = {
        req: new Request('https://example.com', { method: 'POST' }),
        options: { url: 'https://example.com', method: 'POST' },
        state: {},
        meta: {},
      };
      
      const response = new Response('created', { status: 201 });
      
      await middleware(context, async () => {
        context.res = response;
      });
      
      expect(context.res).toBe(response);
      expect(context.meta.cacheHit).toBeUndefined();
    });

    it('should not cache responses with no-store header', async () => {
      const middleware = cache({ ttl: 1000 });
      
      const context: Context = {
        req: new Request('https://example.com', { method: 'GET' }),
        options: { url: 'https://example.com', method: 'GET' },
        state: {},
        meta: {},
      };
      
      const response = new Response('data', { 
        status: 200,
        headers: { 'Cache-Control': 'no-store' }
      });
      
      await middleware(context, async () => {
        context.res = response;
      });
      
      expect(context.res).toBe(response);
      expect(context.meta.cacheHit).toBe(false);
    });

    it('should not cache private responses', async () => {
      const middleware = cache({ ttl: 1000 });
      
      const context: Context = {
        req: new Request('https://example.com', { method: 'GET' }),
        options: { url: 'https://example.com', method: 'GET' },
        state: {},
        meta: {},
      };
      
      const response = new Response('data', { 
        status: 200,
        headers: { 'Cache-Control': 'private' }
      });
      
      await middleware(context, async () => {
        context.res = response;
      });
      
      expect(context.res).toBe(response);
      expect(context.meta.cacheHit).toBe(false);
    });

    it('should respect max-age header', async () => {
      const middleware = cache({ ttl: 1000 });
      
      const context: Context = {
        req: new Request('https://example.com', { method: 'GET' }),
        options: { url: 'https://example.com', method: 'GET' },
        state: {},
        meta: {},
      };
      
      const response = new Response('data', { 
        status: 200,
        headers: { 'Cache-Control': 'max-age=2' }
      });
      
      await middleware(context, async () => {
        context.res = response;
      });
      
      expect(context.res).toBe(response);
      expect(context.meta.cacheHit).toBe(false);
    });
  });

  describe('cacheWithSWR', () => {
    it('should serve stale content while revalidating', async () => {
      // Create a storage that doesn't auto-expire entries for SWR testing
      const storage = {
        cache: new Map(),
        async get(key: string) {
          const entry = this.cache.get(key);
          return entry?.response;
        },
        async set(key: string, response: Response, ttl: number = 300000) {
          const expires = Date.now() + ttl;
          this.cache.set(key, { response, expires });
        },
        async delete(key: string) {
          this.cache.delete(key);
        },
        async clear() {
          this.cache.clear();
        },
        size() {
          return this.cache.size;
        }
      };
      
      const middleware = cacheWithSWR({
        ttl: 1000, 
        staleWhileRevalidate: true,
        storage: storage as any
      });
      
      const context: Context = {
        req: new Request('https://example.com', { method: 'GET' }),
        options: { url: 'https://example.com', method: 'GET' },
        state: {},
        meta: {},
      };
      
      const response = new Response('stale data', { status: 200 });
      
      // First request
      await middleware(context, async () => {
        context.res = response;
      });
      
      expect(context.res).toBeDefined();
      expect(context.res?.status).toBe(200);
      expect(context.meta.cacheHit).toBe(false);
      
      // Wait for stale (but not expired)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Second request - should serve stale content
      const context2: Context = {
        req: new Request('https://example.com', { method: 'GET' }),
        options: { url: 'https://example.com', method: 'GET' },
        state: {},
        meta: {},
      };
      
      
      await middleware(context2, async () => {
        context2.res = new Response('fresh data', { status: 200 });
      });
      
      expect(context2.res).toBeDefined();
      expect(context2.res?.status).toBe(200);
      expect(context2.meta.cacheHit).toBe(true);
      expect(context2.meta.staleWhileRevalidate).toBe(true);
    });
  });

  describe('cacheByContentType', () => {
    it('should only cache specific content types', async () => {
      const storage = new MemoryCacheStorage();
      const middleware = cacheByContentType(['application/json'], { 
        ttl: 1000,
        storage: storage
      });
      
      const jsonContext: Context = {
        req: new Request('https://example.com', { method: 'GET' }),
        options: { url: 'https://example.com', method: 'GET' },
        state: {},
        meta: {},
      };
      
      const jsonResponse = new Response('{"data": "test"}', { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      
      await middleware(jsonContext, async () => {
        jsonContext.res = jsonResponse;
      });
      
      expect(jsonContext.res).toBe(jsonResponse);
      expect(jsonContext.meta.cacheHit).toBe(false);
      
      // Second request should be cached
      const jsonContext2: Context = {
        req: new Request('https://example.com', { method: 'GET' }),
        options: { url: 'https://example.com', method: 'GET' },
        state: {},
        meta: {},
      };
      
      await middleware(jsonContext2, async () => {
        throw new Error('Should not be called');
      });
      
      expect(jsonContext2.res).toBe(jsonResponse);
      expect(jsonContext2.meta.cacheHit).toBe(true);
    });
  });

  describe('cacheWithCustomTTL', () => {
    it('should use custom TTL calculator', async () => {
      const middleware = cacheWithCustomTTL(
        (response) => response.status === 200 ? 2000 : 0,
        { ttl: 1000 }
      );
      
      const context: Context = {
        req: new Request('https://example.com', { method: 'GET' }),
        options: { url: 'https://example.com', method: 'GET' },
        state: {},
        meta: {},
      };
      
      const response = new Response('data', { status: 200 });
      
      await middleware(context, async () => {
        context.res = response;
      });
      
      expect(context.res).toBe(response);
      expect(context.meta.cacheHit).toBe(false);
    });
  });
});
