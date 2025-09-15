# Migration Guide: From Axios to Advanced Client Fetch

This guide helps you migrate from Axios to Advanced Client Fetch with minimal code changes and maximum benefits.

## 🚀 Quick Migration (5 minutes)

### 1. Install Advanced Client Fetch

```bash
# Remove Axios
npm uninstall axios

# Install Advanced Client Fetch with Axios compatibility
npm install @advanced-client-fetch/axios-adapter
```

### 2. Update Imports

```typescript
// Before (Axios)
import axios from 'axios';

// After (Advanced Client Fetch with Axios compatibility)
import { createAxiosInstance } from '@advanced-client-fetch/axios-adapter';
const axios = createAxiosInstance();
```

### 3. That's it! 🎉

Your existing Axios code will work exactly the same, but now with Advanced Client Fetch's power under the hood.

## 🔄 Step-by-Step Migration

### Step 1: Basic Setup

```typescript
// Before
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  headers: {
    'Authorization': 'Bearer token'
  }
});

// After
import { createAxiosInstance } from '@advanced-client-fetch/axios-adapter';

const api = createAxiosInstance({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  headers: {
    'Authorization': 'Bearer token'
  }
});
```

### Step 2: Interceptors

```typescript
// Before (Axios)
axios.interceptors.request.use(
  (config) => {
    config.headers['X-Custom'] = 'value';
    return config;
  },
  (error) => Promise.reject(error)
);

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
    }
    return Promise.reject(error);
  }
);

// After (Advanced Client Fetch with Axios compatibility)
// Same code! Interceptors work exactly the same
api.interceptors.request.use(
  (config) => {
    config.headers['X-Custom'] = 'value';
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
    }
    return Promise.reject(error);
  }
);
```

### Step 3: Request Methods

```typescript
// Before (Axios)
const users = await axios.get('/users');
const user = await axios.post('/users', { name: 'John' });
const updated = await axios.put('/users/1', { name: 'Jane' });
await axios.delete('/users/1');

// After (Advanced Client Fetch with Axios compatibility)
// Same code! All methods work exactly the same
const users = await api.get('/users');
const user = await api.post('/users', { name: 'John' });
const updated = await api.put('/users/1', { name: 'Jane' });
await api.delete('/users/1');
```

### Step 4: Error Handling

```typescript
// Before (Axios)
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

// After (Advanced Client Fetch with Axios compatibility)
// Same code! Error handling works exactly the same
try {
  const response = await api.get('/users');
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

## 🌟 Advanced Migration (Get Advanced Client Fetch Benefits)

### Step 1: Use Native Advanced Client Fetch API

```typescript
// Before (Axios)
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 10000
});

// After (Advanced Client Fetch native)
import { createClient } from '@advanced-client-fetch/core';

const api = createClient({
  baseURL: 'https://api.example.com',
  timeout: 10000
});
```

### Step 2: Add Platform-Specific Features

```typescript
// Node.js
import { createNodeClient } from '@advanced-client-fetch/presets/node';

const api = createNodeClient({
  baseURL: 'https://api.example.com',
  agent: { keepAlive: true, maxSockets: 100 },
  proxy: 'http://proxy:8080',
  security: { ssrfProtection: true }
});

// Edge Runtime
import { createEdgeClient } from '@advanced-client-fetch/presets/edge';

const api = createEdgeClient({
  baseURL: 'https://api.example.com',
  retry: { retries: 3 },
  cache: { ttl: 300000 }
});

// Browser
import { createBrowserClient } from '@advanced-client-fetch/presets/browser';

const api = createBrowserClient({
  baseURL: 'https://api.example.com',
  cookies: true,
  cors: true,
  credentials: 'include'
});
```

### Step 3: Add Resilience Features

```typescript
import { createClient } from '@advanced-client-fetch/core';
import { retry, cache, circuitBreaker, rateLimit } from '@advanced-client-fetch/plugins';

const api = createClient({
  baseURL: 'https://api.example.com',
  middleware: [
    retry({
      retries: 3,
      minDelay: 100,
      maxDelay: 2000,
      jitter: true
    }),
    cache({
      ttl: 300000,
      respectHeaders: true
    }),
    circuitBreaker({
      failureThreshold: 5,
      windowMs: 60000,
      resetTimeout: 30000
    }),
    rateLimit({
      maxRequests: 1000,
      windowMs: 60000
    })
  ]
});
```

### Step 4: Update Request Methods

```typescript
// Before (Axios)
const users = await axios.get('/users');
const user = await axios.post('/users', { name: 'John' });

// After (Advanced Client Fetch native)
const users = await api.get('/users');
const user = await api.post('/users', { name: 'John' });

// Or use convenience methods
const users = await api.json('/users');
const user = await api.json('/users', { 
  method: 'POST', 
  body: { name: 'John' } 
});
```

## 🔧 Common Migration Patterns

### 1. CORS + Cookie Authentication

```typescript
// Before (Axios with manual cookie handling)
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.example.com',
  withCredentials: true
});

// Manual cookie handling
api.interceptors.request.use((config) => {
  const token = getCookie('auth_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// After (Advanced Client Fetch with automatic cookie management)
import { createBrowserClient } from '@advanced-client-fetch/presets/browser';

const api = createBrowserClient({
  baseURL: 'https://api.example.com',
  cookies: true, // Automatic cookie management
  credentials: 'include'
});

// No manual cookie handling needed!
```

### 2. Retry Logic

```typescript
// Before (Axios with manual retry)
import axios from 'axios';
import axiosRetry from 'axios-retry';

const api = axios.create({
  baseURL: 'https://api.example.com'
});

axiosRetry(api, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay
});

// After (Advanced Client Fetch with built-in retry)
import { createClient } from '@advanced-client-fetch/core';
import { retry } from '@advanced-client-fetch/plugins';

const api = createClient({
  baseURL: 'https://api.example.com',
  middleware: [
    retry({
      retries: 3,
      minDelay: 100,
      maxDelay: 2000,
      jitter: true
    })
  ]
});
```

### 3. Caching

```typescript
// Before (Axios with manual caching)
import axios from 'axios';

const cache = new Map();

const api = axios.create({
  baseURL: 'https://api.example.com'
});

api.interceptors.request.use((config) => {
  const key = `${config.method}:${config.url}`;
  if (cache.has(key)) {
    return Promise.resolve(cache.get(key));
  }
  return config;
});

api.interceptors.response.use((response) => {
  const key = `${response.config.method}:${response.config.url}`;
  cache.set(key, response);
  return response;
});

// After (Advanced Client Fetch with built-in caching)
import { createClient } from '@advanced-client-fetch/core';
import { cache } from '@advanced-client-fetch/plugins';

const api = createClient({
  baseURL: 'https://api.example.com',
  middleware: [
    cache({
      ttl: 300000,
      respectHeaders: true
    })
  ]
});
```

### 4. Error Handling

```typescript
// Before (Axios error handling)
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.example.com'
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      redirectToLogin();
    } else if (error.response?.status === 429) {
      // Handle rate limiting
      showRateLimitMessage();
    } else if (error.code === 'ECONNABORTED') {
      // Handle timeout
      showTimeoutMessage();
    }
    return Promise.reject(error);
  }
);

// After (Advanced Client Fetch error handling)
import { createClient } from '@advanced-client-fetch/core';

const api = createClient({
  baseURL: 'https://api.example.com',
  middleware: [
    async (ctx, next) => {
      try {
        await next();
      } catch (error) {
        if (error.status === 401) {
          redirectToLogin();
        } else if (error.status === 429) {
          showRateLimitMessage();
        } else if (error.name === 'TimeoutError') {
          showTimeoutMessage();
        }
        throw error;
      }
    }
  ]
});
```

## 🎯 Migration Benefits

### Immediate Benefits (Axios Compatibility)

- ✅ **Zero Code Changes**: Drop-in replacement
- ✅ **Better Performance**: Modern fetch API
- ✅ **Smaller Bundle**: Tree-shakeable
- ✅ **Platform Support**: Works in Edge runtimes

### Advanced Benefits (Native Advanced Client Fetch)

- 🚀 **Automatic Cookie Management**: No manual cookie handling
- 🛡️ **Security Features**: SSRF protection, header sanitization
- 🔄 **Built-in Resilience**: Retry, circuit breaker, rate limiting
- 📊 **Metrics Collection**: Built-in performance monitoring
- 🌍 **Platform Optimization**: Optimized for each environment
- 🔌 **Plugin System**: Extensible middleware architecture

## 🧪 Testing Your Migration

### 1. Unit Tests

```typescript
// Before (Axios tests)
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

const mock = new MockAdapter(axios);
mock.onGet('/users').reply(200, { users: [] });

const response = await axios.get('/users');
expect(response.data).toEqual({ users: [] });

// After (Advanced Client Fetch tests)
import { createClient } from '@advanced-client-fetch/core';

const client = createClient();
// Mock fetch globally
global.fetch = vi.fn().mockResolvedValue(
  new Response(JSON.stringify({ users: [] }))
);

const response = await client.get('/users');
expect(response.data).toEqual({ users: [] });
```

### 2. Integration Tests

```typescript
// Test with real server
import { createClient } from '@advanced-client-fetch/core';

const client = createClient({
  baseURL: 'https://httpbin.org'
});

test('GET request', async () => {
  const response = await client.get('/get');
  expect(response.status).toBe(200);
});

test('POST request', async () => {
  const response = await client.post('/post', { name: 'test' });
  expect(response.status).toBe(200);
});
```

## 🚨 Common Issues and Solutions

### Issue 1: CORS Errors

```typescript
// Problem: CORS errors in browser
// Solution: Use browser preset with CORS support

import { createBrowserClient } from '@advanced-client-fetch/presets/browser';

const client = createBrowserClient({
  baseURL: 'https://api.example.com',
  cors: true,
  credentials: 'include'
});
```

### Issue 2: Cookie Not Sent

```typescript
// Problem: Cookies not being sent
// Solution: Enable automatic cookie management

import { createBrowserClient } from '@advanced-client-fetch/presets/browser';

const client = createBrowserClient({
  baseURL: 'https://api.example.com',
  cookies: true,
  credentials: 'include'
});
```

### Issue 3: Edge Runtime Compatibility

```typescript
// Problem: Code doesn't work in Edge runtime
// Solution: Use edge preset

import { createEdgeClient } from '@advanced-client-fetch/presets/edge';

const client = createEdgeClient({
  baseURL: 'https://api.example.com',
  retry: { retries: 2 },
  cache: { ttl: 300000 }
});
```

### Issue 4: Bundle Size

```typescript
// Problem: Large bundle size
// Solution: Use tree-shaking and specific imports

// Instead of importing everything
import * as advancedClientFetch from '@advanced-client-fetch/core';

// Import only what you need
import { createClient } from '@advanced-client-fetch/core';
import { retry } from '@advanced-client-fetch/plugins/retry';
```

## 📚 Additional Resources

- [Advanced Client Fetch Documentation](https://advanced-client-fetch.dev)
- [Examples Repository](https://github.com/advanced-client-fetch/examples)
- [Community Discord](https://discord.gg/advanced-client-fetch)
- [GitHub Issues](https://github.com/advanced-client-fetch/advanced-client-fetch/issues)

## 🤝 Need Help?

If you encounter any issues during migration:

1. Check the [Common Issues](#-common-issues-and-solutions) section
2. Search [GitHub Issues](https://github.com/advanced-client-fetch/advanced-client-fetch/issues)
3. Ask in [Discord](https://discord.gg/advanced-client-fetch)
4. Create a new issue with your specific problem

Happy migrating! 🚀
