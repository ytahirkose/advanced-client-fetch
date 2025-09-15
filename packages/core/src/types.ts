/**
 * Core types for HyperHTTP client
 */

// Re-export Web API types for convenience
export type Headers = globalThis.Headers;
export type Request = globalThis.Request;
export type Response = globalThis.Response;
export type AbortSignal = globalThis.AbortSignal;

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
export type ResponseType = 'json' | 'text' | 'blob' | 'arrayBuffer' | 'stream';
export type CircuitBreakerState = 'closed' | 'open' | 'half-open';

// Core request/response types
export interface RequestOptions {
  /** Request URL (can be relative if baseURL is set) */
  url: string | URL;
  /** HTTP method */
  method?: HttpMethod;
  /** Request headers */
  headers?: Record<string, string> | Headers;
  /** Query parameters */
  query?: Record<string, any>;
  /** Request body */
  body?: BodyInit | unknown;
  /** AbortSignal for request cancellation */
  signal?: AbortSignal;
  /** Total timeout in milliseconds */
  timeout?: number;
  /** Expected response type */
  responseType?: ResponseType;
  /** Custom metadata for plugins */
  meta?: Record<string, any>;
  /** Retry configuration (overrides global retry settings) */
  retry?: boolean | RetryOptions;
  /** Cache configuration (overrides global cache settings) */
  cache?: boolean | CacheOptions;
}

// Client types
export interface Client {
  get(url: string, options?: RequestOptions): Promise<Response>;
  post(url: string, data?: any, options?: RequestOptions): Promise<Response>;
  put(url: string, data?: any, options?: RequestOptions): Promise<Response>;
  patch(url: string, data?: any, options?: RequestOptions): Promise<Response>;
  delete(url: string, options?: RequestOptions): Promise<Response>;
  head(url: string, options?: RequestOptions): Promise<Response>;
  options(url: string, options?: RequestOptions): Promise<Response>;
}

export interface ClientOptions {
  /** Base URL for all requests */
  baseURL?: string;
  /** Default headers for all requests */
  headers?: Record<string, string>;
  /** Custom transport function */
  transport?: Transport;
  /** Default timeout in ms */
  timeout?: number;
  /** Default AbortSignal */
  signal?: AbortSignal;
  /** Plugin middleware array */
  plugins?: Middleware[];
  /** Request/response interceptors */
  interceptors?: Interceptor[];
}

// Transport and middleware types
export interface Transport {
  (request: Request): Promise<Response>;
}

export interface Middleware {
  (ctx: Context, next: () => Promise<void>): Promise<void>;
}

export interface Context {
  req: Request;
  res?: Response;
  signal: AbortSignal;
  meta: Record<string, any>;
  state: Record<string, any>;
  error?: Error;
}

export interface Interceptor {
  request?: (config: RequestOptions) => RequestOptions | Promise<RequestOptions>;
  response?: (response: Response) => Response | Promise<Response>;
  error?: (error: Error) => Error | Promise<Error>;
}

// Retry types
export interface RetryOptions {
  /** Number of retry attempts */
  retries?: number;
  /** HTTP methods that can be retried */
  methods?: HttpMethod[];
  /** Minimum delay between retries in ms */
  minDelay?: number;
  /** Maximum delay between retries in ms */
  maxDelay?: number;
  /** Exponential backoff factor */
  factor?: number;
  /** Add jitter to prevent thundering herd */
  jitter?: boolean;
  /** Per-attempt timeout in ms */
  timeoutPerAttempt?: number;
  /** Total timeout for all attempts in ms */
  totalTimeout?: number;
  /** Respect Retry-After header */
  respectRetryAfter?: boolean;
  /** Cap for Retry-After header in ms */
  retryAfterCap?: number;
  /** Custom retry condition */
  retryOn?: (error: Error | Response) => boolean;
  /** Retry callback */
  onRetry?: (info: RetryInfo) => void;
}

export interface RetryInfo {
  attempt: number;
  delay: number;
  error?: Error;
  response?: Response;
  totalAttempts: number;
}

// Cache types
export interface CacheOptions {
  /** Cache TTL in ms */
  ttl?: number;
  /** Cache key generator */
  key?: (request: Request) => string;
  /** Cache storage implementation */
  storage?: CacheStorage;
  /** Respect cache headers */
  respectHeaders?: boolean;
  /** Stale-while-revalidate support */
  staleWhileRevalidate?: boolean;
}

export interface CacheStorage {
  get(key: string): Promise<Response | undefined>;
  set(key: string, response: Response, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

export interface CacheEntry {
  response: Response;
  expires: number;
  staleWhileRevalidate?: boolean;
}

// Error types
export interface HttpError extends Error {
  /** HTTP status code */
  status: number;
  /** Error code */
  code: string;
  /** Request that caused the error */
  request: Request;
  /** Response object (if available) */
  response?: Response;
  /** Additional error data */
  data?: any;
  /** Request ID for tracing */
  requestId?: string;
}

export interface AbortError extends Error {
  name: 'AbortError';
  /** Reason for abort */
  reason?: string;
}

// Metrics types
export interface Metrics {
  url: string;
  method: string;
  status?: number;
  startTime: number;
  endTime?: number;
  duration?: number;
  retries: number;
  requestSize?: number;
  responseSize?: number;
  cacheHit?: boolean;
  error?: string;
}

export interface MetricsData {
  url: string;
  method: string;
  status?: number;
  startTime: number;
  endTime?: number;
  duration?: number;
  retries: number;
  requestSize?: number;
  responseSize?: number;
  cacheHit?: boolean;
  error?: string;
}

// Security types
export interface SecurityOptions {
  allowedHosts?: string[];
  blockedHosts?: string[];
  maxRedirects?: number;
  maxRequestSize?: number;
  maxResponseSize?: number;
}

// Cookie types
export interface Cookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: Date;
  maxAge?: number;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

export interface CookieOptions {
  domain?: string;
  path?: string;
  expires?: Date;
  maxAge?: number;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

export interface CookieJar {
  get(url: string): Promise<string>;
  set(url: string, cookie: string): Promise<void>;
  delete(url: string, name: string): Promise<void>;
  clear(): Promise<void>;
}

// Node.js specific types
export interface NodeAgentOptions {
  keepAlive?: boolean;
  maxSockets?: number;
  maxFreeSockets?: number;
  timeout?: number;
  freeSocketTimeout?: number;
}

export interface ProxyConfig {
  host: string;
  port: number;
  protocol?: 'http' | 'https';
  auth?: {
    username: string;
    password: string;
  };
}

export interface NodeSslOptions {
  rejectUnauthorized?: boolean;
  cert?: string;
  key?: string;
  ca?: string;
}

// Stream types
export interface StreamOptions {
  highWaterMark?: number;
  encoding?: BufferEncoding;
  objectMode?: boolean;
}

// Plugin specific types
export interface RetryPluginOptions {
  retries?: number;
  minDelay?: number;
  maxDelay?: number;
  factor?: number;
  jitter?: boolean;
  respectRetryAfter?: boolean;
  retryOn?: (error: Error | Response) => boolean;
  onRetry?: (info: RetryInfo) => void;
}

export interface CachePluginOptions {
  ttl?: number;
  keyGenerator?: (req: Request) => string;
  storage?: CacheStorage;
  staleWhileRevalidate?: boolean;
  onCacheHit?: (key: string) => void;
  onCacheMiss?: (key: string) => void;
}

export interface RateLimitPluginOptions {
  requests: number;
  window: number;
  keyGenerator?: (req: Request) => string;
  onLimitReached?: (key: string, limit: number) => void;
}

export interface CircuitBreakerPluginOptions {
  failureThreshold: number;
  window: number;
  resetTimeout: number;
  keyGenerator?: (req: Request) => string;
  onStateChange?: (key: string, state: CircuitBreakerState, failures: number) => void;
}

export interface DedupePluginOptions {
  maxAge?: number;
  maxPending?: number;
  keyGenerator?: (req: Request) => string;
  onDedupe?: (key: string) => void;
}

export interface MetricsPluginOptions {
  onMetrics?: (data: MetricsData) => void;
  sampling?: number;
  formatter?: (data: MetricsData) => string;
}

// Circuit breaker types
export interface CircuitBreakerInfo {
  state: CircuitBreakerState;
  failures: number;
  lastFailureTime?: number;
  nextAttemptTime?: number;
}

// Rate limit types
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

// Dedupe types
export interface DedupeEntry {
  promise: Promise<Response>;
  timestamp: number;
}