/**
 * Cache plugin tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cache, cacheWithSWR, MemoryCacheStorage } from '../cache';

describe('MemoryCacheStorage', () => {
  let storage: MemoryCacheStorage;

  beforeEach(() => {
    storage = new MemoryCacheStorage();
  });

  it('should store and retrieve responses', async () => {
    const response = new Response('test data', { status: 200 });
    const key = 'test-key';
    const ttl = 1000;

    await storage.set(key, response, ttl);
    const retrieved = await storage.get(key);

    expect(retrieved).toBeDefined();
    expect(retrieved?.status).toBe(200);
  });

  it('should return undefined for expired entries', async () => {
    const response = new Response('test data', { status: 200 });
    const key = 'test-key';
    const ttl = 1; // Very short TTL

    await storage.set(key, response, ttl);
    
    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const retrieved = await storage.get(key);
    expect(retrieved).toBeUndefined();
  });

  it('should delete entries', async () => {
    const response = new Response('test data', { status: 200 });
    const key = 'test-key';

    await storage.set(key, response, 1000);
    await storage.delete(key);
    
    const retrieved = await storage.get(key);
    expect(retrieved).toBeUndefined();
  });

  it('should clear all entries', async () => {
    const response1 = new Response('test data 1', { status: 200 });
    const response2 = new Response('test data 2', { status: 200 });

    await storage.set('key1', response1, 1000);
    await storage.set('key2', response2, 1000);
    await storage.clear();
    
    expect(await storage.get('key1')).toBeUndefined();
    expect(await storage.get('key2')).toBeUndefined();
  });
});

describe('cache plugin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create cache middleware', () => {
    const middleware = cache({ ttl: 1000 });
    expect(typeof middleware).toBe('function');
  });

  it('should cache GET requests', async () => {
    const mockResponse = new Response('cached data', { status: 200 });
    const mockFetch = vi.fn().mockResolvedValue(mockResponse);
    global.fetch = mockFetch;

    const middleware = cache({ ttl: 1000 });
    const context = {
      req: new Request('https://example.com', { method: 'GET' }),
      res: undefined,
      signal: new AbortController().signal,
      meta: {},
      state: {}
    };

    const next = vi.fn().mockImplementation(async () => {
      context.res = await fetch(context.req);
    });

    // First request
    await middleware(context, next);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(context.meta.cacheHit).toBe(false);

    // Second request (should be cached)
    const context2 = {
      req: new Request('https://example.com', { method: 'GET' }),
      res: undefined,
      signal: new AbortController().signal,
      meta: {},
      state: {}
    };

    const next2 = vi.fn();
    await middleware(context2, next2);
    
    expect(mockFetch).toHaveBeenCalledTimes(1); // Should not call fetch again
    expect(context2.meta.cacheHit).toBe(true);
  });

  it('should not cache non-GET requests', async () => {
    const middleware = cache({ ttl: 1000 });
    const context = {
      req: new Request('https://example.com', { method: 'POST' }),
      res: undefined,
      signal: new AbortController().signal,
      meta: {},
      state: {}
    };

    const next = vi.fn();
    await middleware(context, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe('cacheWithSWR', () => {
  it('should create SWR cache middleware', () => {
    const middleware = cacheWithSWR({ ttl: 1000 });
    expect(typeof middleware).toBe('function');
  });
});
