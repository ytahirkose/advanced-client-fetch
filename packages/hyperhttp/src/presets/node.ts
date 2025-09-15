/**
 * Node.js Preset for HyperHTTP
 * Includes agent support and Node.js specific optimizations
 */

import { createClient } from '../client.js';
import { createNodeTransport, createHttpAgent, createHttpsAgent } from '../node-agent.js';
import type { ClientOptions, NodeAgentOptions } from '../types.js';

/**
 * Create client optimized for Node.js
 */
export function createNodeClient(options: Omit<ClientOptions, 'transport'> & { agent?: NodeAgentOptions } = {}) {
  const { agent, ...clientOptions } = options;
  
  // Create agents
  const httpAgent = createHttpAgent(agent);
  const httpsAgent = createHttpsAgent(agent);
  
  // Create transport with agents
  const transport = createNodeTransport(httpAgent || httpsAgent);
  
  return createClient({
    ...clientOptions,
    transport,
  });
}

/**
 * Create client with keep-alive for Node.js
 */
export function createNodeClientWithKeepAlive(options: Omit<ClientOptions, 'transport'> = {}) {
  return createNodeClient({
    ...options,
    agent: {
      keepAlive: true,
      maxSockets: 100,
      maxFreeSockets: 10,
    },
  });
}

/**
 * Create client with proxy support for Node.js
 */
export function createNodeClientWithProxy(
  proxyUrl: string,
  options: Omit<ClientOptions, 'transport'> = {}
) {
  return createNodeClient({
    ...options,
    // Proxy configuration would be handled by the agent
  });
}