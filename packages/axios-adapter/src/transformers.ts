/**
 * Request/Response transformers for Axios compatibility
 */

import type { Headers } from 'hyperhttp-core';

export function applyRequestTransformers(
  data: any,
  headers: Headers,
  transformers: Array<(data: any, headers: Headers) => any>
): any {
  let result = data;
  for (const transformer of transformers) {
    result = transformer(result, headers);
  }
  return result;
}

export function applyResponseTransformers(
  data: any,
  headers: Headers,
  transformers: Array<(data: any, headers: Headers) => any>
): any {
  let result = data;
  for (const transformer of transformers) {
    result = transformer(result, headers);
  }
  return result;
}

export const defaultRequestTransformers: Array<(data: any, headers: Headers) => any> = [
  createContentTypeTransformer(),
  createFormDataTransformer(),
  createURLSearchParamsTransformer(),
];

export const defaultResponseTransformers: Array<(data: any, headers: Headers) => any> = [
  createContentTypeResponseTransformer(),
  createXMLResponseTransformer(),
  createTextResponseTransformer(),
  createBinaryResponseTransformer(),
  createErrorResponseTransformer(),
  createStatusCodeResponseTransformer(),
  createPaginationResponseTransformer(),
  createRateLimitResponseTransformer(),
  createCacheResponseTransformer(),
  createCORSResponseTransformer(),
  createSecurityResponseTransformer(),
  createCustomHeadersResponseTransformer(),
  createMetadataResponseTransformer(),
  createDebugResponseTransformer(),
  createLoggingResponseTransformer(),
];

export function createContentTypeTransformer() {
  return (data: any, headers: Headers) => {
    if (data && typeof data === 'object' && !(data instanceof FormData) && !(data instanceof URLSearchParams)) {
      if (!headers.has('content-type')) {
        headers.set('content-type', 'application/json; charset=utf-8');
      }
      return JSON.stringify(data);
    }
    return data;
  };
}

export function createFormDataTransformer() {
  return (data: any, headers: Headers) => {
    if (data && typeof data === 'object' && !(data instanceof FormData)) {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value instanceof File || value instanceof Blob) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      });
      return formData;
    }
    return data;
  };
}

export function createURLSearchParamsTransformer() {
  return (data: any, headers: Headers) => {
    if (data && typeof data === 'object' && !(data instanceof URLSearchParams)) {
      const params = new URLSearchParams();
      Object.entries(data).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, String(v)));
        } else {
          params.append(key, String(value));
        }
      });
      if (!headers.has('content-type')) {
        headers.set('content-type', 'application/x-www-form-urlencoded; charset=utf-8');
      }
      return params.toString();
    }
    return data;
  };
}

export function createContentTypeResponseTransformer() {
  return (data: any, headers: Headers) => {
    const contentType = headers.get('content-type');
    if (contentType?.includes('application/json')) {
      try {
        return JSON.parse(data);
      } catch {
        return data;
      }
    }
    return data;
  };
}

export function createXMLResponseTransformer() {
  return (data: any, headers: Headers) => {
    const contentType = headers.get('content-type');
    if (contentType?.includes('application/xml') || contentType?.includes('text/xml')) {
      // Return as string for XML parsing
      return data;
    }
    return data;
  };
}

export function createTextResponseTransformer() {
  return (data: any, headers: Headers) => {
    const contentType = headers.get('content-type');
    if (contentType?.startsWith('text/')) {
      return data;
    }
    return data;
  };
}

export function createBinaryResponseTransformer() {
  return (data: any, headers: Headers) => {
    const contentType = headers.get('content-type');
    if (contentType?.includes('application/octet-stream') || 
        contentType?.includes('image/') ||
        contentType?.includes('video/') ||
        contentType?.includes('audio/')) {
      return data;
    }
    return data;
  };
}

export function createErrorResponseTransformer() {
  return (data: any, _headers: Headers) => {
    // Handle error responses
    if (data && typeof data === 'object' && data.error) {
      return data;
    }
    return data;
  };
}

export function createStatusCodeResponseTransformer() {
  return (data: any, _headers: Headers) => {
    // Handle status code specific transformations
    return data;
  };
}

export function createPaginationResponseTransformer() {
  return (data: any, headers: Headers) => {
    // Extract pagination info from headers
    const pagination = {
      page: parseInt(headers.get('x-page') || '1'),
      perPage: parseInt(headers.get('x-per-page') || '10'),
      total: parseInt(headers.get('x-total') || '0'),
      totalPages: parseInt(headers.get('x-total-pages') || '1')
    };

    if (pagination.total > 0) {
      return {
        data,
        pagination
      };
    }
    return data;
  };
}

export function createRateLimitResponseTransformer() {
  return (data: any, headers: Headers) => {
    const rateLimit = {
      limit: parseInt(headers.get('x-ratelimit-limit') || '0'),
      remaining: parseInt(headers.get('x-ratelimit-remaining') || '0'),
      reset: parseInt(headers.get('x-ratelimit-reset') || '0')
    };

    if (rateLimit.limit > 0) {
      return {
        data,
        rateLimit
      };
    }
    return data;
  };
}

export function createCacheResponseTransformer() {
  return (data: any, headers: Headers) => {
    const cache = {
      hit: headers.get('x-cache') === 'HIT',
      age: parseInt(headers.get('x-cache-age') || '0'),
      expires: headers.get('cache-control')?.includes('max-age'),
      etag: headers.get('etag'),
      lastModified: headers.get('last-modified')
    };

    if (cache.hit || cache.etag || cache.lastModified) {
      return {
        data,
        cache
      };
    }
    return data;
  };
}

export function createCORSResponseTransformer() {
  return (data: any, headers: Headers) => {
    const cors = {
      allowOrigin: headers.get('access-control-allow-origin'),
      allowMethods: headers.get('access-control-allow-methods'),
      allowHeaders: headers.get('access-control-allow-headers'),
      allowCredentials: headers.get('access-control-allow-credentials') === 'true'
    };

    if (cors.allowOrigin) {
      return {
        data,
        cors
      };
    }
    return data;
  };
}

export function createSecurityResponseTransformer() {
  return (data: any, headers: Headers) => {
    const security = {
      contentSecurityPolicy: headers.get('content-security-policy'),
      xFrameOptions: headers.get('x-frame-options'),
      xContentTypeOptions: headers.get('x-content-type-options'),
      strictTransportSecurity: headers.get('strict-transport-security'),
      xXSSProtection: headers.get('x-xss-protection')
    };

    // Only add security info if any security headers are present
    if (Object.values(security).some(value => value !== null)) {
      return {
        data,
        security
      };
    }
    return data;
  };
}

export function createCustomHeadersResponseTransformer(headerNames: string[] = []) {
  return (data: any, headers: Headers) => {
    if (headerNames.length === 0) return data;
    
    const customHeaders: Record<string, string> = {};
    headerNames.forEach(name => {
      const value = headers.get(name);
      if (value) {
        customHeaders[name] = value;
      }
    });

    if (Object.keys(customHeaders).length > 0) {
      return {
        data,
        customHeaders
      };
    }
    return data;
  };
}

export function createMetadataResponseTransformer() {
  return (data: any, headers: Headers) => {
    const metadata = {
      server: headers.get('server'),
      date: headers.get('date'),
      contentLength: headers.get('content-length'),
      contentType: headers.get('content-type'),
      lastModified: headers.get('last-modified'),
      etag: headers.get('etag'),
      expires: headers.get('expires'),
      age: headers.get('age')
    };

    // Only add metadata if any metadata headers are present
    if (Object.values(metadata).some(value => value !== null)) {
      return {
        data,
        metadata
      };
    }
    return data;
  };
}

export function createDebugResponseTransformer() {
  return (data: any, headers: Headers) => {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG) {
      console.log('Response Debug:', {
        data,
        headers: Object.fromEntries(headers.entries()),
        timestamp: new Date().toISOString()
      });
    }
    return data;
  };
}

export function createLoggingResponseTransformer(logger?: (message: string) => void) {
  const log = logger || console.log;
  return (data: any, headers: Headers) => {
    log(`Response: ${JSON.stringify(data)}`);
    return data;
  };
}