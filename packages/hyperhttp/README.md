# 🚀 Advanced Client Fetch

> The modern HTTP client that's more powerful than Axios. Fetch-first, plugin-based, platform-independent with smart retry, caching, rate limiting, and more.

[![npm version](https://badge.fury.io/js/advanced-client-fetch.svg)](https://www.npmjs.com/package/advanced-client-fetch)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](https://www.typescriptlang.org/)

## ✨ Why Advanced Client Fetch?

- **🚀 Fetch-first design** - Built on native fetch API
- **🔌 Plugin architecture** - Koa-like middleware system  
- **🌍 Platform independent** - Works on Node.js, Edge, Deno, Bun, and browsers
- **📦 Zero dependencies** - Minimal core with optional plugins
- **⚡ TypeScript first** - Full type safety and IntelliSense
- **🛡️ Security built-in** - SSRF protection, header sanitization
- **🍪 Cookie management** - Automatic cookie handling
- **🔄 Smart retry** - Exponential backoff with jitter
- **💾 Intelligent caching** - SWR support, TTL management
- **⚖️ Rate limiting** - Prevent API abuse
- **🔧 Circuit breaker** - Prevent cascading failures
- **📊 Metrics** - Built-in performance monitoring

## 🚀 Quick Start

```bash
npm install advanced-client-fetch
```

```typescript
import { createClient, retry, cache, rateLimit } from 'advanced-client-fetch';

const client = createClient({
  baseURL: 'https://api.example.com',
  plugins: [
    retry({ retries: 3 }),
    cache({ ttl: 300000 }), // 5 minutes
    rateLimit({ limit: 100, interval: 60000 }) // 100 req/min
  ]
});

// Simple GET request
const users = await client.get('/users');

// POST with data
const newUser = await client.post('/users', {
  name: 'John Doe',
  email: 'john@example.com'
});

// With error handling
try {
  const data = await client.get('/protected');
} catch (error) {
  if (error.status === 401) {
    // Handle unauthorized
  }
}
```

## 📦 Modular Usage

HyperHTTP is designed to be modular. You can import only what you need:

```typescript
// Core functionality
import { createClient } from 'advanced-client-fetch/core';

// Specific plugins
import { retry, cache } from 'advanced-client-fetch/plugins';

// Platform presets
import { createNodeClient } from 'advanced-client-fetch/presets';

// Axios adapter
import { createAxiosAdapter } from 'advanced-client-fetch/axios';
```

## 🔌 Plugins

### Retry Plugin
```typescript
import { retry } from 'advanced-client-fetch/plugins';

const client = createClient({
  plugins: [
    retry({
      retries: 3,
      delay: (attempt) => Math.pow(2, attempt) * 1000, // Exponential backoff
      retryStatusCodes: [408, 429, 500, 502, 503, 504]
    })
  ]
});
```

### Cache Plugin
```typescript
import { cache } from 'advanced-client-fetch/plugins';

const client = createClient({
  plugins: [
    cache({
      ttl: 300000, // 5 minutes
      staleWhileRevalidate: true,
      keyGenerator: (req) => `${req.method}:${req.url}`
    })
  ]
});
```

### Rate Limit Plugin
```typescript
import { rateLimit } from 'advanced-client-fetch/plugins';

const client = createClient({
  plugins: [
    rateLimit({
      limit: 100,
      interval: 60000, // 1 minute
      queue: true, // Queue requests when limit reached
      maxQueueSize: 50
    })
  ]
});
```

### Circuit Breaker Plugin
```typescript
import { circuitBreaker } from 'advanced-client-fetch/plugins';

const client = createClient({
  plugins: [
    circuitBreaker({
      failureThreshold: 5,
      resetTimeout: 30000, // 30 seconds
      halfOpenTimeout: 5000
    })
  ]
});
```

## 🌍 Platform Presets

### Node.js
```typescript
import { createNodeClient } from 'advanced-client-fetch/presets';

const client = createNodeClient({
  baseURL: 'https://api.example.com',
  node: {
    keepAlive: true,
    maxSockets: 10
  }
});
```

### Edge Runtime
```typescript
import { createEdgeClient } from 'advanced-client-fetch/presets';

const client = createEdgeClient({
  baseURL: 'https://api.example.com'
});
```

### Browser
```typescript
import { createBrowserClient } from 'advanced-client-fetch/presets';

const client = createBrowserClient({
  baseURL: 'https://api.example.com',
  credentials: 'include' // Include cookies
});
```

## 🔄 Axios Migration

Drop-in replacement for Axios:

```typescript
import { createAxiosAdapter } from 'advanced-client-fetch/axios';

// Create Axios-compatible instance
const axios = createAxiosAdapter({
  baseURL: 'https://api.example.com',
  timeout: 5000
});

// Use exactly like Axios
const response = await axios.get('/users');
const data = await axios.post('/users', { name: 'John' });
```

## 🛡️ Security Features

```typescript
const client = createClient({
  security: {
    ssrfProtection: true,
    allowedHosts: ['api.example.com', '*.trusted.com'],
    blockedRequestHeaders: ['x-forwarded-for'],
    sanitizedRequestHeaders: ['authorization']
  }
});
```

## 📊 Metrics & Monitoring

```typescript
import { metrics } from 'advanced-client-fetch/plugins';

const client = createClient({
  plugins: [
    metrics({
      onMetrics: (data) => {
        console.log('Request metrics:', data);
        // Send to your monitoring service
      },
      detailed: true
    })
  ]
});
```

## 🎯 Advanced Usage

### Custom Middleware
```typescript
const client = createClient({
  plugins: [
    // Custom middleware
    async (ctx, next) => {
      console.log('Request:', ctx.req.url);
      await next();
      console.log('Response:', ctx.res?.status);
    }
  ]
});
```

### Request/Response Interceptors
```typescript
const client = createClient({
  plugins: [
    // Request interceptor
    async (ctx, next) => {
      ctx.req.headers.set('X-API-Key', process.env.API_KEY);
      await next();
    },
    // Response interceptor
    async (ctx, next) => {
      await next();
      if (ctx.res?.status === 401) {
        // Handle unauthorized
        window.location.href = '/login';
      }
    }
  ]
});
```

## 📚 API Reference

### Core API
- `createClient(options)` - Create HTTP client
- `createClient().get(url, options)` - GET request
- `createClient().post(url, data, options)` - POST request
- `createClient().put(url, data, options)` - PUT request
- `createClient().patch(url, data, options)` - PATCH request
- `createClient().delete(url, options)` - DELETE request

### Plugin API
- `retry(options)` - Retry failed requests
- `cache(options)` - Cache responses
- `rateLimit(options)` - Rate limit requests
- `circuitBreaker(options)` - Circuit breaker pattern
- `dedupe(options)` - Deduplicate requests
- `metrics(options)` - Collect metrics
- `timeout(options)` - Request timeout

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT © [Yasar Tahir Kose](https://github.com/ytahirkose)

## 🙏 Acknowledgments

- Inspired by Axios and Koa.js
- Built with modern web standards
- Community-driven development

---

**Made with ❤️ by the HyperHTTP team**
