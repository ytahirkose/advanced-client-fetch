import { describe, it, expect, vi } from 'vitest';
import { retry, cache, rateLimit, circuitBreaker } from '../index';

describe('Plugins', () => {
  describe('retry', () => {
    it('should retry failed requests', async () => {
      const retryMiddleware = retry({ retries: 2, minDelay: 10 });
      let attemptCount = 0;
      
      const mockNext = vi.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          const error = new Error('Network error');
          (error as any).status = 500;
          throw error;
        }
        return { data: 'success' };
      });

      const context = { request: { url: '/test' } };
      const result = await retryMiddleware(context, mockNext);

      expect(attemptCount).toBe(3);
      expect(result).toEqual({ data: 'success' });
    });

    it('should not retry if retries exceeded', async () => {
      const retryMiddleware = retry({ retries: 1, minDelay: 10 });
      let attemptCount = 0;
      
      const mockNext = vi.fn().mockImplementation(() => {
        attemptCount++;
        const error = new Error('Network error');
        (error as any).status = 500;
        throw error;
      });

      const context = { request: { url: '/test' } };
      
      await expect(retryMiddleware(context, mockNext)).rejects.toThrow('Network error');
      expect(attemptCount).toBe(2); // 1 retry + 1 original attempt
    });
  });

  describe('cache', () => {
    it('should cache responses', async () => {
      const cacheMiddleware = cache({ ttl: 1000 });
      const mockNext = vi.fn().mockResolvedValue({ data: 'cached' });

      const context = { request: { url: '/test' } };
      
      // First call
      const result1 = await cacheMiddleware(context, mockNext);
      expect(result1).toEqual({ data: 'cached' });
      expect(mockNext).toHaveBeenCalledTimes(1);

      // Second call (should use cache)
      const result2 = await cacheMiddleware(context, mockNext);
      expect(result2).toEqual({ data: 'cached' });
      expect(mockNext).toHaveBeenCalledTimes(1); // Still 1, not 2
    });

    it('should not use cache if expired', async () => {
      const cacheMiddleware = cache({ ttl: 10 }); // Very short TTL
      const mockNext = vi.fn().mockResolvedValue({ data: 'fresh' });

      const context = { request: { url: '/test' } };
      
      // First call
      await cacheMiddleware(context, mockNext);
      
      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 20));
      
      // Second call (should not use cache)
      await cacheMiddleware(context, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(2);
    });
  });

  describe('rateLimit', () => {
    it('should allow requests within limit', async () => {
      const rateLimitMiddleware = rateLimit({ maxRequests: 2, windowMs: 1000 });
      const mockNext = vi.fn().mockResolvedValue({ data: 'success' });

      const context = { request: { url: '/test' } };
      
      // First request
      await rateLimitMiddleware(context, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);

      // Second request
      await rateLimitMiddleware(context, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(2);
    });

    it('should block requests exceeding limit', async () => {
      const rateLimitMiddleware = rateLimit({ maxRequests: 1, windowMs: 1000 });
      const mockNext = vi.fn().mockResolvedValue({ data: 'success' });

      const context = { request: { url: '/test' } };
      
      // First request (allowed)
      await rateLimitMiddleware(context, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);

      // Second request (blocked)
      await expect(rateLimitMiddleware(context, mockNext)).rejects.toThrow('Rate limit exceeded');
      expect(mockNext).toHaveBeenCalledTimes(1); // Still 1, not 2
    });
  });

  describe('circuitBreaker', () => {
    it('should allow requests when circuit is closed', async () => {
      const circuitBreakerMiddleware = circuitBreaker({ 
        failureThreshold: 2,
        keyGenerator: () => 'test'
      });
      const mockNext = vi.fn().mockResolvedValue({ data: 'success' });

      const context = { request: { url: 'https://example.com/test' } };
      
      const result = await circuitBreakerMiddleware(context, mockNext);
      expect(result).toEqual({ data: 'success' });
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should open circuit after failures', async () => {
      const circuitBreakerMiddleware = circuitBreaker({ 
        failureThreshold: 2,
        keyGenerator: () => 'test'
      });
      const mockNext = vi.fn().mockRejectedValue(new Error('Service error'));

      const context = { request: { url: 'https://example.com/test' } };
      
      // First failure
      await expect(circuitBreakerMiddleware(context, mockNext)).rejects.toThrow('Service error');
      
      // Second failure (should open circuit)
      await expect(circuitBreakerMiddleware(context, mockNext)).rejects.toThrow('Service error');
      
      // Third request (circuit should be open)
      await expect(circuitBreakerMiddleware(context, mockNext)).rejects.toThrow('Circuit breaker is open');
    });
  });
});
