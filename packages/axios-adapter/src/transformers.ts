/**
 * Request/Response transformers for Axios compatibility
 */

// Headers type - using Record<string, string> for compatibility
type Headers = Record<string, string>;

export function applyRequestTransformers<T = unknown>(
  data: T,
  headers: Headers,
  transformers: Array<(data: unknown, headers: Headers) => unknown>
): T {
  let result: any = data;
  for (const transformer of transformers) {
    result = transformer(result, headers);
  }
  return result as T;
}

export function applyResponseTransformers<T = unknown>(
  data: T,
  headers: Headers,
  transformers: Array<(data: unknown, headers: Headers) => unknown>
): T {
  let result: any = data;
  for (const transformer of transformers) {
    result = transformer(result, headers);
  }
  return result as T;
}

export const defaultRequestTransformers: Array<(data: unknown, headers: Headers) => unknown> = [
  createContentTypeTransformer(),
  createFormDataTransformer(),
  createURLSearchParamsTransformer(),
];

export const defaultResponseTransformers: Array<(data: unknown, headers: Headers) => unknown> = [
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

// Request Transformers
export function createContentTypeTransformer() {
  return (data: unknown, headers: Headers) => {
    if (data && typeof data === 'object' && !(data instanceof FormData) && !(data instanceof URLSearchParams)) {
      if (!headers['content-type']) {
        headers['content-type'] = 'application/json; charset=utf-8';
      }
      return JSON.stringify(data);
    }
    return data;
  };
}

export function createFormDataTransformer() {
  return (data: any, _headers: Headers) => {
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
      if (!headers['content-type']) {
        headers['content-type'] = 'application/x-www-form-urlencoded; charset=utf-8';
      }
      return params.toString();
    }
    return data;
  };
}

// Response Transformers
export function createContentTypeResponseTransformer() {
  return (data: any, headers: Headers) => {
    const contentType = headers['content-type'] || '';
    
    if (contentType.includes('application/json')) {
      if (typeof data === 'string') {
        try {
          return JSON.parse(data);
        } catch {
          return data;
        }
      }
    } else if (contentType.includes('application/xml') || contentType.includes('text/xml')) {
      return data; // XML parsing would need additional library
    } else if (contentType.includes('text/')) {
      return data;
    }
    
    return data;
  };
}

export function createXMLResponseTransformer() {
  return (data: any, headers: Headers) => {
    const contentType = headers['content-type'] || '';
    if (contentType.includes('xml') && typeof data === 'string') {
      // Basic XML parsing - for full support, use DOMParser or xml2js
      return data;
    }
    return data;
  };
}

export function createTextResponseTransformer() {
  return (data: any, headers: Headers) => {
    const contentType = headers['content-type'] || '';
    if (contentType.includes('text/') && data instanceof ArrayBuffer) {
      return new TextDecoder().decode(data);
    }
    return data;
  };
}

export function createBinaryResponseTransformer() {
  return (data: any, headers: Headers) => {
    const contentType = headers['content-type'] || '';
    if (contentType.includes('application/octet-stream') || contentType.includes('image/')) {
      if (data instanceof ArrayBuffer) {
        return new Blob([data]);
      }
    }
    return data;
  };
}

export function createErrorResponseTransformer() {
  return (data: any, headers: Headers) => {
    const status = parseInt(headers['status'] || '200');
    if (status >= 400) {
      const error = new Error(`HTTP ${status}`);
      (error as any).status = status;
      (error as any).data = data;
      (error as any).headers = headers;
      throw error;
    }
    return data;
  };
}

export function createStatusCodeResponseTransformer() {
  return (data: any, headers: Headers) => {
    const status = parseInt(headers['status'] || '200');
    return {
      data,
      status,
      statusText: headers['status-text'] || '',
      headers,
      config: {}
    };
  };
}

export function createPaginationResponseTransformer() {
  return (data: any, headers: Headers) => {
    const linkHeader = headers['link'];
    if (linkHeader) {
      const pagination = parseLinkHeader(linkHeader);
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
    const rateLimitRemaining = headers['x-ratelimit-remaining'];
    const rateLimitReset = headers['x-ratelimit-reset'];
    
    if (rateLimitRemaining !== undefined || rateLimitReset !== undefined) {
      return {
        data,
        rateLimit: {
          remaining: rateLimitRemaining ? parseInt(rateLimitRemaining) : undefined,
          reset: rateLimitReset ? parseInt(rateLimitReset) : undefined
        }
      };
    }
    return data;
  };
}

export function createCacheResponseTransformer() {
  return (data: any, headers: Headers) => {
    const cacheControl = headers['cache-control'];
    const etag = headers['etag'];
    const lastModified = headers['last-modified'];
    
    if (cacheControl || etag || lastModified) {
      return {
        data,
        cache: {
          control: cacheControl,
          etag,
          lastModified
        }
      };
    }
    return data;
  };
}

export function createCORSResponseTransformer() {
  return (data: any, headers: Headers) => {
    const corsHeaders = ['access-control-allow-origin', 'access-control-allow-methods', 'access-control-allow-headers'];
    const corsInfo: Record<string, string> = {};
    
    corsHeaders.forEach(header => {
      if (headers[header]) {
        corsInfo[header] = headers[header];
      }
    });
    
    if (Object.keys(corsInfo).length > 0) {
      return {
        data,
        cors: corsInfo
      };
    }
    return data;
  };
}

export function createSecurityResponseTransformer() {
  return (data: any, headers: Headers) => {
    const securityHeaders = ['strict-transport-security', 'x-content-type-options', 'x-frame-options'];
    const securityInfo: Record<string, string> = {};
    
    securityHeaders.forEach(header => {
      if (headers[header]) {
        securityInfo[header] = headers[header];
      }
    });
    
    if (Object.keys(securityInfo).length > 0) {
      return {
        data,
        security: securityInfo
      };
    }
    return data;
  };
}

export function createCustomHeadersResponseTransformer() {
  return (data: any, headers: Headers) => {
    const customHeaders: Record<string, string> = {};
    Object.entries(headers).forEach(([key, value]) => {
      if (key.startsWith('x-') || key.startsWith('custom-')) {
        customHeaders[key] = value;
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
      timestamp: new Date().toISOString(),
      contentType: headers['content-type'],
      contentLength: headers['content-length'],
      server: headers['server'],
      date: headers['date']
    };
    
    return {
      data,
      metadata
    };
  };
}

export function createDebugResponseTransformer() {
  return (data: any, headers: Headers) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Response Debug:', {
        data,
        headers,
        timestamp: new Date().toISOString()
      });
    }
    return data;
  };
}

export function createLoggingResponseTransformer(logger?: (message: string) => void) {
  const log = logger || console.log;
  return (data: any, _headers: Headers) => {
    log(`Response: ${JSON.stringify(data)}`);
    return data;
  };
}

// Utility functions
function parseLinkHeader(linkHeader: string): Record<string, string> {
  const links: Record<string, string> = {};
  const linkRegex = /<([^>]+)>;\s*rel="([^"]+)"/g;
  let match;
  
  while ((match = linkRegex.exec(linkHeader)) !== null) {
    links[match[2]] = match[1];
  }
  
  return links;
}