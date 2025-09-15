# @hyperhttp/plugins

> **Powerful HTTP Plugins** - Retry, cache, rate limiting, circuit breaker, and more

[![npm version](https://badge.fury.io/js/@hyperhttp/plugins.svg)](https://badge.fury.io/js/@hyperhttp/plugins)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@hyperhttp/plugins)](https://bundlephobia.com/package/@hyperhttp/plugins)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

A comprehensive collection of plugins for HyperHTTP that add powerful features like retry logic, caching, rate limiting, circuit breakers, and more.

## Installation

```bash
npm install @hyperhttp/plugins
```

## Available Plugins

### 🔄 Retry Plugin

Intelligent retry logic with exponential backoff, jitter, and Retry-After header support.

```typescript
import { retry } from '@hyperhttp/plugins';

const client = createClient({
  plugins: [
    retry({
      retries: 3,
      minDelay: 100,
      maxDelay: 2000,
      factor: 2,
      jitter: true,
      respectRetryAfter: true,
      retryAfterCap: 30000
    })
  ]
});
```

**Features:**
- ✅ Exponential backoff
- ✅ Jitter to prevent thundering herd
- ✅ Retry-After header support
- ✅ Idempotent method detection
- ✅ Custom retry conditions

### 🗄️ Cache Plugin

RFC 9111 compliant HTTP caching with stale-while-revalidate support.

```typescript
import { cache } from '@hyperhttp/plugins';

const client = createClient({
  plugins: [
    cache({
      ttl: 300000, // 5 minutes
      respectHeaders: true,
      staleWhileRevalidate: true
    })
  ]
});
```

**Features:**
- ✅ RFC 9111 compliant
- ✅ Stale-while-revalidate
- ✅ ETag support
- ✅ Cache-Control header parsing
- ✅ Custom storage backends

### 🚦 Rate Limiting Plugin

Sliding window and token bucket rate limiting algorithms.

```typescript
import { rateLimit } from '@hyperhttp/plugins';

const client = createClient({
  plugins: [
    rateLimit({
      maxRequests: 100,
      windowMs: 60000, // 1 minute
      algorithm: 'sliding-window'
    })
  ]
});
```

**Features:**
- ✅ Sliding window algorithm
- ✅ Token bucket algorithm
- ✅ Per-endpoint limits
- ✅ Per-user limits
- ✅ Burst support

### ⚡ Circuit Breaker Plugin

Fault tolerance with circuit breaker pattern.

```typescript
import { circuitBreaker } from '@hyperhttp/plugins';

const client = createClient({
  plugins: [
    circuitBreaker({
      failureThreshold: 5,
      windowMs: 60000,
      resetTimeout: 30000
    })
  ]
});
```

**Features:**
- ✅ Half-open state support
- ✅ Adaptive thresholds
- ✅ Health check integration
- ✅ Per-host circuit breakers
- ✅ Custom failure conditions

### 🔄 Deduplication Plugin

Prevent duplicate requests from being made simultaneously.

```typescript
import { dedupe } from '@hyperhttp/plugins';

const client = createClient({
  plugins: [
    dedupe({
      timeout: 30000,
      maxPending: 100
    })
  ]
});
```

**Features:**
- ✅ Request deduplication
- ✅ Configurable TTL
- ✅ Cache integration
- ✅ Rate limit integration
- ✅ Custom key generation

### 📊 Metrics Plugin

Collect detailed metrics about requests and responses.

```typescript
import { metrics } from '@hyperhttp/plugins';

const client = createClient({
  plugins: [
    metrics({
      collectSizes: true,
      collectTiming: true,
      collectRetries: true,
      collectCache: true
    })
  ]
});
```

**Features:**
- ✅ Request/response sizes
- ✅ Timing information
- ✅ Retry statistics
- ✅ Cache hit/miss rates
- ✅ Custom collectors

### ⏱️ Timeout Plugin

Per-request and per-attempt timeout support.

```typescript
import { timeout } from '@hyperhttp/plugins';

const client = createClient({
  plugins: [
    timeout({
      timeout: 10000, // 10 seconds
      timeoutPerAttempt: 5000 // 5 seconds per attempt
    })
  ]
});
```

**Features:**
- ✅ Total timeout
- ✅ Per-attempt timeout
- ✅ Method-specific timeouts
- ✅ Retry-After integration
- ✅ Exponential backoff

## Real-World Examples

### 1. Production API Client

```typescript
import { createClient } from '@hyperhttp/core';
import { 
  retry, 
  cache, 
  rateLimit, 
  circuitBreaker, 
  metrics 
} from '@hyperhttp/plugins';

const client = createClient({
  baseURL: 'https://api.example.com',
  plugins: [
    // Retry with exponential backoff
    retry({
      retries: 3,
      minDelay: 100,
      maxDelay: 2000,
      jitter: true,
      respectRetryAfter: true
    }),
    
    // Intelligent caching
    cache({
      ttl: 300000, // 5 minutes
      respectHeaders: true,
      staleWhileRevalidate: true
    }),
    
    // Rate limiting
    rateLimit({
      maxRequests: 1000,
      windowMs: 60000, // 1 minute
      algorithm: 'sliding-window'
    }),
    
    // Circuit breaker for resilience
    circuitBreaker({
      failureThreshold: 5,
      windowMs: 300000, // 5 minutes
      resetTimeout: 60000 // 1 minute
    }),
    
    // Metrics collection
    metrics({
      collectSizes: true,
      collectTiming: true,
      collectRetries: true,
      collectCache: true
    })
  ]
});
```

### 2. Microservice Communication

```typescript
import { createClient } from '@hyperhttp/core';
import { retry, circuitBreaker, dedupe } from '@hyperhttp/plugins';

const userService = createClient({
  baseURL: 'https://user-service.internal',
  plugins: [
    retry({
      retries: 3,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      respectRetryAfter: true
    }),
    circuitBreaker({
      failureThreshold: 3,
      windowMs: 60000,
      resetTimeout: 30000
    }),
    dedupe({
      timeout: 10000,
      maxPending: 50
    })
  ]
});
```

### 3. CDN Integration

```typescript
import { createClient } from '@hyperhttp/core';
import { cache, retry, rateLimit } from '@hyperhttp/plugins';

const cdnClient = createClient({
  baseURL: 'https://cdn.example.com',
  plugins: [
    cache({
      ttl: 3600000, // 1 hour
      respectHeaders: true,
      staleWhileRevalidate: true
    }),
    retry({
      retries: 2,
      minDelay: 100,
      maxDelay: 1000
    }),
    rateLimit({
      maxRequests: 10000,
      windowMs: 60000,
      algorithm: 'token-bucket'
    })
  ]
});
```

### 4. Real-time Data Fetching

```typescript
import { createClient } from '@hyperhttp/core';
import { retry, dedupe, timeout } from '@hyperhttp/plugins';

const realtimeClient = createClient({
  baseURL: 'https://realtime.example.com',
  plugins: [
    timeout({
      timeout: 5000, // 5 seconds
      timeoutPerAttempt: 2000 // 2 seconds per attempt
    }),
    retry({
      retries: 2,
      minDelay: 100,
      maxDelay: 1000
    }),
    dedupe({
      timeout: 30000,
      maxPending: 100
    })
  ]
});
```

## Advanced Usage

### Custom Retry Conditions

```typescript
import { retry } from '@hyperhttp/plugins';

const client = createClient({
  plugins: [
    retry({
      retries: 3,
      retryOn: (error) => {
        // Custom retry logic
        if (error.status === 429) return true; // Rate limited
        if (error.status >= 500) return true; // Server error
        return false; // Don't retry client errors
      },
      onRetry: (info) => {
        console.log(`Retry attempt ${info.attempt} after ${info.delay}ms`);
      }
    })
  ]
});
```

### Custom Cache Storage

```typescript
import { cache } from '@hyperhttp/plugins';

class RedisCacheStorage {
  async get(key: string) {
    // Implement Redis get
  }
  
  async set(key: string, response: Response, ttl: number) {
    // Implement Redis set
  }
  
  async delete(key: string) {
    // Implement Redis delete
  }
  
  async clear() {
    // Implement Redis clear
  }
}

const client = createClient({
  plugins: [
    cache({
      storage: new RedisCacheStorage(),
      ttl: 300000
    })
  ]
});
```

### Custom Rate Limiting

```typescript
import { rateLimit } from '@hyperhttp/plugins';

const client = createClient({
  plugins: [
    rateLimit({
      maxRequests: 100,
      windowMs: 60000,
      keyGenerator: (request) => {
        // Custom key generation
        const userId = request.headers.get('X-User-ID');
        return `rate_limit:${userId || 'anonymous'}`;
      }
    })
  ]
});
```

### Custom Circuit Breaker

```typescript
import { circuitBreaker } from '@hyperhttp/plugins';

const client = createClient({
  plugins: [
    circuitBreaker({
      failureThreshold: 5,
      windowMs: 60000,
      resetTimeout: 30000,
      keyGenerator: (request) => {
        // Per-host circuit breaker
        const url = new URL(request.url);
        return `circuit_breaker:${url.hostname}`;
      }
    })
  ]
});
```

## Plugin Composition

### Conditional Plugins

```typescript
import { createConditionalPlugin } from '@hyperhttp/core';
import { retry, cache } from '@hyperhttp/plugins';

const client = createClient({
  plugins: [
    // Only retry GET requests
    createConditionalPlugin(
      (ctx) => ctx.req.method === 'GET',
      retry({ retries: 3 })
    ),
    
    // Only cache successful responses
    createConditionalPlugin(
      (ctx) => ctx.res?.ok === true,
      cache({ ttl: 300000 })
    )
  ]
});
```

### Plugin Chaining

```typescript
import { compose } from '@hyperhttp/core';
import { retry, cache, metrics } from '@hyperhttp/plugins';

const apiMiddleware = compose([
  retry({ retries: 3 }),
  cache({ ttl: 300000 }),
  metrics({ collectTiming: true })
]);

const client = createClient({
  plugins: [apiMiddleware]
});
```

## Performance Considerations

### Bundle Size

Each plugin is tree-shakeable, so you only bundle what you use:

```typescript
// Only bundles retry plugin
import { retry } from '@hyperhttp/plugins';

// Bundles all plugins
import * as plugins from '@hyperhttp/plugins';
```

### Memory Usage

Plugins are designed to be memory-efficient:

- **Retry**: Minimal state, cleans up after completion
- **Cache**: Configurable TTL, automatic cleanup
- **Rate Limit**: Sliding window with automatic cleanup
- **Circuit Breaker**: Per-host state, configurable cleanup
- **Dedupe**: Timeout-based cleanup
- **Metrics**: Optional buffering, configurable retention

## Testing

### Mock Plugins

```typescript
import { vi } from 'vitest';

// Mock retry plugin
const mockRetry = vi.fn().mockImplementation(() => async (ctx, next) => {
  await next();
});

// Mock cache plugin
const mockCache = vi.fn().mockImplementation(() => async (ctx, next) => {
  await next();
});

const client = createClient({
  plugins: [mockRetry(), mockCache()]
});
```

### Plugin Testing

```typescript
import { retry } from '@hyperhttp/plugins';

describe('Retry Plugin', () => {
  it('should retry on failure', async () => {
    const mockFetch = vi.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(new Response('Success'));
    
    global.fetch = mockFetch;
    
    const client = createClient({
      plugins: [retry({ retries: 1 })]
    });
    
    const result = await client.get('/test');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
```

## License

MIT License - see [LICENSE](../../LICENSE) for details.