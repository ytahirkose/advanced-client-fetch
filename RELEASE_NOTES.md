# 🚀 HyperHTTP v1.0.0 - Initial Release

## 🎉 What's New

HyperHTTP is now officially released! The modern HTTP client that's more powerful than Axios, works across all platforms, and solves real-world problems.

## 📦 Packages Released

- **@hyperhttp/core@1.0.0** - Core HTTP client with fetch-first design
- **@hyperhttp/plugins@1.0.0** - Powerful plugins for retry, cache, rate limiting, and more
- **@hyperhttp/presets@1.0.0** - Platform-specific configurations
- **@hyperhttp/axios-adapter@1.0.0** - Drop-in Axios replacement

## ✨ Key Features

### 🚀 **Core Features**
- **Fetch-first design** - Built on native fetch API
- **Plugin architecture** - Koa-like middleware system
- **Platform independent** - Works on Node.js, Edge, Deno, Bun, and browsers
- **Zero dependencies** - Minimal core with optional plugins
- **TypeScript first** - Full type safety and IntelliSense

### 🔌 **Powerful Plugins**
- **Retry** - Smart retry with exponential backoff and jitter
- **Cache** - HTTP caching with SWR support
- **Rate Limiting** - Request throttling and queue management
- **Circuit Breaker** - Fault tolerance and cascading failure prevention
- **Deduplication** - Prevent duplicate requests
- **Metrics** - Performance monitoring and analytics
- **Timeout** - Request timeout management

### 🌍 **Platform Presets**
- **Node.js** - Full-featured with agent options
- **Edge Runtime** - Optimized for Vercel, Cloudflare Workers
- **Browser** - CORS-friendly with cookie management
- **Deno** - Native Deno support
- **Bun** - Optimized for Bun runtime

### 🔄 **Axios Compatibility**
- **Drop-in replacement** - Same API as Axios
- **Solves CORS issues** - Works in Edge runtimes
- **Better performance** - Smaller bundle size
- **Modern features** - Built on HyperHTTP core

## 🛠️ **Installation**

```bash
# Core package
npm install @hyperhttp/core

# With plugins
npm install @hyperhttp/plugins

# Platform presets
npm install @hyperhttp/presets

# Axios adapter
npm install @hyperhttp/axios-adapter
```

## 📖 **Quick Start**

```typescript
import { createClient } from '@hyperhttp/core';
import { retry, cache, timeout } from '@hyperhttp/plugins';

const client = createClient({
  baseURL: 'https://api.example.com',
  plugins: [
    retry({ attempts: 3 }),
    cache({ ttl: 300000 }),
    timeout(5000)
  ]
});

// Make requests
const data = await client.get('/users');
```

## 🔧 **Migration from Axios**

```typescript
// Before (Axios)
import axios from 'axios';
const response = await axios.get('/api/data');

// After (HyperHTTP Axios Adapter)
import axios from '@hyperhttp/axios-adapter';
const response = await axios.get('/api/data');
// Same API, better performance!
```

## 📊 **Bundle Sizes**

- **@hyperhttp/core**: ~13KB (gzipped)
- **@hyperhttp/plugins**: ~1.6KB (gzipped)
- **@hyperhttp/presets**: ~1.7KB (gzipped)
- **@hyperhttp/axios-adapter**: ~15KB (gzipped)

## 🎯 **Why HyperHTTP?**

1. **Solves real problems** - CORS, cookies, Edge runtime compatibility
2. **Better than Axios** - Smaller, faster, more features
3. **Modern architecture** - Plugin-based, tree-shakable
4. **Platform agnostic** - Works everywhere
5. **Production ready** - Built-in resilience features

## 📚 **Documentation**

- [Full Documentation](https://github.com/ytahirkose/HyperHTTP)
- [API Reference](https://github.com/ytahirkose/HyperHTTP/blob/main/docs/api.md)
- [Examples](https://github.com/ytahirkose/HyperHTTP/tree/main/examples)

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guide](https://github.com/ytahirkose/HyperHTTP/blob/main/CONTRIBUTING.md).

## 📄 **License**

MIT License - see [LICENSE](https://github.com/ytahirkose/HyperHTTP/blob/main/LICENSE) for details.

---

**Ready to upgrade your HTTP client? Install HyperHTTP today!** 🚀
