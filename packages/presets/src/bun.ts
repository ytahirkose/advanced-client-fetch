/**
 * Bun preset for Advanced Client Fetch
 * Optimized for Bun runtime
 */

import { createClient, type Client, type ClientOptions } from '@advanced-client-fetch/core';
import { retry, timeout, dedupe, metrics } from '@advanced-client-fetch/plugins';
import type { 
  Middleware, 
  RetryPluginOptions, 
  DedupePluginOptions, 
  MetricsPluginOptions 
} from '@advanced-client-fetch/core';

export interface BunPresetOptions extends ClientOptions {
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
 * Create Advanced Client Fetch client optimized for Bun
 */
export function createBunClient(options: BunPresetOptions = {}): Client {
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
    'User-Agent': 'advanced-client-fetch-bun/1.0.0',
    ...(clientOptions as any).headers,
  };

  const bunMiddleware: Middleware[] = [];

  // Add retry middleware
  if (retryOptions) {
    const retryConfig = typeof retryOptions === 'boolean' 
      ? { retries: 3, minDelay: 100, maxDelay: 2000, jitter: true }
      : retryOptions;
    bunMiddleware.push(retry(retryConfig));
  }

  // Add timeout middleware
  if (timeoutOptions) {
    const timeoutConfig = typeof timeoutOptions === 'number'
      ? { timeout: timeoutOptions }
      : timeoutOptions;
    bunMiddleware.push(timeout(timeoutConfig));
  }

  // Add deduplication middleware
  if (dedupeOptions) {
    const dedupeConfig = typeof dedupeOptions === 'boolean'
      ? { maxAge: 30000 }
      : dedupeOptions;
    bunMiddleware.push(dedupe(dedupeConfig));
  }

  // Add metrics middleware
  if (metricsOptions) {
    const metricsConfig = typeof metricsOptions === 'boolean'
      ? { enabled: true }
      : metricsOptions;
    bunMiddleware.push(metrics(metricsConfig));
  }

  // Add custom middleware
  bunMiddleware.push(...middleware);

  return createClient({
    ...clientOptions,
    headers: defaultHeaders,
    plugins: bunMiddleware,
  });
}

/**
 * Create minimal Bun client
 */
export function createMinimalBunClient(baseURL?: string, options: BunPresetOptions = {}): Client {
  return createBunClient({
    ...options,
    baseURL,
    retry: false,
    timeout: false,
    dedupe: false,
    metrics: false,
  });
}

/**
 * Create full Bun client with all features
 */
export function createFullBunClient(options: BunPresetOptions = {}): Client {
  return createBunClient({
    ...options,
    retry: true,
    timeout: 30000,
    dedupe: true,
    metrics: true,
  });
}

/**
 * Create Bun Edge client
 */
export function createBunEdgeClient(options: BunPresetOptions = {}): Client {
  return createBunClient({
    ...options,
    headers: {
      'User-Agent': 'advanced-client-fetch-bun/edge/1.0.0',
      ...options.headers,
    },
  });
}

/**
 * Create Bun CLI client
 */
export function createBunCLIClient(options: BunPresetOptions = {}): Client {
  return createBunClient({
    ...options,
    headers: {
      'User-Agent': 'advanced-client-fetch-bun/cli/1.0.0',
      ...options.headers,
    },
  });
}

/**
 * Create Bun Fresh client
 */
export function createBunFreshClient(options: BunPresetOptions = {}): Client {
  return createBunClient({
    ...options,
    headers: {
      'User-Agent': 'advanced-client-fetch-bun/fresh/1.0.0',
      ...options.headers,
    },
  });
}

/**
 * Create Bun Hono client
 */
export function createBunHonoClient(options: BunPresetOptions = {}): Client {
  return createBunClient({
    ...options,
    headers: {
      'User-Agent': 'advanced-client-fetch-bun/hono/1.0.0',
      ...options.headers,
    },
  });
}

/**
 * Create Bun Elysia client
 */
export function createBunElysiaClient(options: BunPresetOptions = {}): Client {
  return createBunClient({
    ...options,
    headers: {
      'User-Agent': 'advanced-client-fetch-bun/elysia/1.0.0',
      ...options.headers,
    },
  });
}

/**
 * Create Bun client with retry only
 */
export function createBunClientWithRetry(
  retryOptions: RetryPluginOptions = {},
  clientOptions: Omit<BunPresetOptions, 'retry'> = {}
): Client {
  return createBunClient({
    ...clientOptions,
    retry: retryOptions,
    timeout: false,
    dedupe: false,
    metrics: false,
  });
}

/**
 * Create Bun client with timeout only
 */
export function createBunClientWithTimeout(
  timeoutMs: number = 30000,
  clientOptions: Omit<BunPresetOptions, 'timeout'> = {}
): Client {
  return createBunClient({
    ...clientOptions,
    timeout: timeoutMs,
    retry: false,
    dedupe: false,
    metrics: false,
  });
}

/**
 * Create Bun client with deduplication only
 */
export function createBunClientWithDedupe(
  dedupeOptions: DedupePluginOptions = {},
  clientOptions: Omit<BunPresetOptions, 'dedupe'> = {}
): Client {
  return createBunClient({
    ...clientOptions,
    dedupe: dedupeOptions,
    retry: false,
    timeout: false,
    metrics: false,
  });
}

/**
 * Create Bun client with metrics only
 */
export function createBunClientWithMetrics(
  metricsOptions: MetricsPluginOptions = {},
  clientOptions: Omit<BunPresetOptions, 'metrics'> = {}
): Client {
  return createBunClient({
    ...clientOptions,
    metrics: metricsOptions,
    retry: false,
    timeout: false,
    dedupe: false,
  });
}

/**
 * Create development Bun client
 */
export function createDevelopmentBunClient(
  options: Omit<BunPresetOptions, 'retry' | 'timeout' | 'dedupe' | 'metrics'> = {}
): Client {
  return createBunClient({
    ...options,
    retry: {
      retries: 2,
      minDelay: 50,
      maxDelay: 1000,
      jitter: true,
    },
    timeout: 10000,
    dedupe: true,
    metrics: {
      enabled: true,
    },
  });
}

/**
 * Create production Bun client
 */
export function createProductionBunClient(
  options: Omit<BunPresetOptions, 'retry' | 'timeout' | 'dedupe' | 'metrics'> = {}
): Client {
  return createBunClient({
    ...options,
    retry: {
      retries: 3,
      minDelay: 100,
      maxDelay: 2000,
      jitter: true,
    },
    timeout: 30000,
    dedupe: true,
    metrics: {
      enabled: true,
    },
  });
}

/**
 * Create test Bun client
 */
export function createTestBunClient(
  options: Omit<BunPresetOptions, 'retry' | 'timeout' | 'dedupe' | 'metrics'> = {}
): Client {
  return createBunClient({
    ...options,
    retry: false,
    timeout: 5000,
    dedupe: false,
    metrics: false,
  });
}

/**
 * Create serverless Bun client
 */
export function createServerlessBunClient(
  options: BunPresetOptions = {}
): Client {
  return createBunClient({
    ...options,
    retry: { retries: 1, minDelay: 100, maxDelay: 1000 },
    timeout: 5000,
    dedupe: true,
    metrics: false,
  });
}

/**
 * Create microservice Bun client
 */
export function createMicroserviceBunClient(
  options: BunPresetOptions = {}
): Client {
  return createBunClient({
    ...options,
    retry: { retries: 2, minDelay: 200, maxDelay: 2000 },
    timeout: 10000,
    dedupe: true,
    metrics: true,
  });
}

/**
 * Create API Gateway Bun client
 */
export function createAPIGatewayBunClient(
  options: BunPresetOptions = {}
): Client {
  return createBunClient({
    ...options,
    retry: { retries: 2, minDelay: 100, maxDelay: 1000 },
    timeout: 10000,
    dedupe: true,
    metrics: true,
  });
}

/**
 * Create CDN Bun client
 */
export function createCDNBunClient(
  options: BunPresetOptions = {}
): Client {
  return createBunClient({
    ...options,
    retry: { retries: 1, minDelay: 50, maxDelay: 200 },
    timeout: 5000,
    dedupe: true,
    metrics: false,
  });
}

/**
 * Create WebSocket Bun client
 */
export function createWebSocketBunClient(
  options: BunPresetOptions = {}
): Client {
  return createBunClient({
    ...options,
    retry: { retries: 1, minDelay: 100, maxDelay: 500 },
    timeout: 10000,
    dedupe: false,
    metrics: false,
  });
}

/**
 * Create real-time Bun client
 */
export function createRealTimeBunClient(
  options: BunPresetOptions = {}
): Client {
  return createBunClient({
    ...options,
    retry: { retries: 1, minDelay: 50, maxDelay: 200 },
    timeout: 5000,
    dedupe: false,
    metrics: false,
  });
}

/**
 * Create streaming Bun client
 */
export function createStreamingBunClient(
  options: BunPresetOptions = {}
): Client {
  return createBunClient({
    ...options,
    retry: { retries: 2, minDelay: 100, maxDelay: 1000 },
    timeout: 60000,
    dedupe: false,
    metrics: true,
  });
}

/**
 * Create batch processing Bun client
 */
export function createBatchBunClient(
  options: BunPresetOptions = {}
): Client {
  return createBunClient({
    ...options,
    retry: { retries: 3, minDelay: 500, maxDelay: 5000 },
    timeout: 30000,
    dedupe: true,
    metrics: true,
  });
}

/**
 * Default Bun client instance
 */
export const bunClient = createBunClient();

/**
 * Export for convenience
 */