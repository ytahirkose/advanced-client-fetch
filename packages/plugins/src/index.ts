/**
 * Advanced Client Fetch Plugins - Collection of middleware plugins
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
  type CircuitBreakerPluginOptions,
  type CircuitBreakerStorage,
  type CircuitBreakerState,
  type CircuitBreakerInfo,
  MemoryCircuitBreakerStorage,
} from './circuit-breaker.js';

// Deduplication plugin
export {
  dedupe,
  dedupeWithCustomKey,
  dedupeWithBody,
  dedupeWithHeaders,
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
  type MetricsOptions,
  type DetailedMetrics,
} from './metrics.js';

// Progress tracking plugin
export {
  progress,
  type ProgressPluginOptions,
  type ProgressEvent,
} from './progress.js';

// XSRF protection plugin
export {
  xsrf,
  type XSRFPluginOptions,
} from './xsrf.js';

// Proxy support plugin
export {
  proxy,
  type ProxyPluginOptions,
} from './proxy.js';

// HTTP Agents plugin
export {
  httpAgents,
  createHTTPAgent,
  createHTTPSAgent,
  type HTTPAgentsPluginOptions,
} from './http-agents.js';