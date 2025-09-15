/**
 * Middleware composition for Advanced Client Fetch
 * Based on Koa's compose function
 */

import type { Middleware, Context } from './types';

/**
 * Compose middleware functions into a single function
 */
export function compose(middleware: Middleware[]): Middleware {
  if (!Array.isArray(middleware)) {
    throw new TypeError('Middleware stack must be an array!');
  }

  for (const fn of middleware) {
    if (typeof fn !== 'function') {
      throw new TypeError('Middleware must be composed of functions!');
    }
  }

  return async (context: Context, next: () => Promise<void>): Promise<void> => {
    let index = -1;
    
    async function dispatch(i: number): Promise<void> {
      if (i <= index) {
        throw new Error('next() called multiple times');
      }
      
      index = i;
      const fn = middleware[i];
      
      if (!fn) {
        return next();
      }
      
      try {
        await fn(context, () => dispatch(i + 1));
      } catch (err) {
        throw err;
      }
    }
    
    return dispatch(0);
  };
}

/**
 * Create a middleware that runs multiple middleware in parallel
 */
export function parallel(...middleware: Middleware[]): Middleware {
  return async (context: Context, next: () => Promise<void>): Promise<void> => {
    await Promise.all(middleware.map(mw => mw(context, next)));
  };
}

/**
 * Create a middleware that runs middleware conditionally
 */
export function conditional(
  condition: (context: Context) => boolean,
  middleware: Middleware
): Middleware {
  return async (context: Context, next: () => Promise<void>): Promise<void> => {
    if (condition(context)) {
      await middleware(context, next);
    } else {
      await next();
    }
  };
}

/**
 * Create a middleware that runs middleware only once per request
 */
export function once(middleware: Middleware): Middleware {
  return async (context: Context, next: () => Promise<void>): Promise<void> => {
    const key = '__advanced_client_fetch_once_' + middleware.name;
    
    if (context.state[key]) {
      return next();
    }
    
    context.state[key] = true;
    await middleware(context, next);
  };
}

/**
 * Create a middleware that runs middleware with error handling
 */
export function withErrorHandling(
  middleware: Middleware,
  onError?: (error: Error, context: Context) => void
): Middleware {
  return async (context: Context, next: () => Promise<void>): Promise<void> => {
    try {
      await middleware(context, next);
    } catch (error) {
      if (onError) {
        onError(error as Error, context);
      }
      throw error;
    }
  };
}

/**
 * Create a middleware that measures execution time
 */
export function withTiming(middleware: Middleware): Middleware {
  return async (context: Context, next: () => Promise<void>): Promise<void> => {
    const start = performance.now();
    
    try {
      await middleware(context, next);
    } finally {
      const end = performance.now();
      const duration = end - start;
      
      if (!context.meta.timing) {
        context.meta.timing = {};
      }
      
      // Always set anonymous key for timing
      context.meta.timing.anonymous = duration;
      
      // Also set named key if middleware has a name
      if (middleware.name) {
        context.meta.timing[middleware.name] = duration;
      }
    }
  };
}

/**
 * Create a middleware that logs request/response
 */
export function withLogging(middleware: Middleware): Middleware {
  return async (context: Context, next: () => Promise<void>): Promise<void> => {
    const start = Date.now();
    
    try {
      await middleware(context, next);
      
      const duration = Date.now() - start;
      console.log(`[Advanced Client Fetch] ${context.req.method} ${context.req.url} - ${context.res?.status} (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`[Advanced Client Fetch] ${context.req.method} ${context.req.url} - ERROR (${duration}ms)`, error);
      throw error;
    }
  };
}