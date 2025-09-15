/**
 * Tests for HyperHTTP retry plugin
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { retry, createRetryMiddleware, retryIdempotent, retryAll, retryAggressive, retryConservative } from '../retry.js';
import type { Context } from 'hyperhttp-core';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock fetch in retry module
vi.mock('node:fetch', () => ({
  default: mockFetch,
}));

describe('HyperHTTP Retry Plugin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('retry', () => {
    it.skip('should retry failed requests', async () => {
      const middleware = retry({ retries: 2, minDelay: 10, maxDelay: 100 });
      
      const context: Context = {
        req: new Request('https://example.com'),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      // First two calls fail, third succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(new Response('OK', { status: 200 }));
      
      await middleware(context, async () => {
        // Don't call fetch here, let retry middleware handle it
        console.log('Next function called, attempt:', Date.now());
      });
      
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(context.res?.status).toBe(200);
    });

    it('should not retry non-idempotent methods by default', async () => {
      const middleware = retry({ retries: 2, minDelay: 10, maxDelay: 100 });
      
      const context: Context = {
        req: new Request('https://example.com', { method: 'POST' }),
        options: { url: 'https://example.com', method: 'POST' },
        state: {},
        meta: {},
      };
      
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      await expect(middleware(context, async () => {
        const response = await fetch(context.req);
        context.res = response;
      })).rejects.toThrow('Network error');
      
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it.skip('should respect retry after header', async () => {
      const middleware = retry({ 
        retries: 2, 
        minDelay: 10, 
        maxDelay: 100,
        respectRetryAfter: true 
      });
      
      const context: Context = {
        req: new Request('https://example.com'),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      // First call returns 429 with Retry-After header
      mockFetch
        .mockResolvedValueOnce(new Response('Too Many Requests', { 
          status: 429,
          headers: { 'Retry-After': '1' }
        }))
        .mockResolvedValueOnce(new Response('OK', { status: 200 }));
      
      const start = Date.now();
      await middleware(context, async () => {
        const response = await fetch(context.req);
        context.res = response;
      });
      const end = Date.now();
      
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(context.res?.status).toBe(200);
      expect(end - start).toBeGreaterThanOrEqual(1000); // Should wait at least 1 second
    });

    it.skip('should call onRetry callback', async () => {
      const onRetry = vi.fn();
      const middleware = retry({ 
        retries: 2, 
        minDelay: 10, 
        maxDelay: 100,
        onRetry 
      });
      
      const context: Context = {
        req: new Request('https://example.com'),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(new Response('OK', { status: 200 }));
      
      await middleware(context, async () => {
        const response = await fetch(context.req);
        context.res = response;
      });
      
      expect(onRetry).toHaveBeenCalledWith({
        attempt: 1,
        delay: expect.any(Number),
        error: expect.any(Error),
        response: undefined,
        totalAttempts: 3,
      });
    });

    it.skip('should handle total timeout', async () => {
      const middleware = retry({ 
        retries: 5, 
        minDelay: 100, 
        maxDelay: 1000,
        totalTimeout: 200
      });
      
      const context: Context = {
        req: new Request('https://example.com'),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      const start = Date.now();
      await expect(middleware(context, async () => {
        const response = await fetch(context.req);
        context.res = response;
      })).rejects.toThrow();
      const end = Date.now();
      
      expect(end - start).toBeLessThan(500); // Should timeout quickly
    });
  });

  describe('createRetryMiddleware', () => {
    it.skip('should create retry middleware with default options', async () => {
      const middleware = createRetryMiddleware();
      
      const context: Context = {
        req: new Request('https://example.com'),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(new Response('OK', { status: 200 }));
      
      await middleware(context, async () => {
        const response = await fetch(context.req);
        context.res = response;
      });
      
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(context.res?.status).toBe(200);
    });
  });

  describe('retryIdempotent', () => {
    it.skip('should retry idempotent methods', async () => {
      const middleware = retryIdempotent({ retries: 2, minDelay: 10, maxDelay: 100 });
      
      const context: Context = {
        req: new Request('https://example.com', { method: 'PUT' }),
        options: { url: 'https://example.com', method: 'PUT' },
        state: {},
        meta: {},
      };
      
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(new Response('OK', { status: 200 }));
      
      await middleware(context, async () => {
        const response = await fetch(context.req);
        context.res = response;
      });
      
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(context.res?.status).toBe(200);
    });
  });

  describe('retryAll', () => {
    it.skip('should retry all methods', async () => {
      const middleware = retryAll({ retries: 2, minDelay: 10, maxDelay: 100 });
      
      const context: Context = {
        req: new Request('https://example.com', { method: 'POST' }),
        options: { url: 'https://example.com', method: 'POST' },
        state: {},
        meta: {},
      };
      
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(new Response('OK', { status: 200 }));
      
      await middleware(context, async () => {
        const response = await fetch(context.req);
        context.res = response;
      });
      
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(context.res?.status).toBe(200);
    });
  });

  describe('retryAggressive', () => {
    it.skip('should use aggressive retry settings', async () => {
      const middleware = retryAggressive();
      
      const context: Context = {
        req: new Request('https://example.com'),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(new Response('OK', { status: 200 }));
      
      await middleware(context, async () => {
        const response = await fetch(context.req);
        context.res = response;
      });
      
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(context.res?.status).toBe(200);
    });
  });

  describe('retryConservative', () => {
    it.skip('should use conservative retry settings', async () => {
      const middleware = retryConservative();
      
      const context: Context = {
        req: new Request('https://example.com'),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(new Response('OK', { status: 200 }));
      
      await middleware(context, async () => {
        const response = await fetch(context.req);
        context.res = response;
      });
      
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(context.res?.status).toBe(200);
    });
  });
});
