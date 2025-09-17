/**
 * Edge runtime preset for Advanced Client Fetch
 * Optimized for Cloudflare Workers, Vercel Edge Functions, etc.
 */

import { createClient, type Client, type ClientOptions } from '@advanced-client-fetch/core';
import { retry, timeout, dedupe, metrics } from '@advanced-client-fetch/plugins';
import type { 
  Middleware, 
  RetryPluginOptions, 
  DedupePluginOptions, 
  MetricsPluginOptions 
} from '@advanced-client-fetch/core';

export interface EdgePresetOptions extends ClientOptions {
  /** Enable retry middleware */
  retry?: boolean | RetryPluginOptions;
  /** Enable timeout middleware */
  timeout?: boolean | number;
  /** Enable deduplication middleware */
  dedupe?: boolean | DedupePluginOptions;
  /** Enable metrics middleware */
  metrics?: boolean | MetricsPluginOptions;
  /** Custom middleware */
  middleware?: Middleware[];
}

/**
 * Create Advanced Client Fetch client optimized for edge runtime
 */
export function createEdgeClient(options: EdgePresetOptions = {}): Client {
  const {
    retry: retryOptions = true,
    timeout: timeoutOptions = 30000,
    dedupe: dedupeOptions = true,
    metrics: metricsOptions = false,
    middleware = [],
    ...clientOptions
  } = options;

  // Set default headers
  const defaultHeaders = {
    'User-Agent': 'advanced-client-fetch-edge/1.0.0',
    ...(clientOptions as any).headers,
  };

  const edgeMiddleware: Middleware[] = [];

  // Add retry middleware
  if (retryOptions) {
    const retryConfig = typeof retryOptions === 'boolean' 
      ? { retries: 3, minDelay: 100, maxDelay: 2000, jitter: true }
      : retryOptions;
    edgeMiddleware.push(retry(retryConfig));
  }

  // Add timeout middleware
  if (timeoutOptions) {
    const timeoutConfig = typeof timeoutOptions === 'number'
      ? { timeout: timeoutOptions }
      : timeoutOptions;
    edgeMiddleware.push(timeout(timeoutConfig));
  }

  // Add deduplication middleware
  if (dedupeOptions) {
    const dedupeConfig = typeof dedupeOptions === 'boolean'
      ? { maxAge: 30000 }
      : dedupeOptions;
    edgeMiddleware.push(dedupe(dedupeConfig));
  }

  // Add metrics middleware
  if (metricsOptions) {
    const metricsConfig = typeof metricsOptions === 'boolean'
      ? { enabled: true }
      : metricsOptions;
    edgeMiddleware.push(metrics(metricsConfig));
  }

  // Add custom middleware
  edgeMiddleware.push(...middleware);

  return createClient({
    ...clientOptions,
    headers: defaultHeaders,
    plugins: edgeMiddleware,
    timeout: (clientOptions as any).timeout || 30000,
    maxRedirects: (clientOptions as any).maxRedirects || 3,
  });
}

/**
 * Create edge client with retry only
 */
export function createEdgeClientWithRetry(
  retryOptions: RetryPluginOptions = {},
  clientOptions: Omit<EdgePresetOptions, 'retry'> = {}
): Client {
  return createEdgeClient({
    ...clientOptions,
    retry: retryOptions,
    timeout: false,
    dedupe: false,
    metrics: false,
  });
}

/**
 * Create edge client with timeout only
 */
export function createEdgeClientWithTimeout(
  timeoutMs: number = 30000,
  clientOptions: Omit<EdgePresetOptions, 'timeout'> = {}
): Client {
  return createEdgeClient({
    ...clientOptions,
    timeout: timeoutMs,
    retry: false,
    dedupe: false,
    metrics: false,
  });
}

/**
 * Create edge client with deduplication only
 */
export function createEdgeClientWithDedupe(
  dedupeOptions: DedupePluginOptions = {},
  clientOptions: Omit<EdgePresetOptions, 'dedupe'> = {}
): Client {
  return createEdgeClient({
    ...clientOptions,
    dedupe: dedupeOptions,
    retry: false,
    timeout: false,
    metrics: false,
  });
}

/**
 * Create edge client with metrics only
 */
export function createEdgeClientWithMetrics(
  metricsOptions: MetricsPluginOptions = {},
  clientOptions: Omit<EdgePresetOptions, 'metrics'> = {}
): Client {
  return createEdgeClient({
    ...clientOptions,
    metrics: metricsOptions,
    retry: false,
    timeout: false,
    dedupe: false,
  });
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
      'User-Agent': 'advanced-client-fetch-edge/cloudflare/1.0.0',
      ...(options as any).headers,
    },
  } as any);
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
      'User-Agent': 'advanced-client-fetch-edge/vercel/1.0.0',
      ...(options as any).headers,
    },
  } as any);
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
      'User-Agent': 'advanced-client-fetch-edge/deno/1.0.0',
      ...(options as any).headers,
    },
  } as any);
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
      'User-Agent': 'advanced-client-fetch-edge/bun/1.0.0',
      ...(options as any).headers,
    },
  } as any);
}

/**
 * Create minimal edge client
 */
export function createMinimalEdgeClient(baseURL?: string, options: EdgePresetOptions = {}): Client {
  return createEdgeClient({
    ...options,
    baseURL,
    retry: false,
    timeout: false,
    dedupe: false,
    metrics: false,
  });
}

/**
 * Create full edge client with all features
 */
export function createFullEdgeClient(options: EdgePresetOptions = {}): Client {
  return createEdgeClient({
    ...options,
    retry: true,
    timeout: 30000,
    dedupe: true,
    metrics: true,
  });
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
 * Default edge client instance
 */
export const edgeClient = createEdgeClient();

/**
 * Export for convenience
 */