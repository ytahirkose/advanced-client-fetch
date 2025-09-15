/**
 * Circuit breaker plugin for HyperHTTP
 * Implements circuit breaker pattern for fault tolerance
 */

import type { Middleware, RequestOptions } from 'hyperhttp-core';
import { defaultKeyGenerator, createKeyGenerator } from 'hyperhttp-core';
import { CircuitBreakerError } from 'hyperhttp-core';

export interface CircuitBreakerPluginOptions {
  /** Enable circuit breaker */
  enabled?: boolean;
  /** Failure threshold to open circuit */
  failureThreshold: number;
  /** Time window for failure counting in milliseconds */
  window: number;
  /** Time to wait before trying again in milliseconds */
  resetTimeout: number;
  /** Circuit breaker key generator */
  keyGenerator?: (request: Request) => string;
  /** Storage for circuit breaker state */
  storage?: CircuitBreakerStorage;
  /** Custom error message */
  message?: string;
  /** Monitor function for circuit state changes */
  onStateChange?: (key: string, state: CircuitState, failures: number) => void;
}

export interface CircuitBreakerStorage {
  get(key: string): Promise<CircuitBreakerState | undefined>;
  set(key: string, state: CircuitBreakerState, ttl: number): Promise<void>;
  incrementFailures(key: string, window: number): Promise<number>;
  resetFailures(key: string): Promise<void>;
}

export interface CircuitBreakerState {
  state: CircuitState;
  failures: number;
  lastFailure: number;
  nextAttempt: number;
  windowStart: number;
}

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

/**
 * In-memory circuit breaker storage
 */
export class MemoryCircuitBreakerStorage implements CircuitBreakerStorage {
  private store = new Map<string, CircuitBreakerState>();
  private timers = new Map<string, NodeJS.Timeout>();

  async get(key: string): Promise<CircuitBreakerState | undefined> {
    return this.store.get(key);
  }

  async set(key: string, state: CircuitBreakerState, ttl: number): Promise<void> {
    this.store.set(key, state);
    
    // Clear existing timer
    const existingTimer = this.timers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    // Set new timer
    const timer = setTimeout(() => {
      this.store.delete(key);
      this.timers.delete(key);
    }, ttl);
    
    this.timers.set(key, timer);
  }

  async incrementFailures(key: string, window: number): Promise<number> {
    const now = Date.now();
    const existing = this.store.get(key);
    
    if (!existing || now - existing.windowStart >= window) {
      // New window
      const state: CircuitBreakerState = {
        state: 'CLOSED',
        failures: 1,
        lastFailure: now,
        nextAttempt: 0,
        windowStart: now,
      };
      
      await this.set(key, state, window);
      return 1;
    }
    
    // Increment existing window
    const state: CircuitBreakerState = {
      ...existing,
      failures: existing.failures + 1,
      lastFailure: now,
    };
    
    await this.set(key, state, window - (now - existing.windowStart));
    return state.failures;
  }

  async resetFailures(key: string): Promise<void> {
    const existing = this.store.get(key);
    if (existing) {
      const state: CircuitBreakerState = {
        ...existing,
        failures: 0,
        state: 'CLOSED',
        windowStart: Date.now(),
      };
      
      await this.set(key, state, 60000); // 1 minute
    }
  }
}

const DEFAULT_OPTIONS: Required<Omit<CircuitBreakerPluginOptions, 'failureThreshold' | 'window' | 'resetTimeout'>> = {
  enabled: true,
  keyGenerator: createKeyGenerator({ includeQuery: false, suffix: ':origin' }),
  storage: new MemoryCircuitBreakerStorage(),
  message: 'Circuit breaker is open',
  onStateChange: () => {},
};

/**
 * Create circuit breaker middleware
 */
export function circuitBreaker(options: CircuitBreakerPluginOptions): Middleware {
  console.log('🎯 CIRCUIT BREAKER PLUGIN CREATED');
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  if (!config.enabled) {
    console.log('❌ CIRCUIT BREAKER PLUGIN DISABLED');
    return async (ctx, next) => next();
  }
  
  console.log('✅ CIRCUIT BREAKER PLUGIN ENABLED');

  return async (ctx, next) => {
    console.log('🚀 CIRCUIT BREAKER MIDDLEWARE FUNCTION CALLED');
    const request = ctx.req;
    const key = config.keyGenerator(request);
    const now = Date.now();
    
    console.log(`🔑 Circuit breaker key: ${key}`);
    
    // Get current circuit state
    let circuitState = await config.storage.get(key);
    
    console.log(`📊 Circuit breaker state - key: ${key}, state: ${circuitState?.state || 'NEW'}, failures: ${circuitState?.failures || 0}`);
    
    if (!circuitState) {
      circuitState = {
        state: 'CLOSED',
        failures: 0,
        lastFailure: 0,
        nextAttempt: 0,
        windowStart: now,
      };
      await config.storage.set(key, circuitState, config.window);
    }
    
    // Check circuit state
    if (circuitState.state === 'OPEN') {
      if (now < circuitState.nextAttempt) {
        const retryAfter = Math.ceil((circuitState.nextAttempt - now) / 1000);
        
        throw new CircuitBreakerError(
          config.message,
          circuitState.state,
          circuitState.failures,
          circuitState.nextAttempt
        );
      }
      
      // Move to half-open
      circuitState.state = 'HALF_OPEN';
      circuitState.failures = 0;
      await config.storage.set(key, circuitState, config.window);
      config.onStateChange(key, circuitState.state, circuitState.failures);
    }
    
    try {
      await next();
      
      // Check if response indicates failure (4xx, 5xx)
      if (ctx.res && (ctx.res.status >= 400)) {
        console.log(`Circuit breaker HTTP error - key: ${key}, status: ${ctx.res.status}`);
        throw new Error(`HTTP ${ctx.res.status}: ${ctx.res.statusText}`);
      }
      
      // Set circuit breaker meta
      ctx.meta.circuitBreaker = {
        state: circuitState.state,
        failures: circuitState.failures,
        key: key,
      };
      
      // Success - reset circuit if it was half-open
      if (circuitState.state === 'HALF_OPEN') {
        circuitState.state = 'CLOSED';
        circuitState.failures = 0;
        circuitState.windowStart = now;
        await config.storage.set(key, circuitState, config.window);
        config.onStateChange(key, circuitState.state, circuitState.failures);
      }
      
    } catch (error) {
      // Increment failure count
      const failures = await config.storage.incrementFailures(key, config.window);
      
      // Debug logging
      console.log(`Circuit breaker failure - key: ${key}, failures: ${failures}, threshold: ${config.failureThreshold}`);
      
      // Check if we should open the circuit - more aggressive check
      if (failures > config.failureThreshold) {
        circuitState.state = 'OPEN';
        circuitState.nextAttempt = now + config.resetTimeout;
        await config.storage.set(key, circuitState, config.resetTimeout);
        config.onStateChange(key, circuitState.state, failures);
      }
      
      throw error;
    }
  };
}

/**
 * Create circuit breaker middleware with custom failure detection
 */
export function circuitBreakerWithCustomDetection(
  options: CircuitBreakerPluginOptions & {
    isFailure?: (error: Error, response?: Response) => boolean;
  }
): Middleware {
  const { isFailure = () => true, ...circuitOptions } = options;
  
  return async (ctx, next) => {
    try {
      await circuitBreaker(circuitOptions)(ctx, next);
    } catch (error) {
      // Only count as failure if custom function says so
      if (isFailure(error as Error, ctx.res)) {
        throw error;
      }
      
      // Not a failure, don't count it
      const key = circuitOptions.keyGenerator?.(ctx.req) || new URL(ctx.req.url).origin;
      await circuitOptions.storage?.resetFailures(key);
      
      throw error;
    }
  };
}

/**
 * Create circuit breaker middleware with different thresholds per endpoint
 */
export function adaptiveCircuitBreaker(
  thresholds: Record<string, {
    failureThreshold: number;
    window: number;
    resetTimeout: number;
  }>,
  options: Omit<CircuitBreakerPluginOptions, 'failureThreshold' | 'window' | 'resetTimeout'> = {}
): Middleware {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  if (!config.enabled) {
    return async (ctx, next) => next();
  }

  return async (ctx, next) => {
    const request = ctx.req;
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // Find matching threshold
    const thresholdConfig = Object.entries(thresholds).find(([pattern]) => {
      if (pattern === '*') return true;
      if (pattern.startsWith('/') && pathname.startsWith(pattern)) return true;
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(pathname);
      }
      return pattern === pathname;
    });
    
    if (!thresholdConfig) {
      return next();
    }
    
    const [, threshold] = thresholdConfig;
    
    // Set adapted threshold in meta
    ctx.meta.circuitBreaker = {
      adaptedThreshold: threshold.failureThreshold,
    };
    
    return circuitBreaker({
      ...config,
      ...threshold,
    })(ctx, next);
  };
}

/**
 * Create circuit breaker middleware with exponential backoff
 */
export function circuitBreakerWithBackoff(
  baseOptions: CircuitBreakerPluginOptions,
  backoffFactor: number = 2,
  maxBackoff: number = 300000 // 5 minutes
): Middleware {
  return async (ctx, next) => {
    const key = baseOptions.keyGenerator?.(ctx.req) || new URL(ctx.req.url).origin;
    const circuitState = await baseOptions.storage?.get(key);
    
    if (circuitState?.state === 'OPEN') {
      const now = Date.now();
      const timeSinceLastFailure = now - circuitState.lastFailure;
      const backoffTime = Math.min(
        baseOptions.resetTimeout * Math.pow(backoffFactor, circuitState.failures - 1),
        maxBackoff
      );
      
      if (timeSinceLastFailure < backoffTime) {
        const retryAfter = Math.ceil((backoffTime - timeSinceLastFailure) / 1000);
        
        throw new CircuitBreakerError(
          baseOptions.message || 'Circuit breaker is open',
          circuitState.state,
          circuitState.failures,
          now + backoffTime
        );
      }
    }
    
    return circuitBreaker(baseOptions)(ctx, next);
  };
}

/**
 * Create circuit breaker middleware with health check
 */
export function circuitBreakerWithHealthCheck(
  options: CircuitBreakerPluginOptions & {
    healthCheckUrl?: string;
    healthCheckInterval?: number;
  },
  healthCheckFn?: (request: Request) => Promise<boolean>
): Middleware {
  const { healthCheckUrl, healthCheckInterval = 30000, ...circuitOptions } = options;
  
  if (!healthCheckUrl && !healthCheckFn) {
    return circuitBreaker(circuitOptions);
  }
  
  // Start health check if not already running
  if (!globalThis.__hyperhttp_health_check_running) {
    globalThis.__hyperhttp_health_check_running = true;
    
    setInterval(async () => {
      try {
        if (healthCheckFn) {
          const result = await healthCheckFn(new Request(healthCheckUrl || 'https://example.com'));
          if (result) {
            console.log('Health check passed');
          }
        } else if (healthCheckUrl) {
          const response = await fetch(healthCheckUrl);
          if (response.ok) {
            console.log('Health check passed');
          }
        }
      } catch (error) {
        console.log('Health check failed:', error);
      }
    }, healthCheckInterval);
  }
  
  return circuitBreaker(circuitOptions);
}

/**
 * Circuit breaker by endpoint
 */
export function circuitBreakerByEndpoint(
  configs: Record<string, { failureThreshold: number; window: number; resetTimeout: number }>
): Middleware {
  return async (ctx, next) => {
    const url = new URL(ctx.req.url);
    const pathname = url.pathname;
    
    const config = Object.entries(configs).find(([pattern]) => {
      if (pattern === '*') return true;
      if (pattern.startsWith('/') && pathname.startsWith(pattern)) return true;
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(pathname);
      }
      return pattern === pathname;
    });
    
    if (!config) {
      return next();
    }
    
    const [, { failureThreshold, window, resetTimeout }] = config;
    
    return circuitBreaker({
      failureThreshold,
      window,
      resetTimeout,
    })(ctx, next);
  };
}

/**
 * Circuit breaker by host
 */
export function circuitBreakerByHost(
  config: { failureThreshold: number; window: number; resetTimeout: number }
): Middleware {
  return circuitBreaker({
    ...config,
    keyGenerator: (request) => {
      const url = new URL(request.url);
      return url.hostname;
    },
  });
}

/**
 * Circuit breaker by custom key
 */
export function circuitBreakerByKey(
  config: { failureThreshold: number; window: number; resetTimeout: number },
  keyExtractor: (request: Request) => string
): Middleware {
  return circuitBreaker({
    ...config,
    keyGenerator: keyExtractor,
  });
}