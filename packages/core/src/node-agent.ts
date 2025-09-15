/**
 * Node.js specific agent and proxy utilities
 */

import type { Agent } from 'http';
import type { Agent as HttpsAgent } from 'https';
import type { NodeAgentOptions, ProxyConfig, NodeSslOptions, Context } from './types.js';

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
 * Create proxy middleware
 */
export function createProxyMiddleware(proxy: ProxyConfig) {
  return async (ctx: Context, next: () => Promise<void>) => {
    const url = new URL(ctx.req.url);
    
    // Apply proxy configuration
    if (proxy.protocol === 'http' || proxy.protocol === 'https') {
      // HTTP/HTTPS proxy
      const proxyUrl = `${proxy.protocol}://${proxy.host}:${proxy.port}`;
      
      // Set proxy headers
      if (proxy.auth) {
        const auth = Buffer.from(`${proxy.auth.username}:${proxy.auth.password}`).toString('base64');
        ctx.req.headers.set('Proxy-Authorization', `Basic ${auth}`);
      }
      
      // Modify request URL for proxy
      const originalUrl = ctx.req.url;
      ctx.req = new Request(proxyUrl + originalUrl, {
        method: ctx.req.method,
        headers: ctx.req.headers,
        body: ctx.req.body,
        signal: ctx.req.signal
      });
      
      ctx.meta.proxy = { type: 'http', originalUrl };
    } else if (proxy.protocol === 'socks5') {
      // SOCKS5 proxy (would require additional implementation)
      ctx.meta.proxy = { type: 'socks5', config: proxy };
    }
    
    await next();
  };
}