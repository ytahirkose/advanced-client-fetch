/**
 * HyperHTTP Core - Fetch-first HTTP client with plugin architecture
 */

// Core exports
export { createClient, createDefaultClient, createClientFor } from './client.js';
export { compose, parallel, conditional, once, withErrorHandling, withTiming, withLogging } from './compose.js';
export { combineSignals, combineTimeoutAndSignal, createTimeoutSignal } from './signal.js';

// Type exports
export type {
  Client,
  ClientOptions,
  RequestOptions,
  ResponseType,
  HttpMethod,
  RetryOptions,
  RetryInfo,
  CacheOptions,
  CacheStorage,
  BaseStorage,
  TimedStorage,
  CountableStorage,
  Transport,
  Context,
  Middleware,
  HttpError,
  AbortError,
  Interceptor,
  Metrics,
  MetricsData,
  SecurityOptions,
  Cookie,
  CookieOptions,
  CookieJar,
  NodeAgentOptions,
  ProxyConfig,
  NodeSslOptions,
  StreamOptions,
  RetryPluginOptions,
  CachePluginOptions,
  RateLimitPluginOptions,
  CircuitBreakerPluginOptions,
  DedupePluginOptions,
  MetricsPluginOptions,
  CircuitBreakerInfo,
  RateLimitInfo,
  DedupeEntry,
  KeyGeneratorOptions,
  BasePluginOptions,
  PluginHooks,
  PluginImplementation,
  PresetConfig,
  PlatformOptions,
  PerformanceMetrics,
  BuildOptions,
  BundleAnalysis,
  OptimizationConfig,
} from './types.js';

// Error exports
export {
  HyperHttpError,
  HyperAbortError,
  TimeoutError,
  NetworkError,
  RetryError,
  ValidationError,
  ConfigurationError,
  RateLimitError,
  CircuitBreakerError,
} from './errors.js';

// Utility exports
export {
  isPlainObject,
  isURL,
  isHeaders,
  isIdempotentMethod,
  buildURL,
  mergeHeaders,
  normalizeBody,
  generateRequestId,
  deepMerge,
  sleep,
  calculateBackoffDelay,
  parseRetryAfter,
  isAbsoluteURL,
  getContentType,
  isJSONResponse,
  isTextResponse,
  safeJSONParse,
  cloneRequest,
  getRequestSize,
  getResponseSize,
  isRetryableError,
  isRetryableResponse,
  calculateRetryDelay,
  waitForRetry,
  createAttemptSignal,
  createKeyGenerator,
  hashKey,
  defaultKeyGenerator,
  simpleKeyGenerator,
  bodyAwareKeyGenerator,
  headerAwareKeyGenerator,
} from './utils.js';

// Storage exports
export {
  BaseMemoryStorage,
  MemoryStorage,
  TimedMemoryStorage,
  CountableMemoryStorage,
  createMemoryStorage,
  createTimedStorage,
  createCountableStorage,
  StorageUtils,
  type StorageStats,
} from './storage.js';

// Plugin factory exports
export {
  createPlugin,
  createConditionalPlugin,
  createWrapperPlugin,
  createRetryablePlugin,
  createTimeoutPlugin,
  createMetricsPlugin,
  createCachedPlugin,
  createRateLimitedPlugin,
  PluginComposer,
} from './plugin-factory.js';

// Preset factory exports
export {
  createPresetClient,
  createMinimalPresetClient,
  createFullPresetClient,
  createProductionPresetClient,
  createDevelopmentPresetClient,
  createTestPresetClient,
  createPresetClientBuilder,
  PresetClientBuilder,
  type PresetConfig,
  type PlatformOptions,
} from './preset-factory.js';

// Node.js specific exports
export {
  createHttpAgent,
  createHttpsAgent,
  createNodeTransport,
  createProxyMiddleware,
  isNodeEnvironment,
  getDefaultNodeAgentOptions,
} from './node-agent.js';

// Security exports
export {
  isPrivateIP,
  isLocalhost,
  validateUrlForSSRF,
  cleanHopByHopHeaders,
  blockDangerousHeaders,
  createSSRFProtection,
  createRedirectSecurity,
  createSecurityMiddleware,
  sanitizeHeaders,
  validateRequestSize,
  createRequestSizeValidation,
  createComprehensiveSecurity,
  type SecurityOptions,
} from './security.js';

// Cookie management exports
export {
  MemoryCookieJar,
  createCookieMiddleware,
  createCookieMiddlewareWithOptions,
  createDomainCookieMiddleware,
  createCookieJar,
  parseCookies,
  formatCookies,
  parseCookie,
  formatCookie,
  CookieUtils,
  type CookieOptions,
  type CookieJar,
  type Cookie,
} from './cookie-manager.js';

// Stream utilities exports
export {
  streamToNodeReadable,
  nodeReadableToStream,
  createTransformStream,
  createFilterStream,
  createMapStream,
  createReduceStream,
  streamToBuffer,
  streamToString,
  streamToJSON,
  bufferToStream,
  stringToStream,
  jsonToStream,
  pipeStreams,
  createLimitStream,
  createSkipStream,
  createTakeStream,
  createCollectStream,
  createSplitStream,
  StreamUtils,
  type StreamOptions,
} from './stream-utils.js';

// Performance exports
export {
  PerformanceMonitor,
  createPerformanceMonitor,
  createPerformanceMiddleware,
  Benchmark,
  createBenchmark,
  MemoryMonitor,
  createMemoryMonitor,
  PerformanceUtils,
  PERFORMANCE_CONSTANTS,
  checkPerformanceHealth,
} from './performance.js';

// Build utilities exports
export {
  BundleAnalyzer,
  createBundleAnalyzer,
  BuildOptimizer,
  createBuildOptimizer,
  BuildUtils,
  BUILD_CONSTANTS,
} from './build-utils.js';

// Re-export common types for convenience
export type { Headers, Request, Response, AbortSignal } from './types.js';
