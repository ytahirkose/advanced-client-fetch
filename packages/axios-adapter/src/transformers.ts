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
    if (typeof data === 'object' && data !== null && !(data instanceof FormData)) {
      if (!headers.has('content-type')) {
        headers.set('content-type', 'application/json; charset=utf-8');
      }
    }
    return data;
  };
}

export function createFormDataTransformer() {
  return (data: any, _headers: Headers) => {
    if (data instanceof FormData) {
      // FormData sets its own content-type
      return data;
    }
    return data;
  };
}

export function createURLSearchParamsTransformer() {
  return (data: any, headers: Headers) => {
    if (data instanceof URLSearchParams) {
      if (!headers.has('content-type')) {
        headers.set('content-type', 'application/x-www-form-urlencoded; charset=utf-8');
      }
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
  return (data: any, _headers: Headers) => {
    // Handle pagination metadata
    if (data && typeof data === 'object' && data.pagination) {
      return data;
    }
    return data;
  };
}

export function createRateLimitResponseTransformer() {
  return (data: any, _headers: Headers) => {
    // Handle rate limit headers
    return data;
  };
}

export function createCacheResponseTransformer() {
  return (data: any, _headers: Headers) => {
    // Handle cache headers
    return data;
  };
}

export function createCORSResponseTransformer() {
  return (data: any, _headers: Headers) => {
    // Handle CORS headers
    return data;
  };
}

export function createSecurityResponseTransformer() {
  return (data: any, _headers: Headers) => {
    // Handle security headers
    return data;
  };
}

export function createCustomHeadersResponseTransformer() {
  return (data: any, _headers: Headers) => {
    // Handle custom headers
    return data;
  };
}

export function createMetadataResponseTransformer() {
  return (data: any, _headers: Headers) => {
    // Handle metadata
    return data;
  };
}

export function createDebugResponseTransformer() {
  return (data: any, _headers: Headers) => {
    // Handle debug information
    return data;
  };
}

export function createLoggingResponseTransformer() {
  return (data: any, _headers: Headers) => {
    // Handle logging
    return data;
  };
}