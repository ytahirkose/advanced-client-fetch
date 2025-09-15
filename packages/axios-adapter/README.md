# Advanced Client Fetch - Axios Adapter

[![npm version](https://img.shields.io/npm/v/advanced-client-fetch-axios-adapter.svg)](https://www.npmjs.com/package/advanced-client-fetch-axios-adapter)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/advanced-client-fetch-axios-adapter)](https://bundlephobia.com/package/advanced-client-fetch-axios-adapter)
[![License](https://img.shields.io/npm/l/advanced-client-fetch-axios-adapter.svg)](https://github.com/ytahirkose/advanced-client-fetch/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

🔄 **Axios-compatible adapter for Advanced Client Fetch.** Drop-in replacement for Axios with modern fetch-based architecture.

## ✨ Features

- 🎯 **Axios Compatible**: Drop-in replacement for Axios
- 🚀 **Modern Architecture**: Built on Advanced Client Fetch
- 🌐 **Platform Independent**: Works on Node.js, Browser, Edge, Deno, Bun
- 📦 **Lightweight**: Only ~3KB gzipped
- 🎨 **TypeScript**: Full type safety
- 🔄 **Interceptors**: Request and response interceptors
- ⚡ **Performance**: Better than Axios

## 📦 Installation

```bash
npm install advanced-client-fetch-axios-adapter
```

## 🚀 Quick Start

### Basic Usage

```javascript
import { createAxiosAdapter } from 'advanced-client-fetch-axios-adapter';

const axios = createAxiosAdapter({
  baseURL: 'https://api.example.com',
  timeout: 5000,
  headers: {
    'Authorization': 'Bearer your-token'
  }
});

// Use exactly like Axios
const response = await axios.get('/users');
const newUser = await axios.post('/users', {
  name: 'John Doe',
  email: 'john@example.com'
});
```

### With Interceptors

```javascript
import { createAxiosAdapter } from 'advanced-client-fetch-axios-adapter';

const axios = createAxiosAdapter({
  baseURL: 'https://api.example.com'
});

// Request interceptor
axios.interceptors.request.use(
  (config) => {
    config.headers.Authorization = `Bearer ${getToken()}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      redirectToLogin();
    }
    return Promise.reject(error);
  }
);
```

### Advanced Configuration

```javascript
import { createAxiosAdapter } from 'advanced-client-fetch-axios-adapter';

const axios = createAxiosAdapter({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'MyApp/1.0.0'
  },
  validateStatus: (status) => status < 500,
  transformRequest: [(data) => JSON.stringify(data)],
  transformResponse: [(data) => JSON.parse(data)],
  paramsSerializer: (params) => new URLSearchParams(params).toString()
});
```

## 🔄 Migration from Axios

```javascript
// Before (Axios)
import axios from 'axios';
const response = await axios.get('/api/users');

// After (Advanced Client Fetch Axios Adapter)
import { createAxiosAdapter } from 'advanced-client-fetch-axios-adapter';
const axios = createAxiosAdapter();
const response = await axios.get('/api/users');
```

## 📚 API Reference

### createAxiosAdapter(options)

Creates an Axios-compatible client.

**Options:**
- `baseURL?: string` - Base URL for requests
- `timeout?: number` - Request timeout in milliseconds
- `headers?: Record<string, string>` - Default headers
- `validateStatus?: (status: number) => boolean` - Status validation function
- `transformRequest?: any[]` - Request transformers
- `transformResponse?: any[]` - Response transformers
- `paramsSerializer?: (params: any) => string` - Params serializer

### Methods

- `get(url, config?)` - GET request
- `post(url, data?, config?)` - POST request
- `put(url, data?, config?)` - PUT request
- `patch(url, data?, config?)` - PATCH request
- `delete(url, config?)` - DELETE request
- `head(url, config?)` - HEAD request
- `options(url, config?)` - OPTIONS request

### Interceptors

- `interceptors.request.use(onFulfilled?, onRejected?)` - Request interceptor
- `interceptors.response.use(onFulfilled?, onRejected?)` - Response interceptor

## 🌐 Platform Support

- ✅ **Node.js** 18+
- ✅ **Browsers** (modern)
- ✅ **Edge Runtime** (Vercel, Cloudflare)
- ✅ **Deno** 1.0+
- ✅ **Bun** 1.0+

## 📊 Bundle Size

- **Size**: ~3KB gzipped
- **Dependencies**: Only `advanced-client-fetch`

## 🧪 Testing

```bash
npm test
npm run test:watch
npm run test:coverage
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
- Built with [Advanced Client Fetch](https://github.com/ytahirkose/advanced-client-fetch)
- Powered by native [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)