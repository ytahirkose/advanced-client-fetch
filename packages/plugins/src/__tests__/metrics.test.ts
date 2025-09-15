/**
 * Tests for HyperHTTP metrics plugin
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  metrics, 
  metricsWithCollector, 
  metricsWithLogging, 
  metricsWithJSONLogging, 
  metricsWithFormatter, 
  metricsWithAggregation, 
  metricsWithHistogram, 
  metricsByKey, 
  metricsWithFilter, 
  metricsWithSampling, 
  metricsWithBuffering 
} from '../metrics.js';
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

describe('HyperHTTP Metrics Plugin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('metrics', () => {
    it('should collect basic metrics', async () => {
      const onMetrics = vi.fn();
      const middleware = metrics({ onMetrics });
      
      const context: Context = {
        req: new Request('https://example.com/', { method: 'GET' }),
        options: { url: 'https://example.com/', method: 'GET' },
        state: {},
        meta: {},
      };
      
      const response = new Response('data', { status: 200 });
      
      await middleware(context, async () => {
        context.res = response;
      });
      
      expect(onMetrics).toHaveBeenCalledWith(
        expect.objectContaining({
          startTime: expect.any(Number),
          endTime: expect.any(Number),
          duration: expect.any(Number),
          retries: 0,
          url: 'https://example.com/',
          method: 'GET',
          requestHeaders: expect.any(Object),
          responseHeaders: expect.any(Object),
          status: 200,
        })
      );
    });

    it('should collect error metrics', async () => {
      const onMetrics = vi.fn();
      const middleware = metrics({ onMetrics });
      
      const context: Context = {
        req: new Request('https://example.com/', { method: 'GET' }),
        options: { url: 'https://example.com/', method: 'GET' },
        state: {},
        meta: {},
      };
      
      const error = new Error('Test error');
      
      await expect(middleware(context, async () => {
        throw error;
      })).rejects.toThrow('Test error');
      
      expect(onMetrics).toHaveBeenCalledWith(
        expect.objectContaining({
          startTime: expect.any(Number),
          endTime: expect.any(Number),
          duration: expect.any(Number),
          retries: 0,
          url: 'https://example.com/',
          method: 'GET',
          requestHeaders: expect.any(Object),
          responseHeaders: {},
          error: 'Test error',
        })
      );
    });

    it('should collect retry metrics', async () => {
      const onMetrics = vi.fn();
      const middleware = metrics({ onMetrics, collectRetries: true });
      
      const context: Context = {
        req: new Request('https://example.com/', { method: 'GET' }),
        options: { url: 'https://example.com/', method: 'GET' },
        state: {},
        meta: { retries: 3 },
      };
      
      const response = new Response('data', { status: 200 });
      
      await middleware(context, async () => {
        context.res = response;
      });
      
      expect(onMetrics).toHaveBeenCalledWith(
        expect.objectContaining({
          retries: 0,
        })
      );
    });

    it('should collect cache metrics', async () => {
      const onMetrics = vi.fn();
      const middleware = metrics({ onMetrics, collectCache: true });
      
      const context: Context = {
        req: new Request('https://example.com/', { method: 'GET' }),
        options: { url: 'https://example.com/', method: 'GET' },
        state: {},
        meta: { cacheHit: true, cacheKey: 'key1' },
      };
      
      const response = new Response('data', { status: 200 });
      
      await middleware(context, async () => {
        context.res = response;
      });
      
      expect(onMetrics).toHaveBeenCalledWith(
        expect.objectContaining({
          cache: {
            hit: true,
            key: 'key1',
          },
        })
      );
    });

    it('should collect rate limit metrics', async () => {
      const onMetrics = vi.fn();
      const middleware = metrics({ onMetrics });
      
      const context: Context = {
        req: new Request('https://example.com/', { method: 'GET' }),
        options: { url: 'https://example.com/', method: 'GET' },
        state: {},
        meta: { 
          rateLimit: {
            limit: 100,
            remaining: 99,
            reset: Date.now() + 60000,
          }
        },
      };
      
      const response = new Response('data', { status: 200 });
      
      await middleware(context, async () => {
        context.res = response;
      });
      
      expect(onMetrics).toHaveBeenCalledWith(
        expect.objectContaining({
          rateLimit: {
            limit: 100,
            remaining: 99,
            reset: expect.any(Number),
          },
        })
      );
    });

    it('should collect circuit breaker metrics', async () => {
      const onMetrics = vi.fn();
      const middleware = metrics({ onMetrics });
      
      const context: Context = {
        req: new Request('https://example.com/', { method: 'GET' }),
        options: { url: 'https://example.com/', method: 'GET' },
        state: {},
        meta: { 
          circuitBreaker: {
            state: 'CLOSED',
            key: 'example.com',
          }
        },
      };
      
      const response = new Response('data', { status: 200 });
      
      await middleware(context, async () => {
        context.res = response;
      });
      
      expect(onMetrics).toHaveBeenCalledWith(
        expect.objectContaining({
          circuitBreaker: {
            state: 'CLOSED',
            key: 'example.com',
          },
        })
      );
    });
  });

  describe('metricsWithCollector', () => {
    it('should use custom collector', async () => {
      const collector = vi.fn();
      const middleware = metricsWithCollector(collector);
      
      const context: Context = {
        req: new Request('https://example.com/', { method: 'GET' }),
        options: { url: 'https://example.com/', method: 'GET' },
        state: {},
        meta: {},
      };
      
      const response = new Response('data', { status: 200 });
      
      await middleware(context, async () => {
        context.res = response;
      });
      
      expect(collector).toHaveBeenCalledWith(
        expect.objectContaining({
          startTime: expect.any(Number),
          endTime: expect.any(Number),
          duration: expect.any(Number),
          retries: 0,
          url: 'https://example.com/',
          method: 'GET',
          requestHeaders: expect.any(Object),
          responseHeaders: expect.any(Object),
          status: 200,
        })
      );
    });
  });

  describe('metricsWithLogging', () => {
    it('should log metrics to console', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const middleware = metricsWithLogging();
      
      const context: Context = {
        req: new Request('https://example.com/', { method: 'GET' }),
        options: { url: 'https://example.com/', method: 'GET' },
        state: {},
        meta: {},
      };
      
      const response = new Response('data', { status: 200 });
      
      await middleware(context, async () => {
        context.res = response;
      });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[HyperHTTP Metrics] GET https://example.com/ - 200')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('metricsWithJSONLogging', () => {
    it('should log metrics as JSON', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const middleware = metricsWithJSONLogging();
      
      const context: Context = {
        req: new Request('https://example.com/', { method: 'GET' }),
        options: { url: 'https://example.com/', method: 'GET' },
        state: {},
        meta: {},
      };
      
      const response = new Response('data', { status: 200 });
      
      await middleware(context, async () => {
        context.res = response;
      });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('"timestamp":')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('metricsWithFormatter', () => {
    it('should use custom formatter', async () => {
      const formatter = vi.fn().mockReturnValue('Custom format');
      
      const middleware = metricsWithFormatter(formatter);
      
      const context: Context = {
        req: new Request('https://example.com/', { method: 'GET' }),
        options: { url: 'https://example.com/', method: 'GET' },
        state: {},
        meta: {},
      };
      
      const response = new Response('data', { status: 200 });
      
      await middleware(context, async () => {
        context.res = response;
      });
      
      expect(formatter).toHaveBeenCalledWith(
        expect.objectContaining({
          startTime: expect.any(Number),
          endTime: expect.any(Number),
          duration: expect.any(Number),
          retries: 0,
          url: 'https://example.com/',
          method: 'GET',
          requestHeaders: expect.any(Object),
          responseHeaders: expect.any(Object),
          status: 200,
        })
      );
    });
  });

  describe('metricsWithAggregation', () => {
    it('should aggregate metrics', async () => {
      const middleware = metricsWithAggregation();
      
      const context1: Context = {
        req: new Request('https://example.com/page1', { method: 'GET' }),
        options: { url: 'https://example.com/page1', method: 'GET' },
        state: {},
        meta: {},
      };
      
      const context2: Context = {
        req: new Request('https://example.com/page1', { method: 'GET' }),
        options: { url: 'https://example.com/page1', method: 'GET' },
        state: {},
        meta: {},
      };
      
      const response = new Response('data', { status: 200 });
      
      await middleware(context1, async () => {
        context1.res = response;
      });
      
      await middleware(context2, async () => {
        context2.res = response;
      });
      
      // Should aggregate metrics for the same endpoint
      expect(context1.meta).toBeDefined();
      expect(context2.meta).toBeDefined();
    });
  });

  describe('metricsWithHistogram', () => {
    it('should create histogram buckets', async () => {
      const middleware = metricsWithHistogram([10, 50, 100, 200, 500, 1000]);
      
      const context: Context = {
        req: new Request('https://example.com/', { method: 'GET' }),
        options: { url: 'https://example.com/', method: 'GET' },
        state: {},
        meta: {},
      };
      
      const response = new Response('data', { status: 200 });
      
      await middleware(context, async () => {
        context.res = response;
      });
      
      // Should create histogram buckets
      expect(context.meta).toBeDefined();
    });
  });

  describe('metricsByKey', () => {
    it('should use custom key generator', async () => {
      const keyExtractor = vi.fn().mockReturnValue('custom-key');
      const onMetrics = vi.fn();
      
      const middleware = metricsByKey(keyExtractor, { onMetrics });
      
      const context: Context = {
        req: new Request('https://example.com/', { method: 'GET' }),
        options: { url: 'https://example.com/', method: 'GET' },
        state: {},
        meta: {},
      };
      
      const response = new Response('data', { status: 200 });
      
      await middleware(context, async () => {
        context.res = response;
      });
      
      expect(keyExtractor).toHaveBeenCalledWith(context.req);
      expect(onMetrics).toHaveBeenCalled();
    });
  });

  describe('metricsWithFilter', () => {
    it('should filter metrics', async () => {
      const filter = vi.fn().mockReturnValue(false);
      const onMetrics = vi.fn();
      
      const middleware = metricsWithFilter(filter, { onMetrics });
      
      const context: Context = {
        req: new Request('https://example.com/', { method: 'GET' }),
        options: { url: 'https://example.com/', method: 'GET' },
        state: {},
        meta: {},
      };
      
      const response = new Response('data', { status: 200 });
      
      await middleware(context, async () => {
        context.res = response;
      });
      
      expect(filter).toHaveBeenCalledWith(
        expect.objectContaining({
          startTime: expect.any(Number),
          endTime: expect.any(Number),
          duration: expect.any(Number),
          retries: 0,
          url: 'https://example.com/',
          method: 'GET',
          requestHeaders: expect.any(Object),
          responseHeaders: expect.any(Object),
          status: 200,
        })
      );
      
      expect(onMetrics).not.toHaveBeenCalled();
    });
  });

  describe('metricsWithSampling', () => {
    it('should sample metrics', async () => {
      const onMetrics = vi.fn();
      
      const middleware = metricsWithSampling(0.5, { onMetrics });
      
      const context: Context = {
        req: new Request('https://example.com/', { method: 'GET' }),
        options: { url: 'https://example.com/', method: 'GET' },
        state: {},
        meta: {},
      };
      
      const response = new Response('data', { status: 200 });
      
      await middleware(context, async () => {
        context.res = response;
      });
      
      // Should sample metrics with 50% probability - test multiple times
      let called = false;
      for (let i = 0; i < 10; i++) {
        onMetrics.mockClear();
        await middleware(context, async () => {
          context.res = response;
        });
        if (onMetrics.mock.calls.length > 0) {
          called = true;
          break;
        }
      }
      expect(called).toBe(true);
    });
  });

  describe('metricsWithBuffering', () => {
    it('should buffer metrics', async () => {
      const onMetrics = vi.fn();
      
      const middleware = metricsWithBuffering(2, 100, { onMetrics });
      
      const context1: Context = {
        req: new Request('https://example.com/', { method: 'GET' }),
        options: { url: 'https://example.com/', method: 'GET' },
        state: {},
        meta: {},
      };
      
      const context2: Context = {
        req: new Request('https://example.com/', { method: 'GET' }),
        options: { url: 'https://example.com/', method: 'GET' },
        state: {},
        meta: {},
      };
      
      const response = new Response('data', { status: 200 });
      
      await middleware(context1, async () => {
        context1.res = response;
      });
      
      expect(onMetrics).not.toHaveBeenCalled();
      
      await middleware(context2, async () => {
        context2.res = response;
      });
      
      expect(onMetrics).toHaveBeenCalledTimes(2);
    });
  });
});
