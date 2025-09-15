/**
 * Edge runtime preset for HyperHTTP
 * Optimized for Cloudflare Workers, Vercel Edge Functions, etc.
 */

import { 
  createPresetClient, 
  createMinimalPresetClient, 
  createFullPresetClient,
  createProductionPresetClient,
  createDevelopmentPresetClient,
  createTestPresetClient,
  createPresetClientBuilder,
  type Client, 
  type PlatformOptions,
  type PresetConfig
} from 'hyperhttp-core';
import { retry, timeout, dedupe, metrics } from 'hyperhttp-plugins';

export interface EdgePresetOptions extends PlatformOptions {
  /** Enable retry middleware */
  retry?: boolean | any;
  /** Enable timeout middleware */
  timeout?: boolean | number;
  /** Enable deduplication middleware */
  dedupe?: boolean | any;
  /** Enable metrics middleware */
  metrics?: boolean | any;
  /** Custom middleware */
  middleware?: any[];
}

/**
 * Edge middleware factory
 */
function createEdgeMiddleware(config: PresetConfig, options: EdgePresetOptions): any[] {
  const middleware: any[] = [];

  // Add retry middleware
  if (config.retry) {
    const retryConfig = typeof config.retry === 'boolean' 
      ? { retries: 3, minDelay: 100, maxDelay: 2000, jitter: true }
      : config.retry;
    middleware.push(retry(retryConfig));
  }

  // Add timeout middleware
  if (config.timeout) {
    const timeoutConfig = typeof config.timeout === 'number'
      ? { timeout: config.timeout }
      : config.timeout;
    middleware.push(timeout(timeoutConfig));
  }

  // Add deduplication middleware
  if (config.dedupe) {
    const dedupeConfig = typeof config.dedupe === 'boolean'
      ? { maxAge: 30000 }
      : config.dedupe;
    middleware.push(dedupe(dedupeConfig));
  }

  // Add metrics middleware
  if (config.metrics) {
    const metricsConfig = typeof config.metrics === 'boolean'
      ? { enabled: true }
      : config.metrics;
    middleware.push(metrics(metricsConfig));
  }

  return middleware;
}

/**
 * Create HyperHTTP client optimized for edge runtime
 */
export function createEdgeClient(options: EdgePresetOptions = {}): Client {
  const defaultConfig: PresetConfig = {
    retry: options.retry ?? true,
    timeout: options.timeout ?? 30000,
    dedupe: options.dedupe ?? true,
    metrics: options.metrics ?? false,
  };

  return createPresetClient('edge', options, defaultConfig, createEdgeMiddleware);
}

/**
 * Create edge client with retry only
 */
export function createEdgeClientWithRetry(
  retryOptions: any = {},
  clientOptions: Omit<EdgePresetOptions, 'retry'> = {}
): Client {
  return createPresetClient('edge', {
    ...clientOptions,
    retry: retryOptions,
  }, {
    retry: retryOptions,
    timeout: false,
    dedupe: false,
    metrics: false,
  }, createEdgeMiddleware);
}

/**
 * Create edge client with timeout only
 */
export function createEdgeClientWithTimeout(
  timeoutMs: number = 30000,
  clientOptions: Omit<EdgePresetOptions, 'timeout'> = {}
): Client {
  return createPresetClient('edge', {
    ...clientOptions,
    timeout: timeoutMs,
  }, {
    retry: false,
    timeout: timeoutMs,
    dedupe: false,
    metrics: false,
  }, createEdgeMiddleware);
}

/**
 * Create edge client with deduplication only
 */
export function createEdgeClientWithDedupe(
  dedupeOptions: any = {},
  clientOptions: Omit<EdgePresetOptions, 'dedupe'> = {}
): Client {
  return createPresetClient('edge', {
    ...clientOptions,
    dedupe: dedupeOptions,
  }, {
    retry: false,
    timeout: false,
    dedupe: dedupeOptions,
    metrics: false,
  }, createEdgeMiddleware);
}

/**
 * Create edge client with metrics only
 */
export function createEdgeClientWithMetrics(
  metricsOptions: any = {},
  clientOptions: Omit<EdgePresetOptions, 'metrics'> = {}
): Client {
  return createPresetClient('edge', {
    ...clientOptions,
    metrics: metricsOptions,
  }, {
    retry: false,
    timeout: false,
    dedupe: false,
    metrics: metricsOptions,
  }, createEdgeMiddleware);
}


/**
 * Create edge client for Cloudflare Workers
 */
export function createCloudflareWorkersClient(
  options: EdgePresetOptions = {}
): Client {
  return createEdgeClient({
    ...options,
    headers: {
      'User-Agent': 'hyperhttp-edge/0.1.0',
      ...options.headers,
    },
  });
}

/**
 * Create edge client for Vercel Edge Functions
 */
export function createVercelEdgeClient(
  options: EdgePresetOptions = {}
): Client {
  return createEdgeClient({
    ...options,
    headers: {
      'User-Agent': 'hyperhttp-vercel/0.1.0',
      ...options.headers,
    },
  });
}

/**
 * Create edge client for Deno Deploy
 */
export function createDenoDeployClient(
  options: EdgePresetOptions = {}
): Client {
  return createEdgeClient({
    ...options,
    headers: {
      'User-Agent': 'hyperhttp-deno/0.1.0',
      ...options.headers,
    },
  });
}

/**
 * Create edge client for Bun Edge
 */
export function createBunEdgeClient(
  options: EdgePresetOptions = {}
): Client {
  return createEdgeClient({
    ...options,
    headers: {
      'User-Agent': 'hyperhttp-bun/0.1.0',
      ...options.headers,
    },
  });
}

/**
 * Default edge client instance
 */
export const edgeClient = createEdgeClient();

/**
 * Create minimal edge client
 */
export function createMinimalEdgeClient(baseURL?: string, options: EdgePresetOptions = {}): Client {
  return createMinimalPresetClient('edge', {
    ...options,
    baseURL,
  });
}

/**
 * Create full edge client with all features
 */
export function createFullEdgeClient(options: EdgePresetOptions = {}): Client {
  return createFullPresetClient('edge', options, {
    retry: true,
    timeout: 30000,
    dedupe: true,
    metrics: true,
  }, createEdgeMiddleware);
}

/**
 * Create API Gateway optimized client
 */
export function createAPIGatewayClient(options: EdgePresetOptions = {}): Client {
  return createEdgeClient({
    ...options,
    retry: { retries: 2, minDelay: 100, maxDelay: 1000 },
    timeout: 10000,
    dedupe: true,
    metrics: true,
  });
}

/**
 * Create CDN optimized client
 */
export function createCDNClient(options: EdgePresetOptions = {}): Client {
  return createEdgeClient({
    ...options,
    retry: { retries: 1, minDelay: 50, maxDelay: 200 },
    timeout: 5000,
    dedupe: true,
    metrics: false,
  });
}

/**
 * Create WebSocket optimized client
 */
export function createWebSocketClient(options: EdgePresetOptions = {}): Client {
  return createEdgeClient({
    ...options,
    retry: { retries: 1, minDelay: 100, maxDelay: 500 },
    timeout: 10000,
    dedupe: false,
    metrics: false,
  });
}

/**
 * Create real-time optimized client
 */
export function createRealTimeClient(options: EdgePresetOptions = {}): Client {
  return createEdgeClient({
    ...options,
    retry: { retries: 1, minDelay: 50, maxDelay: 200 },
    timeout: 5000,
    dedupe: false,
    metrics: false,
  });
}

/**
 * Create streaming optimized client
 */
export function createStreamingClient(options: EdgePresetOptions = {}): Client {
  return createEdgeClient({
    ...options,
    retry: { retries: 2, minDelay: 100, maxDelay: 1000 },
    timeout: 60000,
    dedupe: false,
    metrics: true,
  });
}

/**
 * Create batch processing optimized client
 */
export function createBatchClient(options: EdgePresetOptions = {}): Client {
  return createEdgeClient({
    ...options,
    retry: { retries: 3, minDelay: 500, maxDelay: 5000 },
    timeout: 30000,
    dedupe: true,
    metrics: true,
  });
}

/**
 * Create microservice optimized client
 */
export function createMicroserviceClient(options: EdgePresetOptions = {}): Client {
  return createEdgeClient({
    ...options,
    retry: { retries: 2, minDelay: 200, maxDelay: 2000 },
    timeout: 10000,
    dedupe: true,
    metrics: true,
  });
}

/**
 * Create serverless optimized client
 */
export function createServerlessClient(options: EdgePresetOptions = {}): Client {
  return createEdgeClient({
    ...options,
    retry: { retries: 1, minDelay: 100, maxDelay: 1000 },
    timeout: 5000,
    dedupe: true,
    metrics: false,
  });
}

/**
 * Export for convenience
 */
export default edgeClient;