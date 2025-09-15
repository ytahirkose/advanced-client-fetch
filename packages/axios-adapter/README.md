# @hyperhttp/axios-adapter

> **Axios Compatibility Layer** - Drop-in replacement for Axios with HyperHTTP power

[![npm version](https://badge.fury.io/js/@hyperhttp/axios-adapter.svg)](https://badge.fury.io/js/@hyperhttp/axios-adapter)

A complete Axios compatibility layer that allows you to use HyperHTTP's powerful features while maintaining the familiar Axios API. Perfect for migrating existing Axios-based applications.

## Installation

```bash
npm install @hyperhttp/axios-adapter
```

## Quick Start

### Drop-in Replacement

```typescript
// Before (Axios)
import axios from 'axios';

const response = await axios.get('/users');
const users = response.data;

// After (HyperHTTP with Axios compatibility)
import { createAxiosInstance } from '@hyperhttp/axios-adapter';

const axios = createAxiosInstance();
const response = await axios.get('/users');
const users = response.data; // Same API! 🎉
```

### With Configuration

```typescript
import { createAxiosInstance } from '@hyperhttp/axios-adapter';

const axios = createAxiosInstance({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  headers: {
    'Authorization': 'Bearer token'
  }
});

// All Axios APIs work exactly the same
const response = await axios.get('/users', {
  params: { page: 1, limit: 10 },
  headers: { 'X-Custom': 'value' }
});
```

## Features

### ✅ Full Axios API Compatibility

- **Request Methods**: `get`, `post`, `put`, `patch`, `delete`, `head`, `options`
- **Configuration**: `baseURL`, `timeout`, `headers`, `params`, `data`
- **Interceptors**: Request and response interceptors
- **Error Handling**: Axios-style error objects
- **Transformers**: Request and response transformers
- **Cancel Tokens**: Legacy cancel token support

### 🚀 HyperHTTP Power Under the Hood

- **Modern Fetch API**: Faster than XMLHttpRequest
- **Plugin System**: Access to all HyperHTTP plugins
- **Platform Support**: Works in Node.js, Edge, Browser, Deno, Bun
- **Security Features**: SSRF protection, header sanitization
- **Cookie Management**: Automatic cookie handling
- **Stream Support**: Modern stream handling

## Usage Examples

### Basic Usage

```typescript
import { createAxiosInstance } from '@hyperhttp/axios-adapter';

const axios = createAxiosInstance({
  baseURL: 'https://api.example.com',
  timeout: 10000
});

// GET request
const users = await axios.get('/users');

// POST request
const newUser = await axios.post('/users', {
  name: 'John Doe',
  email: 'john@example.com'
});

// PUT request
const updatedUser = await axios.put('/users/1', {
  name: 'John Smith'
});

// DELETE request
await axios.delete('/users/1');
```

### With Interceptors

```typescript
import { createAxiosInstance } from '@hyperhttp/axios-adapter';

const axios = createAxiosInstance();

// Request interceptor
axios.interceptors.request.use(
  (config) => {
    config.headers['Authorization'] = `Bearer ${getToken()}`;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      redirectToLogin();
    }
    return Promise.reject(error);
  }
);
```

### With Transformers

```typescript
import { createAxiosInstance } from '@hyperhttp/axios-adapter';

const axios = createAxiosInstance({
  transformRequest: [
    (data, headers) => {
      // Transform request data
      if (data && typeof data === 'object') {
        data.timestamp = Date.now();
      }
      return JSON.stringify(data);
    }
  ],
  transformResponse: [
    (data) => {
      // Transform response data
      return JSON.parse(data);
    }
  ]
});
```

### With Cancel Tokens

```typescript
import { createAxiosInstance } from '@hyperhttp/axios-adapter';

const axios = createAxiosInstance();

// Create cancel token
const source = axios.CancelToken.source();

// Make request with cancel token
const request = axios.get('/users', {
  cancelToken: source.token
});

// Cancel request
source.cancel('Operation canceled by user');

try {
  const response = await request;
} catch (error) {
  if (axios.isCancel(error)) {
    console.log('Request canceled:', error.message);
  }
}
```

## Advanced Usage

### With HyperHTTP Plugins

```typescript
import { createAxiosInstance } from '@hyperhttp/axios-adapter';
import { retry, cache, circuitBreaker } from '@hyperhttp/plugins';

const axios = createAxiosInstance({
  baseURL: 'https://api.example.com',
  middleware: [
    retry({ retries: 3, jitter: true }),
    cache({ ttl: 300000 }),
    circuitBreaker({
      failureThreshold: 5,
      windowMs: 60000,
      resetTimeout: 30000
    })
  ]
});

// Now you have Axios API with HyperHTTP power!
const response = await axios.get('/users');
```

### Platform-Specific Instances

```typescript
// Node.js
import { createAxiosInstanceWithClient } from '@hyperhttp/axios-adapter';
import { createNodeClient } from '@hyperhttp/presets/node';

const nodeClient = createNodeClient({
  agent: { keepAlive: true, maxSockets: 100 },
  proxy: 'http://proxy:8080'
});

const axios = createAxiosInstanceWithClient(nodeClient);

// Edge Runtime
import { createAxiosInstanceWithClient } from '@hyperhttp/axios-adapter';
import { createEdgeClient } from '@hyperhttp/presets/edge';

const edgeClient = createEdgeClient({
  retry: { retries: 3 },
  cache: { ttl: 300000 }
});

const axios = createAxiosInstanceWithClient(edgeClient);

// Browser
import { createAxiosInstanceWithClient } from '@hyperhttp/axios-adapter';
import { createBrowserClient } from '@hyperhttp/presets/browser';

const browserClient = createBrowserClient({
  cookies: true,
  cors: true,
  credentials: 'include'
});

const axios = createAxiosInstanceWithClient(browserClient);
```

### Custom Error Handling

```typescript
import { createAxiosInstance } from '@hyperhttp/axios-adapter';

const axios = createAxiosInstance();

// Custom error handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error('Server Error:', error.response.status, error.response.data);
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network Error:', error.message);
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);
```

## Migration Guide

### From Axios to HyperHTTP

#### 1. Install HyperHTTP

```bash
npm uninstall axios
npm install @hyperhttp/axios-adapter
```

#### 2. Update Imports

```typescript
// Before
import axios from 'axios';

// After
import { createAxiosInstance } from '@hyperhttp/axios-adapter';
const axios = createAxiosInstance();
```

#### 3. Update Configuration

```typescript
// Before
const axios = require('axios').create({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  headers: {
    'Authorization': 'Bearer token'
  }
});

// After
import { createAxiosInstance } from '@hyperhttp/axios-adapter';

const axios = createAxiosInstance({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  headers: {
    'Authorization': 'Bearer token'
  }
});
```

#### 4. Update Error Handling

```typescript
// Before
try {
  const response = await axios.get('/users');
} catch (error) {
  if (error.response) {
    console.error('Server Error:', error.response.status);
  } else if (error.request) {
    console.error('Network Error');
  } else {
    console.error('Error:', error.message);
  }
}

// After (same API!)
try {
  const response = await axios.get('/users');
} catch (error) {
  if (error.response) {
    console.error('Server Error:', error.response.status);
  } else if (error.request) {
    console.error('Network Error');
  } else {
    console.error('Error:', error.message);
  }
}
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
import { createAxiosInstance } from '@hyperhttp/axios-adapter';

const axios = createAxiosInstance({
  baseURL: '/api', // Proxy through same origin
  withCredentials: true // Send cookies
});

// Works perfectly! 🎉
const profile = await axios.get('/auth/profile');
```

### 2. Microservices with Resilience

```typescript
import { createAxiosInstance } from '@hyperhttp/axios-adapter';
import { retry, circuitBreaker } from '@hyperhttp/plugins';

const axios = createAxiosInstance({
  baseURL: 'https://user-service.internal',
  middleware: [
    retry({
      retries: 3,
      respectRetryAfter: true
    }),
    circuitBreaker({
      failureThreshold: 5,
      windowMs: 60000,
      resetTimeout: 30000
    })
  ]
});

// Automatically handles failures gracefully
const users = await axios.get('/users');
```

### 3. Rate Limited API Integration

```typescript
import { createAxiosInstance } from '@hyperhttp/axios-adapter';
import { rateLimit, retry } from '@hyperhttp/plugins';

const axios = createAxiosInstance({
  baseURL: 'https://api.example.com',
  middleware: [
    rateLimit({
      maxRequests: 100,
      windowMs: 60000,
      algorithm: 'sliding-window'
    }),
    retry({
      retries: 3,
      respectRetryAfter: true,
      retryAfterCap: 30000
    })
  ]
});

// Automatically handles rate limiting
const data = await axios.get('/rate-limited-endpoint');
```

### 4. Edge Runtime API Gateway

```typescript
// cloudflare-worker.js
import { createAxiosInstance } from '@hyperhttp/axios-adapter';
import { retry, cache } from '@hyperhttp/plugins';

const axios = createAxiosInstance({
  baseURL: 'https://api.example.com',
  middleware: [
    retry({ retries: 2 }),
    cache({ ttl: 300000 })
  ]
});

export default {
  async fetch(request) {
    const response = await axios.get('/data');
    return new Response(JSON.stringify(response.data));
  }
};
```

## API Reference

### createAxiosInstance(options?)

Creates a new Axios-compatible instance.

**Options:**
- `baseURL?: string` - Base URL for all requests
- `timeout?: number` - Request timeout in milliseconds
- `headers?: Record<string, string>` - Default headers
- `middleware?: Middleware[]` - HyperHTTP middleware
- `transformRequest?: Transformer[]` - Request transformers
- `transformResponse?: Transformer[]` - Response transformers

### Axios Instance Methods

- `get(url, config?)` - GET request
- `post(url, data?, config?)` - POST request
- `put(url, data?, config?)` - PUT request
- `patch(url, data?, config?)` - PATCH request
- `delete(url, config?)` - DELETE request
- `head(url, config?)` - HEAD request
- `options(url, config?)` - OPTIONS request
- `request(config)` - Generic request method

### Interceptors

```typescript
// Request interceptor
axios.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Response interceptor
axios.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);
```

### Error Handling

```typescript
try {
  const response = await axios.get('/users');
} catch (error) {
  if (axios.isCancel(error)) {
    console.log('Request canceled');
  } else if (error.response) {
    console.log('Server Error:', error.response.status);
  } else if (error.request) {
    console.log('Network Error');
  } else {
    console.log('Error:', error.message);
  }
}
```

## Performance Benefits

### Bundle Size

| Package | Size (gzipped) | Features |
|---------|----------------|----------|
| **@hyperhttp/axios-adapter** | **25KB** | Full Axios API + HyperHTTP power |
| axios | 30KB | Basic features only |
| ky | 12KB | Basic features only |

### Runtime Performance

- **Modern Fetch API**: Faster than XMLHttpRequest
- **Tree Shaking**: Only bundle what you use
- **Platform Optimization**: Optimized for each platform
- **Memory Efficient**: Better memory management

## TypeScript Support

Full TypeScript support with Axios-compatible types:

```typescript
import type { 
  AxiosRequestConfig, 
  AxiosResponse, 
  AxiosError,
  AxiosInstance 
} from '@hyperhttp/axios-adapter';

const axios: AxiosInstance = createAxiosInstance();
```

## License

MIT License - see [LICENSE](../../LICENSE) for details.
