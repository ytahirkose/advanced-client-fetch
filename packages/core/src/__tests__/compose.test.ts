/**
 * Tests for HyperHTTP middleware composition
 */

import { describe, it, expect, vi } from 'vitest';
import {
  compose,
  parallel,
  conditional,
  once,
  withErrorHandling,
  withTiming,
  withLogging,
} from '../compose.js';
import type { Context, Middleware } from '../types.js';

describe('HyperHTTP Compose', () => {
  describe('compose', () => {
    it('should compose middleware functions', async () => {
      const middleware1: Middleware = vi.fn(async (ctx, next) => {
        ctx.state.value1 = 'test1';
        await next();
      });
      
      const middleware2: Middleware = vi.fn(async (ctx, next) => {
        ctx.state.value2 = 'test2';
        await next();
      });
      
      const composed = compose([middleware1, middleware2]);
      
      const context: Context = {
        req: new Request('https://example.com'),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      await composed(context, async () => {
        // Final handler
      });
      
      expect(middleware1).toHaveBeenCalled();
      expect(middleware2).toHaveBeenCalled();
      expect(context.state.value1).toBe('test1');
      expect(context.state.value2).toBe('test2');
    });

    it('should throw error for non-function middleware', () => {
      expect(() => compose([{} as any])).toThrow('Middleware must be composed of functions!');
    });

    it('should throw error for non-array middleware', () => {
      expect(() => compose({} as any)).toThrow('Middleware stack must be an array!');
    });

    it('should throw error for multiple next() calls', async () => {
      const middleware: Middleware = async (ctx, next) => {
        await next();
        await next(); // This should throw
      };
      
      const composed = compose([middleware]);
      const context: Context = {
        req: new Request('https://example.com'),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      await expect(composed(context, async () => {})).rejects.toThrow('next() called multiple times');
    });
  });

  describe('parallel', () => {
    it('should run middleware in parallel', async () => {
      const middleware1: Middleware = vi.fn(async (ctx, next) => {
        await new Promise(resolve => setTimeout(resolve, 50));
        ctx.state.value1 = 'test1';
        await next();
      });
      
      const middleware2: Middleware = vi.fn(async (ctx, next) => {
        await new Promise(resolve => setTimeout(resolve, 50));
        ctx.state.value2 = 'test2';
        await next();
      });
      
      const parallelMw = parallel(middleware1, middleware2);
      
      const context: Context = {
        req: new Request('https://example.com'),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      const start = Date.now();
      await parallelMw(context, async () => {});
      const end = Date.now();
      
      expect(middleware1).toHaveBeenCalled();
      expect(middleware2).toHaveBeenCalled();
      expect(context.state.value1).toBe('test1');
      expect(context.state.value2).toBe('test2');
      expect(end - start).toBeLessThan(100); // Should run in parallel
    });
  });

  describe('conditional', () => {
    it('should run middleware when condition is true', async () => {
      const middleware: Middleware = vi.fn(async (ctx, next) => {
        ctx.state.ran = true;
        await next();
      });
      
      const conditionalMw = conditional(
        (ctx) => ctx.req.method === 'GET',
        middleware
      );
      
      const context: Context = {
        req: new Request('https://example.com', { method: 'GET' }),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      await conditionalMw(context, async () => {});
      
      expect(middleware).toHaveBeenCalled();
      expect(context.state.ran).toBe(true);
    });

    it('should skip middleware when condition is false', async () => {
      const middleware: Middleware = vi.fn(async (ctx, next) => {
        ctx.state.ran = true;
        await next();
      });
      
      const conditionalMw = conditional(
        (ctx) => ctx.req.method === 'POST',
        middleware
      );
      
      const context: Context = {
        req: new Request('https://example.com', { method: 'GET' }),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      await conditionalMw(context, async () => {});
      
      expect(middleware).not.toHaveBeenCalled();
      expect(context.state.ran).toBeUndefined();
    });
  });

  describe('once', () => {
    it('should run middleware only once per request', async () => {
      const middleware: Middleware = vi.fn(async (ctx, next) => {
        ctx.state.count = (ctx.state.count || 0) + 1;
        await next();
      });
      
      const onceMw = once(middleware);
      
      const context: Context = {
        req: new Request('https://example.com'),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      // First call
      await onceMw(context, async () => {});
      expect(middleware).toHaveBeenCalledTimes(1);
      expect(context.state.count).toBe(1);
      
      // Second call - should be skipped
      await onceMw(context, async () => {});
      expect(middleware).toHaveBeenCalledTimes(1);
      expect(context.state.count).toBe(1);
    });
  });

  describe('withErrorHandling', () => {
    it('should handle errors in middleware', async () => {
      const error = new Error('Test error');
      const middleware: Middleware = vi.fn(async (ctx, next) => {
        throw error;
      });
      
      const onError = vi.fn();
      const errorHandlingMw = withErrorHandling(middleware, onError);
      
      const context: Context = {
        req: new Request('https://example.com'),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      await expect(errorHandlingMw(context, async () => {})).rejects.toThrow('Test error');
      expect(onError).toHaveBeenCalledWith(error, context);
    });

    it('should not call onError when no error occurs', async () => {
      const middleware: Middleware = vi.fn(async (ctx, next) => {
        ctx.state.success = true;
        await next();
      });
      
      const onError = vi.fn();
      const errorHandlingMw = withErrorHandling(middleware, onError);
      
      const context: Context = {
        req: new Request('https://example.com'),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      await errorHandlingMw(context, async () => {});
      
      expect(onError).not.toHaveBeenCalled();
      expect(context.state.success).toBe(true);
    });
  });

  describe('withTiming', () => {
    it('should measure middleware execution time', async () => {
      const middleware: Middleware = vi.fn(async (ctx, next) => {
        await new Promise(resolve => setTimeout(resolve, 50));
        await next();
      });
      
      const timingMw = withTiming(middleware);
      
      const context: Context = {
        req: new Request('https://example.com'),
        options: { url: 'https://example.com' },
        state: {},
        meta: { timing: {} },
      };
      
      await timingMw(context, async () => {});
      
      expect(context.meta.timing).toBeDefined();
      expect(context.meta.timing.anonymous).toBeDefined();
      expect(context.meta.timing.anonymous).toBeGreaterThanOrEqual(0);
    });
  });

  describe('withLogging', () => {
    it('should log successful requests', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const middleware: Middleware = vi.fn(async (ctx, next) => {
        ctx.res = new Response('OK', { status: 200 });
        await next();
      });
      
      const loggingMw = withLogging(middleware);
      
      const context: Context = {
        req: new Request('https://example.com', { method: 'GET' }),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      await loggingMw(context, async () => {});
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[HyperHTTP] GET https://example.com/ - 200')
      );
      
      consoleSpy.mockRestore();
    });

    it('should log failed requests', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const middleware: Middleware = vi.fn(async (ctx, next) => {
        throw new Error('Test error');
      });
      
      const loggingMw = withLogging(middleware);
      
      const context: Context = {
        req: new Request('https://example.com', { method: 'GET' }),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      await expect(loggingMw(context, async () => {})).rejects.toThrow('Test error');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[HyperHTTP] GET https://example.com/ - ERROR'),
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });
});
