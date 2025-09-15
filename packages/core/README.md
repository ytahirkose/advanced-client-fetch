# @hyperhttp/core

> **The Core HTTP Client** - Fetch-first, plugin-based, and platform-agnostic

[![npm version](https://badge.fury.io/js/@hyperhttp/core.svg)](https://badge.fury.io/js/@hyperhttp/core)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@hyperhttp/core)](https://bundlephobia.com/package/@hyperhttp/core)

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
  middleware: [
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
  middleware: [createCookieMiddleware(cookieJar)]
});

// Cookies are automatically managed
const response = await client.get('/auth/profile');
```

### Security Features

```typescript
import { createClient, createSecurityMiddleware } from '@hyperhttp/core';

const client = createClient({
  middleware: [
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
- `middleware?: Middleware[]` - Middleware pipeline
- `defaults?: Partial<RequestOptions>` - Default request options

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
cookieJar.set({
  name: 'auth_token',
  value: 'abc123',
  domain: 'example.com',
  path: '/',
  httpOnly: true,
  secure: true,
  sameSite: 'strict'
});

// Get cookie
const token = cookieJar.get('auth_token');

// Delete cookie
cookieJar.delete('auth_token', 'example.com', '/');
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
  streamToString, 
  streamToJSON, 
  streamToBuffer,
  stringToStream,
  jsonToStream 
} from '@hyperhttp/core';

// Convert stream to string
const text = await streamToString(stream);

// Convert stream to JSON
const data = await streamToJSON(stream);

// Convert stream to buffer
const buffer = await streamToBuffer(stream);

// Create stream from string
const stream = stringToStream('Hello World');

// Create stream from JSON
const stream = jsonToStream({ message: 'Hello' });
```

### Stream Processing

```typescript
import { 
  createTransformStream, 
  createFilterStream,
  pipeStreams 
} from '@hyperhttp/core';

// Transform stream
const transform = createTransformStream(chunk => {
  return processChunk(chunk);
});

// Filter stream
const filter = createFilterStream(chunk => {
  return chunk.length > 0;
});

// Pipe streams
const result = pipeStreams(source, transform, filter);
```

## Node.js Features

### HTTP/HTTPS Agents

```typescript
import { createHttpAgent, createHttpsAgent, createNodeTransport } from '@hyperhttp/core';

// Create agents
const httpAgent = createHttpAgent({
  keepAlive: true,
  maxSockets: 100
});

const httpsAgent = createHttpsAgent({
  keepAlive: true,
  maxSockets: 100,
  ssl: { rejectUnauthorized: false }
});

// Create transport with agents
const transport = createNodeTransport({
  keepAlive: true,
  maxSockets: 100
});

const client = createClient({ transport });
```

### Proxy Support

```typescript
import { createProxyMiddleware } from '@hyperhttp/core';

const client = createClient({
  middleware: [
    createProxyMiddleware('http://proxy:8080')
  ]
});
```

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import type { 
  Client, 
  RequestOptions, 
  ResponseType,
  Middleware,
  CookieOptions,
  SecurityOptions 
} from '@hyperhttp/core';
```

## License

MIT License - see [LICENSE](../../LICENSE) for details.
