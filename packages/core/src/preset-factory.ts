/**
 * Preset Factory for Advanced Client Fetch
 * Provides common functionality for creating platform-specific clients
 */

import { createClient, type Client, type ClientOptions } from './client';
import type { Middleware } from './types';

/**
 * Preset configuration interface
 */
export interface PresetConfig {
  retry?: boolean | any;
  timeout?: boolean | number;
  cache?: boolean | any;
  rateLimit?: boolean | any;
  circuitBreaker?: boolean | any;
  dedupe?: boolean | any;
  metrics?: boolean | any;
  security?: boolean | any;
  cookies?: boolean | any;
}

/**
 * Platform-specific options
 */
export interface PlatformOptions extends ClientOptions {
  userAgent?: string;
  defaultHeaders?: Record<string, string>;
  middleware?: Middleware[];
}

/**
 * Create a preset client with common configuration
 */
export function createPresetClient<T extends PlatformOptions>(
  platform: string,
  options: T,
  defaultConfig: PresetConfig,
  middlewareFactory: (config: PresetConfig, options: T) => Middleware[]
): Client {
  const {
    userAgent = `advanced-client-fetch-${platform}/0.1.0`,
    defaultHeaders = {},
    middleware = [],
    ...clientOptions
  } = options;

  // Set default headers
  const headers = {
    'User-Agent': userAgent,
    ...defaultHeaders,
    ...(clientOptions as any).headers,
  };

  // Create middleware based on configuration
  const presetMiddleware = middlewareFactory(defaultConfig, options);
  const allMiddleware = [...presetMiddleware, ...middleware];

  return createClient({
    ...clientOptions,
    headers,
    middleware: allMiddleware,
  });
}

/**
 * Create a minimal preset client
 */
export function createMinimalPresetClient<T extends PlatformOptions>(
  platform: string,
  options: T,
  userAgent?: string
): Client {
  return createPresetClient(
    platform,
    options,
    {
      retry: false,
      timeout: false,
      cache: false,
      rateLimit: false,
      circuitBreaker: false,
      dedupe: false,
      metrics: false,
      security: false,
      cookies: false,
    },
    () => []
  );
}

/**
 * Create a full preset client with all features
 */
export function createFullPresetClient<T extends PlatformOptions>(
  platform: string,
  options: T,
  defaultConfig: PresetConfig,
  middlewareFactory: (config: PresetConfig, options: T) => Middleware[]
): Client {
  const fullConfig: PresetConfig = {
    retry: true,
    timeout: 30000,
    cache: true,
    rateLimit: false,
    circuitBreaker: false,
    dedupe: true,
    metrics: true,
    security: true,
    cookies: true,
    ...defaultConfig,
  };

  return createPresetClient(platform, options, fullConfig, middlewareFactory);
}

/**
 * Create a production preset client
 */
export function createProductionPresetClient<T extends PlatformOptions>(
  platform: string,
  options: T,
  defaultConfig: PresetConfig,
  middlewareFactory: (config: PresetConfig, options: T) => Middleware[]
): Client {
  const productionConfig: PresetConfig = {
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
    security: {
      maxRequestSize: 10 * 1024 * 1024, // 10MB
      maxResponseSize: 50 * 1024 * 1024, // 50MB
    },
    cookies: true,
    ...defaultConfig,
  };

  return createPresetClient(platform, options, productionConfig, middlewareFactory);
}

/**
 * Create a development preset client
 */
export function createDevelopmentPresetClient<T extends PlatformOptions>(
  platform: string,
  options: T,
  defaultConfig: PresetConfig,
  middlewareFactory: (config: PresetConfig, options: T) => Middleware[]
): Client {
  const developmentConfig: PresetConfig = {
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
      onMetrics: (metrics: any) => {
        console.log(`[Advanced Client Fetch ${platform}] ${metrics.method} ${metrics.url} - ${metrics.status} (${metrics.duration?.toFixed(2)}ms)`);
      },
    },
    security: false,
    cookies: true,
    ...defaultConfig,
  };

  return createPresetClient(platform, options, developmentConfig, middlewareFactory);
}

/**
 * Create a test preset client
 */
export function createTestPresetClient<T extends PlatformOptions>(
  platform: string,
  options: T
): Client {
  return createMinimalPresetClient(platform, options);
}

/**
 * Preset client builder for fluent API
 */
export class PresetClientBuilder<T extends PlatformOptions> {
  private platform: string;
  private options: T;
  private config: PresetConfig = {};
  private middlewareFactory: (config: PresetConfig, options: T) => Middleware[] = () => [];

  constructor(platform: string, options: T) {
    this.platform = platform;
    this.options = options;
  }

  withRetry(config: any = true): this {
    this.config.retry = config;
    return this;
  }

  withTimeout(timeout: number | false = 30000): this {
    this.config.timeout = timeout;
    return this;
  }

  withCache(config: any = true): this {
    this.config.cache = config;
    return this;
  }

  withRateLimit(config: any = true): this {
    this.config.rateLimit = config;
    return this;
  }

  withCircuitBreaker(config: any = true): this {
    this.config.circuitBreaker = config;
    return this;
  }

  withDedupe(config: any = true): this {
    this.config.dedupe = config;
    return this;
  }

  withMetrics(config: any = true): this {
    this.config.metrics = config;
    return this;
  }

  withSecurity(config: any = true): this {
    this.config.security = config;
    return this;
  }

  withCookies(config: any = true): this {
    this.config.cookies = config;
    return this;
  }

  withMiddleware(factory: (config: PresetConfig, options: T) => Middleware[]): this {
    this.middlewareFactory = factory;
    return this;
  }

  build(): Client {
    return createPresetClient(this.platform, this.options, this.config, this.middlewareFactory);
  }
}

/**
 * Create a preset client builder
 */
export function createPresetClientBuilder<T extends PlatformOptions>(
  platform: string,
  options: T
): PresetClientBuilder<T> {
  return new PresetClientBuilder(platform, options);
}
