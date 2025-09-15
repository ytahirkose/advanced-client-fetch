/**
 * Tests for HyperHTTP rate limiting plugin
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  rateLimit, 
  rateLimitByEndpoint, 
  rateLimitByUser, 
  rateLimitByIP, 
  rateLimitByKey, 
  rateLimitWithBurst, 
  rateLimitWithBackoff 
} from '../rate-limit.js';
import { RateLimitError } from 'hyperhttp-core';
import type { Context } from 'hyperhttp-core';
import { MemoryRateLimitStorage } from '../rate-limit.js';

describe('HyperHTTP Rate Limiting Plugin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock RateLimitError
    vi.mock('hyperhttp-core', async () => {
      const actual = await vi.importActual('hyperhttp-core');
      return {
        ...actual,
        RateLimitError: class RateLimitError extends Error {
          constructor(message: string, limit: number, remaining: number, resetTime: number) {
            super(message);
            this.name = 'RateLimitError';
            (this as any).limit = limit;
            (this as any).remaining = remaining;
            (this as any).resetTime = resetTime;
          }
        }
      };
    });
  });

  describe('rateLimit', () => {
    it('should allow requests within limit', async () => {
      const middleware = rateLimit({
        limit: 2,
        window: 1000,
        storage: new MemoryRateLimitStorage() // Use fresh storage for each test
      });
      
      const context: Context = {
        req: new Request('https://example.com'),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      await expect(middleware(context, async () => {})).resolves.not.toThrow();
      expect(context.meta.rateLimit).toBeDefined();
      expect(context.meta.rateLimit?.remaining).toBe(1);
    });

    it('should block requests when limit exceeded', async () => {
      const middleware = rateLimit({
        limit: 1,
        windowMs: 1000,
        algorithm: 'sliding-window',
        storage: new MemoryRateLimitStorage()
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
      await expect(middleware(context1, async () => {})).resolves.not.toThrow();
      
      // Second request should be blocked
      await expect(middleware(context2, async () => {})).rejects.toThrow('Too Many Requests');
    });

    it('should reset limit after window expires', async () => {
      const middleware = rateLimit({
        limit: 1,
        windowMs: 100,
        algorithm: 'sliding-window',
        storage: new MemoryRateLimitStorage()
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
      await expect(middleware(context1, async () => {})).resolves.not.toThrow();
      
      // Second request should be blocked
      await expect(middleware(context2, async () => {})).rejects.toThrow('Too Many Requests');
      
      // Wait for window to reset
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Third request should succeed
      const context3: Context = {
        req: new Request('https://example.com'),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      await expect(middleware(context3, async () => {})).resolves.not.toThrow();
    });

    it('should use token bucket algorithm', async () => {
      const middleware = rateLimit({
        limit: 2,
        windowMs: 1000,
        algorithm: 'token-bucket',
        storage: new MemoryRateLimitStorage()
      });
      
      const context: Context = {
        req: new Request('https://example.com'),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      await expect(middleware(context, async () => {})).resolves.not.toThrow();
      expect(context.meta.rateLimit?.remaining).toBe(1);
    });

    it('should skip successful requests when configured', async () => {
      const middleware = rateLimit({
        maxRequests: 1,
        windowMs: 1000,
        algorithm: 'sliding-window',
        skipSuccessfulRequests: true
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
      
      // First request succeeds
      await middleware(context1, async () => {
        context1.res = new Response('OK', { status: 200 });
      });
      
      // Second request should still be allowed because first was successful
      await expect(middleware(context2, async () => {})).resolves.not.toThrow();
    });

    it('should skip failed requests when configured', async () => {
      const middleware = rateLimit({
        maxRequests: 1,
        windowMs: 1000,
        algorithm: 'sliding-window',
        skipFailedRequests: true
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
      
      // First request fails
      await middleware(context1, async () => {
        context1.res = new Response('Error', { status: 500 });
      });
      
      // Second request should still be allowed because first failed
      await expect(middleware(context2, async () => {})).resolves.not.toThrow();
    });
  });

  describe('rateLimitByEndpoint', () => {
    it('should apply different limits for different endpoints', async () => {
      const middleware = rateLimitByEndpoint({
        '/api/users': {
          maxRequests: 1,
          windowMs: 1000,
          algorithm: 'sliding-window'
        },
        '/api/posts': {
          maxRequests: 2,
          windowMs: 1000,
          algorithm: 'sliding-window'
        },
        '*': {
          maxRequests: 5,
          windowMs: 1000,
          algorithm: 'sliding-window'
        }
      });
      
      const usersContext: Context = {
        req: new Request('https://example.com/api/users'),
        options: { url: 'https://example.com/api/users' },
        state: {},
        meta: {},
      };
      
      const postsContext: Context = {
        req: new Request('https://example.com/api/posts'),
        options: { url: 'https://example.com/api/posts' },
        state: {},
        meta: {},
      };
      
      // Users endpoint should have limit of 1
      await expect(middleware(usersContext, async () => {})).resolves.not.toThrow();
      
      const usersContext2: Context = {
        req: new Request('https://example.com/api/users'),
        options: { url: 'https://example.com/api/users' },
        state: {},
        meta: {},
      };
      
      await expect(middleware(usersContext2, async () => {})).rejects.toThrow('Too Many Requests');
      
      // Posts endpoint should have limit of 2
      await expect(middleware(postsContext, async () => {})).resolves.not.toThrow();
    });
  });

  describe('rateLimitByUser', () => {
    it('should apply rate limiting per user', async () => {
      const middleware = rateLimitByUser(
        {
          limit: 1,
          windowMs: 1000,
          algorithm: 'sliding-window',
          storage: new MemoryRateLimitStorage()
        },
        (request) => request.headers.get('X-User-ID')
      );
      
      const user1Context: Context = {
        req: new Request('https://example.com', {
          headers: { 'X-User-ID': 'user1' }
        }),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      const user2Context: Context = {
        req: new Request('https://example.com', {
          headers: { 'X-User-ID': 'user2' }
        }),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      // User 1 should be allowed
      await expect(middleware(user1Context, async () => {})).resolves.not.toThrow();
      
      // User 2 should also be allowed (different user)
      await expect(middleware(user2Context, async () => {})).resolves.not.toThrow();
      
      // User 1 second request should be blocked
      const user1Context2: Context = {
        req: new Request('https://example.com', {
          headers: { 'X-User-ID': 'user1' }
        }),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      await expect(middleware(user1Context2, async () => {})).rejects.toThrow('Too Many Requests');
    });
  });

  describe('rateLimitByIP', () => {
    it('should apply rate limiting per IP', async () => {
      const middleware = rateLimitByIP({
        maxRequests: 1,
        windowMs: 1000,
        algorithm: 'sliding-window'
      });
      
      const context1: Context = {
        req: new Request('https://example.com', {
          headers: { 'X-Forwarded-For': '192.168.1.1' }
        }),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      const context2: Context = {
        req: new Request('https://example.com', {
          headers: { 'X-Forwarded-For': '192.168.1.2' }
        }),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      // IP 1 should be allowed
      await expect(middleware(context1, async () => {})).resolves.not.toThrow();
      
      // IP 2 should also be allowed (different IP)
      await expect(middleware(context2, async () => {})).resolves.not.toThrow();
    });
  });

  describe('rateLimitByKey', () => {
    it('should apply rate limiting by custom key', async () => {
      const middleware = rateLimitByKey(
        {
          maxRequests: 1,
          windowMs: 1000,
          algorithm: 'sliding-window'
        },
        (request) => request.url
      );
      
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
      
      // Page 1 should be allowed
      await expect(middleware(context1, async () => {})).resolves.not.toThrow();
      
      // Page 2 should also be allowed (different key)
      await expect(middleware(context2, async () => {})).resolves.not.toThrow();
    });
  });

  describe('rateLimitWithBurst', () => {
    it('should allow burst requests', async () => {
      const middleware = rateLimitWithBurst(1, 3, 1000);
      
      const context: Context = {
        req: new Request('https://example.com'),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      // Should allow up to 3 requests in burst
      await expect(middleware(context, async () => {})).resolves.not.toThrow();
      await expect(middleware(context, async () => {})).resolves.not.toThrow();
      await expect(middleware(context, async () => {})).resolves.not.toThrow();
      
      // Fourth request should be blocked
      await expect(middleware(context, async () => {})).rejects.toThrow('Too Many Requests');
    });
  });

  describe('rateLimitWithBackoff', () => {
    it('should increase rate limit with each attempt', async () => {
      const middleware = rateLimitWithBackoff(1, 5, 1000);
      
      const context: Context = {
        req: new Request('https://example.com'),
        options: { url: 'https://example.com' },
        state: { rateLimitAttempt: 1 },
        meta: {},
      };
      
      // First attempt should be allowed
      await expect(middleware(context, async () => {})).resolves.not.toThrow();
      
      // Second attempt should be blocked
      await expect(middleware(context, async () => {})).rejects.toThrow('Too Many Requests');
    });
  });
});
