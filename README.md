# Advanced Client Fetch

> **Axios'tan daha küçük, daha modern, daha güçlü HTTP client**

[![npm version](https://badge.fury.io/js/advanced-client-fetch.svg)](https://www.npmjs.com/package/advanced-client-fetch)
[![Build Status](https://github.com/ytahirkose/advanced-client-fetch/workflows/CI/badge.svg)](https://github.com/ytahirkose/advanced-client-fetch/actions)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@hyperhttp/core)](https://bundlephobia.com/result?p=@hyperhttp/core)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

## 🚀 Özellikler

- **🌐 Platform Bağımsız** - Node 18+, Edge, Deno, Bun, Browser
- **⚡ Fetch-First** - Modern web standartları
- **🔌 Plugin Tabanlı** - Modüler ve genişletilebilir
- **📦 Küçük Core** - Minimal bundle size (~13KB)
- **🛡️ Güvenli** - SSRF koruması, header sanitization
- **⚡ Performanslı** - Caching, deduplication, rate limiting
- **🔧 TypeScript** - Tam tip desteği
- **🔄 Axios Uyumlu** - Tanıdık API

## 📦 Paketler

| Paket | Açıklama | Boyut |
|-------|----------|-------|
| `@hyperhttp/core` | Ana HTTP client | ~13KB |
| `@hyperhttp/plugins` | Plugin koleksiyonu | ~10KB |
| `@hyperhttp/axios-adapter` | Axios uyumluluk katmanı | ~15KB |
| `@hyperhttp/presets` | Platform-specific presets | ~8KB |

## 🚀 Hızlı Başlangıç

### Kurulum

```bash
# Core package
npm install @hyperhttp/core

# Plugins
npm install @hyperhttp/plugins

# Axios adapter (opsiyonel)
npm install @hyperhttp/axios-adapter

# Presets (opsiyonel)
npm install @hyperhttp/presets
```

### Temel Kullanım

```javascript
import { createClient } from '@hyperhttp/core';
import { retry, cache, rateLimit } from '@hyperhttp/plugins';

const client = createClient({
  baseURL: 'https://api.example.com',
  plugins: [
    retry({ retries: 3 }),
    cache({ ttl: 60000 }),
    rateLimit({ requests: 100, window: 60000 })
  ]
});

// GET request
const users = await client.get('/users');

// POST request
const newUser = await client.post('/users', {
  name: 'John Doe',
  email: 'john@example.com'
});

// Custom headers
const response = await client.get('/profile', {
  headers: {
    'Authorization': 'Bearer token'
  }
});
```

### Axios Uyumlu Kullanım

```javascript
import { createAxiosAdapter } from '@hyperhttp/axios-adapter';

const axios = createAxiosAdapter({
  baseURL: 'https://api.example.com',
  plugins: [
    retry({ retries: 3 }),
    cache({ ttl: 60000 })
  ]
});

// Axios API'si ile aynı
const response = await axios.get('/users');
```

## 🔌 Plugin'ler

### Retry Plugin
```javascript
import { retry } from '@hyperhttp/plugins';

const client = createClient({
  plugins: [
    retry({
      retries: 3,
      minDelay: 1000,
      maxDelay: 10000,
      respectRetryAfter: true
    })
  ]
});
```

### Cache Plugin
```javascript
import { cache, cacheWithSWR } from '@hyperhttp/plugins';

// Basit cache
const client = createClient({
  plugins: [
    cache({ ttl: 60000 })
  ]
});

// SWR (Stale While Revalidate)
const client = createClient({
  plugins: [
    cacheWithSWR({ 
      ttl: 60000,
      staleWhileRevalidate: true 
    })
  ]
});
```

### Rate Limiting
```javascript
import { rateLimit } from '@hyperhttp/plugins';

const client = createClient({
  plugins: [
    rateLimit({
      requests: 100,
      window: 60000, // 1 dakika
      keyGenerator: (req) => req.url
    })
  ]
});
```

### Circuit Breaker
```javascript
import { circuitBreaker } from '@hyperhttp/plugins';

const client = createClient({
  plugins: [
    circuitBreaker({
      failureThreshold: 5,
      window: 60000,
      resetTimeout: 30000
    })
  ]
});
```

### Deduplication
```javascript
import { dedupe } from '@hyperhttp/plugins';

const client = createClient({
  plugins: [
    dedupe({
      maxAge: 30000,
      maxPending: 10
    })
  ]
});
```

### Metrics
```javascript
import { metrics } from '@hyperhttp/plugins';

const client = createClient({
  plugins: [
    metrics({
      onMetrics: (data) => {
        console.log('Request metrics:', data);
      }
    })
  ]
});
```

## 🌐 Platform Presets

### Node.js
```javascript
import { createNodeClient } from '@hyperhttp/presets';

const client = createNodeClient({
  baseURL: 'https://api.example.com'
});
```

### Edge Runtime
```javascript
import { createEdgeClient } from '@hyperhttp/presets';

const client = createEdgeClient({
  baseURL: 'https://api.example.com'
});
```

### Browser
```javascript
import { createBrowserClient } from '@hyperhttp/presets';

const client = createBrowserClient({
  baseURL: 'https://api.example.com'
});
```

### Deno
```javascript
import { createDenoClient } from '@hyperhttp/presets';

const client = createDenoClient({
  baseURL: 'https://api.example.com'
});
```

### Bun
```javascript
import { createBunClient } from '@hyperhttp/presets';

const client = createBunClient({
  baseURL: 'https://api.example.com'
});
```

## 🔧 Gelişmiş Kullanım

### Custom Plugin Oluşturma
```javascript
const customPlugin = (options) => {
  return async (ctx, next) => {
    console.log('Request started:', ctx.req.url);
    
    const start = Date.now();
    await next();
    const duration = Date.now() - start;
    
    console.log('Request completed in', duration, 'ms');
  };
};

const client = createClient({
  plugins: [customPlugin()]
});
```

### Request/Response Interceptors
```javascript
const client = createClient({
  plugins: [
    {
      name: 'auth',
      request: (ctx) => {
        ctx.req.headers.set('Authorization', 'Bearer token');
      },
      response: (ctx) => {
        console.log('Response status:', ctx.res?.status);
      }
    }
  ]
});
```

### Error Handling
```javascript
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

## 📊 Performans

### Bundle Size Karşılaştırması

| Library | Size (min+gzip) | Features |
|---------|----------------|----------|
| **HyperHTTP Core** | **13KB** | Fetch-first, plugins, TypeScript |
| Axios | 15KB | Legacy, XMLHttpRequest |
| Fetch API | 0KB | Native, limited features |
| Got | 25KB | Node.js only |

### Benchmark Sonuçları

```
GET requests/second:
- HyperHTTP: 15,000 req/s
- Axios: 12,000 req/s
- Fetch: 18,000 req/s (native)

Memory usage:
- HyperHTTP: 2.5MB
- Axios: 3.2MB
```

## 🛡️ Güvenlik

- **SSRF Koruması** - Private IP ve localhost engelleme
- **Header Sanitization** - Tehlikeli header'ları temizleme
- **Request Validation** - URL ve method doğrulama
- **CORS Desteği** - Cross-origin request'ler

## 🔄 Migration from Axios

```javascript
// Axios
import axios from 'axios';

const response = await axios.get('/api/users', {
  headers: { 'Authorization': 'Bearer token' },
  timeout: 5000
});

// HyperHTTP
import { createClient } from '@hyperhttp/core';

const client = createClient({
  baseURL: 'https://api.example.com',
  plugins: [timeout({ duration: 5000 })]
});

const response = await client.get('/api/users', {
  headers: { 'Authorization': 'Bearer token' }
});
```

## 📚 Dökümantasyon

- [API Reference](./docs/api.md)
- [Plugin Guide](./docs/plugins.md)
- [Migration Guide](./docs/migration.md)
- [Examples](./docs/examples.md)
- [Contributing](./CONTRIBUTING.md)

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

MIT License - detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 🙏 Teşekkürler

- [Axios](https://github.com/axios/axios) - İlham kaynağı
- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) - Modern web standartları
- [Koa.js](https://koajs.com/) - Middleware pattern

---

**HyperHTTP** - Modern web için HTTP client 🚀