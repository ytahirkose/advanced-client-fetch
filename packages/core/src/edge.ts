/**
 * Advanced Client Fetch Edge - Optimized for edge runtimes
 */

import { createClient } from './client';
import type { Client, ClientOptions } from './types';

/**
 * Create a client optimized for edge runtimes
 */
export function createEdgeClient(options: ClientOptions = {}): Client {
  return createClient({
    ...options,
    headers: {
      'User-Agent': 'advanced-client-fetch-edge/1.0.0',
      ...options.headers,
    },
    // Edge-specific optimizations
    timeout: options.timeout || 30000,
    maxRedirects: options.maxRedirects || 3,
  });
}

/**
 * Default edge client instance
 */
export const edgeClient = createEdgeClient();
