/**
 * Cookie management for Advanced Client Fetch
 * Provides cookie parsing, formatting, and middleware
 */

import type { Middleware, Context, Cookie, CookieOptions, CookieJar } from './types';

/**
 * Parse cookies from a cookie string
 */
export function parseCookies(cookieString: string): Map<string, string> {
  const cookies = new Map<string, string>();
  
  if (!cookieString) {
    return cookies;
  }
  
  const pairs = cookieString.split(';');
  
  for (const pair of pairs) {
    const [name, value] = pair.trim().split('=', 2);
    if (name && value) {
      cookies.set(name, decodeURIComponent(value));
    }
  }
  
  return cookies;
}

/**
 * Format cookies for HTTP headers
 */
export function formatCookies(cookies: Map<string, string>): string {
  const pairs: string[] = [];
  
  for (const [name, value] of cookies.entries()) {
    pairs.push(`${name}=${encodeURIComponent(value)}`);
  }
  
  return pairs.join('; ');
}

/**
 * Parse a single cookie with attributes
 */
export function parseCookie(cookieString: string): Cookie | null {
  const parts = cookieString.split(';');
  const [nameValue] = parts;
  const [name, value] = nameValue.trim().split('=', 2);
  
  if (!name || !value) {
    return null;
  }
  
  const cookie: Cookie = {
    name: name.trim(),
    value: decodeURIComponent(value.trim())
  };
  
  // Parse attributes
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i].trim();
    const [attrName, attrValue] = part.split('=', 2);
    const lowerAttrName = attrName.toLowerCase();
    
    switch (lowerAttrName) {
      case 'domain':
        cookie.domain = attrValue;
        break;
      case 'path':
        cookie.path = attrValue;
        break;
      case 'expires':
        cookie.expires = new Date(attrValue);
        break;
      case 'max-age':
        cookie.maxAge = parseInt(attrValue, 10);
        break;
      case 'secure':
        cookie.secure = true;
        break;
      case 'httponly':
        cookie.httpOnly = true;
        break;
      case 'samesite':
        cookie.sameSite = attrValue as 'strict' | 'lax' | 'none';
        break;
    }
  }
  
  return cookie;
}

/**
 * Format a cookie for Set-Cookie header
 */
export function formatCookie(cookie: Cookie): string {
  let cookieString = `${cookie.name}=${encodeURIComponent(cookie.value)}`;
  
  if (cookie.domain) {
    cookieString += `; Domain=${cookie.domain}`;
  }
  
  if (cookie.path) {
    cookieString += `; Path=${cookie.path}`;
  }
  
  if (cookie.expires) {
    cookieString += `; Expires=${cookie.expires.toUTCString()}`;
  }
  
  if (cookie.maxAge !== undefined) {
    cookieString += `; Max-Age=${cookie.maxAge}`;
  }
  
  if (cookie.secure) {
    cookieString += `; Secure`;
  }
  
  if (cookie.httpOnly) {
    cookieString += `; HttpOnly`;
  }
  
  if (cookie.sameSite) {
    cookieString += `; SameSite=${cookie.sameSite}`;
  }
  
  return cookieString;
}

/**
 * Memory-based cookie jar implementation
 */
export class MemoryCookieJar implements CookieJar {
  private cookies = new Map<string, Map<string, Cookie>>();
  private cookieTimestamps = new Map<string, Map<string, number>>();
  
  private getDomainKey(url: string): string {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.hostname;
    } catch {
      return 'default';
    }
  }
  
  private isCookieValid(cookie: Cookie, url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname;
      const pathname = parsedUrl.pathname;
      
      // Check domain
      if (cookie.domain) {
        if (!hostname.endsWith(cookie.domain)) {
          return false;
        }
      }
      
      // Check path
      if (cookie.path) {
        if (!pathname.startsWith(cookie.path)) {
          return false;
        }
      }
      
      // Check expiration
      if (cookie.expires && cookie.expires < new Date()) {
        return false;
      }
      
      // Check max-age
      if (cookie.maxAge !== undefined) {
        const domainKey = this.getDomainKey(url);
        const timestamp = this.cookieTimestamps.get(domainKey)?.get(cookie.name);
        if (timestamp) {
          const age = Date.now() - timestamp;
          const maxAgeMs = cookie.maxAge * 1000;
          if (age > maxAgeMs) {
            return false;
          }
        }
      }
      
      return true;
    } catch {
      return false;
    }
  }
  
  async get(url: string): Promise<string> {
    const domainKey = this.getDomainKey(url);
    const domainCookies = this.cookies.get(domainKey);
    
    if (!domainCookies) {
      return '';
    }
    
    const validCookies = new Map<string, string>();
    
    for (const [name, cookie] of domainCookies.entries()) {
      if (this.isCookieValid(cookie, url)) {
        validCookies.set(name, cookie.value);
      }
    }
    
    return formatCookies(validCookies);
  }
  
  async set(url: string, cookieString: string): Promise<void> {
    const domainKey = this.getDomainKey(url);
    const cookie = parseCookie(cookieString);
    
    if (!cookie) {
      return;
    }
    
    if (!this.cookies.has(domainKey)) {
      this.cookies.set(domainKey, new Map());
    }
    
    if (!this.cookieTimestamps.has(domainKey)) {
      this.cookieTimestamps.set(domainKey, new Map());
    }
    
    const domainCookies = this.cookies.get(domainKey)!;
    const domainTimestamps = this.cookieTimestamps.get(domainKey)!;
    
    domainCookies.set(cookie.name, cookie);
    domainTimestamps.set(cookie.name, Date.now());
  }
  
  async delete(url: string, name: string): Promise<void> {
    const domainKey = this.getDomainKey(url);
    const domainCookies = this.cookies.get(domainKey);
    const domainTimestamps = this.cookieTimestamps.get(domainKey);
    
    if (domainCookies) {
      domainCookies.delete(name);
    }
    
    if (domainTimestamps) {
      domainTimestamps.delete(name);
    }
  }
  
  async clear(): Promise<void> {
    this.cookies.clear();
    this.cookieTimestamps.clear();
  }
  
  /**
   * Get all cookies for a domain
   */
  getCookiesForDomain(domain: string): Map<string, Cookie> {
    return this.cookies.get(domain) || new Map();
  }
  
  /**
   * Get all cookies
   */
  getAllCookies(): Map<string, Map<string, Cookie>> {
    return new Map(this.cookies);
  }
}

/**
 * Create a cookie jar
 */
export function createCookieJar(): CookieJar {
  return new MemoryCookieJar();
}

/**
 * Create cookie middleware
 */
export function createCookieMiddleware(cookieJar: CookieJar): Middleware {
  return async (ctx: Context, next: () => Promise<void>) => {
    // Add cookies to request
    const cookieString = await cookieJar.get(ctx.req.url);
    if (cookieString) {
      const headers = new Headers(ctx.req.headers);
      headers.set('Cookie', cookieString);
      ctx.req = new Request(ctx.req, { headers });
    }
    
    await next();
    
    // Extract cookies from response
    if (ctx.res) {
      const setCookieHeaders = ctx.res.headers.get('Set-Cookie');
      if (setCookieHeaders) {
        const cookies = setCookieHeaders.split(',').map(cookie => cookie.trim());
        for (const cookie of cookies) {
          await cookieJar.set(ctx.req.url, cookie);
        }
      }
    }
  };
}

/**
 * Create cookie middleware with options
 */
export function createCookieMiddlewareWithOptions(
  cookieJar: CookieJar,
  options: {
    autoSend?: boolean;
    autoReceive?: boolean;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
  } = {}
): Middleware {
  const { autoSend = true, autoReceive = true, secure = false, sameSite = 'lax' } = options;
  
  return async (ctx: Context, next: () => Promise<void>) => {
    // Add cookies to request
    if (autoSend) {
      const cookieString = await cookieJar.get(ctx.req.url);
      if (cookieString) {
        const headers = new Headers(ctx.req.headers);
        headers.set('Cookie', cookieString);
        ctx.req = new Request(ctx.req, { headers });
      }
    }
    
    await next();
    
    // Extract cookies from response
    if (autoReceive && ctx.res) {
      const setCookieHeaders = ctx.res.headers.get('Set-Cookie');
      if (setCookieHeaders) {
        const cookies = setCookieHeaders.split(',').map(cookie => cookie.trim());
        for (const cookie of cookies) {
          await cookieJar.set(ctx.req.url, cookie);
        }
      }
    }
  };
}

/**
 * Create cookie middleware for specific domains
 */
export function createDomainCookieMiddleware(
  cookieJar: CookieJar,
  allowedDomains: string[]
): Middleware {
  return async (ctx: Context, next: () => Promise<void>) => {
    try {
      const url = new URL(ctx.req.url);
      const hostname = url.hostname;
      
      // Check if domain is allowed
      if (!allowedDomains.some(domain => hostname.includes(domain))) {
        await next();
        return;
      }
      
      // Add cookies to request
      const cookieString = await cookieJar.get(ctx.req.url);
      if (cookieString) {
        const headers = new Headers(ctx.req.headers);
        headers.set('Cookie', cookieString);
        ctx.req = new Request(ctx.req, { headers });
      }
      
      await next();
      
      // Extract cookies from response
      if (ctx.res) {
        const setCookieHeaders = ctx.res.headers.get('Set-Cookie');
        if (setCookieHeaders) {
          const cookies = setCookieHeaders.split(',').map(cookie => cookie.trim());
          for (const cookie of cookies) {
            await cookieJar.set(ctx.req.url, cookie);
          }
        }
      }
    } catch {
      // Invalid URL, skip cookie handling
      await next();
    }
  };
}

/**
 * Cookie utilities
 */
export class CookieUtils {
  /**
   * Check if a cookie is expired
   */
  static isExpired(cookie: Cookie): boolean {
    if (cookie.expires) {
      return cookie.expires < new Date();
    }
    return false;
  }
  
  /**
   * Check if a cookie is secure
   */
  static isSecure(cookie: Cookie): boolean {
    return cookie.secure === true;
  }
  
  /**
   * Check if a cookie is HTTP-only
   */
  static isHttpOnly(cookie: Cookie): boolean {
    return cookie.httpOnly === true;
  }
  
  /**
   * Get cookie age in milliseconds
   */
  static getAge(cookie: Cookie): number | null {
    if (cookie.maxAge !== undefined) {
      return cookie.maxAge * 1000;
    }
    if (cookie.expires) {
      return cookie.expires.getTime() - Date.now();
    }
    return null;
  }
  
  /**
   * Create a simple cookie
   */
  static createSimple(name: string, value: string, options: CookieOptions = {}): Cookie {
    return {
      name,
      value,
      ...options
    };
  }
  
  /**
   * Create a session cookie (no expiration)
   */
  static createSession(name: string, value: string, options: CookieOptions = {}): Cookie {
    return {
      name,
      value,
      ...options
    };
  }
  
  /**
   * Create a persistent cookie with expiration
   */
  static createPersistent(
    name: string, 
    value: string, 
    maxAge: number, 
    options: CookieOptions = {}
  ): Cookie {
    return {
      name,
      value,
      maxAge,
      ...options
    };
  }
}