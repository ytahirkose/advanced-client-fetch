/**
 * Deno preset for Advanced Client Fetch
 * Optimized for Deno runtime
 */

import { createClient, type Client, type ClientOptions } from '@advanced-client-fetch/core';
import { retry, timeout, dedupe, metrics } from '@advanced-client-fetch/plugins';
import type { 
  Middleware, 
  RetryPluginOptions, 
  DedupePluginOptions, 
  MetricsPluginOptions 
} from '@advanced-client-fetch/core';

export interface DenoPresetOptions extends ClientOptions {
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
 * Create Advanced Client Fetch client optimized for Deno
 */
export function createDenoClient(options: DenoPresetOptions = {}): Client {
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
    'User-Agent': 'advanced-client-fetch-deno/1.0.0',
    ...(clientOptions as any).headers,
  };

  const denoMiddleware: Middleware[] = [];

  // Add retry middleware
  if (retryOptions) {
    const retryConfig = typeof retryOptions === 'boolean' 
      ? { retries: 3, minDelay: 100, maxDelay: 2000, jitter: true }
      : retryOptions;
    denoMiddleware.push(retry(retryConfig));
  }

  // Add timeout middleware
  if (timeoutOptions) {
    const timeoutConfig = typeof timeoutOptions === 'number'
      ? { timeout: timeoutOptions }
      : timeoutOptions;
    denoMiddleware.push(timeout(timeoutConfig));
  }

  // Add deduplication middleware
  if (dedupeOptions) {
    const dedupeConfig = typeof dedupeOptions === 'boolean'
      ? { maxAge: 30000 }
      : dedupeOptions;
    denoMiddleware.push(dedupe(dedupeConfig));
  }

  // Add metrics middleware
  if (metricsOptions) {
    const metricsConfig = typeof metricsOptions === 'boolean'
      ? { enabled: true }
      : metricsOptions;
    denoMiddleware.push(metrics(metricsConfig));
  }

  // Add custom middleware
  denoMiddleware.push(...middleware);

  return createClient({
    ...clientOptions,
    headers: defaultHeaders,
    plugins: denoMiddleware,
  });
}

/**
 * Create minimal Deno client
 */
export function createMinimalDenoClient(baseURL?: string, options: DenoPresetOptions = {}): Client {
  return createDenoClient({
    ...options,
    baseURL,
    retry: false,
    timeout: false,
    dedupe: false,
    metrics: false,
  });
}

/**
 * Create full Deno client with all features
 */
export function createFullDenoClient(options: DenoPresetOptions = {}): Client {
  return createDenoClient({
    ...options,
    retry: true,
    timeout: 30000,
    dedupe: true,
    metrics: true,
  });
}

/**
 * Create Deno Deploy client
 */
export function createDenoDeployClient(options: DenoPresetOptions = {}): Client {
  return createDenoClient({
    ...options,
    headers: {
      'User-Agent': 'advanced-client-fetch-deno/deploy/1.0.0',
      ...options.headers,
    },
  });
}

/**
 * Create Deno CLI client
 */
export function createDenoCLIClient(options: DenoPresetOptions = {}): Client {
  return createDenoClient({
    ...options,
    headers: {
      'User-Agent': 'advanced-client-fetch-deno/cli/1.0.0',
      ...options.headers,
    },
  });
}

/**
 * Create Deno Fresh client
 */
export function createDenoFreshClient(options: DenoPresetOptions = {}): Client {
  return createDenoClient({
    ...options,
    headers: {
      'User-Agent': 'advanced-client-fetch-deno/fresh/1.0.0',
      ...options.headers,
    },
  });
}

/**
 * Create Deno Oak client
 */
export function createDenoOakClient(options: DenoPresetOptions = {}): Client {
  return createDenoClient({
    ...options,
    headers: {
      'User-Agent': 'advanced-client-fetch-deno/oak/1.0.0',
      ...options.headers,
    },
  });
}

/**
 * Create Deno Hono client
 */
export function createDenoHonoClient(options: DenoPresetOptions = {}): Client {
  return createDenoClient({
    ...options,
    headers: {
      'User-Agent': 'advanced-client-fetch-deno/hono/1.0.0',
      ...options.headers,
    },
  });
}

/**
 * Create Deno client with retry only
 */
export function createDenoClientWithRetry(
  retryOptions: RetryPluginOptions = {},
  clientOptions: Omit<DenoPresetOptions, 'retry'> = {}
): Client {
  return createDenoClient({
    ...clientOptions,
    retry: retryOptions,
    timeout: false,
    dedupe: false,
    metrics: false,
  });
}

/**
 * Create Deno client with timeout only
 */
export function createDenoClientWithTimeout(
  timeoutMs: number = 30000,
  clientOptions: Omit<DenoPresetOptions, 'timeout'> = {}
): Client {
  return createDenoClient({
    ...clientOptions,
    timeout: timeoutMs,
    retry: false,
    dedupe: false,
    metrics: false,
  });
}

/**
 * Create Deno client with deduplication only
 */
export function createDenoClientWithDedupe(
  dedupeOptions: DedupePluginOptions = {},
  clientOptions: Omit<DenoPresetOptions, 'dedupe'> = {}
): Client {
  return createDenoClient({
    ...clientOptions,
    dedupe: dedupeOptions,
    retry: false,
    timeout: false,
    metrics: false,
  });
}

/**
 * Create Deno client with metrics only
 */
export function createDenoClientWithMetrics(
  metricsOptions: MetricsPluginOptions = {},
  clientOptions: Omit<DenoPresetOptions, 'metrics'> = {}
): Client {
  return createDenoClient({
    ...clientOptions,
    metrics: metricsOptions,
    retry: false,
    timeout: false,
    dedupe: false,
  });
}

/**
 * Create development Deno client
 */
export function createDevelopmentDenoClient(
  options: Omit<DenoPresetOptions, 'retry' | 'timeout' | 'dedupe' | 'metrics'> = {}
): Client {
  return createDenoClient({
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
 * Create production Deno client
 */
export function createProductionDenoClient(
  options: Omit<DenoPresetOptions, 'retry' | 'timeout' | 'dedupe' | 'metrics'> = {}
): Client {
  return createDenoClient({
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
 * Create test Deno client
 */
export function createTestDenoClient(
  options: Omit<DenoPresetOptions, 'retry' | 'timeout' | 'dedupe' | 'metrics'> = {}
): Client {
  return createDenoClient({
    ...options,
    retry: false,
    timeout: 5000,
    dedupe: false,
    metrics: false,
  });
}

/**
 * Create serverless Deno client
 */
export function createServerlessDenoClient(
  options: DenoPresetOptions = {}
): Client {
  return createDenoClient({
    ...options,
    retry: { retries: 1, minDelay: 100, maxDelay: 1000 },
    timeout: 5000,
    dedupe: true,
    metrics: false,
  });
}

/**
 * Create microservice Deno client
 */
export function createMicroserviceDenoClient(
  options: DenoPresetOptions = {}
): Client {
  return createDenoClient({
    ...options,
    retry: { retries: 2, minDelay: 200, maxDelay: 2000 },
    timeout: 10000,
    dedupe: true,
    metrics: true,
  });
}

/**
 * Create API Gateway Deno client
 */
export function createAPIGatewayDenoClient(
  options: DenoPresetOptions = {}
): Client {
  return createDenoClient({
    ...options,
    retry: { retries: 2, minDelay: 100, maxDelay: 1000 },
    timeout: 10000,
    dedupe: true,
    metrics: true,
  });
}

/**
 * Create CDN Deno client
 */
export function createCDNDenoClient(
  options: DenoPresetOptions = {}
): Client {
  return createDenoClient({
    ...options,
    retry: { retries: 1, minDelay: 50, maxDelay: 200 },
    timeout: 5000,
    dedupe: true,
    metrics: false,
  });
}

/**
 * Create WebSocket Deno client
 */
export function createWebSocketDenoClient(
  options: DenoPresetOptions = {}
): Client {
  return createDenoClient({
    ...options,
    retry: { retries: 1, minDelay: 100, maxDelay: 500 },
    timeout: 10000,
    dedupe: false,
    metrics: false,
  });
}

/**
 * Create real-time Deno client
 */
export function createRealTimeDenoClient(
  options: DenoPresetOptions = {}
): Client {
  return createDenoClient({
    ...options,
    retry: { retries: 1, minDelay: 50, maxDelay: 200 },
    timeout: 5000,
    dedupe: false,
    metrics: false,
  });
}

/**
 * Create streaming Deno client
 */
export function createStreamingDenoClient(
  options: DenoPresetOptions = {}
): Client {
  return createDenoClient({
    ...options,
    retry: { retries: 2, minDelay: 100, maxDelay: 1000 },
    timeout: 60000,
    dedupe: false,
    metrics: true,
  });
}

/**
 * Create batch processing Deno client
 */
export function createBatchDenoClient(
  options: DenoPresetOptions = {}
): Client {
  return createDenoClient({
    ...options,
    retry: { retries: 3, minDelay: 500, maxDelay: 5000 },
    timeout: 30000,
    dedupe: true,
    metrics: true,
  });
}

/**
 * Default Deno client instance
 */
export const denoClient = createDenoClient();

/**
 * Export for convenience
 */