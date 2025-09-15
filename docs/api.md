# API Reference

## Core API (`@hyperhttp/core`)

### `createClient(options)`

Creates a new HTTP client instance.

```typescript
import { createClient } from '@hyperhttp/core';

const client = createClient({
  baseURL: 'https://api.example.com',
  timeout: 5000,
  plugins: [],
  headers: {
    'User-Agent': 'MyApp/1.0'
  }
});
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `baseURL` | `string` | - | Base URL for all requests |
| `timeout` | `number` | `0` | Request timeout in milliseconds |
| `plugins` | `Plugin[]` | `[]` | Array of plugins to use |
| `headers` | `Record<string, string>` | `{}` | Default headers |
| `signal` | `AbortSignal` | - | Default abort signal |
| `transport` | `Transport` | `fetch` | Transport function |
| `paramsSerializer` | `Function` | - | Query parameter serializer |

### HTTP Methods

#### `client.get(url, options?)`

```typescript
const response = await client.get('/users');
const response = await client.get('/users', {
  headers: { 'Authorization': 'Bearer token' },
  params: { page: 1, limit: 10 }
});
```

#### `client.post(url, data?, options?)`

```typescript
const response = await client.post('/users', {
  name: 'John Doe',
  email: 'john@example.com'
});
```

#### `client.put(url, data?, options?)`

```typescript
const response = await client.put('/users/1', {
  name: 'John Updated'
});
```

#### `client.patch(url, data?, options?)`

```typescript
const response = await client.patch('/users/1', {
  name: 'John Patched'
});
```

#### `client.delete(url, options?)`

```typescript
const response = await client.delete('/users/1');
```

#### `client.head(url, options?)`

```typescript
const response = await client.head('/users');
```

#### `client.options(url, options?)`

```typescript
const response = await client.options('/users');
```

### Request Options

| Option | Type | Description |
|--------|------|-------------|
| `headers` | `Record<string, string>` | Request headers |
| `params` | `Record<string, any>` | Query parameters |
| `body` | `any` | Request body |
| `timeout` | `number` | Request timeout |
| `signal` | `AbortSignal` | Abort signal |
| `plugins` | `Plugin[]` | Request-specific plugins |

### Response Object

```typescript
interface Response {
  data: any;
  status: number;
  statusText: string;
  headers: Headers;
  url: string;
  ok: boolean;
  redirected: boolean;
  type: ResponseType;
}
```

### Error Handling

```typescript
import { HttpError, NetworkError, TimeoutError } from '@hyperhttp/core';

try {
  const response = await client.get('/api/data');
} catch (error) {
  if (HttpError.isHttpError(error)) {
    console.log('HTTP Error:', error.status, error.message);
  } else if (NetworkError.isNetworkError(error)) {
    console.log('Network Error:', error.message);
  } else if (TimeoutError.isTimeoutError(error)) {
    console.log('Timeout Error:', error.message);
  }
}
```

## Plugin API (`@hyperhttp/plugins`)

### Retry Plugin

```typescript
import { retry } from '@hyperhttp/plugins';

const retryPlugin = retry({
  retries: 3,
  minDelay: 1000,
  maxDelay: 10000,
  respectRetryAfter: true,
  retryOn: (error) => error instanceof NetworkError,
  onRetry: (attempt, delay, error) => {
    console.log(`Retry attempt ${attempt} after ${delay}ms`);
  }
});
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `retries` | `number` | `3` | Number of retry attempts |
| `minDelay` | `number` | `1000` | Minimum delay between retries |
| `maxDelay` | `number` | `10000` | Maximum delay between retries |
| `respectRetryAfter` | `boolean` | `false` | Respect Retry-After header |
| `retryOn` | `(error: Error) => boolean` | - | Function to determine if error should be retried |
| `onRetry` | `(attempt: number, delay: number, error: Error) => void` | - | Retry callback |

### Cache Plugin

```typescript
import { cache, cacheWithSWR } from '@hyperhttp/plugins';

// Simple cache
const cachePlugin = cache({
  ttl: 60000,
  keyGenerator: (req) => `${req.method}:${req.url}`,
  storage: new MemoryCacheStorage()
});

// SWR cache
const swrPlugin = cacheWithSWR({
  ttl: 60000,
  staleWhileRevalidate: true,
  storage: new MemoryCacheStorage()
});
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `ttl` | `number` | `300000` | Time to live in milliseconds |
| `keyGenerator` | `(req: Request) => string` | - | Function to generate cache key |
| `storage` | `CacheStorage` | `MemoryCacheStorage` | Cache storage implementation |
| `staleWhileRevalidate` | `boolean` | `false` | Enable SWR mode |

### Rate Limit Plugin

```typescript
import { rateLimit } from '@hyperhttp/plugins';

const rateLimitPlugin = rateLimit({
  requests: 100,
  window: 60000,
  keyGenerator: (req) => req.url,
  onLimitReached: (key, limit) => {
    console.log(`Rate limit reached for ${key}: ${limit}`);
  }
});
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `requests` | `number` | `100` | Number of requests allowed |
| `window` | `number` | `60000` | Time window in milliseconds |
| `keyGenerator` | `(req: Request) => string` | - | Function to generate rate limit key |
| `onLimitReached` | `(key: string, limit: number) => void` | - | Callback when limit is reached |

### Circuit Breaker Plugin

```typescript
import { circuitBreaker } from '@hyperhttp/plugins';

const circuitBreakerPlugin = circuitBreaker({
  failureThreshold: 5,
  window: 60000,
  resetTimeout: 30000,
  onStateChange: (key, state, failures) => {
    console.log(`Circuit breaker ${key} changed to ${state}`);
  }
});
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `failureThreshold` | `number` | `5` | Number of failures before opening |
| `window` | `number` | `60000` | Time window for failure counting |
| `resetTimeout` | `number` | `30000` | Time before attempting reset |
| `onStateChange` | `(key: string, state: string, failures: number) => void` | - | State change callback |

### Deduplication Plugin

```typescript
import { dedupe } from '@hyperhttp/plugins';

const dedupePlugin = dedupe({
  maxAge: 30000,
  maxPending: 10,
  keyGenerator: (req) => `${req.method}:${req.url}`,
  onDedupe: (key) => {
    console.log(`Request deduplicated: ${key}`);
  }
});
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxAge` | `number` | `30000` | Maximum age for deduplication |
| `maxPending` | `number` | `10` | Maximum pending requests |
| `keyGenerator` | `(req: Request) => string` | - | Function to generate deduplication key |
| `onDedupe` | `(key: string) => void` | - | Deduplication callback |

### Metrics Plugin

```typescript
import { metrics } from '@hyperhttp/plugins';

const metricsPlugin = metrics({
  onMetrics: (data) => {
    console.log('Request metrics:', data);
  },
  sampling: 0.1,
  formatter: (data) => JSON.stringify(data)
});
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `onMetrics` | `(data: MetricsData) => void` | - | Metrics callback |
| `sampling` | `number` | `1.0` | Sampling rate (0-1) |
| `formatter` | `(data: MetricsData) => string` | - | Metrics formatter |

## Axios Adapter API (`@hyperhttp/axios-adapter`)

### `createAxiosAdapter(options)`

Creates an Axios-compatible adapter.

```typescript
import { createAxiosAdapter } from '@hyperhttp/axios-adapter';

const axios = createAxiosAdapter({
  baseURL: 'https://api.example.com',
  timeout: 5000,
  plugins: [retry(), cache()]
});
```

### Axios Methods

All standard Axios methods are supported:

```typescript
// GET request
const response = await axios.get('/users');

// POST request
const response = await axios.post('/users', { name: 'John' });

// Request with config
const response = await axios.get('/users', {
  params: { page: 1 },
  headers: { 'Authorization': 'Bearer token' }
});
```

## Presets API (`@hyperhttp/presets`)

### Platform Presets

```typescript
import { 
  createNodeClient,
  createEdgeClient,
  createBrowserClient,
  createDenoClient,
  createBunClient
} from '@hyperhttp/presets';

// Node.js
const nodeClient = createNodeClient({
  baseURL: 'https://api.example.com'
});

// Edge Runtime
const edgeClient = createEdgeClient({
  baseURL: 'https://api.example.com'
});

// Browser
const browserClient = createBrowserClient({
  baseURL: 'https://api.example.com'
});

// Deno
const denoClient = createDenoClient({
  baseURL: 'https://api.example.com'
});

// Bun
const bunClient = createBunClient({
  baseURL: 'https://api.example.com'
});
```

## Error Types

### HttpError

```typescript
class HttpError extends Error {
  status: number;
  statusText: string;
  response?: Response;
  
  static isHttpError(error: any): error is HttpError;
}
```

### NetworkError

```typescript
class NetworkError extends Error {
  cause?: Error;
  
  static isNetworkError(error: any): error is NetworkError;
}
```

### TimeoutError

```typescript
class TimeoutError extends Error {
  timeout: number;
  
  static isTimeoutError(error: any): error is TimeoutError;
}
```

### AbortError

```typescript
class AbortError extends Error {
  reason?: any;
  
  static isAbortError(error: any): error is AbortError;
}
```

## Utility Functions

### URL Utilities

```typescript
import { buildURL, parseURL, mergeParams } from '@hyperhttp/core';

// Build URL with params
const url = buildURL('https://api.example.com/users', { page: 1, limit: 10 });

// Parse URL
const parsed = parseURL('https://api.example.com/users?page=1');

// Merge query parameters
const merged = mergeParams({ page: 1 }, { limit: 10 });
```

### Header Utilities

```typescript
import { mergeHeaders, cleanHeaders } from '@hyperhttp/core';

// Merge headers
const headers = mergeHeaders(
  { 'Content-Type': 'application/json' },
  { 'Authorization': 'Bearer token' }
);

// Clean dangerous headers
const cleaned = cleanHeaders(headers);
```

### Security Utilities

```typescript
import { validateUrlForSSRF, sanitizeHeaders } from '@hyperhttp/core';

// Validate URL for SSRF
const isValid = validateUrlForSSRF('https://api.example.com');

// Sanitize headers
const sanitized = sanitizeHeaders(headers);
```
