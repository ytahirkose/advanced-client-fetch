/**
 * Advanced Client Fetch - The modern HTTP client (Optimized)
 * 
 * A fetch-first, plugin-based HTTP client that works across all platforms.
 * More powerful than Axios with smart retry, caching, rate limiting, and more.
 */

// Core types and interfaces
export interface RequestOptions {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  signal?: AbortSignal;
  responseType?: 'json' | 'text' | 'blob' | 'arrayBuffer' | 'stream';
  retry?: number;
  cache?: boolean;
  [key: string]: any;
}

export interface Response<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
  config: RequestOptions;
  request?: any;
}

export interface Client {
  get<T = any>(url: string, options?: RequestOptions): Promise<Response<T>>;
  post<T = any>(url: string, data?: any, options?: RequestOptions): Promise<Response<T>>;
  put<T = any>(url: string, data?: any, options?: RequestOptions): Promise<Response<T>>;
  patch<T = any>(url: string, data?: any, options?: RequestOptions): Promise<Response<T>>;
  delete<T = any>(url: string, options?: RequestOptions): Promise<Response<T>>;
  head<T = any>(url: string, options?: RequestOptions): Promise<Response<T>>;
  options<T = any>(url: string, options?: RequestOptions): Promise<Response<T>>;
  request<T = any>(options: RequestOptions): Promise<Response<T>>;
  // Response helper methods
  json<T = any>(url: string, options?: RequestOptions): Promise<T>;
  text(url: string, options?: RequestOptions): Promise<string>;
  blob(url: string, options?: RequestOptions): Promise<Blob>;
  arrayBuffer(url: string, options?: RequestOptions): Promise<ArrayBuffer>;
  stream(url: string, options?: RequestOptions): Promise<ReadableStream>;
}

export interface ClientOptions {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  plugins?: Middleware[];
  signal?: AbortSignal;
}

// Error classes
export class HttpError extends Error {
  public status: number;
  public statusText: string;
  public response?: Response;

  constructor(message: string, status: number, statusText: string, response?: Response) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.statusText = statusText;
    this.response = response;
  }

  static isHttpError(error: any): error is HttpError {
    return error instanceof HttpError;
  }
}

export class NetworkError extends Error {
  public code?: string;
  public request?: any;

  constructor(message: string, code?: string, request?: any) {
    super(message);
    this.name = 'NetworkError';
    this.code = code;
    this.request = request;
  }

  static isNetworkError(error: any): error is NetworkError {
    return error instanceof NetworkError;
  }
}

export class AbortError extends Error {
  constructor(message: string = 'Request aborted') {
    super(message);
    this.name = 'AbortError';
  }

  static isAbortError(error: any): error is AbortError {
    return error instanceof AbortError;
  }
}

export class TimeoutError extends Error {
  constructor(message: string = 'Request timeout') {
    super(message);
    this.name = 'TimeoutError';
  }

  static isTimeoutError(error: any): error is TimeoutError {
    return error instanceof TimeoutError;
  }
}

// Middleware system
export interface Middleware {
  (ctx: any, next: () => Promise<any>): Promise<any>;
}

// Utility functions
export function buildURL(baseURL?: string, url?: string, query?: Record<string, any>): string {
  if (!url) return baseURL || '';
  
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  const fullURL = baseURL ? `${baseURL.replace(/\/$/, '')}/${url.replace(/^\//, '')}` : url;
  
  if (query && Object.keys(query).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, String(v)));
        } else {
          searchParams.set(key, String(value));
        }
      }
    });
    const queryString = searchParams.toString();
    return queryString ? `${fullURL}?${queryString}` : fullURL;
  }
  
  return fullURL;
}

export function mergeHeaders(...headers: (Record<string, string> | Headers)[]): Headers {
  const merged = new Headers();
  
  for (const header of headers) {
    if (header instanceof Headers) {
      for (const [key, value] of header.entries()) {
        merged.set(key, value);
      }
    } else if (header && typeof header === 'object') {
      for (const [key, value] of Object.entries(header)) {
        merged.set(key, value);
      }
    }
  }
  
  return merged;
}

export function normalizeBody(body: any): BodyInit | undefined {
  if (body === undefined || body === null) {
    return undefined;
  }
  
  if (typeof body === 'string') {
    return body;
  }
  
  if (body instanceof FormData) {
    return body;
  }
  
  if (body instanceof URLSearchParams) {
    return body;
  }
  
  if (body instanceof ArrayBuffer) {
    return body;
  }
  
  if (body instanceof Blob) {
    return body;
  }
  
  if (body instanceof ReadableStream) {
    return body;
  }
  
  if (typeof body === 'object') {
    return JSON.stringify(body);
  }
  
  return String(body);
}

export function generateRequestId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function calculateBackoffDelay(attempt: number, options: { minDelay?: number; maxDelay?: number; factor?: number } = {}): number {
  const { minDelay = 100, maxDelay = 2000, factor = 2 } = options;
  const delay = minDelay * Math.pow(factor, attempt);
  return Math.min(delay, maxDelay);
}

export function calculateRetryDelay(attempt: number, options: { minDelay?: number; maxDelay?: number; factor?: number; jitter?: boolean } = {}): number {
  const { minDelay = 100, maxDelay = 2000, factor = 2, jitter = true } = options;
  const delay = calculateBackoffDelay(attempt, { minDelay, maxDelay, factor });
  return jitter ? delay * (0.5 + Math.random() * 0.5) : delay;
}

export function waitForRetry(delay: number): Promise<void> {
  return sleep(delay);
}

export function isRetryableError(error: any): boolean {
  if (!error) return false;
  
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return true;
  }
  
  if (error.status) {
    return error.status >= 500 || error.status === 429;
  }
  
  if (error.name === 'TimeoutError' || error.name === 'AbortError') {
    return true;
  }
  
  return false;
}

// Plugin system
export interface RetryOptions {
  retries?: number;
  minDelay?: number;
  maxDelay?: number;
  factor?: number;
  jitter?: boolean;
  retryOn?: (error: any) => boolean;
  onRetry?: (info: any) => void;
}

export function retry(options: RetryOptions = {}): Middleware {
  const {
    retries = 3,
    minDelay = 100,
    maxDelay = 2000,
    factor = 2,
    jitter = true,
    retryOn = (error: any) => error.status >= 500 || error.status === 429,
    onRetry = () => {}
  } = options;

  return async (_ctx, next) => {
    let lastError: any;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await next();
      } catch (error: any) {
        lastError = error;
        
        if (attempt === retries || !retryOn(error)) {
          throw error;
        }
        
        const delay = calculateRetryDelay(attempt, { minDelay, maxDelay, factor, jitter });
        await waitForRetry(delay);
        onRetry({ attempt: attempt + 1, error, delay });
      }
    }
    
    throw lastError;
  };
}

export interface CacheOptions {
  ttl?: number;
  maxSize?: number;
  storage?: Map<string, any>;
}

export function cache(options: CacheOptions = {}): Middleware {
  const { ttl = 300000, maxSize = 100, storage = new Map() } = options;
  
  return async (ctx, next) => {
    const key = ctx.request.url;
    const cached = storage.get(key);
    
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.response;
    }
    
    const response = await next();
    
    if (storage.size >= maxSize) {
      const firstKey = storage.keys().next().value;
      storage.delete(firstKey);
    }
    
    storage.set(key, {
      response,
      timestamp: Date.now()
    });
    
    return response;
  };
}

export interface RateLimitOptions {
  maxRequests?: number;
  windowMs?: number;
  storage?: Map<string, { count: number; resetTime: number }>;
}

export function rateLimit(options: RateLimitOptions = {}): Middleware {
  const { maxRequests = 100, windowMs = 60000, storage = new Map() } = options;
  
  return async (ctx, next) => {
    const key = ctx.request.url;
    const now = Date.now();
    const record = storage.get(key);
    
    if (!record || now > record.resetTime) {
      storage.set(key, { count: 1, resetTime: now + windowMs });
      return await next();
    }
    
    if (record.count >= maxRequests) {
      throw new Error('Rate limit exceeded');
    }
    
    record.count++;
    return await next();
  };
}

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeout?: number;
  monitoringPeriod?: number;
  storage?: Map<string, { failures: number; lastFailureTime: number; state: 'closed' | 'open' | 'half-open' }>;
}

export function circuitBreaker(options: CircuitBreakerOptions = {}): Middleware {
  const { 
    failureThreshold = 5, 
    resetTimeout = 60000, 
    storage = new Map() 
  } = options;
  
  return async (ctx, next) => {
    const key = ctx.request.url;
    const now = Date.now();
    const record = storage.get(key) || { failures: 0, lastFailureTime: 0, state: 'closed' as const };
    
    if (record.state === 'open') {
      if (now - record.lastFailureTime > resetTimeout) {
        record.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }
    
    try {
      const response = await next();
      
      if (record.state === 'half-open') {
        record.state = 'closed';
        record.failures = 0;
      }
      
      return response;
    } catch (error) {
      record.failures++;
      record.lastFailureTime = now;
      
      if (record.failures >= failureThreshold) {
        record.state = 'open';
      }
      
      storage.set(key, record);
      throw error;
    }
  };
}

// Main client implementation
export function createClient(options: ClientOptions = {}): Client {
  const {
    baseURL = '',
    timeout = 30000,
    headers = {},
    plugins = [],
    signal
  } = options;

  const client: Client = {
    async get<T = any>(url: string, requestOptions: RequestOptions = {}): Promise<Response<T>> {
      return client.request<T>({ ...requestOptions, method: 'GET', url });
    },

    async post<T = any>(url: string, data?: any, requestOptions: RequestOptions = {}): Promise<Response<T>> {
      return client.request<T>({ ...requestOptions, method: 'POST', url, body: data });
    },

    async put<T = any>(url: string, data?: any, requestOptions: RequestOptions = {}): Promise<Response<T>> {
      return client.request<T>({ ...requestOptions, method: 'PUT', url, body: data });
    },

    async patch<T = any>(url: string, data?: any, requestOptions: RequestOptions = {}): Promise<Response<T>> {
      return client.request<T>({ ...requestOptions, method: 'PATCH', url, body: data });
    },

    async delete<T = any>(url: string, requestOptions: RequestOptions = {}): Promise<Response<T>> {
      return client.request<T>({ ...requestOptions, method: 'DELETE', url });
    },

    async head<T = any>(url: string, requestOptions: RequestOptions = {}): Promise<Response<T>> {
      return client.request<T>({ ...requestOptions, method: 'HEAD', url });
    },

    async options<T = any>(url: string, requestOptions: RequestOptions = {}): Promise<Response<T>> {
      return client.request<T>({ ...requestOptions, method: 'OPTIONS', url });
    },

    // Response helper methods
    async json<T = any>(url: string, options: RequestOptions = {}): Promise<T> {
      const response = await client.request<T>({ ...options, method: 'GET', url, responseType: 'json' });
      return response.data;
    },

    async text(url: string, options: RequestOptions = {}): Promise<string> {
      const response = await client.request<string>({ ...options, method: 'GET', url, responseType: 'text' });
      return response.data;
    },

    async blob(url: string, options: RequestOptions = {}): Promise<Blob> {
      const response = await client.request<Blob>({ ...options, method: 'GET', url, responseType: 'blob' });
      return response.data;
    },

    async arrayBuffer(url: string, options: RequestOptions = {}): Promise<ArrayBuffer> {
      const response = await client.request<ArrayBuffer>({ ...options, method: 'GET', url, responseType: 'arrayBuffer' });
      return response.data;
    },

    async stream(url: string, options: RequestOptions = {}): Promise<ReadableStream> {
      const response = await client.request<ReadableStream>({ ...options, method: 'GET', url, responseType: 'stream' });
      return response.data;
    },

    async request<T = any>(requestOptions: RequestOptions): Promise<Response<T>> {
      const {
        method = 'GET',
        url = '',
        headers: requestHeaders = {},
        body,
        timeout: requestTimeout = timeout,
        signal: requestSignal = signal,
        responseType = 'json'
      } = requestOptions;

      // Build URL
      const fullURL = buildURL(baseURL, url, requestOptions.query);
      
      // Merge headers
      const mergedHeaders = mergeHeaders(headers, requestHeaders);
      
      // Normalize body
      const normalizedBody = normalizeBody(body);
      
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), requestTimeout);
      
      // Combine signals
      const combinedSignal = requestSignal ? 
        (() => {
          const combined = new AbortController();
          requestSignal.addEventListener('abort', () => combined.abort());
          controller.signal.addEventListener('abort', () => combined.abort());
          return combined.signal;
        })() : 
        controller.signal;

      try {
        // Create request
        const request = new Request(fullURL, {
          method,
          headers: mergedHeaders,
          body: normalizedBody,
          signal: combinedSignal,
        });

        // Execute middleware pipeline
        let response: Response;
        const context = { request, response: undefined as any, error: undefined as any };
        
        // Run plugins
        for (const plugin of plugins) {
          await plugin(context, async () => {
            response = await fetch(request);
            return response;
          });
        }
        
        if (!response!) {
          response = await fetch(request);
        }

        // Handle response based on type
        let data: T;
        switch (responseType) {
          case 'json':
            data = await response.json() as T;
            break;
          case 'text':
            data = await response.text() as T;
            break;
          case 'blob':
            data = await response.blob() as T;
            break;
          case 'arrayBuffer':
            data = await response.arrayBuffer() as T;
            break;
          case 'stream':
            data = response.body as T;
            break;
          default:
            data = await response.json() as T;
        }

        return {
          data,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          config: requestOptions,
          request
        };

      } catch (error: any) {
        if (error.name === 'AbortError') {
          throw new AbortError('Request was aborted');
        }
        throw new NetworkError(error.message, error.code, request);
      } finally {
        clearTimeout(timeoutId);
      }
    }
  };

  return client;
}

// Platform presets
export function createNodeClient(options: ClientOptions = {}): Client {
  return createClient({
    ...options,
    plugins: [
      retry({ retries: 3 }),
      cache({ ttl: 300000 }),
      rateLimit({ maxRequests: 100, windowMs: 60000 }),
      circuitBreaker({ failureThreshold: 5, resetTimeout: 60000 }),
      ...(options.plugins || [])
    ]
  });
}

export function createEdgeClient(options: ClientOptions = {}): Client {
  return createClient({
    ...options,
    plugins: [
      retry({ retries: 2 }),
      cache({ ttl: 60000 }),
      ...(options.plugins || [])
    ]
  });
}

export function createBrowserClient(options: ClientOptions = {}): Client {
  return createClient({
    ...options,
    plugins: [
      retry({ retries: 2 }),
      cache({ ttl: 300000 }),
      ...(options.plugins || [])
    ]
  });
}

export function createDenoClient(options: ClientOptions = {}): Client {
  return createClient({
    ...options,
    plugins: [
      retry({ retries: 3 }),
      cache({ ttl: 300000 }),
      ...(options.plugins || [])
    ]
  });
}

export function createBunClient(options: ClientOptions = {}): Client {
  return createClient({
    ...options,
    plugins: [
      retry({ retries: 3 }),
      cache({ ttl: 300000 }),
      ...(options.plugins || [])
    ]
  });
}

// Axios compatibility
export interface AxiosRequestConfig {
  url?: string;
  method?: string;
  baseURL?: string;
  headers?: Record<string, string>;
  data?: any;
  timeout?: number;
  signal?: AbortSignal;
  responseType?: 'json' | 'text' | 'blob' | 'arrayBuffer' | 'stream';
  [key: string]: any;
}

export interface AxiosResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
  config: AxiosRequestConfig;
  request?: any;
}

export class AxiosError extends Error {
  public code?: string;
  public config?: AxiosRequestConfig;
  public request?: any;
  public response?: AxiosResponse;

  constructor(message: string, code?: string, config?: AxiosRequestConfig, request?: any, response?: AxiosResponse) {
    super(message);
    this.name = 'AxiosError';
    this.code = code;
    this.config = config;
    this.request = request;
    this.response = response;
  }

  static isAxiosError(error: any): error is AxiosError {
    return error instanceof AxiosError;
  }
}

export function createAxiosAdapter(options: AxiosRequestConfig = {}) {
  const client = createClient({
    baseURL: options.baseURL,
    timeout: options.timeout,
    headers: options.headers,
    signal: options.signal
  });

  return {
    async request<T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
      try {
        const response = await client.request<T>({
          method: config.method || 'GET',
          url: config.url,
          headers: config.headers,
          body: config.data,
          timeout: config.timeout,
          signal: config.signal,
          responseType: config.responseType
        });

        return {
          data: response.data,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          config: { ...options, ...config },
          request: response.request
        };
      } catch (error: any) {
        throw new AxiosError(
          error.message,
          error.code,
          { ...options, ...config },
          error.request,
          error.response
        );
      }
    },

    get: <T = any>(url: string, config?: AxiosRequestConfig) => 
      client.request<T>({ ...config, method: 'GET', url }),
    
    post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
      client.request<T>({ ...config, method: 'POST', url, body: data }),
    
    put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
      client.request<T>({ ...config, method: 'PUT', url, body: data }),
    
    patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
      client.request<T>({ ...config, method: 'PATCH', url, body: data }),
    
    delete: <T = any>(url: string, config?: AxiosRequestConfig) => 
      client.request<T>({ ...config, method: 'DELETE', url }),
    
    head: <T = any>(url: string, config?: AxiosRequestConfig) => 
      client.request<T>({ ...config, method: 'HEAD', url }),
    
    options: <T = any>(url: string, config?: AxiosRequestConfig) => 
      client.request<T>({ ...config, method: 'OPTIONS', url })
  };
}

// Security features
export interface SecurityOptions {
  ssrfProtection?: boolean;
  blockPrivateIPs?: boolean;
  blockLocalhost?: boolean;
  allowedDomains?: string[];
  allowedHosts?: string[];
  maxRequestSize?: number;
  maxResponseSize?: number;
}

export function validateUrlForSSRF(url: string, options: SecurityOptions = {}): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    if (options.allowedDomains && options.allowedDomains.length > 0) {
      const isAllowed = options.allowedDomains.some(domain => {
        if (domain.startsWith('*.')) {
          const baseDomain = domain.slice(2);
          return hostname.endsWith(baseDomain) || hostname === baseDomain;
        }
        return hostname === domain;
      });
      if (!isAllowed) return false;
    }
    
    if (options.allowedHosts && options.allowedHosts.length > 0) {
      if (!options.allowedHosts.includes(hostname)) return false;
    }
    
    if (options.blockLocalhost) {
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
        return false;
      }
    }
    
    if (options.blockPrivateIPs) {
      const ip = hostname;
      if (ip.match(/^10\./) || 
          ip.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./) || 
          ip.match(/^192\.168\./) ||
          ip.match(/^169\.254\./) ||
          ip.match(/^127\./)) {
        return false;
      }
    }
    
    return true;
  } catch {
    return false;
  }
}

export function cleanHopByHopHeaders(headers: Headers): Headers {
  const hopByHopHeaders = [
    'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
    'te', 'trailers', 'transfer-encoding', 'upgrade'
  ];
  
  const cleaned = new Headers();
  for (const [key, value] of headers.entries()) {
    if (!hopByHopHeaders.includes(key.toLowerCase())) {
      cleaned.set(key, value);
    }
  }
  return cleaned;
}

export function blockDangerousHeaders(headers: Headers): Headers {
  const dangerousHeaders = [
    'host', 'origin', 'referer', 'user-agent', 'x-forwarded-for',
    'x-forwarded-host', 'x-forwarded-proto', 'x-real-ip'
  ];
  
  const safe = new Headers();
  for (const [key, value] of headers.entries()) {
    if (!dangerousHeaders.includes(key.toLowerCase())) {
      safe.set(key, value);
    }
  }
  return safe;
}

export function createSecurityMiddleware(options: SecurityOptions = {}): Middleware {
  return async (ctx, next) => {
    if (options.ssrfProtection && ctx.request.url) {
      if (!validateUrlForSSRF(ctx.request.url, options)) {
        throw new Error('SSRF protection: URL not allowed');
      }
    }
    
    if (options.maxRequestSize && ctx.request.body) {
      const contentLength = ctx.request.headers.get('content-length');
      if (contentLength) {
        const size = parseInt(contentLength, 10);
        if (size > options.maxRequestSize) {
          throw new Error('Request size exceeds limit');
        }
      }
    }
    
    if (ctx.request.headers) {
      ctx.request.headers = cleanHopByHopHeaders(ctx.request.headers);
      ctx.request.headers = blockDangerousHeaders(ctx.request.headers);
    }
    
    return await next();
  };
}

// Cookie management
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

export interface CookieJar {
  get(url: string): Cookie[];
  set(url: string, cookies: Cookie[]): void;
  clear(): void;
  getAll(): Map<string, Cookie[]>;
}

export class MemoryCookieJar implements CookieJar {
  private cookies = new Map<string, Cookie[]>();
  
  get(url: string): Cookie[] {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    const path = urlObj.pathname;
    
    const allCookies: Cookie[] = [];
    
    for (const [key, cookies] of this.cookies.entries()) {
      if (this.matchesDomain(key, domain) && this.matchesPath(key, path)) {
        allCookies.push(...cookies);
      }
    }
    
    return allCookies;
  }
  
  set(url: string, cookies: Cookie[]): void {
    const urlObj = new URL(url);
    const key = `${urlObj.hostname}${urlObj.pathname}`;
    this.cookies.set(key, cookies);
  }
  
  clear(): void {
    this.cookies.clear();
  }
  
  getAll(): Map<string, Cookie[]> {
    return new Map(this.cookies);
  }
  
  private matchesDomain(key: string, domain: string): boolean {
    const keyDomain = key.split('/')[0];
    return keyDomain === domain || domain.endsWith(`.${keyDomain}`);
  }
  
  private matchesPath(key: string, path: string): boolean {
    const keyPath = key.split('/').slice(1).join('/');
    return path.startsWith(keyPath);
  }
}

export function createCookieJar(): CookieJar {
  return new MemoryCookieJar();
}

export function parseCookies(cookieHeader: string): Cookie[] {
  if (!cookieHeader) return [];
  
  return cookieHeader.split(';').map(cookie => {
    const [name, value] = cookie.trim().split('=');
    return { name: name.trim(), value: value?.trim() || '' };
  });
}

export function formatCookies(cookies: Cookie[]): string {
  return cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
}

export function createCookieMiddleware(jar: CookieJar): Middleware {
  return async (ctx, next) => {
    const cookies = jar.get(ctx.request.url);
    if (cookies.length > 0) {
      const cookieHeader = formatCookies(cookies);
      ctx.request.headers = new Headers(ctx.request.headers);
      ctx.request.headers.set('Cookie', cookieHeader);
    }
    
    const response = await next();
    
    const setCookieHeader = response.headers.get('Set-Cookie');
    if (setCookieHeader) {
      const cookies = parseCookies(setCookieHeader);
      jar.set(ctx.request.url, cookies);
    }
    
    return response;
  };
}

// Default export
export default createClient;
