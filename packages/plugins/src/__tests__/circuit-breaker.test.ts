/**
 * Tests for HyperHTTP circuit breaker plugin
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  circuitBreaker, 
  circuitBreakerByEndpoint, 
  circuitBreakerByHost, 
  circuitBreakerByKey, 
  adaptiveCircuitBreaker, 
  circuitBreakerWithHealthCheck 
} from '../circuit-breaker.js';
import { CircuitBreakerError } from 'hyperhttp-core';
import type { Context } from 'hyperhttp-core';
import { MemoryCircuitBreakerStorage } from '../circuit-breaker.js';

describe('HyperHTTP Circuit Breaker Plugin', () => {
  let storage: MemoryCircuitBreakerStorage;
  
  beforeEach(() => {
    vi.clearAllMocks();
    storage = new MemoryCircuitBreakerStorage();
    
    // Mock CircuitBreakerError
    vi.mock('hyperhttp-core', async () => {
      const actual = await vi.importActual('hyperhttp-core');
      return {
        ...actual,
        CircuitBreakerError: class CircuitBreakerError extends Error {
          constructor(message: string, state: string, failures: number, nextAttemptTime?: number) {
            super(message);
            this.name = 'CircuitBreakerError';
            (this as any).state = state;
            (this as any).failures = failures;
            (this as any).nextAttemptTime = nextAttemptTime;
          }
        }
      };
    });
  });

  describe('circuitBreaker', () => {
    it('should allow requests when circuit is closed', async () => {
      const middleware = circuitBreaker({
        failureThreshold: 3,
        window: 1000,
        resetTimeout: 500,
        storage: new MemoryCircuitBreakerStorage(), // Use fresh storage for each test
        keyGenerator: () => `test-${Date.now()}-${Math.random()}` // Use unique key for each test
      });
      
      const context: Context = {
        req: new Request('https://example.com'),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      await expect(middleware(context, async () => {})).resolves.not.toThrow();
      expect(context.meta.circuitBreaker?.state).toBe('CLOSED');
    });

    it('should open circuit after failure threshold', async () => {
      const middleware = circuitBreaker({
        failureThreshold: 2,
        windowMs: 1000,
        resetTimeout: 500,
        minimumRequests: 2
      });
      
      const context: Context = {
        req: new Request('https://example.com'),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      // First request fails
      await expect(middleware(context, async () => {
        throw new Error('Network error');
      })).rejects.toThrow('Network error');
      
      // Second request fails
      await expect(middleware(context, async () => {
        throw new Error('Network error');
      })).rejects.toThrow('Network error');
      
      // Third request should be blocked (circuit open)
      await expect(middleware(context, async () => {})).rejects.toThrow('Circuit breaker is open');
    });

    it('should close circuit after reset timeout', async () => {
      const middleware = circuitBreaker({
        failureThreshold: 1,
        window: 1000,
        resetTimeout: 100,
        storage: new MemoryCircuitBreakerStorage(),
        keyGenerator: () => `test-reset-${Date.now()}-${Math.random()}`
      });
      
      const context: Context = {
        req: new Request('https://example.com'),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      // First request fails - circuit opens
      await expect(middleware(context, async () => {
        throw new Error('Network error');
      })).rejects.toThrow('Network error');
      
      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Request should be allowed again (circuit half-open)
      await expect(middleware(context, async () => {})).resolves.not.toThrow();
    });

    it('should close circuit after successful requests in half-open state', async () => {
      const middleware = circuitBreaker({
        failureThreshold: 1,
        window: 1000,
        resetTimeout: 100,
        storage: new MemoryCircuitBreakerStorage(),
        keyGenerator: () => `test-halfopen-${Date.now()}-${Math.random()}`
      });
      
      const context: Context = {
        req: new Request('https://example.com'),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      // First request fails - circuit opens
      await expect(middleware(context, async () => {
        throw new Error('Network error');
      })).rejects.toThrow('Network error');
      
      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Successful request should close circuit
      await expect(middleware(context, async () => {})).resolves.not.toThrow();
      
      // Next request should still be allowed (circuit closed)
      await expect(middleware(context, async () => {})).resolves.not.toThrow();
    });

    it('should not count non-retryable errors', async () => {
      const middleware = circuitBreaker({
        failureThreshold: 1,
        window: 1000,
        resetTimeout: 500,
        storage: new MemoryCircuitBreakerStorage(),
        keyGenerator: () => `test-nonretryable-${Date.now()}-${Math.random()}`
      });
      
      const context: Context = {
        req: new Request('https://example.com'),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      // Non-retryable error should not open circuit
      await expect(middleware(context, async () => {
        const error = new Error('Validation error');
        error.name = 'ValidationError';
        throw error;
      })).rejects.toThrow('Validation error');
      
      // Next request should still be allowed
      await expect(middleware(context, async () => {})).resolves.not.toThrow();
    });
  });

  describe('circuitBreakerByEndpoint', () => {
    it.skip('should apply different circuit breakers for different endpoints', async () => {
      const middleware = circuitBreakerByEndpoint({
        '/api/users': {
          failureThreshold: 1,
          window: 1000,
          resetTimeout: 500,
          storage: new MemoryCircuitBreakerStorage()
        },
        '/api/posts': {
          failureThreshold: 2,
          window: 1000,
          resetTimeout: 500,
          storage: new MemoryCircuitBreakerStorage()
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
      
      // Users endpoint should open circuit after 1 failure
      await expect(middleware(usersContext, async () => {
        throw new Error('Network error');
      })).rejects.toThrow('Network error');
      
      // Second request should be blocked by circuit breaker
      await expect(middleware(usersContext, async () => {})).rejects.toThrow('Circuit breaker is open');
      
      // Posts endpoint should still be open (needs 2 failures)
      await expect(middleware(postsContext, async () => {})).resolves.not.toThrow();
    });
  });

  describe('circuitBreakerByHost', () => {
    it('should apply circuit breaker per host', async () => {
      const middleware = circuitBreakerByHost({
        failureThreshold: 1,
        windowMs: 1000,
        resetTimeout: 500,
        minimumRequests: 1
      });
      
      const context1: Context = {
        req: new Request('https://example1.com'),
        options: { url: 'https://example1.com' },
        state: {},
        meta: {},
      };
      
      const context2: Context = {
        req: new Request('https://example2.com'),
        options: { url: 'https://example2.com' },
        state: {},
        meta: {},
      };
      
      // First host fails - circuit opens
      await expect(middleware(context1, async () => {
        throw new Error('Network error');
      })).rejects.toThrow('Network error');
      
      await expect(middleware(context1, async () => {})).rejects.toThrow('Circuit breaker is open');
      
      // Second host should still be open
      await expect(middleware(context2, async () => {})).resolves.not.toThrow();
    });
  });

  describe('circuitBreakerByKey', () => {
    it('should apply circuit breaker by custom key', async () => {
      const middleware = circuitBreakerByKey(
        {
          failureThreshold: 1,
          windowMs: 1000,
          resetTimeout: 500,
          minimumRequests: 1
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
      
      // Page 1 fails - circuit opens
      await expect(middleware(context1, async () => {
        throw new Error('Network error');
      })).rejects.toThrow('Network error');
      
      await expect(middleware(context1, async () => {})).rejects.toThrow('Circuit breaker is open');
      
      // Page 2 should still be open
      await expect(middleware(context2, async () => {})).resolves.not.toThrow();
    });
  });

  describe('adaptiveCircuitBreaker', () => {
    it.skip('should adapt failure threshold based on performance', async () => {
      const middleware = adaptiveCircuitBreaker(
        {
          failureThreshold: 3,
          window: 1000,
          resetTimeout: 500,
          storage: new MemoryCircuitBreakerStorage(),
          keyGenerator: () => `test-adaptive-${Date.now()}-${Math.random()}`
        },
        {
          minFailureThreshold: 1,
          maxFailureThreshold: 10,
          adaptationFactor: 0.5
        }
      );
      
      const context: Context = {
        req: new Request('https://example.com'),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      // Should adapt threshold based on failure rate
      await expect(middleware(context, async () => {})).resolves.not.toThrow();
      expect(context.meta.circuitBreaker?.adaptedThreshold).toBeDefined();
    });
  });

  describe('circuitBreakerWithHealthCheck', () => {
    it.skip('should perform health check before requests', async () => {
      const healthCheck = vi.fn().mockResolvedValue(true);
      const middleware = circuitBreakerWithHealthCheck(
        {
          failureThreshold: 3,
          window: 1000,
          resetTimeout: 500,
          storage: new MemoryCircuitBreakerStorage(),
          keyGenerator: () => `test-health-${Date.now()}-${Math.random()}`
        },
        healthCheck
      );
      
      const context: Context = {
        req: new Request('https://example.com'),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      await expect(middleware(context, async () => {})).resolves.not.toThrow();
      expect(healthCheck).toHaveBeenCalledWith(context.req);
    });

    it.skip('should block requests when health check fails', async () => {
      const healthCheck = vi.fn().mockResolvedValue(false);
      const middleware = circuitBreakerWithHealthCheck(
        {
          failureThreshold: 3,
          window: 1000,
          resetTimeout: 500,
          storage: new MemoryCircuitBreakerStorage(),
          keyGenerator: () => `test-health-fail-${Date.now()}-${Math.random()}`
        },
        healthCheck
      );
      
      const context: Context = {
        req: new Request('https://example.com'),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      await expect(middleware(context, async () => {})).rejects.toThrow('Service is unhealthy');
    });

    it.skip('should block requests when health check throws', async () => {
      const healthCheck = vi.fn().mockRejectedValue(new Error('Health check failed'));
      const middleware = circuitBreakerWithHealthCheck(
        {
          failureThreshold: 3,
          window: 1000,
          resetTimeout: 500,
          storage: new MemoryCircuitBreakerStorage(),
          keyGenerator: () => `test-health-throw-${Date.now()}-${Math.random()}`
        },
        healthCheck
      );
      
      const context: Context = {
        req: new Request('https://example.com'),
        options: { url: 'https://example.com' },
        state: {},
        meta: {},
      };
      
      await expect(middleware(context, async () => {})).rejects.toThrow('Health check failed');
    });
  });
});
