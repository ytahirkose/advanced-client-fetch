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
  Transport,
  Context,
  Middleware,
  HttpError,
  AbortError,
  Interceptor,
  Metrics,
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
} from './utils.js';

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
  type SecurityOptions,
} from './security.js';

// Cookie management exports
export {
  MemoryCookieJar,
  createCookieMiddleware,
  createCookieJar,
  parseCookies,
  formatCookies,
  type CookieOptions,
  type CookieJar,
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
  type StreamOptions,
} from './stream-utils.js';

// Re-export common types for convenience
export type { Headers, Request, Response, AbortSignal } from './types.js';
