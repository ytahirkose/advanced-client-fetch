/**
 * Tests for HyperHTTP plugins index
 */

import { describe, it, expect } from 'vitest';
import * as plugins from '../index.js';

describe('HyperHTTP Plugins Index', () => {
  it('should export retry plugin', () => {
    expect(plugins.retry).toBeDefined();
    expect(typeof plugins.retry).toBe('function');
  });

  it('should export timeout plugin', () => {
    expect(plugins.timeout).toBeDefined();
    expect(typeof plugins.timeout).toBe('function');
  });

  it('should export cache plugin', () => {
    expect(plugins.cache).toBeDefined();
    expect(typeof plugins.cache).toBe('function');
  });

  it('should export rate limit plugin', () => {
    expect(plugins.rateLimit).toBeDefined();
    expect(typeof plugins.rateLimit).toBe('function');
  });

  it('should export circuit breaker plugin', () => {
    expect(plugins.circuitBreaker).toBeDefined();
    expect(typeof plugins.circuitBreaker).toBe('function');
  });

  it('should export dedupe plugin', () => {
    expect(plugins.dedupe).toBeDefined();
    expect(typeof plugins.dedupe).toBe('function');
  });

  it('should export metrics plugin', () => {
    expect(plugins.metrics).toBeDefined();
    expect(typeof plugins.metrics).toBe('function');
  });

  it('should export all retry variants', () => {
    expect(plugins.createRetryMiddleware).toBeDefined();
    expect(plugins.retryIdempotent).toBeDefined();
    expect(plugins.retryAll).toBeDefined();
    expect(plugins.retryAggressive).toBeDefined();
    expect(plugins.retryConservative).toBeDefined();
  });

  it('should export all timeout variants', () => {
    expect(plugins.timeoutPerAttempt).toBeDefined();
    expect(plugins.totalTimeout).toBeDefined();
    expect(plugins.timeoutByMethod).toBeDefined();
    expect(plugins.timeoutWithBackoff).toBeDefined();
    expect(plugins.timeoutWithRetryAfter).toBeDefined();
  });

  it('should export all cache variants', () => {
    expect(plugins.cacheWithSWR).toBeDefined();
    expect(plugins.cacheByContentType).toBeDefined();
    expect(plugins.cacheWithCustomTTL).toBeDefined();
    expect(plugins.MemoryCacheStorage).toBeDefined();
  });

  it('should export all rate limit variants', () => {
    expect(plugins.rateLimitByEndpoint).toBeDefined();
    expect(plugins.rateLimitByUser).toBeDefined();
    expect(plugins.rateLimitByIP).toBeDefined();
    expect(plugins.rateLimitByKey).toBeDefined();
    expect(plugins.rateLimitWithBurst).toBeDefined();
    expect(plugins.rateLimitWithBackoff).toBeDefined();
  });

  it('should export all circuit breaker variants', () => {
    expect(plugins.circuitBreakerByEndpoint).toBeDefined();
    expect(plugins.circuitBreakerByHost).toBeDefined();
    expect(plugins.circuitBreakerByKey).toBeDefined();
    expect(plugins.adaptiveCircuitBreaker).toBeDefined();
    expect(plugins.circuitBreakerWithHealthCheck).toBeDefined();
  });

  it('should export all dedupe variants', () => {
    expect(plugins.dedupeByKey).toBeDefined();
    expect(plugins.dedupeByMethod).toBeDefined();
    expect(plugins.dedupeWithTTL).toBeDefined();
    expect(plugins.dedupeWithCache).toBeDefined();
    expect(plugins.dedupeWithRateLimit).toBeDefined();
    expect(plugins.getDedupeStats).toBeDefined();
    expect(plugins.clearDedupeCache).toBeDefined();
  });

  it('should export all metrics variants', () => {
    expect(plugins.metricsWithCollector).toBeDefined();
    expect(plugins.metricsWithLogging).toBeDefined();
    expect(plugins.metricsWithJSONLogging).toBeDefined();
    expect(plugins.metricsWithFormatter).toBeDefined();
    expect(plugins.metricsWithAggregation).toBeDefined();
    expect(plugins.metricsWithHistogram).toBeDefined();
    expect(plugins.metricsByKey).toBeDefined();
    expect(plugins.metricsWithFilter).toBeDefined();
    expect(plugins.metricsWithSampling).toBeDefined();
    expect(plugins.metricsWithBuffering).toBeDefined();
  });
});
