/**
 * Security utilities for HyperHTTP
 */

import type { Request, Headers } from './types.js';

export interface SecurityOptions {
  ssrfProtection?: boolean;
  allowedHosts?: string[];
  blockedHosts?: string[];
  maxRedirects?: number;
  maxRequestSize?: number;
  allowedHeaders?: string[];
  blockedHeaders?: string[];
}

/**
 * Check if IP is private
 */
export function isPrivateIP(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  
  if (parts.length !== 4) return false;
  
  // Private IP ranges
  return (
    (parts[0] === 10) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168) ||
    (parts[0] === 127) || // localhost
    (parts[0] === 0) ||   // invalid
    (parts[0] === 169 && parts[1] === 254) // link-local
  );
}

/**
 * Check if host is localhost
 */
export function isLocalhost(hostname: string): boolean {
  return hostname === 'localhost' || 
         hostname === '127.0.0.1' || 
         hostname === '::1' ||
         hostname.startsWith('127.') ||
         hostname.startsWith('0.');
}

/**
 * Validate URL for SSRF protection
 */
export function validateUrlForSSRF(url: string, options: SecurityOptions = {}): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;
    
    // Check blocked hosts
    if (options.blockedHosts?.includes(hostname)) {
      return false;
    }
    
    // Check allowed hosts (if specified)
    if (options.allowedHosts && options.allowedHosts.length > 0) {
      const isAllowed = options.allowedHosts.some(allowedHost => {
        // Exact match
        if (hostname === allowedHost) return true;
        // Subdomain match (e.g., api.example.com matches example.com)
        if (hostname.endsWith('.' + allowedHost)) return true;
        return false;
      });
      if (!isAllowed) return false;
    }
    
    // SSRF protection
    if (options.ssrfProtection !== false) {
      // Block private IPs
      if (isPrivateIP(hostname)) {
        return false;
      }
      
      // Block localhost
      if (isLocalhost(hostname)) {
        return false;
      }
    }
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Clean hop-by-hop headers
 */
export function cleanHopByHopHeaders(headers: Headers | Record<string, string>): Headers {
  const hopByHopHeaders = [
    'connection',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailers',
    'transfer-encoding',
    'upgrade',
  ];
  
  const cleaned = new Headers();
  
  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      if (!hopByHopHeaders.includes(key.toLowerCase())) {
        cleaned.set(key, value);
      }
    });
  } else {
    Object.entries(headers).forEach(([key, value]) => {
      if (!hopByHopHeaders.includes(key.toLowerCase())) {
        cleaned.set(key, value);
      }
    });
  }
  
  return cleaned;
}

/**
 * Block dangerous headers
 */
export function blockDangerousHeaders(headers: Headers | Record<string, string>): Headers {
  const dangerousHeaders = [
    'host',
    'origin',
    'referer',
    'user-agent',
    'x-forwarded-for',
    'x-forwarded-proto',
    'x-real-ip',
  ];
  
  const cleaned = new Headers();
  
  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      if (!dangerousHeaders.includes(key.toLowerCase())) {
        cleaned.set(key, value);
      }
    });
  } else {
    Object.entries(headers).forEach(([key, value]) => {
      if (!dangerousHeaders.includes(key.toLowerCase())) {
        cleaned.set(key, value);
      }
    });
  }
  
  return cleaned;
}

/**
 * Create SSRF protection middleware
 */
export function createSSRFProtection(options: SecurityOptions = {}) {
  return async (ctx: any, next: () => Promise<void>) => {
    const url = ctx.req.url;
    
    if (!validateUrlForSSRF(url, options)) {
      throw new Error('SSRF protection: URL not allowed');
    }
    
    await next();
  };
}

/**
 * Create redirect security middleware
 */
export function createRedirectSecurity(options: SecurityOptions = {}) {
  return async (ctx: any, next: () => Promise<void>) => {
    const maxRedirects = options.maxRedirects || 5;
    let redirectCount = 0;
    
    const originalFetch = globalThis.fetch;
    
    // Override fetch to track redirects
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const response = await originalFetch(input, init);
      
      if (response.redirected) {
        redirectCount++;
        if (redirectCount > maxRedirects) {
          throw new Error('Too many redirects');
        }
      }
      
      return response;
    };
    
    try {
      await next();
    } finally {
      // Restore original fetch
      globalThis.fetch = originalFetch;
    }
  };
}

/**
 * Create security middleware
 */
export function createSecurityMiddleware(options: SecurityOptions = {}) {
  return async (ctx: any, next: () => Promise<void>) => {
    // Clean headers
    ctx.req.headers = cleanHopByHopHeaders(ctx.req.headers);
    
    // Block dangerous headers
    ctx.req.headers = blockDangerousHeaders(ctx.req.headers);
    
    // SSRF protection
    if (options.ssrfProtection !== false) {
      if (!validateUrlForSSRF(ctx.req.url, options)) {
        throw new Error('SSRF protection: URL not allowed');
      }
    }
    
    await next();
  };
}

/**
 * Sanitize headers
 */
export function sanitizeHeaders(headers: Headers | Record<string, string>): Headers {
  const sanitized = new Headers();
  
  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      // Remove null bytes and control characters
      const cleanValue = value.replace(/[\x00-\x1F\x7F]/g, '');
      const cleanKey = key.replace(/[\x00-\x1F\x7F]/g, '');
      
      if (cleanKey && cleanValue) {
        sanitized.set(cleanKey, cleanValue);
      }
    });
  } else {
    Object.entries(headers).forEach(([key, value]) => {
      // Remove null bytes and control characters
      const cleanValue = value.replace(/[\x00-\x1F\x7F]/g, '');
      const cleanKey = key.replace(/[\x00-\x1F\x7F]/g, '');
      
      if (cleanKey && cleanValue) {
        sanitized.set(cleanKey, cleanValue);
      }
    });
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
  
  return true;
}

/**
 * Create request size validation middleware
 */
export function createRequestSizeValidation(maxSize: number = 10 * 1024 * 1024) {
  return async (ctx: any, next: () => Promise<void>) => {
    if (!validateRequestSize(ctx.req, maxSize)) {
      throw new Error('Request too large');
    }
    
    await next();
  };
}