/**
 * Plugin options tests
 */

import { describe, it, expect } from 'vitest';
import type { 
  BasePluginOptions,
  RetryPluginOptions,
  CachePluginOptions,
  RateLimitPluginOptions,
  CircuitBreakerPluginOptions,
  DedupePluginOptions,
  MetricsPluginOptions
} from '../types.js';

describe('Plugin Options', () => {
  describe('BasePluginOptions', () => {
    it('should have all required fields', () => {
      const options: BasePluginOptions = {
        enabled: true,
        name: 'test-plugin',
        priority: 1,
        condition: () => true,
        timeout: 5000,
        retries: 3,
        message: 'Test message'
      };

      expect(options.enabled).toBe(true);
      expect(options.name).toBe('test-plugin');
      expect(options.priority).toBe(1);
      expect(options.condition).toBeDefined();
      expect(options.timeout).toBe(5000);
      expect(options.retries).toBe(3);
      expect(options.message).toBe('Test message');
    });
  });

  describe('RetryPluginOptions', () => {
    it('should extend BasePluginOptions', () => {
      const options: RetryPluginOptions = {
        enabled: true,
        name: 'retry-plugin',
        priority: 1,
        retries: 3,
        minDelay: 1000,
        maxDelay: 5000,
        factor: 2,
        jitter: true,
        respectRetryAfter: true,
        retryOn: () => true,
        onRetry: () => {}
      };

      expect(options.enabled).toBe(true);
      expect(options.name).toBe('retry-plugin');
      expect(options.priority).toBe(1);
      expect(options.retries).toBe(3);
      expect(options.minDelay).toBe(1000);
      expect(options.maxDelay).toBe(5000);
      expect(options.factor).toBe(2);
      expect(options.jitter).toBe(true);
      expect(options.respectRetryAfter).toBe(true);
    });
  });

  describe('CachePluginOptions', () => {
    it('should extend BasePluginOptions', () => {
      const options: CachePluginOptions = {
        enabled: true,
        name: 'cache-plugin',
        priority: 2,
        ttl: 300000,
        keyGenerator: (req) => req.url,
        staleWhileRevalidate: true,
        onCacheHit: () => {},
        onCacheMiss: () => {}
      };

      expect(options.enabled).toBe(true);
      expect(options.name).toBe('cache-plugin');
      expect(options.priority).toBe(2);
      expect(options.ttl).toBe(300000);
      expect(options.keyGenerator).toBeDefined();
      expect(options.staleWhileRevalidate).toBe(true);
    });
  });

  describe('RateLimitPluginOptions', () => {
    it('should extend BasePluginOptions', () => {
      const options: RateLimitPluginOptions = {
        enabled: true,
        name: 'rate-limit-plugin',
        priority: 3,
        requests: 100,
        window: 60000,
        keyGenerator: (req) => req.url,
        onLimitReached: () => {}
      };

      expect(options.enabled).toBe(true);
      expect(options.name).toBe('rate-limit-plugin');
      expect(options.priority).toBe(3);
      expect(options.requests).toBe(100);
      expect(options.window).toBe(60000);
    });
  });

  describe('CircuitBreakerPluginOptions', () => {
    it('should extend BasePluginOptions', () => {
      const options: CircuitBreakerPluginOptions = {
        enabled: true,
        name: 'circuit-breaker-plugin',
        priority: 4,
        failureThreshold: 5,
        window: 60000,
        resetTimeout: 30000,
        keyGenerator: (req) => req.url,
        onStateChange: () => {}
      };

      expect(options.enabled).toBe(true);
      expect(options.name).toBe('circuit-breaker-plugin');
      expect(options.priority).toBe(4);
      expect(options.failureThreshold).toBe(5);
      expect(options.window).toBe(60000);
      expect(options.resetTimeout).toBe(30000);
    });
  });

  describe('DedupePluginOptions', () => {
    it('should extend BasePluginOptions', () => {
      const options: DedupePluginOptions = {
        enabled: true,
        name: 'dedupe-plugin',
        priority: 5,
        maxAge: 1000,
        maxPending: 10,
        keyGenerator: (req) => req.url,
        onDedupe: () => {}
      };

      expect(options.enabled).toBe(true);
      expect(options.name).toBe('dedupe-plugin');
      expect(options.priority).toBe(5);
      expect(options.maxAge).toBe(1000);
      expect(options.maxPending).toBe(10);
    });
  });

  describe('MetricsPluginOptions', () => {
    it('should extend BasePluginOptions', () => {
      const options: MetricsPluginOptions = {
        enabled: true,
        name: 'metrics-plugin',
        priority: 6,
        onMetrics: () => {},
        sampling: 0.1,
        formatter: (data) => JSON.stringify(data)
      };

      expect(options.enabled).toBe(true);
      expect(options.name).toBe('metrics-plugin');
      expect(options.priority).toBe(6);
      expect(options.onMetrics).toBeDefined();
      expect(options.sampling).toBe(0.1);
      expect(options.formatter).toBeDefined();
    });
  });
});
