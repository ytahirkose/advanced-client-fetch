/**
 * HyperHTTP Lite - Minimal HTTP client
 * Only includes core functionality without plugins
 */

export { createClient, createDefaultClient, createClientFor } from './client.js';
export { compose } from './compose.js';
export { combineSignals, combineTimeoutAndSignal, createTimeoutSignal } from './signal.js';

export type {
  Client,
  ClientOptions,
  RequestOptions,
  ResponseType,
  HttpMethod,
  Transport,
  Context,
  Middleware,
  HttpError,
  AbortError,
} from './types.js';

export {
  HyperHttpError,
  HyperAbortError,
  TimeoutError,
  NetworkError,
} from './errors.js';

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
} from './utils.js';