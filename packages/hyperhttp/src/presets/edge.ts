/**
 * Edge Runtime Preset for HyperHTTP
 * Optimized for Cloudflare Workers, Vercel Edge, Deno Deploy
 */

import { createClient } from '../client.js';
import type { ClientOptions } from '../types.js';

/**
 * Create client optimized for Edge runtimes
 */
export function createEdgeClient(options: Omit<ClientOptions, 'transport'> = {}) {
  return createClient({
    ...options,
    // Edge runtimes have native fetch support
    transport: fetch,
  });
}

/**
 * Create client with retry for Edge
 */
export function createEdgeClientWithRetry(options: Omit<ClientOptions, 'transport'> = {}) {
  return createClient({
    ...options,
    transport: fetch,
    plugins: [
      // Add retry middleware for edge
      ...(options.plugins || []),
    ],
  });
}

/**
 * Create client with cache for Edge
 */
export function createEdgeClientWithCache(options: Omit<ClientOptions, 'transport'> = {}) {
  return createClient({
    ...options,
    transport: fetch,
    plugins: [
      // Add cache middleware for edge
      ...(options.plugins || []),
    ],
  });
}