/**
 * Performance monitoring for Axios compatibility
 */

export interface PerformanceMetrics {
  requestCount: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  errorCount: number;
  successCount: number;
}

export interface RequestTiming {
  startTime: number;
  endTime?: number;
  duration?: number;
  requestId: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    requestCount: 0,
    totalTime: 0,
    averageTime: 0,
    minTime: Infinity,
    maxTime: 0,
    errorCount: 0,
    successCount: 0,
  };

  private timings: Map<string, RequestTiming> = new Map();

  startRequest(requestId: string): void {
    this.timings.set(requestId, {
      startTime: performance.now(),
      requestId,
    });
  }

  endRequest(requestId: string, success: boolean = true): void {
    const timing = this.timings.get(requestId);
    if (!timing) return;

    const endTime = performance.now();
    const duration = endTime - timing.startTime;

    timing.endTime = endTime;
    timing.duration = duration;

    this.metrics.requestCount++;
    this.metrics.totalTime += duration;
    this.metrics.averageTime = this.metrics.totalTime / this.metrics.requestCount;
    this.metrics.minTime = Math.min(this.metrics.minTime, duration);
    this.metrics.maxTime = Math.max(this.metrics.maxTime, duration);

    if (success) {
      this.metrics.successCount++;
    } else {
      this.metrics.errorCount++;
    }

    this.timings.delete(requestId);
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  reset(): void {
    this.metrics = {
      requestCount: 0,
      totalTime: 0,
      averageTime: 0,
      minTime: Infinity,
      maxTime: 0,
      errorCount: 0,
      successCount: 0,
    };
    this.timings.clear();
  }
}

export const globalPerformanceMonitor = new PerformanceMonitor();

export class MemoryMonitor {
  private memoryUsage: NodeJS.MemoryUsage | null = null;

  getMemoryUsage(): NodeJS.MemoryUsage | null {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      this.memoryUsage = process.memoryUsage();
    }
    return this.memoryUsage;
  }

  getMemoryUsageFormatted(): Record<string, string> | null {
    const usage = this.getMemoryUsage();
    if (!usage) return null;

    return {
      rss: `${Math.round(usage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(usage.external / 1024 / 1024)} MB`,
    };
  }
}

export const memoryMonitor = new MemoryMonitor();

export class RequestDeduplicationCache {
  private cache = new Map<string, Promise<any>>();

  async get<T>(key: string, factory: () => Promise<T>): Promise<T> {
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const promise = factory();
    this.cache.set(key, promise);

    // Clean up after completion
    promise.finally(() => {
      this.cache.delete(key);
    });

    return promise;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export const requestDeduplicationCache = new RequestDeduplicationCache();

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private optimizations: Set<string> = new Set();

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  enableOptimization(name: string): void {
    this.optimizations.add(name);
  }

  disableOptimization(name: string): void {
    this.optimizations.delete(name);
  }

  isOptimizationEnabled(name: string): boolean {
    return this.optimizations.has(name);
  }

  getEnabledOptimizations(): string[] {
    return Array.from(this.optimizations);
  }
}