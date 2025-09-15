# Advanced Client Fetch

[![npm version](https://img.shields.io/npm/v/advanced-client-fetch.svg)](https://www.npmjs.com/package/advanced-client-fetch)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/advanced-client-fetch)](https://bundlephobia.com/package/advanced-client-fetch)
[![License](https://img.shields.io/npm/l/advanced-client-fetch.svg)](https://github.com/ytahirkose/advanced-client-fetch/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

🚀 **The modern HTTP client that's more powerful than Axios.** Fetch-first, plugin-based, platform-independent with smart retry, caching, rate limiting, and more.

## ✨ Features

- 🎯 **Fetch-first**: Built on native `fetch` API
- 🔌 **Plugin-based**: Modular architecture like Koa
- 🌐 **Platform-independent**: Works on Node.js, Edge, Deno, Bun, and browsers
- 🚀 **Smart retry**: Exponential backoff with jitter
- 💾 **Built-in caching**: Memory and persistent storage
- 🛡️ **Security**: SSRF protection, header sanitization
- 🍪 **Cookie management**: Automatic cookie handling
- 📊 **Metrics**: Performance monitoring and analytics
- 🔄 **Axios compatibility**: Drop-in replacement for Axios
- 📦 **Tree-shakable**: Only bundle what you use
- 🎨 **TypeScript**: Full type safety

## 📦 Installation

```bash
# Install the main package
npm install advanced-client-fetch

# Or with specific features
npm install advanced-client-fetch --core
npm install advanced-client-fetch --plugins
npm install advanced-client-fetch --presets
npm install advanced-client-fetch --axios-adapter
```

## 🚀 Quick Start

### Basic Usage

```javascript
import { createClient } from 'advanced-client-fetch';

const client = createClient({
  baseURL: 'https://api.example.com',
  timeout: 5000,
});

// GET request
const response = await client.get('/users');

// POST request
const newUser = await client.post('/users', {
  name: 'John Doe',
  email: 'john@example.com'
});
```

### With Plugins

```javascript
import { createClient } from 'advanced-client-fetch';
import { retryPlugin, cachePlugin } from 'advanced-client-fetch/plugins';

const client = createClient({
  baseURL: 'https://api.example.com',
  plugins: [
    retryPlugin({
      attempts: 3,
      delay: 1000,
      backoff: 'exponential'
    }),
    cachePlugin({
      ttl: 300000, // 5 minutes
      storage: 'memory'
    })
  ]
});
```

### Axios Compatibility

```javascript
import { createAxiosAdapter } from 'advanced-client-fetch/axios-adapter';

const axios = createAxiosAdapter({
  baseURL: 'https://api.example.com',
  timeout: 5000
});

// Use exactly like Axios
const response = await axios.get('/users');
```

### Platform Presets

```javascript
import { browserPreset, nodePreset } from 'advanced-client-fetch/presets';

// Browser-optimized client
const browserClient = browserPreset({
  baseURL: 'https://api.example.com'
});

// Node.js-optimized client
const nodeClient = nodePreset({
  baseURL: 'https://api.example.com'
});
```

## 🔌 Available Plugins

- **Retry**: Smart retry with exponential backoff
- **Cache**: Memory and persistent caching
- **Rate Limiting**: Request rate limiting
- **Circuit Breaker**: Fault tolerance
- **Deduplication**: Request deduplication
- **Metrics**: Performance monitoring
- **Timeout**: Request timeout handling

## 🌐 Platform Support

- ✅ **Node.js** 18+
- ✅ **Browsers** (modern)
- ✅ **Edge Runtime** (Vercel, Cloudflare)
- ✅ **Deno** 1.0+
- ✅ **Bun** 1.0+

## 📊 Bundle Size

- **Core**: ~2.5KB gzipped
- **With Plugins**: ~8KB gzipped
- **Full Package**: ~15KB gzipped

## 🧪 Testing

```bash
npm test
npm run test:watch
npm run test:coverage
```

## 📚 API Reference

### Core API

```javascript
import { 
  createClient,
  createAxiosAdapter,
  HttpError,
  AbortError,
  NetworkError
} from 'advanced-client-fetch';
```

### Plugins API

```javascript
import { 
  retryPlugin,
  cachePlugin,
  rateLimitPlugin,
  circuitBreakerPlugin
} from 'advanced-client-fetch/plugins';
```

### Presets API

```javascript
import { 
  browserPreset,
  nodePreset,
  edgePreset,
  denoPreset,
  bunPreset
} from 'advanced-client-fetch/presets';
```

## 🔄 Migration from Axios

```javascript
// Before (Axios)
import axios from 'axios';
const response = await axios.get('/api/users');

// After (Advanced Client Fetch)
import { createClient } from 'advanced-client-fetch';
const client = createClient();
const response = await client.get('/api/users');
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [Axios](https://github.com/axios/axios)
- Built with [TypeScript](https://www.typescriptlang.org/)
- Powered by native [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)