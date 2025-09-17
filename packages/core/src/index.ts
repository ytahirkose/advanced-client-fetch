/**
 * Advanced Client Fetch Core - Fetch-first HTTP client with plugin architecture
 */

// Core exports
export { createClient, createDefaultClient, createClientFor } from './client';
export { compose, parallel, conditional, once, withErrorHandling, withTiming, withLogging } from './compose';
export { combineSignals, combineTimeoutAndSignal, createTimeoutSignal } from './signal';

// Re-export types from types.ts
export type {
  Headers,
  Request,
  Response,
  AbortSignal,
  RequestInit,
  ResponseInit,
  AbortController,
  Plugin,
  HttpMethod,
  ResponseType,
  ProgressEvent,
  ProxyConfig,
  TransitionalOptions,
  EnvironmentOptions,
  FormSerializerOptions,
  BaseStorage,
  TimedStorage,
  CountableStorage,
  CacheStorage
} from './types';

// Type exports
export type {
  Client,
  ClientOptions,
  RequestOptions,
  RetryOptions,
  RetryInfo,
  CacheOptions,
  Transport,
  Context,
  Middleware,
  Interceptor,
  Metrics,
  SecurityOptions,
  Cookie,
  CookieOptions,
  CookieJar,
  NodeAgentOptions,
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
  PerformanceMetrics,
  BuildOptions,
  BundleAnalysis,
  OptimizationConfig,
} from './types';

// Error exports
export {
  // Base error classes
  BaseError,
  BaseHttpError,
  BaseAbortError,
  // HTTP error classes
  ClientError,
  ServerError,
  NetworkError,
  // Abort error classes
  TimeoutError,
  // Other error classes
  RetryError,
  ValidationError,
  ConfigurationError,
  RateLimitError,
  CircuitBreakerError,
  // Legacy error classes (deprecated)
  AdvancedClientFetchError,
  AdvancedClientFetchAbortError,
  // Error utility functions
  isHttpError,
  isAbortError,
  isTimeoutError,
  isNetworkError,
  isRetryError,
  isValidationError,
  isConfigurationError,
  isRateLimitError,
  isCircuitBreakerError,
  // Axios compatibility
  AxiosError,
} from './errors';

// Cancel Token exports
export {
  CancelToken,
  CancelError,
  isCancel,
  raceCancelTokens,
  timeoutCancelToken,
  type CancelTokenSource,
  type CancelTokenStatic,
  type CancelToken as CancelTokenInterface,
} from './cancel-token';

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
} from './utils';

// Performance optimization exports
export {
  ObjectPool,
  headersPool,
  urlPool,
  requestPool,
  responsePool,
  errorPool,
  mapPool,
  setPool,
  arrayPool,
  getHeaders,
  releaseHeaders,
  getURL,
  releaseURL,
  getMap,
  releaseMap,
  getSet,
  releaseSet,
  getArray,
  releaseArray,
  clearAllPools,
} from './object-pool';

export {
  intern,
  internStrings,
  internObjectKeys,
  internHeaders,
  clearStringCache,
  getStringCacheStats,
  HTTP_METHODS,
  COMMON_HEADERS,
  CONTENT_TYPES,
  RESPONSE_TYPES,
} from './string-intern';

export {
  lazyLoad,
  lazyLoadAsync,
  lazyLoadWithCleanup,
  clearLazyCache,
  removeFromLazyCache,
  getLazyCacheStats,
  lazyLoaders,
  createLazyLoader,
} from './lazy-loading';

// Security exports
export {
  isPrivateIP,
  isLocalhost,
  validateUrlForSSRF,
  cleanHopByHopHeaders,
  blockDangerousHeaders,
  createSecurityMiddleware,
  type SecurityViolation,
} from './security';

// Cookie management exports
export {
  parseCookies,
  formatCookies,
  parseCookie,
  formatCookie,
  createCookieJar,
  createCookieMiddleware,
} from './cookie-manager';
