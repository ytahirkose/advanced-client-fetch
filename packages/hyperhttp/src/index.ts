/**
 * HyperHTTP - The modern HTTP client
 * 
 * A fetch-first, plugin-based HTTP client that works across all platforms.
 * More powerful than Axios with smart retry, caching, rate limiting, and more.
 * 
 * @example
 * ```typescript
 * import { createClient } from 'hyperhttp';
 * 
 * const client = createClient({
 *   baseURL: 'https://api.example.com',
 *   plugins: [retry(), cache(), rateLimit()]
 * });
 * 
 * const data = await client.get('/users');
 * ```
 */

// Re-export everything from core
export * from 'hyperhttp-core';

// Re-export commonly used plugins
export {
  retry,
  cache,
  rateLimit,
  circuitBreaker,
  dedupe,
  metrics,
  timeout
} from 'hyperhttp-plugins';

// Re-export presets
export {
  createNodeClient,
  createEdgeClient,
  createBrowserClient,
  createDenoClient,
  createBunClient
} from 'hyperhttp-presets';

// Re-export axios adapter
export {
  createAxiosAdapter,
  createAxiosInstance
} from 'hyperhttp-axios-adapter';

// Default export for convenience
export { createClient as default } from 'hyperhttp-core';
