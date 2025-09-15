/**
 * Object pool for performance optimization
 */

// Object pool for common objects to reduce GC pressure
class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn: (obj: T) => void;
  private maxSize: number;

  constructor(createFn: () => T, resetFn: (obj: T) => void, maxSize = 100) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.maxSize = maxSize;
  }

  get(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.createFn();
  }

  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      this.resetFn(obj);
      this.pool.push(obj);
    }
  }

  clear(): void {
    this.pool.length = 0;
  }
}

// Headers object pool
const headersPool = new ObjectPool<Headers>(
  () => new Headers(),
  (headers) => {
    // Clear all headers
    const entries = Array.from(headers.entries());
    for (const [key] of entries) {
      headers.delete(key);
    }
  }
);

// URL object pool
const urlPool = new ObjectPool<URL>(
  () => new URL('about:blank'),
  (url) => {
    // Reset URL to blank
    url.href = 'about:blank';
  }
);

// Request object pool
const requestPool = new ObjectPool<Request>(
  () => new Request('about:blank'),
  (req) => {
    // Request objects are immutable, so we can't reset them
    // This pool is mainly for reducing allocation overhead
  }
);

// Response object pool
const responsePool = new ObjectPool<Response>(
  () => new Response(),
  (res) => {
    // Response objects are immutable, so we can't reset them
    // This pool is mainly for reducing allocation overhead
  }
);

// Error object pool
const errorPool = new ObjectPool<Error>(
  () => new Error(),
  (err) => {
    err.message = '';
    err.name = 'Error';
    err.stack = undefined;
  }
);

// Object pool for common data structures
const mapPool = new ObjectPool<Map<string, any>>(
  () => new Map(),
  (map) => map.clear()
);

const setPool = new ObjectPool<Set<string>>(
  () => new Set(),
  (set) => set.clear()
);

// Array pool for temporary arrays
const arrayPool = new ObjectPool<any[]>(
  () => [],
  (arr) => {
    arr.length = 0;
  }
);

// Export pool utilities
export {
  ObjectPool,
  headersPool,
  urlPool,
  requestPool,
  responsePool,
  errorPool,
  mapPool,
  setPool,
  arrayPool
};

// Pool management utilities
export function getHeaders(): Headers {
  return headersPool.get();
}

export function releaseHeaders(headers: Headers): void {
  headersPool.release(headers);
}

export function getURL(): URL {
  return urlPool.get();
}

export function releaseURL(url: URL): void {
  urlPool.release(url);
}

export function getMap<K, V>(): Map<K, V> {
  return mapPool.get() as Map<K, V>;
}

export function releaseMap<K, V>(map: Map<K, V>): void {
  mapPool.release(map as any);
}

export function getSet<T>(): Set<T> {
  return setPool.get() as Set<T>;
}

export function releaseSet<T>(set: Set<T>): void {
  setPool.release(set as any);
}

export function getArray<T>(): T[] {
  return arrayPool.get() as T[];
}

export function releaseArray<T>(arr: T[]): void {
  arrayPool.release(arr as any);
}

// Clear all pools (useful for testing or cleanup)
export function clearAllPools(): void {
  headersPool.clear();
  urlPool.clear();
  requestPool.clear();
  responsePool.clear();
  errorPool.clear();
  mapPool.clear();
  setPool.clear();
  arrayPool.clear();
}
