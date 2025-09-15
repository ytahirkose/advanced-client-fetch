/**
 * Node.js preset for HyperHTTP
 * Optimized for Node.js runtime with full feature set
 */

import { createClient, Client, ClientOptions } from 'hyperhttp-core';
import { 
  retry, 
  timeout, 
  cache, 
  rateLimit, 
  circuitBreaker, 
  dedupe, 
  metrics 
} from 'hyperhttp-plugins';

export interface NodePresetOptions extends ClientOptions {
  /** Enable retry middleware */
  retry?: boolean | any;
  /** Enable timeout middleware */
  timeout?: boolean | number;
  /** Enable cache middleware */
  cache?: boolean | any;
  /** Enable rate limiting middleware */
  rateLimit?: boolean | any;
  /** Enable circuit breaker middleware */
  circuitBreaker?: boolean | any;
  /** Enable deduplication middleware */
  dedupe?: boolean | any;
  /** Enable metrics middleware */
  metrics?: boolean | any;
  /** Custom middleware */
  middleware?: any[];
}

/**
 * Create HyperHTTP client optimized for Node.js
 */
export function createNodeClient(options: NodePresetOptions = {}): Client {
  const {
    retry: retryOptions = true,
    timeout: timeoutOptions = 30000,
    cache: cacheOptions = true,
    rateLimit: rateLimitOptions = false,
    circuitBreaker: circuitBreakerOptions = false,
    dedupe: dedupeOptions = true,
    metrics: metricsOptions = false,
    middleware = [],
    ...clientOptions
  } = options;

  // Set default headers
  const defaultHeaders = {
    'User-Agent': 'hyperhttp-node/0.1.0',
    ...clientOptions.headers,
  };

  const nodeMiddleware: any[] = [];

  // Add retry middleware
  if (retryOptions) {
    const retryConfig = typeof retryOptions === 'boolean' 
      ? { retries: 3, minDelay: 100, maxDelay: 2000, jitter: true }
      : retryOptions;
    nodeMiddleware.push(retry(retryConfig));
  }

  // Add timeout middleware
  if (timeoutOptions) {
    const timeoutConfig = typeof timeoutOptions === 'number'
      ? { timeout: timeoutOptions }
      : timeoutOptions;
    nodeMiddleware.push(timeout(timeoutConfig));
  }

  // Add cache middleware
  if (cacheOptions) {
    const cacheConfig = typeof cacheOptions === 'boolean'
      ? { ttl: 300000, cacheOnlyGET: true }
      : cacheOptions;
    nodeMiddleware.push(cache(cacheConfig));
  }

  // Add rate limiting middleware
  if (rateLimitOptions) {
    const rateLimitConfig = typeof rateLimitOptions === 'boolean'
      ? { limit: 100, window: 60000 }
      : rateLimitOptions;
    nodeMiddleware.push(rateLimit(rateLimitConfig));
  }

  // Add circuit breaker middleware
  if (circuitBreakerOptions) {
    const circuitBreakerConfig = typeof circuitBreakerOptions === 'boolean'
      ? { failureThreshold: 5, window: 60000, resetTimeout: 30000 }
      : circuitBreakerOptions;
    nodeMiddleware.push(circuitBreaker(circuitBreakerConfig));
  }

  // Add deduplication middleware
  if (dedupeOptions) {
    const dedupeConfig = typeof dedupeOptions === 'boolean'
      ? { maxAge: 30000 }
      : dedupeOptions;
    nodeMiddleware.push(dedupe(dedupeConfig));
  }

  // Add metrics middleware
  if (metricsOptions) {
    const metricsConfig = typeof metricsOptions === 'boolean'
      ? { enabled: true }
      : metricsOptions;
    nodeMiddleware.push(metrics(metricsConfig));
  }

  // Add custom middleware
  nodeMiddleware.push(...middleware);

  return createClient({
    ...clientOptions,
    headers: defaultHeaders,
    middleware: nodeMiddleware,
  });
}

/**
 * Create minimal Node.js client with basic features
 */
export function createMinimalNodeClient(baseURL?: string, options: NodePresetOptions = {}): Client {
  return createNodeClient({
    ...options,
    baseURL,
    retry: false,
    timeout: false,
    cache: false,
    rateLimit: false,
    circuitBreaker: false,
    dedupe: false,
    metrics: false,
  });
}

/**
 * Create API server optimized client
 */
export function createAPIServerClient(options: NodePresetOptions = {}): Client {
  return createNodeClient({
    ...options,
    retry: true,
    timeout: 5000,
    cache: true,
    rateLimit: { limit: 1000, window: 60000 },
    circuitBreaker: true,
    dedupe: true,
    metrics: true,
  });
}

/**
 * Create database optimized client
 */
export function createDatabaseClient(options: NodePresetOptions = {}): Client {
  return createNodeClient({
    ...options,
    retry: { retries: 3, backoff: 'exponential' },
    timeout: 30000,
    cache: false,
    rateLimit: false,
    circuitBreaker: { failureThreshold: 3 },
    dedupe: false,
    metrics: true,
  });
}

/**
 * Create microservice optimized client
 */
export function createMicroserviceClient(options: NodePresetOptions = {}): Client {
  return createNodeClient({
    ...options,
    retry: true,
    timeout: 10000,
    cache: true,
    rateLimit: true,
    circuitBreaker: true,
    dedupe: true,
    metrics: true,
  });
}

/**
 * Create batch processing optimized client
 */
export function createBatchClient(options: NodePresetOptions = {}): Client {
  return createNodeClient({
    ...options,
    retry: { retries: 5, backoff: 'linear' },
    timeout: 60000,
    cache: false,
    rateLimit: { limit: 10, window: 1000 },
    circuitBreaker: false,
    dedupe: false,
    metrics: true,
  });
}

/**
 * Create real-time optimized client
 */
export function createRealTimeClient(options: NodePresetOptions = {}): Client {
  return createNodeClient({
    ...options,
    retry: false,
    timeout: 1000,
    cache: false,
    rateLimit: false,
    circuitBreaker: false,
    dedupe: false,
    metrics: true,
  });
}

/**
 * Create streaming optimized client
 */
export function createStreamingClient(options: NodePresetOptions = {}): Client {
  return createNodeClient({
    ...options,
    retry: true,
    timeout: 60000, // 60 seconds for streaming
    cache: false,
    rateLimit: false,
    circuitBreaker: false,
    dedupe: false,
    metrics: true,
  });
}

/**
 * Create WebSocket optimized client
 */
export function createWebSocketClient(options: NodePresetOptions = {}): Client {
  return createNodeClient({
    ...options,
    retry: true,
    timeout: 5000,
    cache: false,
    rateLimit: false,
    circuitBreaker: true,
    dedupe: false,
    metrics: true,
  });
}

/**
 * Create serverless optimized client
 */
export function createServerlessClient(options: NodePresetOptions = {}): Client {
  return createNodeClient({
    ...options,
    retry: { retries: 2, backoff: 'fixed' },
    timeout: 15000,
    cache: true,
    rateLimit: false,
    circuitBreaker: false,
    dedupe: true,
    metrics: false,
  });
}

/**
 * Create Node.js client with all features enabled
 */
export function createFullNodeClient(
  options: Omit<NodePresetOptions, 'retry' | 'timeout' | 'cache' | 'rateLimit' | 'circuitBreaker' | 'dedupe' | 'metrics'> = {}
): Client {
  return createNodeClient({
    ...options,
    retry: true,
    timeout: 30000,
    cache: true,
    rateLimit: { limit: 100, window: 60000 },
    circuitBreaker: { failureThreshold: 5, window: 60000, resetTimeout: 30000 },
    dedupe: true,
    metrics: true,
  });
}

/**
 * Create Node.js client with production settings
 */
export function createProductionNodeClient(
  options: Omit<NodePresetOptions, 'retry' | 'timeout' | 'cache' | 'rateLimit' | 'circuitBreaker' | 'dedupe' | 'metrics'> = {}
): Client {
  return createNodeClient({
    ...options,
    retry: {
      retries: 5,
      minDelay: 100,
      maxDelay: 5000,
      jitter: true,
      respectRetryAfter: true,
    },
    timeout: 60000,
    cache: {
      ttl: 600000, // 10 minutes
      cacheOnlyGET: true,
      staleWhileRevalidate: true,
    },
    rateLimit: {
      limit: 50,
      window: 60000,
    },
    circuitBreaker: {
      failureThreshold: 10,
      window: 300000, // 5 minutes
      resetTimeout: 60000, // 1 minute
    },
    dedupe: {
      maxAge: 60000, // 1 minute
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
 * Create Node.js client with development settings
 */
export function createDevelopmentNodeClient(
  options: Omit<NodePresetOptions, 'retry' | 'timeout' | 'cache' | 'rateLimit' | 'circuitBreaker' | 'dedupe' | 'metrics'> = {}
): Client {
  return createNodeClient({
    ...options,
    retry: {
      retries: 2,
      minDelay: 50,
      maxDelay: 1000,
      jitter: true,
    },
    timeout: 10000,
    cache: false,
    rateLimit: false,
    circuitBreaker: false,
    dedupe: true,
    metrics: {
      enabled: true,
      onMetrics: (metrics) => {
        console.log(`[HyperHTTP] ${metrics.method} ${metrics.url} - ${metrics.status} (${metrics.duration.toFixed(2)}ms)`);
      },
    },
  });
}

/**
 * Create Node.js client with testing settings
 */
export function createTestNodeClient(
  options: Omit<NodePresetOptions, 'retry' | 'timeout' | 'cache' | 'rateLimit' | 'circuitBreaker' | 'dedupe' | 'metrics'> = {}
): Client {
  return createNodeClient({
    ...options,
    retry: false,
    timeout: 5000,
    cache: false,
    rateLimit: false,
    circuitBreaker: false,
    dedupe: false,
    metrics: false,
  });
}

/**
 * Create Node.js client with specific features
 */
export function createNodeClientWithFeatures(
  features: {
    retry?: boolean | any;
    timeout?: boolean | number;
    cache?: boolean | any;
    rateLimit?: boolean | any;
    circuitBreaker?: boolean | any;
    dedupe?: boolean | any;
    metrics?: boolean | any;
  },
  clientOptions: Omit<NodePresetOptions, 'retry' | 'timeout' | 'cache' | 'rateLimit' | 'circuitBreaker' | 'dedupe' | 'metrics'> = {}
): Client {
  return createNodeClient({
    ...clientOptions,
    ...features,
  });
}

/**
 * Create Node.js client for microservices
 */
export function createMicroserviceNodeClient(
  serviceName: string,
  options: Omit<NodePresetOptions, 'retry' | 'timeout' | 'cache' | 'rateLimit' | 'circuitBreaker' | 'dedupe' | 'metrics'> = {}
): Client {
  return createNodeClient({
    ...options,
    headers: {
      'User-Agent': `hyperhttp-node/${serviceName}/0.1.0`,
      'X-Service-Name': serviceName,
      ...options.headers,
    },
    retry: {
      retries: 3,
      minDelay: 100,
      maxDelay: 2000,
      jitter: true,
    },
    timeout: 30000,
    cache: {
      ttl: 300000, // 5 minutes
      cacheOnlyGET: true,
    },
    rateLimit: {
      limit: 100,
      window: 60000,
    },
    circuitBreaker: {
      failureThreshold: 5,
      window: 60000,
      resetTimeout: 30000,
    },
    dedupe: true,
    metrics: {
      enabled: true,
      keyGenerator: (req) => `${serviceName}:${req.method}:${new URL(req.url).pathname}`,
    },
  });
}

/**
 * Create Node.js client for API gateway
 */
export function createAPIGatewayNodeClient(
  options: Omit<NodePresetOptions, 'retry' | 'timeout' | 'cache' | 'rateLimit' | 'circuitBreaker' | 'dedupe' | 'metrics'> = {}
): Client {
  return createNodeClient({
    ...options,
    headers: {
      'User-Agent': 'hyperhttp-node/api-gateway/0.1.0',
      ...options.headers,
    },
    retry: {
      retries: 2,
      minDelay: 50,
      maxDelay: 1000,
      jitter: true,
    },
    timeout: 10000,
    cache: {
      ttl: 60000, // 1 minute
      cacheOnlyGET: true,
    },
    rateLimit: {
      limit: 1000,
      window: 60000,
    },
    circuitBreaker: {
      failureThreshold: 20,
      window: 300000, // 5 minutes
      resetTimeout: 60000, // 1 minute
    },
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
 * Default Node.js client instance
 */
export const nodeClient = createNodeClient();

/**
 * Export for convenience
 */
export default nodeClient;