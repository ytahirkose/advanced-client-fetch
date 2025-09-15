/**
 * Browser preset for Advanced Client Fetch
 * Optimized for browser environments
 */

import { createClient, type Client, type ClientOptions } from '@advanced-client-fetch/core';
import { retry, timeout, dedupe, metrics } from '@advanced-client-fetch/plugins';
import type { 
  Middleware, 
  RetryPluginOptions, 
  DedupePluginOptions, 
  MetricsPluginOptions 
} from '@advanced-client-fetch/core';

export interface BrowserPresetOptions extends ClientOptions {
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
 * Create Advanced Client Fetch client optimized for browser
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
    'User-Agent': 'advanced-client-fetch-browser/1.0.0',
    ...clientOptions.headers,
  };

  const browserMiddleware: Middleware[] = [];

  // Add retry middleware
  if (retryOptions) {
    const retryConfig = typeof retryOptions === 'boolean' 
      ? { retries: 3, minDelay: 100, maxDelay: 2000, jitter: true }
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
    plugins: browserMiddleware,
    withCredentials: clientOptions.withCredentials || false,
  });
}

/**
 * Create minimal browser client
 */
export function createMinimalBrowserClient(baseURL?: string, options: BrowserPresetOptions = {}): Client {
  return createBrowserClient({
    ...options,
    baseURL,
    retry: false,
    timeout: false,
    dedupe: false,
    metrics: false,
  });
}

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
    retry: { retries: 2, minDelay: 100, maxDelay: 1000 },
    timeout: 10000,
    dedupe: true,
    metrics: true,
  });
}

/**
 * Create PWA optimized client
 */
export function createPWAClient(options: BrowserPresetOptions = {}): Client {
  return createBrowserClient({
    ...options,
    retry: { retries: 3, minDelay: 100, maxDelay: 2000 },
    timeout: 15000,
    dedupe: true,
    metrics: true,
  });
}

/**
 * Create browser client with retry only
 */
export function createBrowserClientWithRetry(
  retryOptions: RetryPluginOptions = {},
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
    timeout: timeoutMs,
    retry: false,
    dedupe: false,
    metrics: false,
  });
}

/**
 * Create browser client with deduplication only
 */
export function createBrowserClientWithDedupe(
  dedupeOptions: DedupePluginOptions = {},
  clientOptions: Omit<BrowserPresetOptions, 'dedupe'> = {}
): Client {
  return createBrowserClient({
    ...clientOptions,
    dedupe: dedupeOptions,
    retry: false,
    timeout: false,
    metrics: false,
  });
}

/**
 * Create browser client with metrics only
 */
export function createBrowserClientWithMetrics(
  metricsOptions: MetricsPluginOptions = {},
  clientOptions: Omit<BrowserPresetOptions, 'metrics'> = {}
): Client {
  return createBrowserClient({
    ...clientOptions,
    metrics: metricsOptions,
    retry: false,
    timeout: false,
    dedupe: false,
  });
}

/**
 * Create development browser client
 */
export function createDevelopmentBrowserClient(
  options: Omit<BrowserPresetOptions, 'retry' | 'timeout' | 'dedupe' | 'metrics'> = {}
): Client {
  return createBrowserClient({
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
 * Create production browser client
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
    dedupe: true,
    metrics: {
      enabled: true,
    },
  });
}

/**
 * Create test browser client
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
 * Create mobile browser client
 */
export function createMobileBrowserClient(
  options: BrowserPresetOptions = {}
): Client {
  return createBrowserClient({
    ...options,
    headers: {
      'User-Agent': 'advanced-client-fetch-browser/mobile/1.0.0',
      ...options.headers,
    },
    retry: { retries: 2, minDelay: 200, maxDelay: 2000 },
    timeout: 20000,
    dedupe: true,
    metrics: true,
  });
}

/**
 * Create desktop browser client
 */
export function createDesktopBrowserClient(
  options: BrowserPresetOptions = {}
): Client {
  return createBrowserClient({
    ...options,
    headers: {
      'User-Agent': 'advanced-client-fetch-browser/desktop/1.0.0',
      ...options.headers,
    },
    retry: { retries: 3, minDelay: 100, maxDelay: 2000 },
    timeout: 30000,
    dedupe: true,
    metrics: true,
  });
}

/**
 * Create web worker client
 */
export function createWebWorkerClient(
  options: BrowserPresetOptions = {}
): Client {
  return createBrowserClient({
    ...options,
    headers: {
      'User-Agent': 'advanced-client-fetch-browser/worker/1.0.0',
      ...options.headers,
    },
    retry: { retries: 2, minDelay: 100, maxDelay: 1000 },
    timeout: 15000,
    dedupe: true,
    metrics: false,
  });
}

/**
 * Create service worker client
 */
export function createServiceWorkerClient(
  options: BrowserPresetOptions = {}
): Client {
  return createBrowserClient({
    ...options,
    headers: {
      'User-Agent': 'advanced-client-fetch-browser/service-worker/1.0.0',
      ...options.headers,
    },
    retry: { retries: 1, minDelay: 100, maxDelay: 500 },
    timeout: 10000,
    dedupe: true,
    metrics: false,
  });
}

/**
 * Default browser client instance
 */
export const browserClient = createBrowserClient();

/**
 * Export for convenience
 */