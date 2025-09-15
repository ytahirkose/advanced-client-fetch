/**
 * Advanced Client Fetch Node - Optimized for Node.js runtime
 */

import { createClient } from './client';
import type { Client, ClientOptions } from './types';

/**
 * Create a client optimized for Node.js runtime
 */
export function createNodeClient(options: ClientOptions = {}): Client {
  return createClient({
    ...options,
    headers: {
      'User-Agent': 'advanced-client-fetch-node/1.0.0',
      ...options.headers,
    },
    // Node.js-specific optimizations
    timeout: options.timeout || 60000,
    maxRedirects: options.maxRedirects || 5,
  });
}

/**
 * Default node client instance
 */
export const nodeClient = createNodeClient();
