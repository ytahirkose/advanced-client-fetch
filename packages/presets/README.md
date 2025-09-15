# @advanced-client-fetch/presets

> **Platform-Specific HTTP Clients** - Optimized configurations for different environments

[![npm version](https://badge.fury.io/js/@advanced-client-fetch/presets.svg)](https://badge.fury.io/js/@advanced-client-fetch/presets)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@advanced-client-fetch/presets)](https://bundlephobia.com/package/@advanced-client-fetch/presets)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

Pre-configured HTTP clients optimized for specific platforms and use cases. Each preset includes the best practices and optimizations for its target environment.

## Installation

```bash
npm install @advanced-client-fetch/presets
```

## Available Presets

### 🌐 Browser Preset

Optimized for browser environments with CORS, cookies, and credentials support.

```typescript
import { createBrowserClient } from '@advanced-client-fetch/presets/browser';

const client = createBrowserClient({
  baseURL: 'https://api.example.com',
  cookies: true,
  cors: true,
  credentials: 'include'
});
```

**Features:**
- ✅ CORS support
- ✅ Cookie management
- ✅ Credentials handling
- ✅ Same-origin policy compliance

### 🖥️ Node.js Preset

Full-featured client for Node.js with HTTP agents, proxy support, and security features.

```typescript
import { createNodeClient } from '@advanced-client-fetch/presets/node';

const client = createNodeClient({
  baseURL: 'https://api.example.com',
  agent: {
    keepAlive: true,
    maxSockets: 100
  },
  proxy: 'http://proxy:8080',
  security: {
    ssrfProtection: true,
    blockPrivateIPs: true
  }
});
```

**Features:**
- ✅ HTTP/HTTPS agents
- ✅ Proxy support
- ✅ SSL/TLS configuration
- ✅ Security middleware
- ✅ Cookie management

### ⚡ Edge Preset

Optimized for edge runtimes like Cloudflare Workers, Vercel Edge Functions.

```typescript
import { createEdgeClient } from '@advanced-client-fetch/presets/edge';

const client = createEdgeClient({
  baseURL: 'https://api.example.com',
  retry: { retries: 3 },
  cache: { ttl: 300000 },
  dedupe: true
});
```

**Features:**
- ✅ Edge-optimized
- ✅ Minimal bundle size
- ✅ Retry with backoff
- ✅ Intelligent caching
- ✅ Request deduplication

### 🦕 Deno Preset

Optimized for Deno runtime with native fetch support.

```typescript
import { createDenoClient } from '@advanced-client-fetch/presets/deno';

const client = createDenoClient({
  baseURL: 'https://api.example.com',
  retry: { retries: 3 },
  cache: { ttl: 300000 }
});
```

### 🥟 Bun Preset

Optimized for Bun runtime with native performance.

```typescript
import { createBunClient } from '@advanced-client-fetch/presets/bun';

const client = createBunClient({
  baseURL: 'https://api.example.com',
  retry: { retries: 3 }
});
```

## Specialized Clients

### API Gateway Client

```typescript
import { createAPIGatewayClient } from '@advanced-client-fetch/presets/edge';

const client = createAPIGatewayClient({
  baseURL: 'https://api.example.com',
  retry: { retries: 5, maxDelay: 5000 },
  timeout: 30000,
  cache: { ttl: 600000 },
  rateLimit: { maxRequests: 1000, windowMs: 60000 }
});
```

### CDN Client

```typescript
import { createCDNClient } from '@advanced-client-fetch/presets/edge';

const client = createCDNClient({
  baseURL: 'https://cdn.example.com',
  retry: { retries: 2 },
  timeout: 5000,
  cache: { ttl: 3600000 }, // 1 hour
  rateLimit: { maxRequests: 10000, windowMs: 60000 }
});
```

### Microservice Client

```typescript
import { createMicroserviceClient } from '@advanced-client-fetch/presets/node';

const client = createMicroserviceClient({
  baseURL: 'https://service.example.com',
  retry: { retries: 3 },
  timeout: 10000,
  circuitBreaker: {
    failureThreshold: 5,
    windowMs: 300000,
    resetTimeout: 60000
  }
});
```

### Real-time Client

```typescript
import { createRealTimeClient } from '@advanced-client-fetch/presets/browser';

const client = createRealTimeClient({
  baseURL: 'https://realtime.example.com',
  retry: { retries: 2 },
  timeout: 5000,
  cache: false,
  rateLimit: { maxRequests: 1000, windowMs: 60000 }
});
```

### WebSocket Client

```typescript
import { createWebSocketClient } from '@advanced-client-fetch/presets/browser';

const client = createWebSocketClient({
  baseURL: 'wss://ws.example.com',
  retry: { retries: 3 },
  timeout: 10000
});
```

### Streaming Client

```typescript
import { createStreamingClient } from '@advanced-client-fetch/presets/node';

const client = createStreamingClient({
  baseURL: 'https://stream.example.com',
  retry: { retries: 2 },
  timeout: 30000
});
```

### Batch Client

```typescript
import { createBatchClient } from '@advanced-client-fetch/presets/node';

const client = createBatchClient({
  baseURL: 'https://batch.example.com',
  retry: { retries: 3 },
  timeout: 60000,
  rateLimit: { maxRequests: 100, windowMs: 60000 }
});
```

### Serverless Client

```typescript
import { createServerlessClient } from '@advanced-client-fetch/presets/edge';

const client = createServerlessClient({
  baseURL: 'https://api.example.com',
  retry: { retries: 2 },
  timeout: 10000,
  cache: { ttl: 300000 }
});
```

## Real-World Examples

### 1. CORS + Cookie Authentication

**Problem**: Frontend can't send cookies to backend due to CORS restrictions.

**Solution**:
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://api.company.com',
        changeOrigin: true
      }
    }
  }
});

// Frontend
import { createBrowserClient } from '@advanced-client-fetch/presets/browser';

const client = createBrowserClient({
  baseURL: '/api', // Proxy through same origin
  cookies: true,   // Automatic cookie management
  credentials: 'include'
});

// Works perfectly! 🎉
const profile = await client.get('/auth/profile');
```

### 2. Microservices with Circuit Breaker

**Problem**: One failing service brings down the entire system.

**Solution**:
```typescript
import { createMicroserviceClient } from '@advanced-client-fetch/presets/node';

const client = createMicroserviceClient({
  circuitBreaker: {
    failureThreshold: 5,
    windowMs: 60000,
    resetTimeout: 30000
  }
});

// Automatically handles failures gracefully
const data = await client.get('/unreliable-service');
```

### 3. Edge Runtime API Gateway

**Problem**: Need to make HTTP requests in Cloudflare Workers.

**Solution**:
```typescript
// cloudflare-worker.js
import { createEdgeClient } from '@advanced-client-fetch/presets/edge';

const client = createEdgeClient({
  retry: { retries: 2 },
  cache: { ttl: 300000 },
  dedupe: true
});

export default {
  async fetch(request) {
    const data = await client.get('https://api.example.com/data');
    return new Response(JSON.stringify(data));
  }
};
```

### 4. Rate Limited API Integration

**Problem**: API has rate limits, need to respect them.

**Solution**:
```typescript
import { createAPIGatewayClient } from '@advanced-client-fetch/presets/edge';

const client = createAPIGatewayClient({
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000,
    algorithm: 'sliding-window'
  },
  retry: {
    retries: 3,
    respectRetryAfter: true
  }
});

// Automatically handles rate limiting
const data = await client.get('/rate-limited-api');
```

## Configuration Options

### Common Options

All presets support these common options:

```typescript
interface PresetOptions {
  baseURL?: string;
  headers?: Record<string, string>;
  retry?: boolean | RetryOptions;
  timeout?: boolean | number;
  cache?: boolean | CacheOptions;
  rateLimit?: boolean | RateLimitOptions;
  circuitBreaker?: boolean | CircuitBreakerOptions;
  dedupe?: boolean | DedupeOptions;
  metrics?: boolean | MetricsOptions;
  plugins?: Middleware[];
}
```

### Platform-Specific Options

#### Node.js Options

```typescript
interface NodePresetOptions extends PresetOptions {
  agent?: NodeAgentOptions;
  proxy?: string | ProxyConfig;
  ssl?: NodeSslOptions;
  keepAlive?: boolean;
  maxSockets?: number;
  connectionTimeout?: number;
  socketTimeout?: number;
  security?: SecurityOptions;
  cookies?: boolean | CookieOptions;
  enableSecurity?: boolean;
}
```

#### Browser Options

```typescript
interface BrowserPresetOptions extends PresetOptions {
  cors?: boolean | CorsOptions;
  credentials?: 'omit' | 'same-origin' | 'include';
  mode?: 'cors' | 'no-cors' | 'same-origin';
  redirect?: 'follow' | 'error' | 'manual';
  referrer?: string;
  referrerPolicy?: ReferrerPolicy;
  cache?: RequestCache;
  integrity?: string;
  keepalive?: boolean;
  signal?: AbortSignal;
}
```

## Performance Comparison

| Preset | Bundle Size | Use Case | Performance |
|--------|-------------|----------|-------------|
| **Browser** | ~12KB | Frontend apps | ⭐⭐⭐⭐⭐ |
| **Node.js** | ~11KB | Backend services | ⭐⭐⭐⭐⭐ |
| **Edge** | ~10KB | Edge runtimes | ⭐⭐⭐⭐⭐ |
| **Deno** | ~10KB | Deno apps | ⭐⭐⭐⭐⭐ |
| **Bun** | ~10KB | Bun apps | ⭐⭐⭐⭐⭐ |

## Migration Guide

### From Axios

```typescript
// Before
import axios from 'axios';

const client = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 10000
});

// After
import { createNodeClient } from '@advanced-client-fetch/presets/node';

const client = createNodeClient({
  baseURL: 'https://api.example.com',
  timeout: 10000
});
```

### From Fetch

```typescript
// Before
const response = await fetch('https://api.example.com/users');
const users = await response.json();

// After
import { createBrowserClient } from '@advanced-client-fetch/presets/browser';

const client = createBrowserClient();
const users = await client.get('/users');
```

## License

MIT License - see [LICENSE](../../LICENSE) for details.