# @hyperhttp/core

> **The Core HTTP Client** - Fetch-first, plugin-based, and platform-agnostic

[![npm version](https://badge.fury.io/js/@hyperhttp/core.svg)](https://badge.fury.io/js/@hyperhttp/core)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@hyperhttp/core)](https://bundlephobia.com/package/@hyperhttp/core)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

The core package of HyperHTTP - a modern, fetch-first HTTP client with plugin architecture that works across all platforms.

## Features

- 🚀 **Fetch-first**: Built on modern web standards
- 🔌 **Plugin Architecture**: Extensible middleware system
- 🌍 **Platform Agnostic**: Works in Node.js, Edge, Browser, Deno, Bun
- 🛡️ **Security**: SSRF protection, header sanitization, request validation
- 🍪 **Cookie Management**: Automatic cookie handling
- 📦 **Tree Shakeable**: Only bundle what you use
- 🔧 **TypeScript**: Full type safety
- ⚡ **Performance**: Optimized for modern runtimes
- 🔄 **Smart Retry**: Exponential backoff with jitter
- 📊 **Metrics**: Built-in performance monitoring

## Installation

```bash
npm install @hyperhttp/core
```

## Quick Start

```typescript
import { createClient } from '@hyperhttp/core';

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

## Advanced Usage

### With Plugins

```typescript
import { createClient } from '@hyperhttp/core';
import { retry, cache, security } from '@hyperhttp/plugins';

const client = createClient({
  baseURL: 'https://api.example.com',
  plugins: [
    retry({ retries: 3, jitter: true }),
    cache({ ttl: 300000 }),
    security({ ssrfProtection: true })
  ]
});
```

### Cookie Management

```typescript
import { createClient, createCookieMiddleware, createCookieJar } from '@hyperhttp/core';

const cookieJar = createCookieJar();
const client = createClient({
  plugins: [createCookieMiddleware(cookieJar)]
});

// Cookies are automatically managed
const response = await client.get('/auth/profile');
```

### Security Features

```typescript
import { createClient, createSecurityMiddleware } from '@hyperhttp/core';

const client = createClient({
  plugins: [
    createSecurityMiddleware({
      ssrfProtection: true,
      blockPrivateIPs: true,
      allowedDomains: ['api.example.com']
    })
  ]
});
```

## API Reference

### createClient(options)

Creates a new HTTP client instance.

**Options:**
- `baseURL?: string` - Base URL for all requests
- `headers?: Record<string, string>` - Default headers
- `transport?: (request: Request) => Promise<Response>` - Custom transport
- `plugins?: Middleware[]` - Plugin pipeline
- `timeout?: number` - Default timeout in milliseconds
- `signal?: AbortSignal` - Default abort signal
- `paramsSerializer?: (params: Record<string, any>) => string` - Query parameter serializer

### Client Methods

- `get(url, options)` - GET request
- `post(url, data, options)` - POST request
- `put(url, data, options)` - PUT request
- `patch(url, data, options)` - PATCH request
- `delete(url, options)` - DELETE request
- `head(url, options)` - HEAD request
- `options(url, options)` - OPTIONS request
- `json(url, options)` - GET request returning JSON
- `text(url, options)` - GET request returning text
- `blob(url, options)` - GET request returning Blob
- `arrayBuffer(url, options)` - GET request returning ArrayBuffer
- `stream(url, options)` - GET request returning ReadableStream

## Security Features

### SSRF Protection

```typescript
import { validateUrlForSSRF } from '@hyperhttp/core';

// Block private IPs and localhost
const isValid = validateUrlForSSRF('https://api.example.com', {
  blockPrivateIPs: true,
  blockLocalhost: true
});
```

### Header Sanitization

```typescript
import { cleanHopByHopHeaders, blockDangerousHeaders } from '@hyperhttp/core';

// Remove hop-by-hop headers
const cleaned = cleanHopByHopHeaders(request);

// Block dangerous headers
const safe = blockDangerousHeaders(request);
```

### Request Validation

```typescript
import { validateRequestSize, createRequestSizeValidation } from '@hyperhttp/core';

// Validate request size
const isValid = validateRequestSize(request, 10 * 1024 * 1024); // 10MB

// Middleware for request size validation
const middleware = createRequestSizeValidation(10 * 1024 * 1024);
```

## Cookie Management

### Basic Usage

```typescript
import { createCookieJar, createCookieMiddleware } from '@hyperhttp/core';

const cookieJar = createCookieJar();

// Set cookie
cookieJar.set('https://example.com', 'auth_token=abc123; Path=/; HttpOnly; Secure; SameSite=Strict');

// Get cookie
const cookies = cookieJar.get('https://example.com');

// Delete cookie
cookieJar.delete('https://example.com', 'auth_token');
```

### Advanced Cookie Management

```typescript
import { parseCookies, formatCookies } from '@hyperhttp/core';

// Parse cookie header
const cookies = parseCookies('name=value; path=/; domain=example.com');

// Format cookies for request
const cookieHeader = formatCookies(cookies);
```

## Stream Utilities

### Stream Conversion

```typescript
import { 
  streamToNodeReadable, 
  nodeReadableToStream,
  createTransformStream
} from '@hyperhttp/core';

// Convert Web Stream to Node.js Readable
const nodeStream = streamToNodeReadable(webStream);

// Convert Node.js Readable to Web Stream
const webStream = nodeReadableToStream(nodeStream);

// Create transform stream
const transform = createTransformStream(chunk => {
  return processChunk(chunk);
});
```

## Storage Utilities

### Memory Storage

```typescript
import { createMemoryStorage, createTimedStorage, createCountableStorage } from '@hyperhttp/core';

// Basic memory storage
const storage = createMemoryStorage();

// Storage with TTL
const timedStorage = createTimedStorage(60000); // 1 minute TTL

// Storage with count limits
const countableStorage = createCountableStorage(1000); // Max 1000 items
```

## Performance Monitoring

### Built-in Metrics

```typescript
import { createClient, createPerformanceMonitor } from '@hyperhttp/core';

const monitor = createPerformanceMonitor();
const client = createClient({
  plugins: [monitor]
});

// Get performance metrics
const metrics = monitor.getMetrics();
console.log('Average response time:', metrics.averageResponseTime);
```

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import type { 
  Client, 
  ClientOptions, 
  RequestOptions, 
  ResponseType,
  Middleware,
  CookieOptions,
  SecurityOptions,
  PerformanceMetrics
} from '@hyperhttp/core';
```

## License

MIT License - see [LICENSE](../../LICENSE) for details.