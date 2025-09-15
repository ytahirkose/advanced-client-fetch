/**
 * Advanced Client Fetch - The modern HTTP client
 * 
 * A fetch-first, plugin-based HTTP client that works across all platforms.
 * More powerful than Axios with smart retry, caching, rate limiting, and more.
 * 
 * @example
 * ```typescript
 * import { createClient, retry, cache, rateLimit } from 'advanced-client-fetch';
 * 
 * const client = createClient({
 *   baseURL: 'https://api.example.com',
 *   plugins: [retry(), cache(), rateLimit()]
 * });
 * 
 * const data = await client.get('/users');
 * ```
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
  constructor(message: string = 'Request was aborted') {
    super(message);
    this.name = 'AbortError';
  }

  static isAbortError(error: any): error is AbortError {
    return error instanceof AbortError;
  }
}

// Utility functions
export function isJSONResponse(contentType: string): boolean {
  return contentType.includes('application/json');
}

export function getContentType(headers: Headers): string {
  return headers.get('content-type') || '';
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

      // Combine URLs
      const fullUrl = baseURL ? `${baseURL}${url}` : url;

      // Combine headers
      const combinedHeaders = { ...headers, ...requestHeaders };

      // Create context for middleware
      const context = {
        request: {
          method,
          url: fullUrl,
          headers: combinedHeaders,
          body,
          signal: requestSignal,
          responseType
        },
        response: null as Response<T> | null,
        error: null as any
      };

      // Create middleware chain
      const middlewareChain = [...(plugins || [])];
      
      // Add the actual fetch middleware at the end
      middlewareChain.push(async (ctx: any, next: () => Promise<any>) => {
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), requestTimeout);

        // Combine signals
        const combinedSignal = requestSignal ? 
          (() => {
            const combinedController = new AbortController();
            const abort = () => combinedController.abort();
            requestSignal.addEventListener('abort', abort);
            controller.signal.addEventListener('abort', abort);
            return combinedController.signal;
          })() : 
          controller.signal;

        try {
          // Create fetch options
          const fetchOptions: RequestInit = {
            method: ctx.request.method,
            headers: ctx.request.headers,
            signal: combinedSignal
          };

          // Add body if present
          if (ctx.request.body !== undefined) {
            if (typeof ctx.request.body === 'string') {
              fetchOptions.body = ctx.request.body;
            } else if (ctx.request.body instanceof FormData) {
              fetchOptions.body = ctx.request.body;
            } else if (ctx.request.body instanceof URLSearchParams) {
              fetchOptions.body = ctx.request.body;
            } else if (ctx.request.body instanceof ArrayBuffer) {
              fetchOptions.body = ctx.request.body;
            } else if (ctx.request.body instanceof Blob) {
              fetchOptions.body = ctx.request.body;
            } else if (typeof ctx.request.body === 'object') {
              fetchOptions.body = JSON.stringify(ctx.request.body);
              ctx.request.headers['Content-Type'] = 'application/json';
            }
          }

          // Make the request
          const response = await fetch(ctx.request.url, fetchOptions);

          // Clear timeout
          clearTimeout(timeoutId);

          // Handle response
          let data: T;
          switch (ctx.request.responseType) {
            case 'json':
              data = await response.json();
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
              data = await response.json();
          }

          // Create response object
          const responseObj: Response<T> = {
            data,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            config: requestOptions,
            request: { url: ctx.request.url, method: ctx.request.method, headers: ctx.request.headers }
          };

          // Check for HTTP errors
          if (!response.ok) {
            throw new HttpError(
              `Request failed with status ${response.status}`,
              response.status,
              response.statusText,
              responseObj
            );
          }

          ctx.response = responseObj;
          return responseObj;

        } catch (error) {
          clearTimeout(timeoutId);

          if (error instanceof HttpError) {
            throw error;
          }

          if (error instanceof DOMException && error.name === 'AbortError') {
            throw new AbortError('Request was aborted');
          }

          if (error instanceof TypeError) {
            throw new NetworkError(`Network error: ${error.message}`);
          }

          throw new NetworkError(`Request failed: ${error.message}`);
        }
      });

      // Execute middleware chain
      let index = 0;
      const next = async () => {
        if (index >= middlewareChain.length) {
          return context.response;
        }
        
        const middleware = middlewareChain[index++];
        return await middleware(context, next);
      };

      try {
        return await next();
      } catch (error) {
        context.error = error;
        throw error;
      }
    }
  };

  return client;
}

// Plugin system
export interface Middleware {
  (ctx: any, next: () => Promise<any>): Promise<any>;
}

export interface RetryOptions {
  retries?: number;
  minDelay?: number;
  maxDelay?: number;
  factor?: number;
  jitter?: boolean;
  respectRetryAfter?: boolean;
  retryAfterCap?: number;
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
    respectRetryAfter = true,
    retryAfterCap = 30000,
    retryOn = (error) => error.status >= 500 || error.status === 429,
    onRetry = () => {}
  } = options;

  return async (ctx, next) => {
    let lastError: any;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await next();
      } catch (error) {
        lastError = error;
        
        if (attempt === retries || !retryOn(error)) {
          throw error;
        }
        
        const delay = Math.min(
          minDelay * Math.pow(factor, attempt),
          maxDelay
        );
        
        const jitterDelay = jitter ? delay * (0.5 + Math.random() * 0.5) : delay;
        
        onRetry({ attempt: attempt + 1, delay: jitterDelay, error });
        
        await new Promise(resolve => setTimeout(resolve, jitterDelay));
      }
    }
    
    throw lastError;
  };
}

export interface CacheOptions {
  ttl?: number;
  storage?: any;
  keyGenerator?: (request: any) => string;
}

export function cache(options: CacheOptions = {}): Middleware {
  const { ttl = 300000, storage = new Map(), keyGenerator = (req) => req.url } = options;
  
  return async (ctx, next) => {
    const key = keyGenerator(ctx.request);
    const cached = storage.get(key);
    
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.response;
    }
    
    const response = await next();
    storage.set(key, { response, timestamp: Date.now() });
    
    return response;
  };
}

export interface RateLimitOptions {
  maxRequests?: number;
  windowMs?: number;
  keyGenerator?: (request: any) => string;
}

export function rateLimit(options: RateLimitOptions = {}): Middleware {
  const { maxRequests = 100, windowMs = 60000, keyGenerator = () => 'default' } = options;
  const requests = new Map<string, number[]>();
  
  return async (ctx, next) => {
    const key = keyGenerator(ctx.request);
    const now = Date.now();
    const windowStart = now - windowMs;
    
    const userRequests = requests.get(key) || [];
    const recentRequests = userRequests.filter(time => time > windowStart);
    
    if (recentRequests.length >= maxRequests) {
      throw new Error('Rate limit exceeded');
    }
    
    recentRequests.push(now);
    requests.set(key, recentRequests);
    
    return await next();
  };
}

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  windowMs?: number;
  resetTimeout?: number;
  keyGenerator?: (request: any) => string;
}

export function circuitBreaker(options: CircuitBreakerOptions = {}): Middleware {
  const { 
    failureThreshold = 5, 
    windowMs = 60000, 
    resetTimeout = 30000,
    keyGenerator = (req) => {
      try {
        return new URL(req.url).hostname;
      } catch {
        return req.url;
      }
    }
  } = options;
  
  const states = new Map<string, { state: 'closed' | 'open' | 'half-open', failures: number, lastFailure: number }>();
  
  return async (ctx, next) => {
    const key = keyGenerator(ctx.request);
    const now = Date.now();
    const circuit = states.get(key) || { state: 'closed', failures: 0, lastFailure: 0 };
    
    if (circuit.state === 'open') {
      if (now - circuit.lastFailure > resetTimeout) {
        circuit.state = 'half-open';
        states.set(key, circuit);
      } else {
        throw new Error('Circuit breaker is open');
      }
    }
    
    try {
      const response = await next();
      
      if (circuit.state === 'half-open') {
        circuit.state = 'closed';
        circuit.failures = 0;
        states.set(key, circuit);
      }
      
      return response;
    } catch (error) {
      circuit.failures++;
      circuit.lastFailure = now;
      
      if (circuit.failures >= failureThreshold) {
        circuit.state = 'open';
      }
      
      states.set(key, circuit);
      throw error;
    }
  };
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
  params?: Record<string, any>;
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

export interface AxiosError extends Error {
  config: AxiosRequestConfig;
  code?: string;
  request?: any;
  response?: AxiosResponse;
  isAxiosError: boolean;
}

export class AxiosError extends Error implements AxiosError {
  public config: AxiosRequestConfig;
  public code?: string;
  public request?: any;
  public response?: AxiosResponse;
  public isAxiosError = true;

  constructor(message: string, config: AxiosRequestConfig, code?: string, request?: any, response?: AxiosResponse) {
    super(message);
    this.name = 'AxiosError';
    this.config = config;
    this.code = code;
    this.request = request;
    this.response = response;
  }

  static isAxiosError(error: any): error is AxiosError {
    return error && error.isAxiosError === true;
  }
}

export function createAxiosAdapter(options: ClientOptions = {}): any {
  const client = createClient(options);
  
  const axiosAdapter = {
    request: async (config: AxiosRequestConfig): Promise<AxiosResponse> => {
      try {
        const response = await client.request({
          method: config.method || 'GET',
          url: config.url || '',
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
          config: config,
          request: response.request
        };
      } catch (error) {
        if (error instanceof HttpError) {
          throw new AxiosError(
            error.message,
            config,
            error.status.toString(),
            undefined,
            {
              data: error.response?.data,
              status: error.status,
              statusText: error.statusText,
              headers: error.response?.headers || new Headers(),
              config: config,
              request: undefined
            }
          );
        }
        
        if (error instanceof NetworkError) {
          throw new AxiosError(error.message, config, 'NETWORK_ERROR');
        }
        
        if (error instanceof AbortError) {
          throw new AxiosError('Request aborted', config, 'ABORTED');
        }
        
        throw new AxiosError(error.message, config);
      }
    },

    get: (url: string, config: AxiosRequestConfig = {}): Promise<AxiosResponse> => {
      return axiosAdapter.request({ ...config, method: 'GET', url });
    },

    post: (url: string, data?: any, config: AxiosRequestConfig = {}): Promise<AxiosResponse> => {
      return axiosAdapter.request({ ...config, method: 'POST', url, data });
    },

    put: (url: string, data?: any, config: AxiosRequestConfig = {}): Promise<AxiosResponse> => {
      return axiosAdapter.request({ ...config, method: 'PUT', url, data });
    },

    patch: (url: string, data?: any, config: AxiosRequestConfig = {}): Promise<AxiosResponse> => {
      return axiosAdapter.request({ ...config, method: 'PATCH', url, data });
    },

    delete: (url: string, config: AxiosRequestConfig = {}): Promise<AxiosResponse> => {
      return axiosAdapter.request({ ...config, method: 'DELETE', url });
    },

    head: (url: string, config: AxiosRequestConfig = {}): Promise<AxiosResponse> => {
      return axiosAdapter.request({ ...config, method: 'HEAD', url });
    },

    options: (url: string, config: AxiosRequestConfig = {}): Promise<AxiosResponse> => {
      return axiosAdapter.request({ ...config, method: 'OPTIONS', url });
    },

    defaults: {
      headers: options.headers || {}
    },

    interceptors: {
      request: {
        use: () => {}
      },
      response: {
        use: () => {}
      }
    }
  };
  
  return axiosAdapter;
}

// Platform presets
export function createNodeClient(options: ClientOptions = {}): Client {
  return createClient({
    ...options,
    plugins: [
      retry({ retries: 3, minDelay: 100, maxDelay: 2000 }),
      cache({ ttl: 300000 }), // 5 minutes
      rateLimit({ maxRequests: 100, windowMs: 60000 }),
      circuitBreaker({ failureThreshold: 5, resetTimeout: 30000 }),
      ...(options.plugins || [])
    ]
  });
}

export function createEdgeClient(options: ClientOptions = {}): Client {
  return createClient({
    ...options,
    plugins: [
      retry({ retries: 2, minDelay: 50, maxDelay: 1000 }),
      cache({ ttl: 60000 }), // 1 minute
      rateLimit({ maxRequests: 50, windowMs: 60000 }),
      ...(options.plugins || [])
    ]
  });
}

export function createBrowserClient(options: ClientOptions = {}): Client {
  return createClient({
    ...options,
    plugins: [
      retry({ retries: 2, minDelay: 100, maxDelay: 1000 }),
      cache({ ttl: 300000 }), // 5 minutes
      rateLimit({ maxRequests: 30, windowMs: 60000 }),
      ...(options.plugins || [])
    ]
  });
}

export function createDenoClient(options: ClientOptions = {}): Client {
  return createClient({
    ...options,
    plugins: [
      retry({ retries: 3, minDelay: 100, maxDelay: 2000 }),
      cache({ ttl: 300000 }), // 5 minutes
      rateLimit({ maxRequests: 100, windowMs: 60000 }),
      ...(options.plugins || [])
    ]
  });
}

export function createBunClient(options: ClientOptions = {}): Client {
  return createClient({
    ...options,
    plugins: [
      retry({ retries: 3, minDelay: 100, maxDelay: 2000 }),
      cache({ ttl: 300000 }), // 5 minutes
      rateLimit({ maxRequests: 100, windowMs: 60000 }),
      circuitBreaker({ failureThreshold: 5, resetTimeout: 30000 }),
      ...(options.plugins || [])
    ]
  });
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
    // Add cookies to request
    const cookies = jar.get(ctx.request.url);
    if (cookies.length > 0) {
      const cookieHeader = formatCookies(cookies);
      ctx.request.headers = new Headers(ctx.request.headers);
      ctx.request.headers.set('Cookie', cookieHeader);
    }
    
    const response = await next();
    
    // Extract cookies from response
    const setCookieHeader = response.headers.get('Set-Cookie');
    if (setCookieHeader) {
      const cookies = parseCookies(setCookieHeader);
      jar.set(ctx.request.url, cookies);
    }
    
    return response;
  };
}

// Utility functions
export function buildURL(baseURL?: string, url?: string, query?: Record<string, any>): string {
  if (!url) return baseURL || '';
  
  // If url is absolute, use it as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Combine baseURL and url
  const fullURL = baseURL ? `${baseURL.replace(/\/$/, '')}/${url.replace(/^\//, '')}` : url;
  
  // Add query parameters
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

export function deepMerge<T>(target: T, ...sources: Partial<T>[]): T {
  if (!sources.length) return target;
  const source = sources.shift();
  
  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }
  
  return deepMerge(target, ...sources);
}

function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item);
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function calculateBackoffDelay(attempt: number, options: { minDelay?: number; maxDelay?: number; factor?: number } = {}): number {
  const { minDelay = 100, maxDelay = 2000, factor = 2 } = options;
  const delay = minDelay * Math.pow(factor, attempt);
  return Math.min(delay, maxDelay);
}

export function parseRetryAfter(retryAfter: string): number {
  const seconds = parseInt(retryAfter, 10);
  if (!isNaN(seconds)) {
    return seconds * 1000;
  }
  
  const date = new Date(retryAfter);
  if (!isNaN(date.getTime())) {
    return date.getTime() - Date.now();
  }
  
  return 0;
}

export function isAbsoluteURL(url: string): boolean {
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
}

export function getContentTypeFromHeaders(headers: Headers): string | null {
  return headers.get('content-type');
}

export function isJSONResponseFromHeaders(headers: Headers): boolean {
  const contentType = getContentTypeFromHeaders(headers);
  return contentType ? contentType.includes('application/json') : false;
}

export function isTextResponseFromHeaders(headers: Headers): boolean {
  const contentType = getContentTypeFromHeaders(headers);
  return contentType ? contentType.includes('text/') : false;
}

export function safeJSONParse(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function cloneRequest(request: Request): Request {
  return new Request(request.url, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    mode: request.mode,
    credentials: request.credentials,
    cache: request.cache,
    redirect: request.redirect,
    referrer: request.referrer,
    referrerPolicy: request.referrerPolicy,
    integrity: request.integrity
  });
}

export function getRequestSize(request: Request): number {
  const contentLength = request.headers.get('content-length');
  if (contentLength) {
    return parseInt(contentLength, 10);
  }
  return 0;
}

export function getResponseSize(response: Response): number {
  const contentLength = response.headers.get('content-length');
  if (contentLength) {
    return parseInt(contentLength, 10);
  }
  return 0;
}

export function isRetryableError(error: any): boolean {
  if (!error) return false;
  
  // Network errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return true;
  }
  
  // HTTP errors
  if (error.status) {
    return error.status >= 500 || error.status === 429;
  }
  
  // Timeout errors
  if (error.name === 'TimeoutError' || error.name === 'AbortError') {
    return true;
  }
  
  return false;
}

export function isRetryableResponse(response: Response): boolean {
  return response.status >= 500 || response.status === 429;
}

export function calculateRetryDelay(attempt: number, options: RetryOptions = {}): number {
  const { minDelay = 100, maxDelay = 2000, factor = 2, jitter = true } = options;
  const delay = calculateBackoffDelay(attempt, { minDelay, maxDelay, factor });
  return jitter ? delay * (0.5 + Math.random() * 0.5) : delay;
}

export function waitForRetry(delay: number): Promise<void> {
  return sleep(delay);
}

export function createAttemptSignal(originalSignal?: AbortSignal): AbortSignal {
  const controller = new AbortController();
  
  if (originalSignal) {
    originalSignal.addEventListener('abort', () => controller.abort());
  }
  
  return controller.signal;
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
    
    // Check allowed domains
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
    
    // Check allowed hosts
    if (options.allowedHosts && options.allowedHosts.length > 0) {
      if (!options.allowedHosts.includes(hostname)) return false;
    }
    
    // Block localhost
    if (options.blockLocalhost) {
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
        return false;
      }
    }
    
    // Block private IPs
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

export function validateRequestSize(request: Request, maxSize: number = 10 * 1024 * 1024): boolean {
  const contentLength = request.headers.get('content-length');
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    return size <= maxSize;
  }
  return true; // Unknown size, allow but monitor
}

export function createSecurityMiddleware(options: SecurityOptions = {}): Middleware {
  return async (ctx, next) => {
    // SSRF Protection
    if (options.ssrfProtection && ctx.request.url) {
      if (!validateUrlForSSRF(ctx.request.url, options)) {
        throw new Error('SSRF protection: URL not allowed');
      }
    }
    
    // Request size validation
    if (options.maxRequestSize && ctx.request.body) {
      if (!validateRequestSize(ctx.request as any, options.maxRequestSize)) {
        throw new Error('Request size exceeds limit');
      }
    }
    
    // Clean headers
    if (ctx.request.headers) {
      ctx.request.headers = cleanHopByHopHeaders(ctx.request.headers);
      ctx.request.headers = blockDangerousHeaders(ctx.request.headers);
    }
    
    return await next();
  };
}

// Node.js specific features (optimized)
export interface NodeAgentOptions {
  keepAlive?: boolean;
  maxSockets?: number;
  maxFreeSockets?: number;
  timeout?: number;
  freeSocketTimeout?: number;
  keepAliveMsecs?: number;
  ssl?: {
    rejectUnauthorized?: boolean;
    cert?: string | Buffer;
    key?: string | Buffer;
    ca?: string | Buffer | string[] | Buffer[];
  };
}

// Stream utilities (optimized)
export interface StreamOptions {
  highWaterMark?: number;
  encoding?: string;
}

// Default export
export default createClient;
