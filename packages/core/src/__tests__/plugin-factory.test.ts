/**
 * Tests for Plugin Factory
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createPlugin,
  createConditionalPlugin,
  createWrapperPlugin,
  createRetryablePlugin,
  createTimeoutPlugin,
  createMetricsPlugin,
  createCachedPlugin,
  createRateLimitedPlugin,
  PluginComposer,
} from '../plugin-factory.js';
import type { Context, Middleware } from '../types.js';

describe('Plugin Factory', () => {
  let mockContext: Context;
  let mockNext: () => Promise<void>;

  beforeEach(() => {
    mockContext = {
      req: new Request('https://example.com'),
      res: undefined,
      signal: new AbortController().signal,
      meta: {},
      state: {},
    };
    mockNext = vi.fn().mockResolvedValue(undefined);
  });

  describe('createPlugin', () => {
    it('should create a plugin with default options', async () => {
      const plugin = createPlugin(
        'test-plugin',
        { enabled: true, name: 'test' },
        (config, ctx, next) => {
          ctx.meta.test = 'value';
          return next();
        }
      );

      const middleware = plugin();
      await middleware(mockContext, mockNext);

      expect(mockContext.meta.test).toBe('value');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should skip disabled plugins', async () => {
      const plugin = createPlugin(
        'test-plugin',
        { enabled: false, name: 'test' },
        (config, ctx, next) => {
          ctx.meta.test = 'value';
          return next();
        }
      );

      const middleware = plugin();
      await middleware(mockContext, mockNext);

      expect(mockContext.meta.test).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should merge options correctly', async () => {
      const plugin = createPlugin(
        'test-plugin',
        { enabled: true, name: 'default', value: 0 },
        (config, ctx, next) => {
          ctx.meta.test = config.value;
          return next();
        }
      );

      const middleware = plugin({ value: 42 });
      await middleware(mockContext, mockNext);

      expect(mockContext.meta.test).toBe(42);
    });
  });

  describe('createConditionalPlugin', () => {
    it('should run plugin when condition is true', async () => {
      const plugin = createConditionalPlugin(
        'test-plugin',
        (ctx) => ctx.req.url.includes('example'),
        { enabled: true, name: 'test' },
        (config, ctx, next) => {
          ctx.meta.test = 'value';
          return next();
        }
      );

      const middleware = plugin();
      await middleware(mockContext, mockNext);

      expect(mockContext.meta.test).toBe('value');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should skip plugin when condition is false', async () => {
      const plugin = createConditionalPlugin(
        'test-plugin',
        (ctx) => ctx.req.url.includes('other'),
        { enabled: true, name: 'test' },
        (config, ctx, next) => {
          ctx.meta.test = 'value';
          return next();
        }
      );

      const middleware = plugin();
      await middleware(mockContext, mockNext);

      expect(mockContext.meta.test).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('createRetryablePlugin', () => {
    it('should retry on failure', async () => {
      let attempt = 0;
      const plugin = createRetryablePlugin(
        'test-plugin',
        { enabled: true, name: 'test' },
        (config, ctx, next) => {
          attempt++;
          if (attempt < 3) {
            throw new Error('Test error');
          }
          ctx.meta.test = 'success';
          return next();
        },
        { maxRetries: 3, retryDelay: 10 }
      );

      const middleware = plugin();
      await middleware(mockContext, mockNext);

      expect(attempt).toBe(3);
      expect(mockContext.meta.test).toBe('success');
    });

    it('should throw error after max retries', async () => {
      const plugin = createRetryablePlugin(
        'test-plugin',
        { enabled: true, name: 'test' },
        (config, ctx, next) => {
          throw new Error('Test error');
        },
        { maxRetries: 2, retryDelay: 10 }
      );

      const middleware = plugin();
      
      await expect(middleware(mockContext, mockNext)).rejects.toThrow('Test error');
    });
  });

  describe('createTimeoutPlugin', () => {
    it('should timeout after specified duration', async () => {
      const plugin = createTimeoutPlugin(
        'test-plugin',
        { enabled: true, name: 'test', timeout: 50 },
        (config, ctx, next) => {
          return new Promise(resolve => {
            setTimeout(() => {
              ctx.meta.test = 'value';
              resolve();
            }, 100);
          });
        }
      );

      const middleware = plugin();
      
      await expect(middleware(mockContext, mockNext)).rejects.toThrow('timed out');
    });

    it('should complete before timeout', async () => {
      const plugin = createTimeoutPlugin(
        'test-plugin',
        { enabled: true, name: 'test', timeout: 100 },
        (config, ctx, next) => {
          ctx.meta.test = 'value';
          return next();
        }
      );

      const middleware = plugin();
      await middleware(mockContext, mockNext);

      expect(mockContext.meta.test).toBe('value');
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('createMetricsPlugin', () => {
    it('should collect metrics on success', async () => {
      const plugin = createMetricsPlugin(
        'test-plugin',
        { enabled: true, name: 'test' },
        (config, ctx, next) => {
          ctx.meta.test = 'value';
          return next();
        }
      );

      const middleware = plugin();
      await middleware(mockContext, mockNext);

      expect(mockContext.meta.metrics).toBeDefined();
      expect(mockContext.meta.metrics!['test-plugin']).toBeDefined();
      expect(mockContext.meta.metrics!['test-plugin'].success).toBe(true);
      expect(mockContext.meta.metrics!['test-plugin'].duration).toBeGreaterThan(0);
    });

    it('should collect metrics on error', async () => {
      const plugin = createMetricsPlugin(
        'test-plugin',
        { enabled: true, name: 'test' },
        (config, ctx, next) => {
          throw new Error('Test error');
        }
      );

      const middleware = plugin();
      
      await expect(middleware(mockContext, mockNext)).rejects.toThrow('Test error');
      
      expect(mockContext.meta.metrics).toBeDefined();
      expect(mockContext.meta.metrics!['test-plugin']).toBeDefined();
      expect(mockContext.meta.metrics!['test-plugin'].success).toBe(false);
      expect(mockContext.meta.metrics!['test-plugin'].error).toBe('Test error');
    });
  });

  describe('createCachedPlugin', () => {
    it('should cache results', async () => {
      let callCount = 0;
      const plugin = createCachedPlugin(
        'test-plugin',
        { enabled: true, name: 'test' },
        (config, ctx, next) => {
          callCount++;
          ctx.meta.test = 'value';
          ctx.res = new Response('test');
          return next();
        },
        { ttl: 1000 }
      );

      const middleware = plugin();
      
      // First call
      await middleware(mockContext, mockNext);
      expect(callCount).toBe(1);
      expect(mockContext.meta.cacheHit).toBe(false);
      
      // Second call (should use cache)
      const newContext = { ...mockContext, res: undefined };
      await middleware(newContext, mockNext);
      expect(callCount).toBe(1); // Should not call again
      expect(newContext.meta.cacheHit).toBe(true);
    });
  });

  describe('createRateLimitedPlugin', () => {
    it('should allow requests within limit', async () => {
      const plugin = createRateLimitedPlugin(
        'test-plugin',
        { enabled: true, name: 'test' },
        (config, ctx, next) => {
          ctx.meta.test = 'value';
          return next();
        },
        { limit: 2, window: 1000 }
      );

      const middleware = plugin();
      
      // First request
      await middleware(mockContext, mockNext);
      expect(mockContext.meta.test).toBe('value');
      
      // Second request
      const newContext = { ...mockContext };
      await middleware(newContext, mockNext);
      expect(newContext.meta.test).toBe('value');
    });

    it('should block requests over limit', async () => {
      const plugin = createRateLimitedPlugin(
        'test-plugin',
        { enabled: true, name: 'test' },
        (config, ctx, next) => {
          ctx.meta.test = 'value';
          return next();
        },
        { limit: 1, window: 1000 }
      );

      const middleware = plugin();
      
      // First request (should pass)
      await middleware(mockContext, mockNext);
      expect(mockContext.meta.test).toBe('value');
      
      // Second request (should be blocked)
      const newContext = { ...mockContext };
      await expect(middleware(newContext, mockNext)).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('PluginComposer', () => {
    it('should compose multiple plugins', async () => {
      const composer = new PluginComposer();
      
      composer.add('plugin1', async (ctx, next) => {
        ctx.meta.plugin1 = 'value1';
        await next();
      }, 1);
      
      composer.add('plugin2', async (ctx, next) => {
        ctx.meta.plugin2 = 'value2';
        await next();
      }, 2);
      
      const middleware = composer.compose();
      await middleware(mockContext, mockNext);
      
      expect(mockContext.meta.plugin1).toBe('value1');
      expect(mockContext.meta.plugin2).toBe('value2');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should respect plugin priority', async () => {
      const composer = new PluginComposer();
      const callOrder: string[] = [];
      
      composer.add('plugin2', async (ctx, next) => {
        callOrder.push('plugin2');
        await next();
      }, 2);
      
      composer.add('plugin1', async (ctx, next) => {
        callOrder.push('plugin1');
        await next();
      }, 1);
      
      const middleware = composer.compose();
      await middleware(mockContext, mockNext);
      
      expect(callOrder).toEqual(['plugin1', 'plugin2']);
    });

    it('should remove plugins', async () => {
      const composer = new PluginComposer();
      
      composer.add('plugin1', async (ctx, next) => {
        ctx.meta.plugin1 = 'value1';
        await next();
      });
      
      composer.add('plugin2', async (ctx, next) => {
        ctx.meta.plugin2 = 'value2';
        await next();
      });
      
      composer.remove('plugin1');
      
      const middleware = composer.compose();
      await middleware(mockContext, mockNext);
      
      expect(mockContext.meta.plugin1).toBeUndefined();
      expect(mockContext.meta.plugin2).toBe('value2');
    });

    it('should clear all plugins', async () => {
      const composer = new PluginComposer();
      
      composer.add('plugin1', async (ctx, next) => {
        ctx.meta.plugin1 = 'value1';
        await next();
      });
      
      composer.clear();
      
      const middleware = composer.compose();
      await middleware(mockContext, mockNext);
      
      expect(mockContext.meta.plugin1).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
