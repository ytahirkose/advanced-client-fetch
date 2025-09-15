/**
 * XSRF/CSRF protection plugin
 */

import type { Plugin, Context } from '@advanced-client-fetch/core';

export interface XSRFPluginOptions {
  /** XSRF cookie name */
  cookieName?: string;
  /** XSRF header name */
  headerName?: string;
  /** Cookie domain */
  domain?: string;
  /** Cookie path */
  path?: string;
  /** Secure cookie flag */
  secure?: boolean;
  /** SameSite cookie attribute */
  sameSite?: 'strict' | 'lax' | 'none';
  /** Custom token generator */
  tokenGenerator?: () => string;
  /** Custom token validator */
  tokenValidator?: (token: string) => boolean;
}

/**
 * XSRF protection plugin
 */
export function xsrf(options: XSRFPluginOptions = {}): Plugin {
  const {
    cookieName = 'XSRF-TOKEN',
    headerName = 'X-XSRF-TOKEN',
    domain,
    path = '/',
    secure = true,
    sameSite = 'lax',
    tokenGenerator = generateToken,
    tokenValidator = validateToken
  } = options;

  return {
    name: 'xsrf',
    priority: 2000,
    
    async onRequest(context: Context): Promise<void> {
      const { req, options } = context;
      
      // Only apply XSRF protection to state-changing methods
      const method = req.method?.toUpperCase();
      if (!method || !['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        return;
      }
      
      // Get XSRF token from cookie
      const cookieHeader = req.headers.get('cookie');
      let xsrfToken: string | null = null;
      
      if (cookieHeader) {
        const cookies = parseCookies(cookieHeader);
        xsrfToken = cookies[cookieName];
      }
      
      // Generate new token if not present or invalid
      if (!xsrfToken || !tokenValidator(xsrfToken)) {
        xsrfToken = tokenGenerator();
        
        // Set XSRF cookie in response headers
        const cookieValue = buildCookie(cookieName, xsrfToken, {
          domain,
          path,
          secure,
          sameSite,
          httpOnly: false // XSRF token needs to be accessible to JavaScript
        });
        
        // Add Set-Cookie header to response
        if (!context.responseHeaders) {
          context.responseHeaders = new Headers();
        }
        context.responseHeaders.set('Set-Cookie', cookieValue);
      }
      
      // Add XSRF token to request headers
      const headers = new Headers(req.headers);
      headers.set(headerName, xsrfToken);
      
      context.req = new Request(req, {
        headers
      });
    },
    
    async onResponse(context: Context): Promise<void> {
      // XSRF protection is primarily request-side
      // Response handling can be added here if needed
    }
  };
}

/**
 * Generate a secure random token
 */
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate XSRF token format
 */
function validateToken(token: string): boolean {
  // Basic validation - should be 64 character hex string
  return /^[a-f0-9]{64}$/.test(token);
}

/**
 * Parse cookies from cookie header
 */
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  
  cookieHeader.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      cookies[name] = decodeURIComponent(value);
    }
  });
  
  return cookies;
}

/**
 * Build cookie string
 */
function buildCookie(
  name: string,
  value: string,
  options: {
    domain?: string;
    path?: string;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    httpOnly?: boolean;
    maxAge?: number;
    expires?: Date;
  } = {}
): string {
  let cookie = `${name}=${encodeURIComponent(value)}`;
  
  if (options.domain) {
    cookie += `; Domain=${options.domain}`;
  }
  
  if (options.path) {
    cookie += `; Path=${options.path}`;
  }
  
  if (options.secure) {
    cookie += '; Secure';
  }
  
  if (options.sameSite) {
    cookie += `; SameSite=${options.sameSite}`;
  }
  
  if (options.httpOnly) {
    cookie += '; HttpOnly';
  }
  
  if (options.maxAge !== undefined) {
    cookie += `; Max-Age=${options.maxAge}`;
  }
  
  if (options.expires) {
    cookie += `; Expires=${options.expires.toUTCString()}`;
  }
  
  return cookie;
}

export default xsrf;
