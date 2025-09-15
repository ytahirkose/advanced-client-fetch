/**
 * Metrics plugin for Advanced Client Fetch
 */

import type { Middleware, Context, Metrics } from '@advanced-client-fetch/core';

export interface MetricsOptions {
  /** Callback for metrics data */
  onMetrics?: (data: Metrics) => void;
  /** Sampling rate (0-1) */
  sampling?: number;
  /** Metrics formatter */
  formatter?: (data: Metrics) => string;
  /** Enable metrics */
  enabled?: boolean;
}

export interface DetailedMetrics extends Metrics {
  /** Request headers */
  requestHeaders?: Record<string, string>;
  /** Response headers */
  responseHeaders?: Record<string, string>;
  /** User agent */
  userAgent?: string;
  /** Referer */
  referer?: string;
  /** Cache status */
  cacheStatus?: 'hit' | 'miss' | 'stale';
  /** Retry count */
  retryCount?: number;
  /** Error details */
  errorDetails?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Create metrics middleware
 */
export function metrics(options: MetricsOptions = {}): Middleware {
  const {
    onMetrics,
    sampling = 1.0,
    formatter = (data) => JSON.stringify(data),
    enabled = true,
  } = options;

  if (!enabled) {
    return async (ctx, next) => next();
  }

  return async (ctx, next) => {
    const startTime = performance.now();
    const requestId = ctx.meta.requestId || 'unknown';
    
    // Skip if sampling
    if (Math.random() > sampling) {
      return next();
    }

    let error: Error | undefined;
    let retryCount = 0;

    try {
      await next();
    } catch (err) {
      error = err as Error;
      throw err;
    } finally {
      const endTime = performance.now();
      const duration = endTime - startTime;

      const metricsData: Metrics = {
        url: ctx.req.url,
        method: ctx.req.method,
        status: ctx.res?.status,
        startTime,
        endTime,
        duration,
        retries: retryCount,
        requestSize: ctx.meta.requestSize,
        responseSize: ctx.meta.responseSize,
        cacheHit: ctx.meta.cacheHit,
        error: error?.message,
      };

      if (onMetrics) {
        onMetrics(metricsData);
      } else {
        console.log(formatter(metricsData));
      }
    }
  };
}

/**
 * Create metrics middleware with collector
 */
export function metricsWithCollector(
  collector: (data: Metrics) => void,
  options: Omit<MetricsOptions, 'onMetrics'> = {}
): Middleware {
  return metrics({
    ...options,
    onMetrics: collector,
  });
}

/**
 * Create metrics middleware with logging
 */
export function metricsWithLogging(
  options: Omit<MetricsOptions, 'onMetrics' | 'formatter'> = {}
): Middleware {
  return metrics({
    ...options,
    onMetrics: (data) => {
      console.log(`[Advanced Client Fetch Metrics] ${data.method} ${data.url} - ${data.status} (${data.duration?.toFixed(2)}ms)`);
    },
  });
}

/**
 * Create metrics middleware with JSON logging
 */
export function metricsWithJSONLogging(
  options: Omit<MetricsOptions, 'onMetrics' | 'formatter'> = {}
): Middleware {
  return metrics({
    ...options,
    formatter: (data) => JSON.stringify(data, null, 2),
  });
}

/**
 * Create metrics middleware with custom formatter
 */
export function metricsWithFormatter(
  formatter: (data: Metrics) => string,
  options: Omit<MetricsOptions, 'formatter'> = {}
): Middleware {
  return metrics({
    ...options,
    formatter,
  });
}

/**
 * Create metrics middleware with aggregation
 */
export function metricsWithAggregation(
  windowSize: number = 60000, // 1 minute
  options: Omit<MetricsOptions, 'onMetrics'> = {}
): Middleware {
  const aggregatedMetrics = new Map<string, {
    count: number;
    totalDuration: number;
    errors: number;
    lastReset: number;
  }>();

  return metrics({
    ...options,
    onMetrics: (data) => {
      const now = Date.now();
      const key = `${data.method}:${new URL(data.url).pathname}`;
      
      let aggregated = aggregatedMetrics.get(key);
      if (!aggregated || now - aggregated.lastReset > windowSize) {
        aggregated = {
          count: 0,
          totalDuration: 0,
          errors: 0,
          lastReset: now,
        };
      }

      aggregated.count++;
      aggregated.totalDuration += data.duration || 0;
      if (data.error) {
        aggregated.errors++;
      }

      aggregatedMetrics.set(key, aggregated);

      // Log aggregated metrics
      console.log(`[Advanced Client Fetch Aggregated] ${key}: ${aggregated.count} requests, avg ${(aggregated.totalDuration / aggregated.count).toFixed(2)}ms, ${aggregated.errors} errors`);
    },
  });
}

/**
 * Create metrics middleware with histogram
 */
export function metricsWithHistogram(
  buckets: number[] = [10, 50, 100, 500, 1000, 5000],
  options: Omit<MetricsOptions, 'onMetrics'> = {}
): Middleware {
  const histogram = new Map<string, number[]>();

  return metrics({
    ...options,
    onMetrics: (data) => {
      const key = `${data.method}:${new URL(data.url).pathname}`;
      const duration = data.duration || 0;
      
      let bucketCounts = histogram.get(key) || new Array(buckets.length + 1).fill(0);
      
      // Find appropriate bucket
      let bucketIndex = buckets.length; // +Inf bucket
      for (let i = 0; i < buckets.length; i++) {
        if (duration <= buckets[i]) {
          bucketIndex = i;
          break;
        }
      }
      
      bucketCounts[bucketIndex]++;
      histogram.set(key, bucketCounts);

      // Log histogram
      console.log(`[Advanced Client Fetch Histogram] ${key}:`, bucketCounts.map((count, i) => {
        const bucket = i === buckets.length ? '+Inf' : buckets[i].toString();
        return `${bucket}: ${count}`;
      }).join(', '));
    },
  });
}