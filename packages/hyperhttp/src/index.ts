/**
 * Advanced Client Fetch - The modern HTTP client
 * 
 * A fetch-first, plugin-based HTTP client that works across all platforms.
 * More powerful than Axios with smart retry, caching, rate limiting, and more.
 * 
 * @example
 * ```typescript
 * import { createClient, retry, cache, rateLimit } from 'advanced-client-fetch';
 * 
 * const client = createClient({
 *   baseURL: 'https://api.example.com',
 *   plugins: [retry(), cache(), rateLimit()]
 * });
 * 
 * const data = await client.get('/users');
 * ```
 */

// Re-export from published packages
export * from 'hyperhttp-core';
export * from 'hyperhttp-plugins';
export * from 'hyperhttp-presets';
export * from 'hyperhttp-axios-adapter';

// Default export
export { createClient as default } from 'hyperhttp-core';
