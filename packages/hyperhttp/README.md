# Advanced Client Fetch

> **🚀 The modern HTTP client that's more powerful than Axios**

[![npm version](https://badge.fury.io/js/advanced-client-fetch.svg)](https://www.npmjs.com/package/advanced-client-fetch)
[![Build Status](https://github.com/ytahirkose/advanced-client-fetch/workflows/CI/badge.svg)](https://github.com/ytahirkose/advanced-client-fetch/actions)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/advanced-client-fetch)](https://bundlephobia.com/result?p=advanced-client-fetch)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

A fetch-first, plugin-based HTTP client that works across all platforms. More powerful than Axios with smart retry, caching, rate limiting, circuit breaker, and more.

## ✨ Features

- **🌐 Platform Independent** - Node 18+, Edge, Deno, Bun, Browser
- **⚡ Fetch-First** - Built on modern web standards
- **🔌 Plugin Architecture** - Modular and extensible middleware system
- **📦 Small Core** - Minimal bundle size (~15KB)
- **🛡️ Security** - SSRF protection, header sanitization
- **⚡ Performance** - Caching, deduplication, rate limiting
- **🔧 TypeScript** - Full type safety
- **🔄 Axios Compatible** - Drop-in replacement for Axios
- **🧪 Well Tested** - 100% test coverage

## 📦 Installation

```bash
npm install advanced-client-fetch
```

## 🚀 Quick Start

### Basic Usage

```javascript
import { createClient } from 'advanced-client-fetch';

const client = createClient({
  baseURL: 'https://api.example.com',
  headers: {
    'Authorization': 'Bearer token'
  }
});

// Make requests
const users = await client.get('/users');
const user = await client.post('/users', { name: 'John' });
```

### With Plugins

```javascript
import { createClient, retry, cache, rateLimit, circuitBreaker } from 'advanced-client-fetch';

const client = createClient({
  baseURL: 'https://api.example.com',
  plugins: [
    retry({ retries: 3, minDelay: 100, maxDelay: 2000 }),
    cache({ ttl: 300000 }), // 5 minutes
    rateLimit({ maxRequests: 100, windowMs: 60000 }),
    circuitBreaker({ failureThreshold: 5, resetTimeout: 30000 })
  ]
});

const data = await client.get('/api/data');
```

### Axios Compatibility

```javascript
import { createAxiosAdapter } from 'advanced-client-fetch';

const axios = createAxiosAdapter({
  baseURL: 'https://api.example.com',
  plugins: [
    retry({ retries: 3 }),
    cache({ ttl: 300000 })
  ]
});

// Use exactly like Axios
const response = await axios.get('/users');
const user = await axios.post('/users', { name: 'John' });
```

### Platform Presets

```javascript
import { 
  createNodeClient, 
  createEdgeClient, 
  createBrowserClient,
  createDenoClient,
  createBunClient 
} from 'advanced-client-fetch';

// Node.js (full-featured)
const nodeClient = createNodeClient({
  baseURL: 'https://api.example.com'
});

// Edge runtime (optimized)
const edgeClient = createEdgeClient({
  baseURL: 'https://api.example.com'
});

// Browser (CORS-friendly)
const browserClient = createBrowserClient({
  baseURL: 'https://api.example.com'
});
```

## 🔌 Plugins

### Retry Plugin

Intelligent retry logic with exponential backoff and jitter.

```javascript
import { retry } from 'advanced-client-fetch';

const client = createClient({
  plugins: [
    retry({
      retries: 3,
      minDelay: 100,
      maxDelay: 2000,
      factor: 2,
      jitter: true,
      retryOn: (error) => error.status >= 500
    })
  ]
});
```

### Cache Plugin

RFC 9111 compliant HTTP caching.

```javascript
import { cache } from 'advanced-client-fetch';

const client = createClient({
  plugins: [
    cache({
      ttl: 300000, // 5 minutes
      keyGenerator: (request) => request.url
    })
  ]
});
```

### Rate Limiting Plugin

Sliding window rate limiting.

```javascript
import { rateLimit } from 'advanced-client-fetch';

const client = createClient({
  plugins: [
    rateLimit({
      maxRequests: 100,
      windowMs: 60000, // 1 minute
      keyGenerator: (request) => request.headers['X-User-ID'] || 'anonymous'
    })
  ]
});
```

### Circuit Breaker Plugin

Fault tolerance with circuit breaker pattern.

```javascript
import { circuitBreaker } from 'advanced-client-fetch';

const client = createClient({
  plugins: [
    circuitBreaker({
      failureThreshold: 5,
      windowMs: 60000,
      resetTimeout: 30000,
      keyGenerator: (request) => new URL(request.url).hostname
    })
  ]
});
```

## 🌍 Platform Support

| Platform | Support | Notes |
|----------|---------|-------|
| **Node.js** | ✅ Full | HTTP agents, proxy support |
| **Edge** | ✅ Full | Cloudflare Workers, Vercel Edge |
| **Browser** | ✅ Full | CORS, credentials, cookies |
| **Deno** | ✅ Full | Native fetch support |
| **Bun** | ✅ Full | Optimized for Bun runtime |

## 📊 Bundle Size

| Format | Size | Gzipped |
|--------|------|---------|
| **ESM** | 14.6 KB | ~5.2 KB |
| **CJS** | 15.0 KB | ~5.4 KB |

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 🔧 API Reference

### createClient(options)

Creates a new HTTP client instance.

**Options:**
- `baseURL?: string` - Base URL for all requests
- `timeout?: number` - Request timeout in milliseconds
- `headers?: Record<string, string>` - Default headers
- `plugins?: Middleware[]` - Plugin middleware array
- `signal?: AbortSignal` - Default abort signal

### HTTP Methods

- `client.get(url, options?)` - GET request
- `client.post(url, data?, options?)` - POST request
- `client.put(url, data?, options?)` - PUT request
- `client.patch(url, data?, options?)` - PATCH request
- `client.delete(url, options?)` - DELETE request
- `client.head(url, options?)` - HEAD request
- `client.options(url, options?)` - OPTIONS request

### Response Object

```typescript
interface Response<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
  config: RequestOptions;
  request?: any;
}
```

### Error Classes

- `HttpError` - HTTP status errors (4xx, 5xx)
- `NetworkError` - Network connectivity errors
- `AbortError` - Request aborted errors
- `TimeoutError` - Request timeout errors

## 🚀 Migration from Axios

### 1. Install Advanced Client Fetch

```bash
npm uninstall axios
npm install advanced-client-fetch
```

### 2. Update Imports

```javascript
// Before
import axios from 'axios';

// After
import { createAxiosAdapter } from 'advanced-client-fetch';
const axios = createAxiosAdapter();
```

### 3. That's it! 🎉

Your existing Axios code will work without any changes.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT © [Yasar Tahir Kose](https://github.com/ytahirkose)

## 🙏 Acknowledgments

- [Axios](https://github.com/axios/axios) for inspiration
- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) for the foundation
- [Koa](https://koajs.com/) for middleware architecture inspiration