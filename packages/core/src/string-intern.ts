/**
 * String interning for performance optimization
 */

// String interning cache
const stringCache = new Map<string, string>();
const MAX_CACHE_SIZE = 10000;

/**
 * Intern a string to reduce memory usage and improve comparison performance
 */
export function intern(str: string): string {
  if (str.length === 0) return str;
  
  // Check if string is already interned
  const cached = stringCache.get(str);
  if (cached) {
    return cached;
  }
  
  // Cache is full, clear some entries
  if (stringCache.size >= MAX_CACHE_SIZE) {
    const entries = Array.from(stringCache.entries());
    // Remove 20% of entries (oldest first)
    const toRemove = Math.floor(entries.length * 0.2);
    for (let i = 0; i < toRemove; i++) {
      stringCache.delete(entries[i][0]);
    }
  }
  
  // Cache the string
  stringCache.set(str, str);
  return str;
}

/**
 * Intern multiple strings at once
 */
export function internStrings(strings: string[]): string[] {
  return strings.map(intern);
}

/**
 * Intern object keys
 */
export function internObjectKeys<T extends Record<string, any>>(obj: T): T {
  const result = {} as T;
  for (const [key, value] of Object.entries(obj)) {
    (result as any)[intern(key)] = value;
  }
  return result;
}

/**
 * Intern headers object
 */
export function internHeaders(headers: Headers): Headers {
  const result = new Headers();
  for (const [key, value] of headers.entries()) {
    result.set(intern(key), intern(value));
  }
  return result;
}

/**
 * Clear string cache
 */
export function clearStringCache(): void {
  stringCache.clear();
}

/**
 * Get cache statistics
 */
export function getStringCacheStats(): { size: number; maxSize: number } {
  return {
    size: stringCache.size,
    maxSize: MAX_CACHE_SIZE
  };
}

// Common HTTP methods - pre-interned
export const HTTP_METHODS = {
  GET: intern('GET'),
  POST: intern('POST'),
  PUT: intern('PUT'),
  PATCH: intern('PATCH'),
  DELETE: intern('DELETE'),
  HEAD: intern('HEAD'),
  OPTIONS: intern('OPTIONS')
} as const;

// Common headers - pre-interned
export const COMMON_HEADERS = {
  'Content-Type': intern('Content-Type'),
  'Authorization': intern('Authorization'),
  'User-Agent': intern('User-Agent'),
  'Accept': intern('Accept'),
  'Accept-Encoding': intern('Accept-Encoding'),
  'Accept-Language': intern('Accept-Language'),
  'Cache-Control': intern('Cache-Control'),
  'Connection': intern('Connection'),
  'Host': intern('Host'),
  'Referer': intern('Referer'),
  'X-Requested-With': intern('X-Requested-With'),
  'X-CSRF-Token': intern('X-CSRF-Token'),
  'X-XSRF-Token': intern('X-XSRF-Token')
} as const;

// Common content types - pre-interned
export const CONTENT_TYPES = {
  'application/json': intern('application/json'),
  'application/x-www-form-urlencoded': intern('application/x-www-form-urlencoded'),
  'multipart/form-data': intern('multipart/form-data'),
  'text/plain': intern('text/plain'),
  'text/html': intern('text/html'),
  'text/xml': intern('text/xml'),
  'application/xml': intern('application/xml'),
  'application/octet-stream': intern('application/octet-stream')
} as const;

// Common response types - pre-interned
export const RESPONSE_TYPES = {
  'json': intern('json'),
  'text': intern('text'),
  'blob': intern('blob'),
  'arrayBuffer': intern('arrayBuffer'),
  'stream': intern('stream'),
  'document': intern('document')
} as const;
