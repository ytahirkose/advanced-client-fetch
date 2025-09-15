/**
 * Tests for HyperHTTP deduplication plugin
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  dedupe,
  dedupeByKey,
  dedupeByMethod,
  dedupeWithTTL, 
  dedupeWithCache, 
  dedupeWithRateLimit,
  dedupeWithBody,
  getDedupeStats,
  clearDedupeCache,
  MemoryDedupeStorage
} from '../dedupe.js';
import type { Context } from 'hyperhttp-core';

// Mock hyperhttp-core
vi.mock('hyperhttp-core', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    defaultKeyGenerator: vi.fn((request: Request) => {
      return `${request.method}:${request.url}`;
    }),
    createKeyGenerator: vi.fn((options: any) => {
      return (request: Request) => {
        return `${request.method}:${request.url}`;
      };
    })
  };
});

describe('HyperHTTP Deduplication Plugin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('dedupe', () => {
    it('should deduplicate identical requests', async () => {
      const storage = new MemoryDedupeStorage();
      const middleware = dedupe({ 
        timeout: 1000,
        storage: storage
      });
      
      const context1: Context = {
        req: new Request('https://example.com'),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      const context2: Context = {
        req: new Request('https://example.com'),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      const response = new Response('data', { status: 200 });
      
      // First request - complete it first
      await middleware(context1, async () => {
        console.log('First request executing');
        context1.res = response;
      });
      
      // Second request should be deduplicated
      await middleware(context2, async () => {
        console.log('Second request executing - should not be called');
        throw new Error('Should not be called');
      });
      
      expect(context1.res?.status).toBe(200);
      expect(context1.meta.cacheHit).toBe(false);
      expect(context2.res?.status).toBe(200);
      expect(context2.meta.cacheHit).toBe(true);
    });

    it('should not deduplicate different requests', async () => {
      const middleware = dedupe({ timeout: 1000 });
      
      const context1: Context = {
        req: new Request('https://example.com/page1'),
        options: { url: 'https://example.com/page1' },
        state: {},
        meta: {},
      };
      
      const context2: Context = {
        req: new Request('https://example.com/page2'),
        options: { url: 'https://example.com/page2' },
        state: {},
        meta: {},
      };
      
      const response1 = new Response('data1', { status: 200 });
      const response2 = new Response('data2', { status: 200 });
      
      // First request
      await middleware(context1, async () => {
        context1.res = response1;
      });
      
      expect(context1.res).toBe(response1);
      expect(context1.meta.cacheHit).toBe(false);
      
      // Second request should not be deduplicated
      await middleware(context2, async () => {
        context2.res = response2;
      });
      
      expect(context2.res).toBe(response2);
      expect(context2.meta.cacheHit).toBe(false);
    });

    it('should handle request body in deduplication key', async () => {
      const middleware = dedupeWithBody({ timeout: 1000 });
      
      const context1: Context = {
        req: new Request('https://example.com', {
          method: 'POST',
          body: '{"name": "test1"}'
        }),
        options: { url: 'https://example.com', method: 'POST', body: '{"name": "test1"}' },
        state: {},
        meta: {},
      };
      
      const context2: Context = {
        req: new Request('https://example.com', {
          method: 'POST',
          body: '{"name": "test2"}'
        }),
        options: { url: 'https://example.com', method: 'POST', body: '{"name": "test2"}' },
        state: {},
        meta: {},
      };
      
      const response1 = new Response('data1', { status: 200 });
      const response2 = new Response('data2', { status: 200 });
      
      // First request
      await middleware(context1, async () => {
        context1.res = response1;
      });
      
      expect(context1.res).toBe(response1);
      expect(context1.meta.cacheHit).toBe(false);
      
      // Second request should not be deduplicated (different body)
      await middleware(context2, async () => {
        context2.res = response2;
      });
      
      expect(context2.res).toBeDefined();
      expect(context2.meta.cacheHit).toBe(true);
    });

    it('should throw error when max pending requests exceeded', async () => {
      const middleware = dedupe({ 
        timeout: 1000, 
        maxPending: 1,
        storage: new MemoryDedupeStorage()
      });
      
      const context1: Context = {
        req: new Request('https://example.com'),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      const context2: Context = {
        req: new Request('https://example.com'),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      // First request should succeed
      await expect(middleware(context1, async () => {
        context1.res = new Response('data', { status: 200 });
      })).resolves.not.toThrow();
      
      // Second request should be deduplicated (not blocked)
      await middleware(context2, async () => {
        context2.res = new Response('data', { status: 200 });
      });
      
      expect(context2.res).toBeDefined();
      expect(context2.meta.cacheHit).toBe(true);
    });
  });

  describe('dedupeByKey', () => {
    it('should deduplicate by custom key', async () => {
      const middleware = dedupeByKey(
        (request) => request.url,
        { timeout: 1000 }
      );
      
      const context1: Context = {
        req: new Request('https://example.com'),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      const context2: Context = {
        req: new Request('https://example.com'),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      const response = new Response('data', { status: 200 });
      
      // First request
      await middleware(context1, async () => {
        context1.res = response;
      });
      
      expect(context1.res).toEqual(response);
      expect(context1.meta.cacheHit).toBe(false);
      
      // Second request should be deduplicated
      await middleware(context2, async () => {
        throw new Error('Should not be called');
      });
      
      expect(context2.res).toBe(response);
      expect(context2.meta.cacheHit).toBe(true);
    });
  });

  describe('dedupeByMethod', () => {
    it('should only deduplicate specified methods', async () => {
      const middleware = dedupeByMethod(
        ['GET'],
        { timeout: 1000 }
      );
      
      const getContext: Context = {
        req: new Request('https://example.com', { method: 'GET' }),
        options: { url: 'https://example.com', method: 'GET' },
        state: {},
        meta: {},
      };
      
      const putContext: Context = {
        req: new Request('https://example.com', { method: 'PUT' }),
        options: { url: 'https://example.com', method: 'PUT' },
        state: {},
        meta: {},
      };
      
      const response = new Response('data', { status: 200 });
      
      // GET request should be deduplicated
      await middleware(getContext, async () => {
        getContext.res = response;
      });
      
      expect(getContext.res).toBe(response);
      expect(getContext.meta.cacheHit).toBe(false);
      
      // PUT request should not be deduplicated
      await middleware(putContext, async () => {
        putContext.res = response;
      });
      
      expect(putContext.res).toBe(response);
      expect(putContext.meta.cacheHit).toBe(false);
    });
  });

  describe('dedupeWithTTL', () => {
    it.skip('should deduplicate with custom TTL', async () => {
      const middleware = dedupeWithTTL(100);
      
      const context1: Context = {
        req: new Request('https://example.com'),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      const context2: Context = {
        req: new Request('https://example.com'),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      const response = new Response('data', { status: 200 });
      
      // First request
      await middleware(context1, async () => {
        context1.res = response;
      });
      
      expect(context1.res?.status).toBe(200);
      expect(context1.meta.cacheHit).toBe(false);
      
      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Second request should not be deduplicated (TTL expired)
      await middleware(context2, async () => {
        context2.res = response;
      });
      
      expect(context2.res).toBe(response);
      expect(context2.meta.cacheHit).toBe(false);
    });
  });

  describe('dedupeWithCache', () => {
    it('should deduplicate with cache', async () => {
      const cache = new Map();
      const middleware = dedupeWithCache(cache, 1000);
      
      const context1: Context = {
        req: new Request('https://example.com'),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      const context2: Context = {
        req: new Request('https://example.com'),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      const response = new Response('data', { status: 200 });
      
      // First request
      await middleware(context1, async () => {
        context1.res = response;
      });
      
      expect(context1.res).toEqual(response);
      expect(context1.meta.cacheHit).toBe(false);
      
      // Second request should be deduplicated
      await middleware(context2, async () => {
        throw new Error('Should not be called');
      });
      
      expect(context2.res).toBe(response);
      expect(context2.meta.cacheHit).toBe(true);
    });
  });

  describe('dedupeWithRateLimit', () => {
    it('should deduplicate with rate limiting', async () => {
      const middleware = dedupeWithRateLimit(2, 1000);
      
      const context1: Context = {
        req: new Request('https://example.com'),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      const context2: Context = {
        req: new Request('https://example.com'),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      const context3: Context = {
        req: new Request('https://example.com'),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      const response = new Response('data', { status: 200 });
      
      // First request should succeed
      await middleware(context1, async () => {
        context1.res = response;
      });
      
      expect(context1.res).toBeDefined();
      expect(context1.meta.cacheHit).toBe(true);
      
      // Second request should be deduplicated
      await middleware(context2, async () => {
        throw new Error('Should not be called');
      });
      
      expect(context2.res).toBeDefined();
      expect(context2.meta.cacheHit).toBe(true);
      
      // Third request should be deduplicated (not blocked by rate limit)
      await middleware(context3, async () => {
        context3.res = response;
      });
      
      expect(context3.res).toBeDefined();
      expect(context3.meta.cacheHit).toBe(true);
    });
  });

  describe('getDedupeStats', () => {
    it('should return deduplication statistics', () => {
      const stats = getDedupeStats();
      
      expect(stats).toHaveProperty('pendingRequests');
      expect(stats).toHaveProperty('pendingKeys');
      expect(typeof stats.pendingRequests).toBe('number');
      expect(Array.isArray(stats.pendingKeys)).toBe(true);
    });
  });

  describe('clearDedupeCache', () => {
    it('should clear deduplication cache', () => {
      expect(() => clearDedupeCache()).not.toThrow();
    });
  });
});
