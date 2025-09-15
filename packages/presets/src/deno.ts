/**
 * Deno preset for HyperHTTP
 * Optimized for Deno runtime
 */

import { createClient, Client, ClientOptions } from 'hyperhttp-core';
import { retry, timeout, dedupe, metrics } from 'hyperhttp-plugins';

export interface DenoPresetOptions extends ClientOptions {
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
 * Create HyperHTTP client optimized for Deno
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

  const denoMiddleware: any[] = [];

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
    middleware: denoMiddleware,
    headers: {
      'User-Agent': 'hyperhttp-deno/0.1.0',
      ...clientOptions.headers,
    },
  });
}

/**
 * Create Deno client for CLI applications
 */
export function createDenoCLIClient(
  options: Omit<DenoPresetOptions, 'retry' | 'timeout' | 'dedupe' | 'metrics'> = {}
): Client {
  return createDenoClient({
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
 * Create Deno client for server applications
 */
export function createDenoServerClient(
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
      includeTiming: true,
    },
  });
}

/**
 * Create Deno client for Deploy
 */
export function createDenoDeployClient(
  options: Omit<DenoPresetOptions, 'retry' | 'timeout' | 'dedupe' | 'metrics'> = {}
): Client {
  return createDenoClient({
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
 * Default Deno client instance
 */
export const denoClient = createDenoClient();

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
 * Create API server optimized client
 */
export function createAPIServerClient(options: DenoPresetOptions = {}): Client {
  return createDenoClient({
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
export function createDatabaseClient(options: DenoPresetOptions = {}): Client {
  return createDenoClient({
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
export function createMicroserviceClient(options: DenoPresetOptions = {}): Client {
  return createDenoClient({
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
export function createBatchClient(options: DenoPresetOptions = {}): Client {
  return createDenoClient({
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
export function createRealTimeClient(options: DenoPresetOptions = {}): Client {
  return createDenoClient({
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
export function createStreamingClient(options: DenoPresetOptions = {}): Client {
  return createDenoClient({
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
export function createWebSocketClient(options: DenoPresetOptions = {}): Client {
  return createDenoClient({
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
export function createServerlessClient(options: DenoPresetOptions = {}): Client {
  return createDenoClient({
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
export default denoClient;