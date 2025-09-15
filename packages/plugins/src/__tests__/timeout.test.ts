/**
 * Tests for HyperHTTP timeout plugin
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  timeout, 
  timeoutPerAttempt, 
  totalTimeout, 
  timeoutByMethod, 
  timeoutWithBackoff, 
  timeoutWithRetryAfter 
} from '../timeout.js';
import type { Context } from 'hyperhttp-core';

describe('HyperHTTP Timeout Plugin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('timeout', () => {
    it('should timeout requests after specified duration', async () => {
      const middleware = timeout({ timeout: 100 });
      
      const context: Context = {
        req: new Request('https://example.com'),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      await expect(middleware(context, async () => {
        await new Promise((resolve, reject) => {
          const timeoutId = setTimeout(resolve, 200);
          context.signal?.addEventListener('abort', () => {
            clearTimeout(timeoutId);
            reject(new Error('Request aborted'));
          });
        });
      })).rejects.toThrow();
    });

    it('should not timeout requests that complete quickly', async () => {
      const middleware = timeout({ timeout: 100 });
      
      const context: Context = {
        req: new Request('https://example.com'),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      await expect(middleware(context, async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      })).resolves.not.toThrow();
    });

    it('should not apply timeout when disabled', async () => {
      const middleware = timeout({ enabled: false });
      
      const context: Context = {
        req: new Request('https://example.com'),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      await expect(middleware(context, async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      })).resolves.not.toThrow();
    });
  });

  describe('timeoutPerAttempt', () => {
    it('should timeout per attempt', async () => {
      const middleware = timeoutPerAttempt(100);
      
      const context: Context = {
        req: new Request('https://example.com'),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      await expect(middleware(context, async () => {
        await new Promise((resolve, reject) => {
          const timeoutId = setTimeout(resolve, 200);
          context.signal?.addEventListener('abort', () => {
            clearTimeout(timeoutId);
            reject(new Error('Request aborted'));
          });
        });
      })).rejects.toThrow();
    });
  });

  describe('totalTimeout', () => {
    it('should timeout after total duration', async () => {
      const middleware = totalTimeout(100);
      
      const context: Context = {
        req: new Request('https://example.com'),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      await expect(middleware(context, async () => {
        await new Promise((resolve, reject) => {
          const timeoutId = setTimeout(resolve, 200);
          context.signal?.addEventListener('abort', () => {
            clearTimeout(timeoutId);
            reject(new Error('Request aborted'));
          });
        });
      })).rejects.toThrow();
    });
  });

  describe('timeoutByMethod', () => {
    it('should apply different timeouts for different methods', async () => {
      const middleware = timeoutByMethod({
        'GET': 100,
        'POST': 200,
        '*': 50
      });
      
      const getContext: Context = {
        req: new Request('https://example.com', { method: 'GET' }),
        options: { url: 'https://example.com', method: 'GET' },
        state: {},
        meta: {},
      };
      
      const postContext: Context = {
        req: new Request('https://example.com', { method: 'POST' }),
        options: { url: 'https://example.com', method: 'POST' },
        state: {},
        meta: {},
      };
      
      // GET should timeout quickly
      await expect(middleware(getContext, async () => {
        await new Promise((resolve, reject) => {
          const timeoutId = setTimeout(resolve, 150);
          getContext.signal?.addEventListener('abort', () => {
            clearTimeout(timeoutId);
            reject(new Error('Request aborted'));
          });
        });
      })).rejects.toThrow();
      
      // POST should not timeout
      await expect(middleware(postContext, async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      })).resolves.not.toThrow();
    });
  });

  describe('timeoutWithBackoff', () => {
    it('should increase timeout with each attempt', async () => {
      const middleware = timeoutWithBackoff(100, 1000, 2);
      
      const context: Context = {
        req: new Request('https://example.com'),
        options: { url: 'https://example.com' },
        state: { retryAttempt: 1 },
        meta: {},
      };
      
      // First attempt should timeout quickly
      await expect(middleware(context, async () => {
        await new Promise((resolve, reject) => {
          const timeoutId = setTimeout(resolve, 150);
          context.signal?.addEventListener('abort', () => {
            clearTimeout(timeoutId);
            reject(new Error('Request aborted'));
          });
        });
      })).rejects.toThrow();
      
      // Second attempt should have longer timeout
      context.state.retryAttempt = 2;
      await expect(middleware(context, async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      })).resolves.not.toThrow();
    });
  });

  describe('timeoutWithRetryAfter', () => {
    it('should respect Retry-After header', async () => {
      const middleware = timeoutWithRetryAfter(100, 2000);
      
      const context: Context = {
        req: new Request('https://example.com'),
        options: { url: 'https://example.com' },
        state: {},
        meta: {
          retryAfter: 1000 // 1 second in milliseconds
        },
      };
      
      const start = Date.now();
      await expect(middleware(context, async () => {
        await new Promise((resolve, reject) => {
          const timeoutId = setTimeout(resolve, 1200); // Wait longer than retryAfter
          context.signal?.addEventListener('abort', () => {
            clearTimeout(timeoutId);
            reject(new Error('Request aborted'));
          });
        });
      })).rejects.toThrow();
      const end = Date.now();
      
      // Should wait at least 1 second due to Retry-After header
      expect(end - start).toBeGreaterThanOrEqual(1000);
    });
  });
});
