/**
 * Proxy support plugin for Node.js environments
 */

import type { Plugin, Context } from '@advanced-client-fetch/core';
import type { ProxyConfig } from '@advanced-client-fetch/core';

export interface ProxyPluginOptions {
  /** Default proxy configuration */
  proxy?: ProxyConfig;
  /** Proxy bypass list (URLs that should not use proxy) */
  bypass?: string[];
  /** Custom proxy resolver */
  proxyResolver?: (url: string) => ProxyConfig | null;
}

/**
 * Proxy support plugin
 */
export function proxy(options: ProxyPluginOptions = {}): Plugin {
  const {
    proxy: defaultProxy,
    bypass = [],
    proxyResolver
  } = options;

  return {
    name: 'proxy',
    priority: 1500,
    
    async onRequest(context: Context): Promise<void> {
      const { req, options } = context;
      
      // Only apply in Node.js environment
      if (typeof window !== 'undefined') {
        return;
      }
      
      // Get proxy configuration
      let proxyConfig: ProxyConfig | null = null;
      
      if (options.proxy) {
        proxyConfig = options.proxy;
      } else if (proxyResolver) {
        proxyConfig = proxyResolver(req.url);
      } else if (defaultProxy) {
        proxyConfig = defaultProxy;
      }
      
      if (!proxyConfig) {
        return;
      }
      
      // Check if URL should bypass proxy
      const url = new URL(req.url);
      const shouldBypass = bypass.some(pattern => {
        if (pattern.startsWith('*.')) {
          const domain = pattern.slice(2);
          return url.hostname.endsWith(domain);
        }
        return url.hostname === pattern || url.hostname.endsWith('.' + pattern);
      });
      
      if (shouldBypass) {
        return;
      }
      
      // Apply proxy configuration
      await applyProxy(context, proxyConfig);
    }
  };
}

/**
 * Apply proxy configuration to request
 */
async function applyProxy(context: Context, proxyConfig: ProxyConfig): Promise<void> {
  const { req } = context;
  
  try {
    // Dynamic import for Node.js modules
    const { HttpsProxyAgent } = await import('https-proxy-agent');
    const { HttpProxyAgent } = await import('http-proxy-agent');
    
    // Build proxy URL
    const protocol = proxyConfig.protocol || 'http';
    const auth = proxyConfig.auth ? 
      `${proxyConfig.auth.username}:${proxyConfig.auth.password}@` : '';
    const proxyUrl = `${protocol}://${auth}${proxyConfig.host}:${proxyConfig.port}`;
    
    // Create proxy agent
    const url = new URL(req.url);
    const isHttps = url.protocol === 'https:';
    const Agent = isHttps ? HttpsProxyAgent : HttpProxyAgent;
    const agent = new Agent(proxyUrl);
    
    // Apply agent to fetch options
    if (!context.fetchOptions) {
      context.fetchOptions = {};
    }
    
    // @ts-ignore - Node.js specific
    context.fetchOptions.agent = agent;
    
  } catch (error) {
    console.warn('Proxy plugin: Failed to apply proxy configuration', error);
  }
}

export default proxy;
