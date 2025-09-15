/**
 * Bun preset for HyperHTTP
 * Optimized for Bun runtime
 */

import { createClient, Client, ClientOptions } from 'hyperhttp-core';
import { retry, timeout, dedupe, metrics } from 'hyperhttp-plugins';

export interface BunPresetOptions extends ClientOptions {
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
 * Create HyperHTTP client optimized for Bun
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

  const bunMiddleware: any[] = [];

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
    middleware: bunMiddleware,
    headers: {
      'User-Agent': 'hyperhttp-bun/0.1.0',
      ...clientOptions.headers,
    },
  });
}

/**
 * Create Bun client for CLI applications
 */
export function createBunCLIClient(
  options: Omit<BunPresetOptions, 'retry' | 'timeout' | 'dedupe' | 'metrics'> = {}
): Client {
  return createBunClient({
    ...options,
    retry: {
      retries: 2,
      minDelay: 100,
      maxDelay: 1000,
      jitter: true,
    },
    timeout: 15000,
    dedupe: true,
    metrics: false,
  });
}

/**
 * Create Bun client for server applications
 */
export function createBunServerClient(
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
      includeTiming: true,
      includeRequestBodySize: true,
      includeResponseBodySize: true,
    },
  });
}

/**
 * Create Bun client for edge runtime
 */
export function createBunEdgeClient(
  options: Omit<BunPresetOptions, 'retry' | 'timeout' | 'dedupe' | 'metrics'> = {}
): Client {
  return createBunClient({
    ...options,
    retry: {
      retries: 2,
      minDelay: 100,
      maxDelay: 1000,
      jitter: true,
    },
    timeout: 20000,
    dedupe: true,
    metrics: false,
  });
}

/**
 * Default Bun client instance
 */
export const bunClient = createBunClient();

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
 * Create API server optimized client
 */
export function createAPIServerClient(options: BunPresetOptions = {}): Client {
  return createBunClient({
    ...options,
    retry: { retries: 2, minDelay: 100, maxDelay: 1000 },
    timeout: 10000,
    dedupe: true,
    metrics: true,
  });
}

/**
 * Create database optimized client
 */
export function createDatabaseClient(options: BunPresetOptions = {}): Client {
  return createBunClient({
    ...options,
    retry: { retries: 3, minDelay: 200, maxDelay: 2000 },
    timeout: 15000,
    dedupe: true,
    metrics: true,
  });
}

/**
 * Create microservice optimized client
 */
export function createMicroserviceClient(options: BunPresetOptions = {}): Client {
  return createBunClient({
    ...options,
    retry: { retries: 2, minDelay: 200, maxDelay: 2000 },
    timeout: 10000,
    dedupe: true,
    metrics: true,
  });
}

/**
 * Create batch processing optimized client
 */
export function createBatchClient(options: BunPresetOptions = {}): Client {
  return createBunClient({
    ...options,
    retry: { retries: 3, minDelay: 500, maxDelay: 5000 },
    timeout: 30000,
    dedupe: true,
    metrics: true,
  });
}

/**
 * Create real-time optimized client
 */
export function createRealTimeClient(options: BunPresetOptions = {}): Client {
  return createBunClient({
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
export function createStreamingClient(options: BunPresetOptions = {}): Client {
  return createBunClient({
    ...options,
    retry: { retries: 2, minDelay: 100, maxDelay: 1000 },
    timeout: 60000,
    dedupe: false,
    metrics: true,
  });
}

/**
 * Create WebSocket optimized client
 */
export function createWebSocketClient(options: BunPresetOptions = {}): Client {
  return createBunClient({
    ...options,
    retry: { retries: 1, minDelay: 100, maxDelay: 500 },
    timeout: 10000,
    dedupe: false,
    metrics: false,
  });
}

/**
 * Create serverless optimized client
 */
export function createServerlessClient(options: BunPresetOptions = {}): Client {
  return createBunClient({
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
export default bunClient;