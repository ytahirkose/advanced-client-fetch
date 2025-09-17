/**
 * Core types for Advanced Client Fetch client
 */

// Re-export Web API types for convenience
export type Headers = globalThis.Headers;
export type Request = globalThis.Request;
export type Response = globalThis.Response;
export type AbortSignal = globalThis.AbortSignal;
export type RequestInit = globalThis.RequestInit;
export type ResponseInit = globalThis.ResponseInit;
export type AbortController = globalThis.AbortController;

// Base storage interfaces
export interface BaseStorage<T = unknown> {
  get(key: string): Promise<T | undefined>;
  set(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
}

export interface TimedStorage<T> extends BaseStorage<T> {
  increment(key: string, window: number): Promise<T>;
  reset(key: string): Promise<void>;
}

export interface CountableStorage<T> extends BaseStorage<T> {
  increment(key: string): Promise<number>;
  decrement(key: string): Promise<number>;
  getCount(key: string): Promise<number>;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
export type ResponseType = 'json' | 'text' | 'blob' | 'arrayBuffer' | 'stream' | 'document';

// Context interface
export interface Context {
  request: Request;
  response?: Response;
  error?: Error;
  retryCount?: number;
  startTime?: number;
  endTime?: number;
  metadata?: Record<string, unknown>;
  // Legacy properties for backward compatibility
  req: Request;
  res?: Response;
  signal: AbortSignal;
  meta: Record<string, any>;
  state: Record<string, any>;
}

// Plugin interface
export interface Plugin {
  name: string;
  priority?: number;
  enabled?: boolean;
  condition?: (context: Context) => boolean;
  timeout?: number;
  retries?: number;
  message?: string;
}

// Progress event interface
export interface ProgressEvent {
  loaded: number;
  total: number;
  lengthComputable: boolean;
  percent?: number;
}

// Proxy configuration
export interface ProxyConfig {
  host: string;
  port: number;
  auth?: {
    username: string;
    password: string;
  };
  protocol?: 'http' | 'https';
}

// Transitional options
export interface TransitionalOptions {
  silentJSONParsing?: boolean;
  forcedJSONParsing?: boolean;
  clarifyTimeoutError?: boolean;
}

// Environment options
export interface EnvironmentOptions {
  FormData?: any;
}

// Form serializer options
export interface FormSerializerOptions {
  visitor?: (value: any, key: string, path: string, helpers: any) => any;
  dots?: boolean;
  metaTokens?: boolean;
  indexes?: boolean;
}


// Core request/response types
export interface RequestOptions {
  /** Request URL (can be relative if baseURL is set) */
  url: string | URL;
  /** HTTP method */
  method?: HttpMethod;
  /** Request headers */
  headers?: Record<string, string> | Headers;
  /** Query parameters */
  query?: Record<string, string | number | boolean | string[] | number[] | boolean[] | null | undefined>;
  /** Request body */
  body?: BodyInit | string | number | boolean | object | null;
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
  /** Upload progress callback */
  onUploadProgress?: (progressEvent: ProgressEvent) => void;
  /** Download progress callback */
  onDownloadProgress?: (progressEvent: ProgressEvent) => void;
  /** XSRF cookie name */
  xsrfCookieName?: string;
  /** XSRF header name */
  xsrfHeaderName?: string;
  /** Proxy configuration */
  proxy?: ProxyConfig;
  /** HTTP agent for Node.js */
  httpAgent?: any;
  /** HTTPS agent for Node.js */
  httpsAgent?: any;
  /** Socket path for Unix sockets */
  socketPath?: string;
  /** IP family preference */
  family?: 4 | 6;
  /** DNS lookup function */
  lookup?: any;
  /** Before redirect callback */
  beforeRedirect?: (options: any, responseDetails: any) => void;
  /** Max redirects */
  maxRedirects?: number;
  /** Decompress response */
  decompress?: boolean;
  /** Max content length */
  maxContentLength?: number;
  /** Max body length */
  maxBodyLength?: number;
  /** Transitional options */
  transitional?: TransitionalOptions;
  /** Environment options */
  env?: EnvironmentOptions;
  /** Form serializer options */
  formSerializer?: FormSerializerOptions;
  /** Max rate for requests */
  maxRate?: number | [number, number];
  /** Rate limit callback */
  onRateLimit?: (retryAfter: number, options: any) => void;
  /** Response callback */
  onResponse?: (response: Response) => void;
  /** Error callback */
  onError?: (error: Error) => void;
}

// Client types
export interface Client {
  <T = any>(options: RequestOptions): Promise<T>;
  request<T = any>(options: RequestOptions): Promise<T>;
  get<T = any>(url: string, options?: Omit<RequestOptions, 'url' | 'method'>): Promise<T>;
  post<T = any>(url: string, data?: unknown, options?: Omit<RequestOptions, 'url' | 'method' | 'body'>): Promise<T>;
  put<T = any>(url: string, data?: unknown, options?: Omit<RequestOptions, 'url' | 'method' | 'body'>): Promise<T>;
  patch<T = any>(url: string, data?: unknown, options?: Omit<RequestOptions, 'url' | 'method' | 'body'>): Promise<T>;
  delete<T = any>(url: string, options?: Omit<RequestOptions, 'url' | 'method'>): Promise<T>;
  head<T = any>(url: string, options?: Omit<RequestOptions, 'url' | 'method'>): Promise<T>;
  options<T = any>(url: string, options?: Omit<RequestOptions, 'url' | 'method'>): Promise<T>;
  json<T = any>(url: string, options?: Omit<RequestOptions, 'url' | 'responseType'>): Promise<T>;
  text<T = any>(url: string, options?: Omit<RequestOptions, 'url' | 'responseType'>): Promise<T>;
  blob<T = any>(url: string, options?: Omit<RequestOptions, 'url' | 'responseType'>): Promise<T>;
  arrayBuffer<T = any>(url: string, options?: Omit<RequestOptions, 'url' | 'responseType'>): Promise<T>;
  stream<T = any>(url: string, options?: Omit<RequestOptions, 'url' | 'responseType'>): Promise<T>;
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
  interceptors?: {
    request?: Array<(request: Request) => Request>;
    response?: Array<(response: any) => any>;
  };
  /** Query parameter serializer */
  paramsSerializer?: (params: Record<string, any>) => string;
  /** Validate status function */
  validateStatus?: (status: number) => boolean;
  /** Max redirects */
  maxRedirects?: number;
  /** With credentials */
  withCredentials?: boolean;
  /** Enable cookie handling */
  cookies?: boolean;
}

// Transport and middleware types
export interface Transport {
  (request: Request): Promise<Response>;
}

export interface Middleware {
  (ctx: Context, next: () => Promise<void>): Promise<void>;
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

export interface CacheStorage extends BaseStorage<Response> {
  // CacheStorage now extends BaseStorage<Response>
  // All methods are inherited from BaseStorage
}

// Error types - Moved to errors.ts as classes
// These interfaces are now replaced by concrete error classes

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
export interface RetryPluginOptions extends BasePluginOptions {
  retries?: number;
  minDelay?: number;
  maxDelay?: number;
  factor?: number;
  jitter?: boolean;
  respectRetryAfter?: boolean;
  retryOn?: (error: Error | Response) => boolean;
  onRetry?: (info: RetryInfo) => void;
}

export interface CachePluginOptions extends BasePluginOptions {
  ttl?: number;
  keyGenerator?: (req: Request) => string;
  storage?: CacheStorage;
  staleWhileRevalidate?: boolean;
  onCacheHit?: (key: string) => void;
  onCacheMiss?: (key: string) => void;
}

export interface RateLimitPluginOptions extends BasePluginOptions {
  requests: number;
  window: number;
  keyGenerator?: (req: Request) => string;
  onLimitReached?: (key: string, limit: number) => void;
}

export interface CircuitBreakerPluginOptions extends BasePluginOptions {
  failureThreshold: number;
  window: number;
  resetTimeout: number;
  keyGenerator?: (req: Request) => string;
  onStateChange?: (key: string, state: CircuitBreakerState, failures: number) => void;
}

export interface DedupePluginOptions extends BasePluginOptions {
  maxAge?: number;
  maxPending?: number;
  keyGenerator?: (req: Request) => string;
  onDedupe?: (key: string) => void;
}

export interface MetricsPluginOptions extends BasePluginOptions {
  onMetrics?: (data: Metrics) => void;
  sampling?: number;
  formatter?: (data: Metrics) => string;
}

// Circuit breaker types
export type CircuitBreakerState = 'closed' | 'open' | 'half-open';

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

// Key Generator types
export interface KeyGeneratorOptions {
  /** Include HTTP method in key */
  includeMethod?: boolean;
  /** Include request body in key */
  includeBody?: boolean;
  /** Include specific headers in key */
  includeHeaders?: string[];
  /** Include all headers in key */
  includeAllHeaders?: boolean;
  /** Hash algorithm to use */
  hashAlgorithm?: 'md5' | 'sha256' | 'base64' | 'none';
  /** Custom key prefix */
  prefix?: string;
  /** Custom key suffix */
  suffix?: string;
  /** Include query parameters */
  includeQuery?: boolean;
  /** Include URL fragment */
  includeFragment?: boolean;
}

// Plugin Factory types
export interface BasePluginOptions {
  /** Enable/disable the plugin */
  enabled?: boolean;
  /** Plugin name for debugging */
  name?: string;
  /** Plugin priority (higher = earlier execution) */
  priority?: number;
  /** Condition function to determine if plugin should run */
  condition?: (context: Context) => boolean;
  /** Plugin timeout in milliseconds */
  timeout?: number;
  /** Number of retries for plugin operations */
  retries?: number;
  /** Custom error message */
  message?: string;
}

export interface PluginHooks {
  /** Called before the plugin executes */
  onBefore?: (ctx: Context) => void | Promise<void>;
  /** Called after the plugin executes successfully */
  onAfter?: (ctx: Context) => void | Promise<void>;
  /** Called when the plugin encounters an error */
  onError?: (error: Error, ctx: Context) => void | Promise<void>;
  /** Called when the plugin is disabled */
  onDisabled?: (ctx: Context) => void | Promise<void>;
}

// Performance types
export interface PerformanceMetrics {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  timestamp: number;
}

// Build types
export interface BuildOptions {
  minify?: boolean;
  treeShaking?: boolean;
  codeSplitting?: boolean;
  compression?: boolean;
  sourceMap?: boolean;
  target?: string;
  format?: 'esm' | 'cjs' | 'umd';
}

export interface BundleAnalysis {
  totalSize: number;
  totalModules: number;
  averageSize: number;
  medianSize: number;
  largestModules: Array<{ name: string; size: number; dependencies: string[] }>;
  sizeDistribution: {
    small: number;
    medium: number;
    large: number;
    xlarge: number;
  };
  dependencyGraph: Map<string, string[]>;
}

export interface OptimizationConfig {
  minify?: boolean;
  treeShaking?: boolean;
  codeSplitting?: boolean;
  compression?: boolean;
}

export type PluginImplementation<T extends BasePluginOptions> = (
  config: T,
  ctx: Context,
  next: () => Promise<void>
) => Promise<void>;