/**
 * HTTP Agents support plugin for Node.js
 */

import type { Plugin, Context } from '@advanced-client-fetch/core';

export interface HTTPAgentsPluginOptions {
  /** Default HTTP agent */
  httpAgent?: any;
  /** Default HTTPS agent */
  httpsAgent?: any;
  /** Agent factory function */
  agentFactory?: (url: string, options: any) => any;
}

/**
 * HTTP Agents support plugin
 */
export function httpAgents(options: HTTPAgentsPluginOptions = {}): Plugin {
  const {
    httpAgent: defaultHttpAgent,
    httpsAgent: defaultHttpsAgent,
    agentFactory
  } = options;

  return {
    name: 'http-agents',
    priority: 1000,
    
    async onRequest(context: Context): Promise<void> {
      const { req, options } = context;
      
      // Only apply in Node.js environment
      if (typeof window !== 'undefined') {
        return;
      }
      
      // Get agent configuration
      const httpAgent = options.httpAgent || defaultHttpAgent;
      const httpsAgent = options.httpsAgent || defaultHttpsAgent;
      
      if (!httpAgent && !httpsAgent && !agentFactory) {
        return;
      }
      
      // Apply agents to fetch options
      if (!context.fetchOptions) {
        context.fetchOptions = {};
      }
      
      const url = new URL(req.url);
      const isHttps = url.protocol === 'https:';
      
      if (agentFactory) {
        // Use custom agent factory
        const agent = agentFactory(req.url, options);
        if (agent) {
          // @ts-ignore - Node.js specific
          context.fetchOptions.agent = agent;
        }
      } else {
        // Use default agents
        if (isHttps && httpsAgent) {
          // @ts-ignore - Node.js specific
          context.fetchOptions.agent = httpsAgent;
        } else if (!isHttps && httpAgent) {
          // @ts-ignore - Node.js specific
          context.fetchOptions.agent = httpAgent;
        }
      }
    }
  };
}

/**
 * Create HTTP agent with common options
 */
export function createHTTPAgent(options: {
  keepAlive?: boolean;
  keepAliveMsecs?: number;
  maxSockets?: number;
  maxFreeSockets?: number;
  timeout?: number;
  freeSocketTimeout?: number;
} = {}) {
  // This would be implemented with actual Node.js http module
  // For now, return a placeholder
  return {
    keepAlive: options.keepAlive ?? true,
    keepAliveMsecs: options.keepAliveMsecs ?? 1000,
    maxSockets: options.maxSockets ?? Infinity,
    maxFreeSockets: options.maxFreeSockets ?? 256,
    timeout: options.timeout ?? 0,
    freeSocketTimeout: options.freeSocketTimeout ?? 15000
  };
}

/**
 * Create HTTPS agent with common options
 */
export function createHTTPSAgent(options: {
  keepAlive?: boolean;
  keepAliveMsecs?: number;
  maxSockets?: number;
  maxFreeSockets?: number;
  timeout?: number;
  freeSocketTimeout?: number;
  rejectUnauthorized?: boolean;
  ca?: string | Buffer | Array<string | Buffer>;
  cert?: string | Buffer | Array<string | Buffer>;
  key?: string | Buffer | Array<string | Buffer>;
  passphrase?: string;
  pfx?: string | Buffer | Array<string | Buffer>;
} = {}) {
  // This would be implemented with actual Node.js https module
  // For now, return a placeholder
  return {
    keepAlive: options.keepAlive ?? true,
    keepAliveMsecs: options.keepAliveMsecs ?? 1000,
    maxSockets: options.maxSockets ?? Infinity,
    maxFreeSockets: options.maxFreeSockets ?? 256,
    timeout: options.timeout ?? 0,
    freeSocketTimeout: options.freeSocketTimeout ?? 15000,
    rejectUnauthorized: options.rejectUnauthorized ?? true,
    ca: options.ca,
    cert: options.cert,
    key: options.key,
    passphrase: options.passphrase,
    pfx: options.pfx
  };
}

export default httpAgents;
