/**
 * Plugin Factory for Advanced Client Fetch
 * Provides utilities for creating and composing plugins
 */

import type { Middleware, Context, BasePluginOptions, PluginImplementation } from './types';

/**
 * Create a plugin with standard configuration
 */
export function createPlugin<T extends BasePluginOptions>(
  name: string,
  defaultOptions: T,
  implementation: PluginImplementation<T>
): (options?: Partial<T>) => Middleware {
  return (options: Partial<T> = {} as Partial<T>) => {
    const config = { ...defaultOptions, ...options };
    
    if (!config.enabled) {
      return async (ctx: Context, next: () => Promise<void>) => next();
    }
    
    return async (ctx: Context, next: () => Promise<void>) => {
      return implementation(config, ctx, next);
    };
  };
}

/**
 * Create a conditional plugin that runs based on a condition
 */
export function createConditionalPlugin<T extends BasePluginOptions>(
  name: string,
  condition: (ctx: Context) => boolean,
  defaultOptions: T,
  implementation: PluginImplementation<T>
): (options?: Partial<T>) => Middleware {
  return (options: Partial<T> = {} as Partial<T>) => {
    const config = { ...defaultOptions, ...options };
    
    if (!config.enabled) {
      return async (ctx: Context, next: () => Promise<void>) => next();
    }
    
    return async (ctx: Context, next: () => Promise<void>) => {
      if (condition(ctx)) {
        await implementation(config, ctx, next);
      } else {
        await next();
      }
    };
  };
}

/**
 * Create a wrapper plugin that wraps another middleware
 */
export function createWrapperPlugin<T extends BasePluginOptions>(
  name: string,
  defaultOptions: T,
  wrapper: (config: T, middleware: Middleware) => Middleware
): (options?: Partial<T>) => Middleware {
  return (options: Partial<T> = {} as Partial<T>) => {
    const config = { ...defaultOptions, ...options };
    
    if (!config.enabled) {
      return async (ctx: Context, next: () => Promise<void>) => next();
    }
    
    return wrapper(config, async (ctx: Context, next: () => Promise<void>) => {
      await next();
    });
  };
}

/**
 * Create a retryable plugin that can be retried on failure
 */
export function createRetryablePlugin<T extends BasePluginOptions>(
  name: string,
  defaultOptions: T,
  implementation: PluginImplementation<T>,
  retryOptions: {
    maxRetries?: number;
    retryDelay?: number;
    retryOn?: (error: Error) => boolean;
  } = {}
): (options?: Partial<T>) => Middleware {
  const { maxRetries = 3, retryDelay = 1000, retryOn = () => true } = retryOptions;
  
  return (options: Partial<T> = {} as Partial<T>) => {
    const config = { ...defaultOptions, ...options };
    
    if (!config.enabled) {
      return async (ctx: Context, next: () => Promise<void>) => next();
    }
    
    return async (ctx: Context, next: () => Promise<void>) => {
      let lastError: Error | undefined;
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          await implementation(config, ctx, next);
          return; // Success
        } catch (error) {
          lastError = error as Error;
          
          if (attempt === maxRetries || !retryOn(lastError)) {
            throw lastError;
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        }
      }
    };
  };
}

/**
 * Create a timeout plugin
 */
export function createTimeoutPlugin<T extends BasePluginOptions>(
  name: string,
  defaultOptions: T,
  implementation: PluginImplementation<T>
): (options?: Partial<T>) => Middleware {
  return (options: Partial<T> = {} as Partial<T>) => {
    const config = { ...defaultOptions, ...options };
    
    if (!config.enabled) {
      return async (ctx: Context, next: () => Promise<void>) => next();
    }
    
    return async (ctx: Context, next: () => Promise<void>) => {
      const timeout = (config as any).timeout || 30000;
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Plugin ${name} timed out after ${timeout}ms`));
        }, timeout);
      });
      
      const implementationPromise = implementation(config, ctx, next);
      
      await Promise.race([implementationPromise, timeoutPromise]);
    };
  };
}

/**
 * Create a metrics plugin that collects metrics
 */
export function createMetricsPlugin<T extends BasePluginOptions>(
  name: string,
  defaultOptions: T,
  implementation: PluginImplementation<T>
): (options?: Partial<T>) => Middleware {
  return (options: Partial<T> = {} as Partial<T>) => {
    const config = { ...defaultOptions, ...options };
    
    if (!config.enabled) {
      return async (ctx: Context, next: () => Promise<void>) => next();
    }
    
    return async (ctx: Context, next: () => Promise<void>) => {
      const startTime = performance.now();
      
      try {
        await implementation(config, ctx, next);
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Store metrics in context
        if (!ctx.meta.metrics) {
          ctx.meta.metrics = {};
        }
        ctx.meta.metrics[name] = {
          duration,
          success: true,
          timestamp: Date.now()
        };
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Store error metrics in context
        if (!ctx.meta.metrics) {
          ctx.meta.metrics = {};
        }
        ctx.meta.metrics[name] = {
          duration,
          success: false,
          error: (error as Error).message,
          timestamp: Date.now()
        };
        
        throw error;
      }
    };
  };
}

/**
 * Create a cached plugin that caches results
 */
export function createCachedPlugin<T extends BasePluginOptions>(
  name: string,
  defaultOptions: T,
  implementation: PluginImplementation<T>,
  cacheOptions: {
    keyGenerator?: (ctx: Context) => string;
    ttl?: number;
    storage?: Map<string, any>;
  } = {}
): (options?: Partial<T>) => Middleware {
  const { keyGenerator = (ctx) => `${ctx.req.method}:${ctx.req.url}`, ttl = 300000, storage = new Map() } = cacheOptions;
  
  return (options: Partial<T> = {} as Partial<T>) => {
    const config = { ...defaultOptions, ...options };
    
    if (!config.enabled) {
      return async (ctx: Context, next: () => Promise<void>) => next();
    }
    
    return async (ctx: Context, next: () => Promise<void>) => {
      const key = keyGenerator(ctx);
      const cached = storage.get(key);
      
      if (cached && Date.now() - cached.timestamp < ttl) {
        // Return cached result
        ctx.res = cached.response;
        ctx.meta.cacheHit = true;
        return;
      }
      
      // Execute implementation
      await implementation(config, ctx, next);
      
      // Cache the result
      if (ctx.res) {
        storage.set(key, {
          response: ctx.res,
          timestamp: Date.now()
        });
        ctx.meta.cacheHit = false;
      }
    };
  };
}

/**
 * Create a rate limited plugin
 */
export function createRateLimitedPlugin<T extends BasePluginOptions>(
  name: string,
  defaultOptions: T,
  implementation: PluginImplementation<T>,
  rateLimitOptions: {
    limit?: number;
    window?: number;
    keyGenerator?: (ctx: Context) => string;
    storage?: Map<string, { count: number; resetTime: number }>;
  } = {}
): (options?: Partial<T>) => Middleware {
  const { limit = 100, window = 60000, keyGenerator = (ctx) => ctx.req.url, storage = new Map() } = rateLimitOptions;
  
  return (options: Partial<T> = {} as Partial<T>) => {
    const config = { ...defaultOptions, ...options };
    
    if (!config.enabled) {
      return async (ctx: Context, next: () => Promise<void>) => next();
    }
    
    return async (ctx: Context, next: () => Promise<void>) => {
      const key = keyGenerator(ctx);
      const now = Date.now();
      const rateLimitInfo = storage.get(key);
      
      if (rateLimitInfo) {
        if (now >= rateLimitInfo.resetTime) {
          // Reset window
          rateLimitInfo.count = 0;
          rateLimitInfo.resetTime = now + window;
        }
        
        if (rateLimitInfo.count >= limit) {
          throw new Error(`Rate limit exceeded for ${name}. Try again in ${Math.ceil((rateLimitInfo.resetTime - now) / 1000)} seconds.`);
        }
        
        rateLimitInfo.count++;
      } else {
        storage.set(key, { count: 1, resetTime: now + window });
      }
      
      await implementation(config, ctx, next);
    };
  };
}

/**
 * Plugin Composer for combining multiple plugins
 */
export class PluginComposer {
  private plugins: Array<{ name: string; middleware: Middleware; priority: number }> = [];
  
  add(name: string, middleware: Middleware, priority: number = 0): this {
    this.plugins.push({ name, middleware, priority });
    this.plugins.sort((a, b) => a.priority - b.priority);
    return this;
  }
  
  remove(name: string): this {
    this.plugins = this.plugins.filter(p => p.name !== name);
    return this;
  }
  
  compose(): Middleware {
    const middleware = this.plugins.map(p => p.middleware);
    
    return async (ctx: Context, next: () => Promise<void>) => {
      let index = -1;
      
      const dispatch = async (i: number): Promise<void> => {
        if (i <= index) {
          throw new Error('next() called multiple times');
        }
        
        index = i;
        const fn = middleware[i];
        
        if (!fn) {
          return next();
        }
        
        await fn(ctx, () => dispatch(i + 1));
      };
      
      return dispatch(0);
    };
  }
  
  clear(): this {
    this.plugins = [];
    return this;
  }
  
  getPluginNames(): string[] {
    return this.plugins.map(p => p.name);
  }
}