/**
 * Node.js specific agent and proxy utilities
 */

import type { Agent } from 'http';
import type { Agent as HttpsAgent } from 'https';
import type { NodeAgentOptions, ProxyConfig, NodeSslOptions } from './types.js';

/**
 * Check if running in Node.js environment
 */
export function isNodeEnvironment(): boolean {
  return typeof process !== 'undefined' && 
         typeof process.versions !== 'undefined' && 
         typeof process.versions.node !== 'undefined';
}

/**
 * Create HTTP agent
 */
export function createHttpAgent(options: NodeAgentOptions = {}): Agent | undefined {
  if (!isNodeEnvironment()) {
    return undefined;
  }
  
  try {
    const { Agent } = require('node:http');
    return new Agent({
      keepAlive: true,
      maxSockets: 100,
      maxFreeSockets: 10,
      timeout: 60000,
      freeSocketTimeout: 30000,
      ...options,
    });
  } catch {
    return undefined;
  }
}

/**
 * Create HTTPS agent
 */
export function createHttpsAgent(options: NodeAgentOptions & NodeSslOptions = {}): HttpsAgent | undefined {
  if (!isNodeEnvironment()) {
    return undefined;
  }
  
  try {
    const { Agent } = require('node:https');
    return new Agent({
      keepAlive: true,
      maxSockets: 100,
      maxFreeSockets: 10,
      timeout: 60000,
      freeSocketTimeout: 30000,
      rejectUnauthorized: true,
      ...options,
    });
  } catch {
    return undefined;
  }
}

/**
 * Get default Node.js agent options
 */
export function getDefaultNodeAgentOptions(): NodeAgentOptions {
  return {
    keepAlive: true,
    maxSockets: 50,
    maxFreeSockets: 10,
    timeout: 0,
  };
}

/**
 * Create Node.js transport with agent support
 */
export function createNodeTransport(agent?: Agent | HttpsAgent): (request: Request) => Promise<Response> {
  if (!isNodeEnvironment()) {
    return fetch;
  }
  
  try {
    const { fetch: nodeFetch } = require('undici');
    return (request: Request) => nodeFetch(request, { dispatcher: agent });
  } catch {
    // Fallback to global fetch
    return globalThis.fetch;
  }
}

/**
 * Create proxy middleware (placeholder)
 */
export function createProxyMiddleware(proxy: ProxyConfig) {
  // This would be implemented with actual proxy logic
  return async (ctx: any, next: () => Promise<void>) => {
    // Proxy implementation would go here
    await next();
  };
}