/**
 * Security utilities for Advanced Client Fetch
 * Provides SSRF protection, header sanitization, and request validation
 */

import type { Middleware, Context } from './types';

/**
 * Security options interface
 */
export interface SecurityOptions {
  enableRateLimiting?: boolean;
  rateLimitWindow?: number;
  rateLimitMax?: number;
  onSecurityViolation?: (violation: SecurityViolation) => void;
  allowPrivateIPs?: boolean;
  maxRedirects?: number;
  maxBodySize?: number;
  allowedProtocols?: string[];
  blockedHeaders?: string[];
  customValidators?: Array<(ctx: Context) => Promise<boolean>>;
}

/**
 * Check if an IP address is private
 */
export function isPrivateIP(ip: string): boolean {
  // IPv4 private ranges
  const privateRanges = [
    /^10\./,                    // 10.0.0.0/8
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
    /^192\.168\./,              // 192.168.0.0/16
    /^127\./,                   // 127.0.0.0/8 (loopback)
    /^169\.254\./,              // 169.254.0.0/16 (link-local)
    /^0\./,                     // 0.0.0.0/8
    /^::1$/,                    // IPv6 loopback
    /^fe80:/,                   // IPv6 link-local
    /^fc00:/,                   // IPv6 unique local
    /^fd00:/,                   // IPv6 unique local
  ];
  
  return privateRanges.some(range => range.test(ip));
}

/**
 * Check if an IP address is localhost
 */
export function isLocalhost(ip: string): boolean {
  return ip === 'localhost' || 
         ip === '127.0.0.1' || 
         ip === '::1' || 
         ip === '0.0.0.0';
}

/**
 * Validate URL for SSRF protection
 */
export function validateUrlForSSRF(url: string, options: SecurityOptions = {}): boolean {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;
    
    // Check blocked hosts
    if (options.blockedHosts?.some(blocked => hostname.includes(blocked))) {
      return false;
    }
    
    // Check allowed hosts (if specified)
    if (options.allowedHosts && !options.allowedHosts.some(allowed => hostname.includes(allowed))) {
      return false;
    }
    
    // Check for private IPs
    if (isPrivateIP(hostname)) {
      return false;
    }
    
    // Check for localhost
    if (isLocalhost(hostname)) {
      return false;
    }
    
    // Check protocol
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Clean hop-by-hop headers
 */
export function cleanHopByHopHeaders(headers: Headers): Headers {
  const hopByHopHeaders = [
    'connection',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailers',
    'transfer-encoding',
    'upgrade'
  ];
  
  const cleaned = new Headers();
  
  for (const [key, value] of headers.entries()) {
    if (!hopByHopHeaders.includes(key.toLowerCase())) {
      cleaned.set(key, value);
    }
  }
  
  return cleaned;
}

/**
 * Block dangerous headers
 */
export function blockDangerousHeaders(headers: Headers): Headers {
  const dangerousHeaders = [
    'host',
    'origin',
    'referer',
    'user-agent',
    'x-forwarded-for',
    'x-forwarded-proto',
    'x-forwarded-host',
    'x-real-ip',
    'x-requested-with',
    'x-csrf-token',
    'x-xsrf-token'
  ];
  
  const cleaned = new Headers();
  
  for (const [key, value] of headers.entries()) {
    if (!dangerousHeaders.includes(key.toLowerCase())) {
      cleaned.set(key, value);
    }
  }
  
  return cleaned;
}

/**
 * Create SSRF protection middleware
 */
export function createSSRFProtection(options: SecurityOptions = {}): Middleware {
  return async (ctx: Context, next: () => Promise<void>) => {
    const url = ctx.req.url;
    
    if (!validateUrlForSSRF(url, options)) {
      throw new Error(`SSRF protection: URL ${url} is not allowed`);
    }
    
    await next();
  };
}

/**
 * Create redirect security middleware
 */
export function createRedirectSecurity(options: SecurityOptions = {}): Middleware {
  return async (ctx: Context, next: () => Promise<void>) => {
    // Store original headers
    const originalHeaders = new Headers(ctx.req.headers);
    
    // Clean dangerous headers before redirect
    const cleanedHeaders = blockDangerousHeaders(originalHeaders);
    
    // Create new request with cleaned headers
    ctx.req = new Request(ctx.req, {
      headers: cleanedHeaders
    });
    
    await next();
  };
}

/**
 * Create security middleware
 */
export function createSecurityMiddleware(options: SecurityOptions = {}): Middleware {
  return async (ctx: Context, next: () => Promise<void>) => {
    // SSRF protection
    if (!validateUrlForSSRF(ctx.req.url, options)) {
      throw new Error(`Security: URL ${ctx.req.url} is not allowed`);
    }
    
    // Clean headers
    const cleanedHeaders = cleanHopByHopHeaders(ctx.req.headers);
    ctx.req = new Request(ctx.req, {
      headers: cleanedHeaders
    });
    
    await next();
  };
}

/**
 * Sanitize headers
 */
export function sanitizeHeaders(headers: Headers): Headers {
  const sanitized = new Headers();
  
  for (const [key, value] of headers.entries()) {
    // Remove null bytes and control characters
    const sanitizedKey = key.replace(/[\x00-\x1F\x7F]/g, '');
    const sanitizedValue = value.replace(/[\x00-\x1F\x7F]/g, '');
    
    if (sanitizedKey && sanitizedValue) {
      sanitized.set(sanitizedKey, sanitizedValue);
    }
  }
  
  return sanitized;
}

/**
 * Validate request size
 */
export function validateRequestSize(request: Request, maxSize: number = 10 * 1024 * 1024): boolean {
  const contentLength = request.headers.get('content-length');
  
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    return size <= maxSize;
  }
  
  return true; // Unknown size, allow it
}

/**
 * Create request size validation middleware
 */
export function createRequestSizeValidation(maxSize: number = 10 * 1024 * 1024): Middleware {
  return async (ctx: Context, next: () => Promise<void>) => {
    if (!validateRequestSize(ctx.req, maxSize)) {
      throw new Error(`Request size exceeds maximum allowed size of ${maxSize} bytes`);
    }
    
    await next();
  };
}

/**
 * Validate response size
 */
export function validateResponseSize(response: Response, maxSize: number = 50 * 1024 * 1024): boolean {
  const contentLength = response.headers.get('content-length');
  
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    return size <= maxSize;
  }
  
  return true; // Unknown size, allow it
}

/**
 * Create response size validation middleware
 */
export function createResponseSizeValidation(maxSize: number = 50 * 1024 * 1024): Middleware {
  return async (ctx: Context, next: () => Promise<void>) => {
    await next();
    
    if (ctx.res && !validateResponseSize(ctx.res, maxSize)) {
      throw new Error(`Response size exceeds maximum allowed size of ${maxSize} bytes`);
    }
  };
}

/**
 * Create comprehensive security middleware
 */
export function createComprehensiveSecurity(options: SecurityOptions = {}): Middleware {
  return async (ctx: Context, next: () => Promise<void>) => {
    // SSRF protection
    if (!validateUrlForSSRF(ctx.req.url, options)) {
      throw new Error(`Security: URL ${ctx.req.url} is not allowed`);
    }
    
    // Request size validation
    if (options.maxRequestSize && !validateRequestSize(ctx.req, options.maxRequestSize)) {
      throw new Error(`Request size exceeds maximum allowed size`);
    }
    
    // Sanitize headers
    const sanitizedHeaders = sanitizeHeaders(ctx.req.headers);
    const cleanedHeaders = cleanHopByHopHeaders(sanitizedHeaders);
    
    ctx.req = new Request(ctx.req, {
      headers: cleanedHeaders
    });
    
    await next();
    
    // Response size validation
    if (ctx.res && options.maxResponseSize && !validateResponseSize(ctx.res, options.maxResponseSize)) {
      throw new Error(`Response size exceeds maximum allowed size`);
    }
  };
}

/**
 * Security options interface
 */
export interface SecurityOptions {
  allowedHosts?: string[];
  blockedHosts?: string[];
  maxRedirects?: number;
  maxRequestSize?: number;
  maxResponseSize?: number;
  allowPrivateIPs?: boolean;
  allowLocalhost?: boolean;
  enableRateLimiting?: boolean;
  rateLimitWindow?: number;
  rateLimitMax?: number;
  onSecurityViolation?: (violation: SecurityViolation) => void;
}

/**
 * Security violation interface
 */
export interface SecurityViolation {
  type: 'ssrf' | 'redirect' | 'header' | 'size' | 'rate_limit';
  message: string;
  url?: string;
  headers?: Record<string, string>;
  size?: number;
  maxSize?: number;
  timestamp: number;
}

/**
 * Enhanced security validation with rate limiting
 */
export function createEnhancedSecurity(options: SecurityOptions = {}): Middleware {
  const {
    enableRateLimiting = true,
    rateLimitWindow = 60000, // 1 minute
    rateLimitMax = 100, // 100 requests per minute
    onSecurityViolation,
    ...securityOptions
  } = options;

  return async (ctx: Context, next: () => Promise<void>) => {
    // Call comprehensive security first
    await createComprehensiveSecurity(securityOptions)(ctx, next);

    // Add rate limiting if enabled
    if (enableRateLimiting) {
      // This would integrate with the rate-limit plugin
      // For now, we'll add a basic implementation
      const clientId = ctx.req.headers.get('x-forwarded-for') || 'unknown';
      const now = Date.now();
      
      // Simple in-memory rate limiting (in production, use Redis or similar)
      if (typeof globalThis !== 'undefined') {
        const rateLimitStore = (globalThis as any).__rateLimitStore || new Map();
        (globalThis as any).__rateLimitStore = rateLimitStore;
        
        const key = `rate_limit:${clientId}`;
        const requests = rateLimitStore.get(key) || [];
        
        // Remove old requests outside the window
        const validRequests = requests.filter((time: number) => now - time < rateLimitWindow);
        
        if (validRequests.length >= rateLimitMax) {
          const violation: SecurityViolation = {
            type: 'rate_limit',
            message: `Rate limit exceeded: ${validRequests.length}/${rateLimitMax} requests in ${rateLimitWindow}ms`,
            timestamp: now
          };
          
          if (onSecurityViolation) {
            onSecurityViolation(violation);
          }
          
          throw new Error(`Rate limit exceeded: ${validRequests.length}/${rateLimitMax} requests in ${rateLimitWindow}ms`);
        }
        
        // Add current request
        validRequests.push(now);
        rateLimitStore.set(key, validRequests);
      }
    }
  };
}