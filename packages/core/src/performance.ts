/**
 * Performance utilities for Advanced Client Fetch
 * Provides performance monitoring, optimization, and benchmarking
 */

import type { Context, Middleware, PerformanceMetrics } from './types';

/**
 * Performance monitor class
 */
export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private startTimes: Map<string, number> = new Map();

  /**
   * Start timing a metric
   */
  start(metricName: string): void {
    this.startTimes.set(metricName, performance.now());
  }

  /**
   * End timing a metric
   */
  end(metricName: string): PerformanceMetrics {
    const startTime = this.startTimes.get(metricName);
    if (!startTime) {
      throw new Error(`Metric ${metricName} was not started`);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    const metric: PerformanceMetrics = {
      name: metricName,
      startTime,
      endTime,
      duration,
      timestamp: Date.now(),
    };

    this.metrics.set(metricName, metric);
    this.startTimes.delete(metricName);

    return metric;
  }

  /**
   * Get a metric by name
   */
  getMetric(metricName: string): PerformanceMetrics | undefined {
    return this.metrics.get(metricName);
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
    this.startTimes.clear();
  }

  /**
   * Get metrics summary
   */
  getSummary(): {
    totalMetrics: number;
    totalDuration: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
  } {
    const metrics = this.getAllMetrics();
    if (metrics.length === 0) {
      return {
        totalMetrics: 0,
        totalDuration: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
      };
    }

    const durations = metrics.map(m => m.duration);
    const totalDuration = durations.reduce((sum, duration) => sum + duration, 0);

    return {
      totalMetrics: metrics.length,
      totalDuration,
      averageDuration: totalDuration / metrics.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
    };
  }
}

/**
 * Create a performance monitor
 */
export function createPerformanceMonitor(): PerformanceMonitor {
  return new PerformanceMonitor();
}

/**
 * Performance middleware factory
 */
export function createPerformanceMiddleware(
  monitor: PerformanceMonitor,
  options: {
    trackRequest?: boolean;
    trackResponse?: boolean;
    trackMiddleware?: boolean;
    onMetric?: (metric: PerformanceMetrics) => void;
  } = {}
): Middleware {
  const {
    trackRequest = true,
    trackResponse = true,
    trackMiddleware = false,
    onMetric = () => {},
  } = options;

  return async (ctx: Context, next: () => Promise<void>) => {
    if (trackRequest) {
      monitor.start('request');
    }

    if (trackMiddleware) {
      monitor.start('middleware');
    }

    try {
      await next();
    } finally {
      if (trackMiddleware) {
        const middlewareMetric = monitor.end('middleware');
        onMetric(middlewareMetric);
      }

      if (trackResponse) {
        const requestMetric = monitor.end('request');
        onMetric(requestMetric);
      }
    }
  };
}

/**
 * Benchmark utility
 */
export class Benchmark {
  private results: Array<{ name: string; duration: number; iterations: number }> = [];

  /**
   * Run a function multiple times and measure performance
   */
  async run<T>(
    name: string,
    fn: () => T | Promise<T>,
    iterations: number = 1000
  ): Promise<{ result: T; duration: number; iterations: number }> {
    const startTime = performance.now();
    
    let result: T;
    for (let i = 0; i < iterations; i++) {
      result = await fn();
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    const benchmarkResult = { name, duration, iterations };
    this.results.push(benchmarkResult);
    
    return { result: result!, duration, iterations };
  }

  /**
   * Get benchmark results
   */
  getResults(): Array<{ name: string; duration: number; iterations: number; average: number }> {
    return this.results.map(result => ({
      ...result,
      average: result.duration / result.iterations,
    }));
  }

  /**
   * Clear results
   */
  clear(): void {
    this.results = [];
  }

  /**
   * Get summary
   */
  getSummary(): {
    totalBenchmarks: number;
    totalDuration: number;
    averageDuration: number;
    fastest: string;
    slowest: string;
  } {
    if (this.results.length === 0) {
      return {
        totalBenchmarks: 0,
        totalDuration: 0,
        averageDuration: 0,
        fastest: '',
        slowest: '',
      };
    }

    const totalDuration = this.results.reduce((sum, result) => sum + result.duration, 0);
    const averageDuration = totalDuration / this.results.length;
    
    const fastest = this.results.reduce((min, result) => 
      result.duration < min.duration ? result : min
    );
    
    const slowest = this.results.reduce((max, result) => 
      result.duration > max.duration ? result : max
    );

    return {
      totalBenchmarks: this.results.length,
      totalDuration,
      averageDuration,
      fastest: fastest.name,
      slowest: slowest.name,
    };
  }
}

/**
 * Create a benchmark instance
 */
export function createBenchmark(): Benchmark {
  return new Benchmark();
}

/**
 * Memory usage monitor
 */
export class MemoryMonitor {
  private measurements: Array<{ timestamp: number; used: number; total: number }> = [];

  /**
   * Take a memory measurement
   */
  measure(): { used: number; total: number; percentage: number } {
    const memory = (performance as any).memory;
    if (!memory) {
      return { used: 0, total: 0, percentage: 0 };
    }

    const used = memory.usedJSHeapSize;
    const total = memory.totalJSHeapSize;
    const percentage = (used / total) * 100;

    this.measurements.push({
      timestamp: Date.now(),
      used,
      total,
    });

    return { used, total, percentage };
  }

  /**
   * Get memory measurements
   */
  getMeasurements(): Array<{ timestamp: number; used: number; total: number; percentage: number }> {
    return this.measurements.map(measurement => ({
      ...measurement,
      percentage: (measurement.used / measurement.total) * 100,
    }));
  }

  /**
   * Clear measurements
   */
  clear(): void {
    this.measurements = [];
  }

  /**
   * Get memory trend
   */
  getTrend(): {
    increasing: boolean;
    decreasing: boolean;
    stable: boolean;
    change: number;
  } {
    if (this.measurements.length < 2) {
      return { increasing: false, decreasing: false, stable: true, change: 0 };
    }

    const first = this.measurements[0];
    const last = this.measurements[this.measurements.length - 1];
    const change = last.used - first.used;

    return {
      increasing: change > 0,
      decreasing: change < 0,
      stable: Math.abs(change) < 1000, // Less than 1KB change
      change,
    };
  }
}

/**
 * Create a memory monitor
 */
export function createMemoryMonitor(): MemoryMonitor {
  return new MemoryMonitor();
}

/**
 * Performance utilities
 */
export class PerformanceUtils {
  /**
   * Debounce a function
   */
  static debounce<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  }

  /**
   * Throttle a function
   */
  static throttle<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let lastCall = 0;
    
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        fn(...args);
      }
    };
  }

  /**
   * Create a performance-optimized middleware
   */
  static createOptimizedMiddleware<T extends (...args: any[]) => any>(
    middleware: T,
    options: {
      cache?: boolean;
      debounce?: number;
      throttle?: number;
    } = {}
  ): T {
    let optimized = middleware;

    if (options.cache) {
      const cache = new Map();
      optimized = ((...args: any[]) => {
        const key = JSON.stringify(args);
        if (cache.has(key)) {
          return cache.get(key);
        }
        const result = middleware(...args);
        cache.set(key, result);
        return result;
      }) as T;
    }

    if (options.debounce) {
      optimized = PerformanceUtils.debounce(optimized, options.debounce) as T;
    }

    if (options.throttle) {
      optimized = PerformanceUtils.throttle(optimized, options.throttle) as T;
    }

    return optimized;
  }

  /**
   * Measure function execution time
   */
  static async measure<T>(
    fn: () => T | Promise<T>,
    name?: string
  ): Promise<{ result: T; duration: number }> {
    const startTime = performance.now();
    const result = await fn();
    const endTime = performance.now();
    const duration = endTime - startTime;

    if (name) {
      console.log(`${name} took ${duration.toFixed(2)}ms`);
    }

    return { result, duration };
  }

  /**
   * Create a performance profiler
   */
  static createProfiler(): {
    start: (name: string) => void;
    end: (name: string) => number;
    getResults: () => Record<string, number>;
    clear: () => void;
  } {
    const timers = new Map<string, number>();
    const results = new Map<string, number>();

    return {
      start: (name: string) => {
        timers.set(name, performance.now());
      },
      end: (name: string) => {
        const startTime = timers.get(name);
        if (!startTime) {
          throw new Error(`Timer ${name} was not started`);
        }
        const duration = performance.now() - startTime;
        results.set(name, duration);
        timers.delete(name);
        return duration;
      },
      getResults: () => Object.fromEntries(results),
      clear: () => {
        timers.clear();
        results.clear();
      },
    };
  }
}

/**
 * Performance constants
 */
export const PERFORMANCE_CONSTANTS = {
  // Memory thresholds
  MEMORY_WARNING_THRESHOLD: 50 * 1024 * 1024, // 50MB
  MEMORY_CRITICAL_THRESHOLD: 100 * 1024 * 1024, // 100MB
  
  // Duration thresholds
  SLOW_REQUEST_THRESHOLD: 1000, // 1 second
  VERY_SLOW_REQUEST_THRESHOLD: 5000, // 5 seconds
  
  // Cache thresholds
  CACHE_HIT_RATIO_GOOD: 0.8, // 80%
  CACHE_HIT_RATIO_EXCELLENT: 0.95, // 95%
  
  // Retry thresholds
  MAX_RETRY_DELAY: 30000, // 30 seconds
  MIN_RETRY_DELAY: 100, // 100ms
} as const;

/**
 * Performance health check
 */
export function checkPerformanceHealth(
  monitor: PerformanceMonitor,
  memoryMonitor: MemoryMonitor
): {
  healthy: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check memory usage
  const memory = memoryMonitor.measure();
  if (memory.percentage > 90) {
    issues.push('High memory usage detected');
    recommendations.push('Consider reducing cache size or implementing garbage collection');
  }

  // Check request duration
  const summary = monitor.getSummary();
  if (summary.averageDuration > PERFORMANCE_CONSTANTS.SLOW_REQUEST_THRESHOLD) {
    issues.push('Slow request duration detected');
    recommendations.push('Consider optimizing middleware or reducing request complexity');
  }

  // Check memory trend
  const trend = memoryMonitor.getTrend();
  if (trend.increasing && trend.change > PERFORMANCE_CONSTANTS.MEMORY_WARNING_THRESHOLD) {
    issues.push('Memory usage is increasing rapidly');
    recommendations.push('Check for memory leaks in middleware or plugins');
  }

  return {
    healthy: issues.length === 0,
    issues,
    recommendations,
  };
}
