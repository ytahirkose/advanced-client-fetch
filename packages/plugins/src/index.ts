/**
 * HyperHTTP Plugins - Collection of middleware plugins
 */

// Retry plugin
export {
  retry,
  createRetryMiddleware,
  retryIdempotent,
  retryAll,
  retryAggressive,
  retryConservative,
  type RetryPluginOptions,
} from './retry.js';

// Timeout plugin
export {
  timeout,
  requestTimeout,
  globalTimeout,
  timeoutWithMessage,
  timeoutForMethods,
  timeoutWithBackoff,
  timeoutWithRetryAfter,
  timeoutWithCircuitBreaker,
  timeoutPerAttempt,
  totalTimeout,
  timeoutByMethod,
  type TimeoutPluginOptions,
} from './timeout.js';

// Cache plugin
export {
  cache,
  cacheWithSWR,
  cacheByContentType,
  cacheWithCustomTTL,
  MemoryCacheStorage,
  type CachePluginOptions,
} from './cache.js';

// Rate limiting plugin
export {
  rateLimit,
  tokenBucketRateLimit,
  slidingWindowRateLimit,
  adaptiveRateLimit,
  rateLimitByEndpoint,
  rateLimitByUser,
  rateLimitByIP,
  rateLimitByKey,
  rateLimitWithBurst,
  rateLimitWithBackoff,
  type RateLimitPluginOptions,
  type RateLimitStorage,
  type RateLimitInfo,
  MemoryRateLimitStorage,
} from './rate-limit.js';

// Circuit breaker plugin
export {
  circuitBreaker,
  circuitBreakerWithCustomDetection,
  adaptiveCircuitBreaker,
  circuitBreakerWithBackoff,
  circuitBreakerWithHealthCheck,
  circuitBreakerByEndpoint,
  circuitBreakerByHost,
  circuitBreakerByKey,
  type CircuitBreakerPluginOptions,
  type CircuitBreakerStorage,
  type CircuitBreakerState,
  type CircuitState,
  MemoryCircuitBreakerStorage,
} from './circuit-breaker.js';

// Deduplication plugin
export {
  dedupe,
  dedupeWithCustomKey,
  dedupeWithBody,
  dedupeWithHeaders,
  adaptiveDedupe,
  dedupeWithCacheWarming,
  dedupeWithMetrics,
  dedupeByKey,
  dedupeByMethod,
  dedupeWithTTL,
  dedupeWithCache,
  dedupeWithRateLimit,
  getDedupeStats,
  clearDedupeCache,
  type DedupePluginOptions,
  type DedupeStorage,
  type InFlightRequest,
  MemoryDedupeStorage,
} from './dedupe.js';

// Metrics plugin
export {
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
  metricsWithBuffering,
  type MetricsOptions,
  type DetailedMetrics,
} from './metrics.js';
