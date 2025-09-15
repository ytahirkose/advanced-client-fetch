/**
 * Utility functions for HyperHTTP
 */

import type { Headers, Request, Response, HttpMethod } from './types.js';

/**
 * Check if value is a plain object
 */
export function isPlainObject(value: any): value is Record<string, any> {
  return value !== null && 
         typeof value === 'object' && 
         Object.prototype.toString.call(value) === '[object Object]';
}

/**
 * Check if value is a URL
 */
export function isURL(value: any): value is URL {
  return value instanceof URL;
}

/**
 * Check if value is Headers
 */
export function isHeaders(value: any): value is Headers {
  return value instanceof Headers;
}

/**
 * Check if HTTP method is idempotent
 */
export function isIdempotentMethod(method: string): boolean {
  const idempotentMethods = ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE'];
  return idempotentMethods.includes(method.toUpperCase());
}

/**
 * Build URL from base URL and path
 */
export function buildURL(
  baseURL?: string, 
  url?: string | URL, 
  query?: Record<string, any>,
  paramsSerializer?: (params: Record<string, any>) => string
): string {
  if (!url) {
    throw new Error('URL is required');
  }
  
  let fullURL: string;
  
  if (typeof url === 'string') {
    // Check if URL is absolute
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
      fullURL = url;
    } else if (baseURL) {
      // Combine base URL with relative path
      const base = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
      const path = url.startsWith('/') ? url : `/${url}`;
      fullURL = `${base}${path}`;
    } else {
      fullURL = url;
    }
  } else {
    fullURL = url.toString();
  }
  
  // Add query parameters
  if (query && Object.keys(query).length > 0) {
    const serializer = paramsSerializer || defaultParamsSerializer;
    const queryString = serializer(query);
    if (queryString) {
      const separator = fullURL.includes('?') ? '&' : '?';
      fullURL += `${separator}${queryString}`;
    }
  }
  
  return fullURL;
}

/**
 * Default query parameter serializer
 */
function defaultParamsSerializer(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, String(v)));
      } else {
        searchParams.set(key, String(value));
      }
    }
  });
  
  return searchParams.toString();
}

/**
 * Merge headers
 */
export function mergeHeaders(
  ...sources: (Record<string, string> | Headers | undefined)[]
): Headers {
  const headers = new Headers();
  
  for (const source of sources) {
    if (!source) continue;
    
    if (isHeaders(source)) {
      source.forEach((value, key) => {
        headers.set(key, value);
      });
    } else {
      Object.entries(source).forEach(([key, value]) => {
        headers.set(key, value);
      });
    }
  }
  
  return headers;
}

/**
 * Normalize request body
 */
export function normalizeBody(body: any, headers: Headers): BodyInit | undefined {
  if (body === null || body === undefined) {
    return undefined;
  }
  
  // Already a valid BodyInit
  if (typeof body === 'string' || 
      body instanceof ArrayBuffer || 
      body instanceof Blob || 
      body instanceof FormData || 
      body instanceof URLSearchParams ||
      body instanceof ReadableStream) {
    return body;
  }
  
  // Plain object - stringify as JSON
  if (isPlainObject(body) || Array.isArray(body)) {
    if (!headers.has('content-type')) {
      headers.set('content-type', 'application/json; charset=utf-8');
    }
    return JSON.stringify(body);
  }
  
  // Convert to string
  return String(body);
}

/**
 * Generate request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Deep merge objects
 */
export function deepMerge<T extends Record<string, any>>(target: T, ...sources: Partial<T>[]): T {
  const result = { ...target };
  
  for (const source of sources) {
    if (!source) continue;
    
    for (const key in source) {
      if (source[key] !== undefined) {
        if (isPlainObject(source[key]) && isPlainObject(result[key])) {
          result[key] = deepMerge(result[key], source[key] as any);
        } else {
          result[key] = source[key] as any;
        }
      }
    }
  }
  
  return result;
}

/**
 * Sleep utility
 */
export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('Aborted'));
      return;
    }
    
    const timeoutId = setTimeout(resolve, ms);
    
    if (signal) {
      const onAbort = () => {
        clearTimeout(timeoutId);
        reject(new Error('Aborted'));
      };
      
      signal.addEventListener('abort', onAbort, { once: true });
    }
  });
}

/**
 * Calculate exponential backoff delay
 */
export function calculateBackoffDelay(
  attempt: number,
  minDelay: number = 100,
  maxDelay: number = 2000,
  factor: number = 2,
  jitter: boolean = true
): number {
  const baseDelay = Math.min(minDelay * Math.pow(factor, attempt - 1), maxDelay);
  
  if (jitter) {
    // Full jitter: random value between 0 and baseDelay
    return Math.random() * baseDelay;
  }
  
  return baseDelay;
}

/**
 * Parse Retry-After header
 */
export function parseRetryAfter(retryAfter: string): number {
  const value = parseInt(retryAfter, 10);
  
  // If it's a number, treat as seconds
  if (!isNaN(value)) {
    return value * 1000;
  }
  
  // Try to parse as HTTP date
  const date = new Date(retryAfter);
  if (!isNaN(date.getTime())) {
    return Math.max(0, date.getTime() - Date.now());
  }
  
  // Default to 1 second
  return 1000;
}

/**
 * Check if URL is absolute
 */
export function isAbsoluteURL(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//');
}

/**
 * Get content type from response
 */
export function getContentType(response: Response): string | null {
  const contentType = response.headers.get('content-type');
  return contentType || null;
}

/**
 * Check if response is JSON
 */
export function isJSONResponse(response: Response): boolean {
  const contentType = getContentType(response);
  return contentType?.includes('application/json') ?? false;
}

/**
 * Check if response is text
 */
export function isTextResponse(response: Response): boolean {
  const contentType = getContentType(response);
  return contentType?.startsWith('text/') ?? false;
}

/**
 * Safe JSON parse
 */
export function safeJSONParse(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Clone request
 */
export function cloneRequest(request: Request, overrides: RequestInit = {}): Request {
  return new Request(request, overrides);
}

/**
 * Get request size
 */
export function getRequestSize(request: Request): number {
  const body = request.body;
  if (!body) return 0;
  
  if (typeof body === 'string') {
    return new TextEncoder().encode(body).length;
  }
  
  if (body instanceof ArrayBuffer) {
    return body.byteLength;
  }
  
  if (body instanceof Blob) {
    return body.size;
  }
  
  // For other types, estimate
  return JSON.stringify(body).length;
}

/**
 * Get response size
 */
export function getResponseSize(response: Response): number {
  const contentLength = response.headers.get('content-length');
  if (contentLength) {
    return parseInt(contentLength, 10);
  }
  
  // Estimate size when content-length is missing
  return 1000; // Default estimate
}


/**
 * Calculate retry delay with exponential backoff and jitter
 */
export function calculateRetryDelay(
  attempt: number,
  response: Response | undefined,
  config: {
    minDelay: number;
    maxDelay: number;
    factor: number;
    jitter: boolean;
    respectRetryAfter: boolean;
    retryAfterCap: number;
  }
): number {
  // Check for Retry-After header
  if (response && config.respectRetryAfter) {
    const retryAfter = response.headers.get('retry-after');
    if (retryAfter) {
      const delay = parseRetryAfter(retryAfter);
      return Math.min(delay, config.retryAfterCap);
    }
  }
  
  // Calculate exponential backoff
  return calculateBackoffDelay(
    attempt,
    config.minDelay,
    config.maxDelay,
    config.factor,
    config.jitter
  );
}

/**
 * Wait for retry with abort signal support
 */
export async function waitForRetry(delay: number, signal?: AbortSignal): Promise<void> {
  if (delay <= 0) return;
  
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('Aborted'));
      return;
    }
    
    const timeoutId = setTimeout(resolve, delay);
    
    if (signal) {
      const onAbort = () => {
        clearTimeout(timeoutId);
        reject(new Error('Aborted'));
      };
      
      signal.addEventListener('abort', onAbort, { once: true });
    }
  });
}

/**
 * Create attempt-specific abort signal
 */
export function createAttemptSignal(
  originalSignal: AbortSignal | undefined,
  timeoutMs: number
): AbortSignal {
  if (timeoutMs <= 0) {
    return originalSignal || new AbortController().signal;
  }
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  // Clean up timeout when original signal aborts
  if (originalSignal?.aborted) {
    clearTimeout(timeoutId);
    controller.abort();
  } else if (originalSignal) {
    originalSignal.addEventListener('abort', () => {
      clearTimeout(timeoutId);
      controller.abort();
    }, { once: true });
  }
  
  return controller.signal;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: any): boolean {
  if (!error) return false;
  
  // Network errors are retryable
  if (error.name === 'NetworkError' || error.name === 'TypeError') {
    return true;
  }
  
  // Timeout errors are retryable
  if (error.name === 'TimeoutError') {
    return true;
  }
  
  // HTTP 5xx errors are retryable
  if (error.status >= 500 && error.status < 600) {
    return true;
  }
  
  // HTTP 429 (Too Many Requests) is retryable
  if (error.status === 429) {
    return true;
  }
  
  // HTTP 4xx errors (except 429) are not retryable
  if (error.status >= 400 && error.status < 500) {
    return false;
  }
  
  // Abort errors (except timeout) are not retryable
  if (error.name === 'AbortError' && error.reason !== 'timeout') {
    return false;
  }
  
  return false;
}

/**
 * Check if response is retryable
 */
export function isRetryableResponse(response: Response): boolean {
  if (!response) return false;
  
  // 5xx responses are retryable
  if (response.status >= 500 && response.status < 600) {
    return true;
  }
  
  // 429 (Too Many Requests) is retryable
  if (response.status === 429) {
    return true;
  }
  
  // 2xx responses are not retryable
  if (response.status >= 200 && response.status < 300) {
    return false;
  }
  
  // 4xx responses (except 429) are not retryable
  if (response.status >= 400 && response.status < 500) {
    return false;
  }
  
  return false;
}