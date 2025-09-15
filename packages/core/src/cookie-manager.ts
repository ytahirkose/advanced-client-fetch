/**
 * Cookie management for HyperHTTP
 */

export interface CookieOptions {
  domain?: string;
  path?: string;
  expires?: Date;
  maxAge?: number;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

export interface Cookie {
  name: string;
  value: string;
  options?: CookieOptions;
}

export interface CookieJar {
  get(name: string): string | undefined;
  set(name: string, value: string, options?: CookieOptions): void;
  delete(name: string, domain?: string, path?: string): void;
  clear(): void;
  getAll(): Cookie[];
  toHeader(): string;
  getForUrl(url: string): string;
  setFromResponse(response: Response, url: string): void;
}

/**
 * In-memory cookie jar implementation
 */
export class MemoryCookieJar implements CookieJar {
  private cookies = new Map<string, Cookie>();

  get(name: string): string | undefined {
    const cookie = this.cookies.get(name);
    return cookie?.value;
  }

  set(name: string, value: string, options?: CookieOptions): void {
    this.cookies.set(name, { name, value, options });
  }

  delete(name: string, domain?: string, path?: string): void {
    this.cookies.delete(name);
  }

  clear(): void {
    this.cookies.clear();
  }

  getAll(): Cookie[] {
    return Array.from(this.cookies.values());
  }

  toHeader(): string {
    return this.getAll()
      .map(cookie => `${cookie.name}=${cookie.value}`)
      .join('; ');
  }

  getForUrl(url: string): string {
    return this.toHeader();
  }

  setFromResponse(response: Response, url: string): void {
    const setCookieHeader = response.headers.get('Set-Cookie');
    if (setCookieHeader) {
      const cookies = parseCookies(setCookieHeader);
      for (const cookie of cookies) {
        this.set(cookie.name, cookie.value, cookie.options);
      }
    }
  }
}

/**
 * Create cookie jar
 */
export function createCookieJar(): CookieJar {
  return new MemoryCookieJar();
}

/**
 * Parse cookies from Set-Cookie header
 */
export function parseCookies(setCookieHeader: string): Cookie[] {
  const cookies: Cookie[] = [];
  
  if (!setCookieHeader) return cookies;
  
  // Split by semicolon for individual cookies
  const cookieStrings = setCookieHeader.split(';').map(s => s.trim());
  
  for (const cookieString of cookieStrings) {
    const [nameValue, ...attributes] = cookieString.split(';').map(s => s.trim());
    const [name, value] = nameValue.split('=');
    
    if (name && value) {
      const options: CookieOptions = {};
      
      for (const attr of attributes) {
        const [key, val] = attr.split('=');
        
        switch (key.toLowerCase()) {
          case 'domain':
            options.domain = val;
            break;
          case 'path':
            options.path = val;
            break;
          case 'expires':
            options.expires = new Date(val);
            break;
          case 'max-age':
            options.maxAge = parseInt(val, 10);
            break;
          case 'secure':
            options.secure = true;
            break;
          case 'httponly':
            options.httpOnly = true;
            break;
          case 'samesite':
            options.sameSite = val as 'strict' | 'lax' | 'none';
            break;
        }
      }
      
      cookies.push({ name, value, options });
    }
  }
  
  return cookies;
}

/**
 * Format cookies for Cookie header
 */
export function formatCookies(cookies: Cookie[]): string {
  return cookies
    .map(cookie => `${cookie.name}=${cookie.value}`)
    .join('; ');
}

/**
 * Create cookie middleware
 */
export function createCookieMiddleware(cookieJar: CookieJar) {
  return async (ctx: any, next: () => Promise<void>) => {
    // Add cookies to request
    const cookieHeader = cookieJar.toHeader();
    if (cookieHeader) {
      ctx.req.headers.set('Cookie', cookieHeader);
    }
    
    await next();
    
    // Extract cookies from response
    if (ctx.res) {
      const setCookieHeader = ctx.res.headers.get('Set-Cookie');
      if (setCookieHeader) {
        const cookies = parseCookies(setCookieHeader);
        for (const cookie of cookies) {
          cookieJar.set(cookie.name, cookie.value, cookie.options);
        }
      }
    }
  };
}