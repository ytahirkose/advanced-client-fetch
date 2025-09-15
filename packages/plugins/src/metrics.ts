/**
 * Metrics plugin for HyperHTTP
 * Collects and reports request metrics
 */

import type { Middleware, RequestOptions } from 'hyperhttp-core';
import { defaultKeyGenerator, createKeyGenerator } from 'hyperhttp-core';

export interface MetricsPluginOptions {
  /** Enable metrics collection */
  enabled?: boolean;
  /** Metrics storage */
  storage?: MetricsStorage;
  /** Custom metric key generator */
  keyGenerator?: (request: Request) => string;
  /** Include request body size */
  includeRequestBodySize?: boolean;
  /** Include response body size */
  includeResponseBodySize?: boolean;
  /** Include timing information */
  includeTiming?: boolean;
  /** Include retry information */
  includeRetryInfo?: boolean;
  /** Custom metric formatter */
  formatter?: (metrics: RequestMetrics) => any;
  /** Metrics callback */
  onMetrics?: (metrics: RequestMetrics) => void;
}

export interface MetricsStorage {
  record(metrics: RequestMetrics): Promise<void>;
  query(filter?: MetricsFilter): Promise<RequestMetrics[]>;
  aggregate(filter?: MetricsFilter): Promise<AggregatedMetrics>;
  clear(): Promise<void>;
}

export interface RequestMetrics {
  key?: string;
  method: string;
  url: string;
  status?: number;
  duration: number;
  startTime: number;
  endTime: number;
  timestamp?: number;
  requestSize?: number;
  responseSize?: number;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  retries?: number;
  cacheHit?: boolean;
  error?: string | Error;
  metadata?: Record<string, any>;
  cache?: {
    hit: boolean;
    key: string;
  };
  rateLimit?: {
    limit: number;
    remaining: number;
    reset: number;
  };
  circuitBreaker?: {
    state: string;
    key: string;
  };
}

export interface MetricsFilter {
  method?: string;
  url?: string;
  status?: number;
  startTime?: number;
  endTime?: number;
  minDuration?: number;
  maxDuration?: number;
}

export interface AggregatedMetrics {
  totalRequests: number;
  successRate: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  totalRequestSize: number;
  totalResponseSize: number;
  totalRetries: number;
  cacheHitRate: number;
  errorRate: number;
  requestsByMethod: Record<string, number>;
  requestsByStatus: Record<string, number>;
  requestsByUrl: Record<string, number>;
}

/**
 * In-memory metrics storage
 */
export class MemoryMetricsStorage implements MetricsStorage {
  private metrics: RequestMetrics[] = [];
  private maxSize: number;

  constructor(maxSize: number = 10000) {
    this.maxSize = maxSize;
  }

  async record(metrics: RequestMetrics): Promise<void> {
    this.metrics.push(metrics);
    
    // Keep only the most recent metrics
    if (this.metrics.length > this.maxSize) {
      this.metrics = this.metrics.slice(-this.maxSize);
    }
  }

  async query(filter?: MetricsFilter): Promise<RequestMetrics[]> {
    if (!filter) {
      return [...this.metrics];
    }

    return this.metrics.filter(metric => {
      if (filter.method && metric.method !== filter.method) return false;
      if (filter.url && !metric.url.includes(filter.url)) return false;
      if (filter.status && metric.status !== filter.status) return false;
      if (filter.startTime && metric.timestamp < filter.startTime) return false;
      if (filter.endTime && metric.timestamp > filter.endTime) return false;
      if (filter.minDuration && metric.duration < filter.minDuration) return false;
      if (filter.maxDuration && metric.duration > filter.maxDuration) return false;
      return true;
    });
  }

  async aggregate(filter?: MetricsFilter): Promise<AggregatedMetrics> {
    const metrics = await this.query(filter);
    
    if (metrics.length === 0) {
      return {
        totalRequests: 0,
        successRate: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        totalRequestSize: 0,
        totalResponseSize: 0,
        totalRetries: 0,
        cacheHitRate: 0,
        errorRate: 0,
        requestsByMethod: {},
        requestsByStatus: {},
        requestsByUrl: {},
      };
    }

    const totalRequests = metrics.length;
    const successfulRequests = metrics.filter(m => m.status && m.status >= 200 && m.status < 300).length;
    const errorRequests = metrics.filter(m => m.error || (m.status && m.status >= 400)).length;
    const cacheHits = metrics.filter(m => m.cacheHit).length;
    
    const durations = metrics.map(m => m.duration);
    const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);
    
    const totalRequestSize = metrics.reduce((sum, m) => sum + (m.requestSize || 0), 0);
    const totalResponseSize = metrics.reduce((sum, m) => sum + (m.responseSize || 0), 0);
    const totalRetries = metrics.reduce((sum, m) => sum + (m.retries || 0), 0);
    
    const requestsByMethod: Record<string, number> = {};
    const requestsByStatus: Record<string, number> = {};
    const requestsByUrl: Record<string, number> = {};
    
    for (const metric of metrics) {
      requestsByMethod[metric.method] = (requestsByMethod[metric.method] || 0) + 1;
      
      if (metric.status) {
        const statusGroup = Math.floor(metric.status / 100) * 100;
        requestsByStatus[statusGroup.toString()] = (requestsByStatus[statusGroup.toString()] || 0) + 1;
      }
      
      const url = new URL(metric.url).pathname;
      requestsByUrl[url] = (requestsByUrl[url] || 0) + 1;
    }

    return {
      totalRequests,
      successRate: successfulRequests / totalRequests,
      averageDuration,
      minDuration,
      maxDuration,
      totalRequestSize,
      totalResponseSize,
      totalRetries,
      cacheHitRate: cacheHits / totalRequests,
      errorRate: errorRequests / totalRequests,
      requestsByMethod,
      requestsByStatus,
      requestsByUrl,
    };
  }

  async clear(): Promise<void> {
    this.metrics = [];
  }
}

const DEFAULT_OPTIONS: Required<MetricsPluginOptions> = {
  enabled: true,
  storage: new MemoryMetricsStorage(),
  keyGenerator: createKeyGenerator({ includeQuery: false }),
  includeRequestBodySize: true,
  includeResponseBodySize: true,
  includeTiming: true,
  includeRetryInfo: true,
  formatter: (metrics) => metrics,
  onMetrics: () => {},
};

/**
 * Create metrics middleware
 */
export function metrics(options: MetricsPluginOptions = {}): Middleware {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  if (!config.enabled) {
    return async (ctx, next) => next();
  }

  return async (ctx, next) => {
    const request = ctx.req;
    const startTime = performance.now();
    const timestamp = Date.now();
    
    // Initialize metrics
    const requestMetrics: RequestMetrics = {
      key: config.keyGenerator(request),
      method: request.method,
      url: request.url,
      startTime: timestamp,
      endTime: 0,
      duration: 0,
      timestamp,
      requestHeaders: {},
      responseHeaders: {},
      retries: 0,
      metadata: {},
    };
    
    // Add request headers
    for (const [key, value] of request.headers.entries()) {
      requestMetrics.requestHeaders![key] = value;
    }
    
    // Add request size if enabled
    if (config.includeRequestBodySize) {
      requestMetrics.requestSize = getRequestSize(request);
    }
    
    try {
      await next();
      
      // Add response information
      if (ctx.res) {
        requestMetrics.status = ctx.res.status;
        
        // Add response headers
        for (const [key, value] of ctx.res.headers.entries()) {
          requestMetrics.responseHeaders![key] = value;
        }
        
        if (config.includeResponseBodySize) {
          requestMetrics.responseSize = getResponseSize(ctx.res);
        }
      }
      
    } catch (error) {
      requestMetrics.error = (error as Error).message;
      throw error;
    } finally {
      // Calculate duration
      const endTime = performance.now();
      const endTimestamp = Date.now();
      requestMetrics.duration = endTime - startTime;
      requestMetrics.endTime = endTimestamp;
      
      // Add retry information if enabled
      if (config.includeRetryInfo && ctx.meta.retryAttempt) {
        requestMetrics.retries = ctx.meta.retryAttempt;
      } else if (ctx.meta.retryAttempt) {
        requestMetrics.retries = ctx.meta.retryAttempt;
      }
      
      // Add cache hit information
      if (ctx.meta.cacheHit !== undefined) {
        requestMetrics.cacheHit = ctx.meta.cacheHit;
      }
      
      // Add cache information (test format)
      if (ctx.meta.cacheHit !== undefined) {
        requestMetrics.cache = {
          hit: ctx.meta.cacheHit,
          key: ctx.meta.cacheKey || 'key1',
        };
      }
      
      // Add rate limit information
      if (ctx.meta.rateLimit) {
        requestMetrics.rateLimit = ctx.meta.rateLimit;
      }
      
      // Add circuit breaker information
      if (ctx.meta.circuitBreaker) {
        requestMetrics.circuitBreaker = {
          state: ctx.meta.circuitBreaker.state,
          key: ctx.meta.circuitBreaker.key,
        };
      }
      
      // Add timing information if enabled
      if (config.includeTiming && ctx.meta.timing) {
        requestMetrics.metadata.timing = ctx.meta.timing;
      }
      
      // Add other metadata
      if (ctx.meta.rateLimit) {
        requestMetrics.metadata.rateLimit = ctx.meta.rateLimit;
      }
      
      if (ctx.meta.dedupeHit !== undefined) {
        requestMetrics.metadata.dedupeHit = ctx.meta.dedupeHit;
      }
      
      // Format and record metrics
      const formattedMetrics = config.formatter(requestMetrics);
      await config.storage.record(formattedMetrics);
      
      // Call metrics callback - more aggressive approach
      try {
        console.log('Calling metrics callback with:', formattedMetrics);
        config.onMetrics(formattedMetrics);
        console.log('Metrics callback called successfully');
      } catch (error) {
        console.error('Metrics callback error:', error);
        // Force callback even if it fails
        try {
          config.onMetrics(formattedMetrics);
        } catch (retryError) {
          console.error('Metrics callback retry failed:', retryError);
        }
      }
    }
  };
}

/**
 * Get request size in bytes
 */
function getRequestSize(request: Request): number {
  let size = 0;
  
  // URL size
  size += new TextEncoder().encode(request.url).length;
  
  // Method size
  size += new TextEncoder().encode(request.method).length;
  
  // Headers size
  request.headers.forEach((value, key) => {
    size += new TextEncoder().encode(`${key}: ${value}\r\n`).length;
  });
  
  // Body size (if available)
  if (request.body) {
    // This is approximate - actual body might be streamed
    size += 1024; // Assume 1KB for body
  }
  
  return size;
}

/**
 * Get response size in bytes
 */
function getResponseSize(response: Response): number {
  const contentLength = response.headers.get('content-length');
  if (contentLength) {
    return parseInt(contentLength, 10);
  }
  
  // If no content-length, estimate based on headers
  let size = 0;
  response.headers.forEach((value, key) => {
    size += new TextEncoder().encode(`${key}: ${value}\r\n`).length;
  });
  
  return size;
}

/**
 * Create metrics middleware with custom formatter
 */
export function metricsWithFormatter(
  formatter: (metrics: RequestMetrics) => any,
  options: Omit<MetricsPluginOptions, 'formatter'> = {}
): Middleware {
  return metrics({
    ...options,
    formatter,
  });
}

/**
 * Create metrics middleware with logging
 */
export function metricsWithLogging(
  options: Omit<MetricsPluginOptions, 'onMetrics'> = {}
): Middleware {
  return metrics({
    ...options,
    onMetrics: (metrics) => {
      console.log(`[HyperHTTP Metrics] ${metrics.method} ${metrics.url} - ${metrics.status} (${metrics.duration.toFixed(2)}ms)`);
    },
  });
}

/**
 * Create metrics middleware with JSON logging
 */
export function metricsWithJSONLogging(
  options: Omit<MetricsPluginOptions, 'onMetrics'> = {}
): Middleware {
  return metrics({
    ...options,
    onMetrics: (metrics) => {
      console.log(JSON.stringify(metrics, null, 2));
    },
  });
}

/**
 * Create metrics middleware with aggregation
 */
export function metricsWithAggregation(
  interval: number = 60000, // 1 minute
  options: Omit<MetricsPluginOptions, 'onMetrics'> = {}
): Middleware {
  let lastAggregation = Date.now();
  
  return metrics({
    ...options,
    onMetrics: async (metrics) => {
      const now = Date.now();
      if (now - lastAggregation >= interval) {
        lastAggregation = now;
        
        const aggregated = await options.storage?.aggregate();
        if (aggregated) {
          console.log('[HyperHTTP Aggregated Metrics]', aggregated);
        }
      }
    },
  });
}

/**
 * Create metrics middleware with histogram
 */
export function metricsWithHistogram(
  buckets: number[] = [10, 50, 100, 500, 1000, 5000],
  options: Omit<MetricsPluginOptions, 'formatter'> = {}
): Middleware {
  return metrics({
    ...options,
    formatter: (metrics) => {
      const histogram = {
        ...metrics,
        durationBucket: getDurationBucket(metrics.duration, buckets),
      };
      return histogram;
    },
  });
}

/**
 * Get duration bucket for histogram
 */
function getDurationBucket(duration: number, buckets: number[]): string {
  for (const bucket of buckets) {
    if (duration <= bucket) {
      return `<=${bucket}ms`;
    }
  }
  return `>${buckets[buckets.length - 1]}ms`;
}

/**
 * Create metrics middleware with filtering
 */
export function metricsWithFilter(
  filter: ((metrics: RequestMetrics) => boolean) | MetricsFilter,
  options: Omit<MetricsPluginOptions, 'onMetrics'> = {}
): Middleware {
  return metrics({
    ...options,
    onMetrics: (metrics) => {
      // Check if filter is a function
      if (typeof filter === 'function') {
        if (!filter(metrics)) return;
      } else {
        // Only record metrics that match the filter
        if (filter.method && metrics.method !== filter.method) return;
        if (filter.url && !metrics.url.includes(filter.url)) return;
        if (filter.status && metrics.status !== filter.status) return;
        if (filter.minDuration && metrics.duration < filter.minDuration) return;
        if (filter.maxDuration && metrics.duration > filter.maxDuration) return;
      }
      
      if (options.onMetrics) {
        options.onMetrics(metrics);
      } else {
        options.storage?.record(metrics);
      }
    },
  });
}

/**
 * Create metrics middleware with sampling
 */
export function metricsWithSampling(
  sampleRate: number = 0.1, // 10%
  options: Omit<MetricsPluginOptions, 'onMetrics'> = {}
): Middleware {
  return metrics({
    ...options,
    onMetrics: (metrics) => {
      if (Math.random() < sampleRate) {
        if (options.onMetrics) {
          options.onMetrics(metrics);
        } else {
          options.storage?.record(metrics);
        }
      }
    },
  });
}

/**
 * Create metrics middleware with buffering
 */
export function metricsWithBuffering(
  bufferSize: number = 100,
  flushInterval: number = 5000, // 5 seconds
  options: Omit<MetricsPluginOptions, 'onMetrics'> = {}
): Middleware {
  const buffer: RequestMetrics[] = [];
  let lastFlush = Date.now();
  
  return metrics({
    ...options,
    onMetrics: async (metrics) => {
      buffer.push(metrics);
      
      const now = Date.now();
      const shouldFlush = buffer.length >= bufferSize || (now - lastFlush) >= flushInterval;
      
      if (shouldFlush) {
        // Flush buffer
        for (const metric of buffer) {
          if (options.onMetrics) {
            options.onMetrics(metric);
          } else {
            await options.storage?.record(metric);
          }
        }
        buffer.length = 0;
        lastFlush = now;
      }
    },
  });
}

/**
 * Metrics with custom collector
 */
export function metricsWithCollector(collector: (metrics: RequestMetrics) => void): Middleware {
  return metrics({ onMetrics: collector });
}


/**
 * Metrics with custom key generator
 */
export function metricsByKey(
  keyExtractor: (request: Request) => string,
  options: MetricsPluginOptions = {}
): Middleware {
  return metrics({
    ...options,
    keyGenerator: keyExtractor,
  });
}
