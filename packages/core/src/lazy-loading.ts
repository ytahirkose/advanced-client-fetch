/**
 * Lazy loading utilities for performance optimization
 */

// Note: Using any for complex Node.js types to avoid DTS generation issues

// Lazy loading cache
const lazyCache = new Map<string, any>();

/**
 * Lazy load a module or function
 */
export function lazyLoad<T>(key: string, loader: () => T): T {
  if (lazyCache.has(key)) {
    return lazyCache.get(key);
  }
  
  const value = loader();
  lazyCache.set(key, value);
  return value;
}

/**
 * Lazy load with promise
 */
export function lazyLoadAsync<T>(key: string, loader: () => Promise<T>): Promise<T> {
  if (lazyCache.has(key)) {
    return Promise.resolve(lazyCache.get(key));
  }
  
  return loader().then(value => {
    lazyCache.set(key, value);
    return value;
  });
}

/**
 * Lazy load with cleanup
 */
export function lazyLoadWithCleanup<T>(
  key: string, 
  loader: () => T, 
  cleanup: (value: T) => void
): T {
  if (lazyCache.has(key)) {
    return lazyCache.get(key);
  }
  
  const value = loader();
  lazyCache.set(key, value);
  
  // Register cleanup
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      cleanup(value);
    });
  }
  
  return value;
}

/**
 * Clear lazy loading cache
 */
export function clearLazyCache(): void {
  lazyCache.clear();
}

/**
 * Remove specific item from cache
 */
export function removeFromLazyCache(key: string): boolean {
  return lazyCache.delete(key);
}

/**
 * Get cache statistics
 */
export function getLazyCacheStats(): { size: number; keys: string[] } {
  return {
    size: lazyCache.size,
    keys: Array.from(lazyCache.keys())
  };
}

// Common lazy loaders
export const lazyLoaders: Record<string, () => Promise<any>> = {
  // Node.js specific modules
  nodeHttp: () => import('http'),
  nodeHttps: () => import('https'),
  nodeUrl: () => import('url'),
  nodeCrypto: () => import('crypto'),
  nodeFs: () => import('fs'),
  nodePath: () => import('path'),
  nodeStream: () => import('stream'),
  nodeEvents: () => import('events'),
  nodeBuffer: () => import('buffer'),
  nodeOs: () => import('os'),
  nodeZlib: () => import('zlib'),
  
  // Browser specific modules
  browserCrypto: () => Promise.resolve(crypto),
  browserFetch: () => Promise.resolve(fetch),
  browserHeaders: () => Promise.resolve(Headers),
  browserRequest: () => Promise.resolve(Request),
  browserResponse: () => Promise.resolve(Response),
  browserAbortController: () => Promise.resolve(AbortController),
  browserAbortSignal: () => Promise.resolve(AbortSignal),
  
  // Common utilities
  jsonParse: () => Promise.resolve(JSON.parse),
  jsonStringify: () => Promise.resolve(JSON.stringify),
  urlConstructor: () => Promise.resolve(URL),
  urlSearchParams: () => Promise.resolve(URLSearchParams),
  formData: () => Promise.resolve(FormData),
  textEncoder: () => Promise.resolve(TextEncoder),
  textDecoder: () => Promise.resolve(TextDecoder),
  blob: () => Promise.resolve(Blob),
  arrayBuffer: () => Promise.resolve(ArrayBuffer),
  uint8Array: () => Promise.resolve(Uint8Array),
  uint16Array: () => Promise.resolve(Uint16Array),
  uint32Array: () => Promise.resolve(Uint32Array),
  int8Array: () => Promise.resolve(Int8Array),
  int16Array: () => Promise.resolve(Int16Array),
  int32Array: () => Promise.resolve(Int32Array),
  float32Array: () => Promise.resolve(Float32Array),
  float64Array: () => Promise.resolve(Float64Array),
  bigInt64Array: () => Promise.resolve(BigInt64Array),
  bigUint64Array: () => Promise.resolve(BigUint64Array)
} as const;

// Type-safe lazy loading
export function createLazyLoader<T>(loader: () => T) {
  let value: T | undefined;
  let promise: Promise<T> | undefined;
  
  return {
    get(): T {
      if (value !== undefined) {
        return value;
      }
      if (promise) {
        throw new Error('Lazy loader is already loading');
      }
      value = loader();
      return value;
    },
    
    async getAsync(): Promise<T> {
      if (value !== undefined) {
        return value;
      }
      if (promise) {
        return promise;
      }
      promise = Promise.resolve(loader());
      value = await promise;
      return value;
    },
    
    isLoaded(): boolean {
      return value !== undefined;
    },
    
    reset(): void {
      value = undefined;
      promise = undefined;
    }
  };
}
