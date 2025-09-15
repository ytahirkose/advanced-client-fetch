/**
 * Advanced Client Fetch Lite - Minimal client with essential features only
 */

import { createClient } from './client';
import type { Client, ClientOptions } from './types';

/**
 * Create a minimal client with only essential features
 */
export function createLiteClient(options: ClientOptions = {}): Client {
  return createClient({
    ...options,
    plugins: [], // No plugins for lite version
  });
}

/**
 * Default lite client instance
 */
export const liteClient = createLiteClient();