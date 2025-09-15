/**
 * Browser preset for HyperHTTP
 * Optimized for browser runtime with limited features
 */

import { createClient, Client, ClientOptions } from 'hyperhttp-core';
import { retry, timeout, dedupe, metrics } from 'hyperhttp-plugins';

export interface BrowserPresetOptions extends ClientOptions {
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
 * Create HyperHTTP client optimized for browser
 */
export function createBrowserClient(options: BrowserPresetOptions = {}): Client {
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
    'User-Agent': 'hyperhttp-browser/0.1.0',
    ...clientOptions.headers,
  };

  const browserMiddleware: any[] = [];

  // Add retry middleware
  if (retryOptions) {
    const retryConfig = typeof retryOptions === 'boolean' 
      ? { retries: 2, minDelay: 100, maxDelay: 1000, jitter: true }
      : retryOptions;
    browserMiddleware.push(retry(retryConfig));
  }

  // Add timeout middleware
  if (timeoutOptions) {
    const timeoutConfig = typeof timeoutOptions === 'number'
      ? { timeout: timeoutOptions }
      : timeoutOptions;
    browserMiddleware.push(timeout(timeoutConfig));
  }

  // Add deduplication middleware
  if (dedupeOptions) {
    const dedupeConfig = typeof dedupeOptions === 'boolean'
      ? { maxAge: 30000 }
      : dedupeOptions;
    browserMiddleware.push(dedupe(dedupeConfig));
  }

  // Add metrics middleware
  if (metricsOptions) {
    const metricsConfig = typeof metricsOptions === 'boolean'
      ? { enabled: true }
      : metricsOptions;
    browserMiddleware.push(metrics(metricsConfig));
  }

  // Add custom middleware
  browserMiddleware.push(...middleware);

  return createClient({
    ...clientOptions,
    headers: defaultHeaders,
    middleware: browserMiddleware,
  });
}

/**
 * Create browser client with minimal features
 */
export function createMinimalBrowserClient(
  baseURL?: string,
  options: Omit<BrowserPresetOptions, 'retry' | 'timeout' | 'dedupe' | 'metrics' | 'middleware'> = {}
): Client {
  return createClient({
    ...options,
    baseURL,
    middleware: [],
  });
}

/**
 * Create browser client with retry only
 */
export function createBrowserClientWithRetry(
  retryOptions: any = {},
  clientOptions: Omit<BrowserPresetOptions, 'retry'> = {}
): Client {
  return createBrowserClient({
    ...clientOptions,
    retry: retryOptions,
    timeout: false,
    dedupe: false,
    metrics: false,
  });
}

/**
 * Create browser client with timeout only
 */
export function createBrowserClientWithTimeout(
  timeoutMs: number = 30000,
  clientOptions: Omit<BrowserPresetOptions, 'timeout'> = {}
): Client {
  return createBrowserClient({
    ...clientOptions,
    retry: false,
    timeout: timeoutMs,
    dedupe: false,
    metrics: false,
  });
}

/**
 * Create browser client with deduplication only
 */
export function createBrowserClientWithDedupe(
  dedupeOptions: any = {},
  clientOptions: Omit<BrowserPresetOptions, 'dedupe'> = {}
): Client {
  return createBrowserClient({
    ...clientOptions,
    retry: false,
    timeout: false,
    dedupe: dedupeOptions,
    metrics: false,
  });
}

/**
 * Create browser client with metrics only
 */
export function createBrowserClientWithMetrics(
  metricsOptions: any = {},
  clientOptions: Omit<BrowserPresetOptions, 'metrics'> = {}
): Client {
  return createBrowserClient({
    ...clientOptions,
    retry: false,
    timeout: false,
    dedupe: false,
    metrics: metricsOptions,
  });
}

/**
 * Create browser client for development
 */
export function createDevelopmentBrowserClient(
  options: Omit<BrowserPresetOptions, 'retry' | 'timeout' | 'dedupe' | 'metrics'> = {}
): Client {
  return createBrowserClient({
    ...options,
    retry: {
      retries: 1,
      minDelay: 50,
      maxDelay: 500,
      jitter: true,
    },
    timeout: 10000,
    dedupe: true,
    metrics: {
      enabled: true,
      onMetrics: (metrics) => {
        console.log(`[HyperHTTP Browser] ${metrics.method} ${metrics.url} - ${metrics.status} (${metrics.duration.toFixed(2)}ms)`);
      },
    },
  });
}

/**
 * Create browser client for production
 */
export function createProductionBrowserClient(
  options: Omit<BrowserPresetOptions, 'retry' | 'timeout' | 'dedupe' | 'metrics'> = {}
): Client {
  return createBrowserClient({
    ...options,
    retry: {
      retries: 3,
      minDelay: 100,
      maxDelay: 2000,
      jitter: true,
    },
    timeout: 30000,
    dedupe: {
      maxAge: 60000, // 1 minute
    },
    metrics: {
      enabled: true,
      includeTiming: true,
    },
  });
}

/**
 * Create browser client for testing
 */
export function createTestBrowserClient(
  options: Omit<BrowserPresetOptions, 'retry' | 'timeout' | 'dedupe' | 'metrics'> = {}
): Client {
  return createBrowserClient({
    ...options,
    retry: false,
    timeout: 5000,
    dedupe: false,
    metrics: false,
  });
}

/**
 * Create browser client for mobile apps
 */
export function createMobileBrowserClient(
  options: Omit<BrowserPresetOptions, 'retry' | 'timeout' | 'dedupe' | 'metrics'> = {}
): Client {
  return createBrowserClient({
    ...options,
    headers: {
      'User-Agent': 'hyperhttp-browser/mobile/0.1.0',
      ...options.headers,
    },
    retry: {
      retries: 2,
      minDelay: 200,
      maxDelay: 1000,
      jitter: true,
    },
    timeout: 20000,
    dedupe: {
      maxAge: 30000,
    },
    metrics: {
      enabled: true,
      includeTiming: true,
    },
  });
}

/**
 * Create browser client for desktop apps
 */
export function createDesktopBrowserClient(
  options: Omit<BrowserPresetOptions, 'retry' | 'timeout' | 'dedupe' | 'metrics'> = {}
): Client {
  return createBrowserClient({
    ...options,
    headers: {
      'User-Agent': 'hyperhttp-browser/desktop/0.1.0',
      ...options.headers,
    },
    retry: {
      retries: 3,
      minDelay: 100,
      maxDelay: 2000,
      jitter: true,
    },
    timeout: 30000,
    dedupe: {
      maxAge: 60000,
    },
    metrics: {
      enabled: true,
      includeTiming: true,
      includeRequestBodySize: true,
      includeResponseBodySize: true,
    },
  });
}

/**
 * Create browser client for web workers
 */
export function createWebWorkerClient(
  options: Omit<BrowserPresetOptions, 'retry' | 'timeout' | 'dedupe' | 'metrics'> = {}
): Client {
  return createBrowserClient({
    ...options,
    headers: {
      'User-Agent': 'hyperhttp-browser/worker/0.1.0',
      ...options.headers,
    },
    retry: {
      retries: 2,
      minDelay: 100,
      maxDelay: 1000,
      jitter: true,
    },
    timeout: 15000,
    dedupe: {
      maxAge: 30000,
    },
    metrics: false, // Disable metrics in workers to reduce overhead
  });
}

/**
 * Create browser client for service workers
 */
export function createServiceWorkerClient(
  options: Omit<BrowserPresetOptions, 'retry' | 'timeout' | 'dedupe' | 'metrics'> = {}
): Client {
  return createBrowserClient({
    ...options,
    headers: {
      'User-Agent': 'hyperhttp-browser/service-worker/0.1.0',
      ...options.headers,
    },
    retry: {
      retries: 1,
      minDelay: 100,
      maxDelay: 500,
      jitter: true,
    },
    timeout: 10000,
    dedupe: {
      maxAge: 60000,
    },
    metrics: false, // Disable metrics in service workers
  });
}

/**
 * Default browser client instance
 */
export const browserClient = createBrowserClient();

/**
 * Create full browser client with all features
 */
export function createFullBrowserClient(options: BrowserPresetOptions = {}): Client {
  return createBrowserClient({
    ...options,
    retry: true,
    timeout: 30000,
    dedupe: true,
    metrics: true,
  });
}

/**
 * Create SPA optimized client
 */
export function createSPAClient(options: BrowserPresetOptions = {}): Client {
  return createBrowserClient({
    ...options,
    retry: { retries: 1, minDelay: 100, maxDelay: 500 },
    timeout: 10000,
    dedupe: true,
    metrics: false,
  });
}

/**
 * Create PWA optimized client
 */
export function createPWAClient(options: BrowserPresetOptions = {}): Client {
  return createBrowserClient({
    ...options,
    retry: { retries: 3, minDelay: 200, maxDelay: 2000 },
    timeout: 15000,
    dedupe: true,
    metrics: true,
  });
}

/**
 * Create real-time optimized client
 */
export function createRealTimeClient(options: BrowserPresetOptions = {}): Client {
  return createBrowserClient({
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
export function createStreamingClient(options: BrowserPresetOptions = {}): Client {
  return createBrowserClient({
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
export function createWebSocketClient(options: BrowserPresetOptions = {}): Client {
  return createBrowserClient({
    ...options,
    retry: { retries: 1, minDelay: 100, maxDelay: 500 },
    timeout: 10000,
    dedupe: false,
    metrics: false,
  });
}

/**
 * Create batch processing optimized client
 */
export function createBatchClient(options: BrowserPresetOptions = {}): Client {
  return createBrowserClient({
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
export function createMicroserviceClient(options: BrowserPresetOptions = {}): Client {
  return createBrowserClient({
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
export function createServerlessClient(options: BrowserPresetOptions = {}): Client {
  return createBrowserClient({
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
export default browserClient;