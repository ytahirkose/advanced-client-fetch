# Advanced Client Fetch

[![npm version](https://img.shields.io/npm/v/advanced-client-fetch.svg)](https://www.npmjs.com/package/advanced-client-fetch)
[![npm downloads](https://img.shields.io/npm/dm/advanced-client-fetch.svg)](https://www.npmjs.com/package/advanced-client-fetch)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

🚀 **Modern HTTP client with fetch-first design, plugin architecture, and security features. Works across all platforms with automatic cookie management and SSRF protection.**

## ✨ Features

- **🌐 Universal**: Works on Node.js, Browser, Edge runtimes, Deno, and Bun
- **🔌 Plugin Architecture**: Extensible middleware system with built-in plugins
- **⚡ Performance**: Fetch-first design with optimized request handling
- **🛡️ Security**: Built-in SSRF protection and security features
- **🍪 Cookie Management**: Automatic cookie handling across requests
- **🔄 Axios Compatible**: Drop-in replacement for Axios
- **📊 Metrics**: Built-in performance monitoring and metrics
- **🔄 Retry Logic**: Smart retry with exponential backoff and jitter
- **⏱️ Timeout**: Configurable timeouts with per-attempt and total timeout
- **💾 Caching**: RFC 9111 compliant HTTP caching
- **🚦 Rate Limiting**: Token bucket and sliding window rate limiting
- **🔌 Circuit Breaker**: Fault tolerance with circuit breaker pattern
- **🔗 Deduplication**: Request deduplication to prevent duplicate calls
- **📈 Monitoring**: Comprehensive metrics and performance monitoring

## 🚀 Quick Start

### Installation

```bash
# npm
npm install advanced-client-fetch

# pnpm
pnpm add advanced-client-fetch

# yarn
yarn add advanced-client-fetch

# bun
bun add advanced-client-fetch
```

### Basic Usage

```typescript
import { createClient } from 'advanced-client-fetch';

// Create a client
const client = createClient({
  baseURL: 'https://api.example.com',
  headers: {
    'Authorization': 'Bearer your-token'
  }
});

// Make requests
const users = await client.get('/users');
const user = await client.post('/users', { name: 'John', email: 'john@example.com' });
```

### With Plugins

```typescript
import { createClient, retry, timeout, cache, metrics } from 'advanced-client-fetch';

const client = createClient({
  baseURL: 'https://api.example.com',
  plugins: [
    retry({ retries: 3, minDelay: 100, maxDelay: 2000 }),
    timeout(30000),
    cache({ ttl: 300000 }),
    metrics({ enabled: true })
  ]
});
```

### Platform-Specific Presets

```typescript
import { 
  createNodeClient, 
  createEdgeClient, 
  createBrowserClient,
  createDenoClient,
  createBunClient 
} from 'advanced-client-fetch';

// Node.js optimized
const nodeClient = createNodeClient({
  baseURL: 'https://api.example.com'
});

// Edge runtime optimized
const edgeClient = createEdgeClient({
  baseURL: 'https://api.example.com'
});

// Browser optimized
const browserClient = createBrowserClient({
  baseURL: 'https://api.example.com'
});
```

### Axios Compatibility

```typescript
import { createAxiosAdapter } from 'advanced-client-fetch';

const axios = createAxiosAdapter({
  baseURL: 'https://api.example.com',
  timeout: 5000
});

// Use exactly like Axios
const response = await axios.get('/users');
```

## 📚 Documentation

### Core Concepts

- **[Client API](./docs/client-api.md)** - Core client methods and options
- **[Plugins](./docs/plugins.md)** - Built-in and custom plugins
- **[Presets](./docs/presets.md)** - Platform-specific configurations
- **[Axios Adapter](./docs/axios-adapter.md)** - Axios compatibility layer
- **[Error Handling](./docs/error-handling.md)** - Error types and handling
- **[Security](./docs/security.md)** - Security features and best practices

### Plugins

- **[Retry](./docs/plugins/retry.md)** - Smart retry with exponential backoff
- **[Timeout](./docs/plugins/timeout.md)** - Configurable timeouts
- **[Cache](./docs/plugins/cache.md)** - HTTP caching with RFC 9111 compliance
- **[Rate Limiting](./docs/plugins/rate-limiting.md)** - Request rate limiting
- **[Circuit Breaker](./docs/plugins/circuit-breaker.md)** - Fault tolerance
- **[Deduplication](./docs/plugins/deduplication.md)** - Request deduplication
- **[Metrics](./docs/plugins/metrics.md)** - Performance monitoring

### Presets

- **[Node.js](./docs/presets/node.md)** - Node.js runtime optimizations
- **[Edge](./docs/presets/edge.md)** - Edge runtime optimizations
- **[Browser](./docs/presets/browser.md)** - Browser environment optimizations
- **[Deno](./docs/presets/deno.md)** - Deno runtime optimizations
- **[Bun](./docs/presets/bun.md)** - Bun runtime optimizations

## 🔌 Plugins

### Built-in Plugins

```typescript
import { 
  retry, 
  timeout, 
  cache, 
  rateLimit, 
  circuitBreaker, 
  dedupe, 
  metrics 
} from 'advanced-client-fetch';

const client = createClient({
  plugins: [
    // Retry failed requests
    retry({
      retries: 3,
      minDelay: 100,
      maxDelay: 2000,
      jitter: true
    }),
    
    // Set request timeout
    timeout(30000),
    
    // Cache responses
    cache({
      ttl: 300000, // 5 minutes
      cacheOnlyGET: true
    }),
    
    // Rate limiting
    rateLimit({
      requests: 100,
      window: 60000 // 1 minute
    }),
    
    // Circuit breaker
    circuitBreaker({
      failureThreshold: 5,
      window: 60000,
      resetTimeout: 30000
    }),
    
    // Request deduplication
    dedupe({
      maxAge: 30000
    }),
    
    // Performance metrics
    metrics({
      enabled: true
    })
  ]
});
```

### Custom Plugins

```typescript
import { createClient, type Middleware } from 'advanced-client-fetch';

const customPlugin: Middleware = async (ctx, next) => {
  console.log(`Making request to ${ctx.req.url}`);
  
  try {
    await next();
    console.log(`Request completed with status ${ctx.res?.status}`);
  } catch (error) {
    console.error(`Request failed: ${error.message}`);
    throw error;
  }
};

const client = createClient({
  plugins: [customPlugin]
});
```

## 🌍 Platform Support

### Node.js
```typescript
import { createNodeClient } from 'advanced-client-fetch';

const client = createNodeClient({
  baseURL: 'https://api.example.com'
});
```

### Edge Runtimes
```typescript
import { createEdgeClient } from 'advanced-client-fetch';

const client = createEdgeClient({
  baseURL: 'https://api.example.com'
});
```

### Browser
```typescript
import { createBrowserClient } from 'advanced-client-fetch';

const client = createBrowserClient({
  baseURL: 'https://api.example.com'
});
```

### Deno
```typescript
import { createDenoClient } from 'advanced-client-fetch';

const client = createDenoClient({
  baseURL: 'https://api.example.com'
});
```

### Bun
```typescript
import { createBunClient } from 'advanced-client-fetch';

const client = createBunClient({
  baseURL: 'https://api.example.com'
});
```

## 🔄 Migration from Axios

Advanced Client Fetch provides a drop-in replacement for Axios:

```typescript
// Before (Axios)
import axios from 'axios';

const response = await axios.get('/api/users');

// After (Advanced Client Fetch)
import { createAxiosAdapter } from 'advanced-client-fetch';

const axios = createAxiosAdapter();
const response = await axios.get('/api/users');
```

## 🛡️ Security Features

- **SSRF Protection**: Prevents Server-Side Request Forgery attacks
- **Host Validation**: Validates allowed/blocked hosts
- **Request Size Limits**: Configurable request and response size limits
- **Redirect Limits**: Prevents infinite redirect loops
- **Cookie Security**: Secure cookie handling with proper flags

## 📊 Performance

- **Fetch-First**: Uses native fetch API for optimal performance
- **Tree Shaking**: Optimized bundle size with tree shaking
- **Lazy Loading**: Plugins are loaded only when needed
- **Connection Pooling**: Efficient connection management
- **Request Deduplication**: Prevents duplicate requests

## 🧪 Testing

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

## 📦 Bundle Analysis

```bash
# Analyze bundle size
pnpm build
pnpm analyze
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

## 🙏 Acknowledgments

- Inspired by [Axios](https://axios-http.com/) for its excellent API design
- Built on top of the native [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- Plugin architecture inspired by [Koa](https://koajs.com/)

## 📞 Support

- 📖 [Documentation](./docs/)
- 🐛 [Issues](https://github.com/ytahirkose/advanced-client-fetch/issues)
- 💬 [Discussions](https://github.com/ytahirkose/advanced-client-fetch/discussions)
- 📧 [Email](mailto:ytahirkose@gmail.com)

---

Made with ❤️ by [Yasar Tahir Kose](https://github.com/ytahirkose)# CI Test
