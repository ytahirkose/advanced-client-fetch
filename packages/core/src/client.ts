/**
 * Core HTTP client implementation
 */

import type {
  Client,
  ClientOptions,
  RequestOptions,
  Context,
  Transport,
  ResponseType,
  HttpMethod,
} from './types';
import { compose } from './compose';
import { buildURL, mergeHeaders, normalizeBody, generateRequestId } from './utils';
import { combineTimeoutAndSignal } from './signal';
import { 
  AdvancedClientFetchError, 
  AdvancedClientFetchAbortError, 
  NetworkError, 
  TimeoutError,
  ClientError,
  ServerError,
  BaseHttpError
} from './errors';

/**
 * Create a new HTTP client
 */
export function createClient(options: ClientOptions = {}): Client {
  const {
    baseURL,
    headers: defaultHeaders = {},
    transport = defaultTransport,
    plugins = [],
    timeout = 0,
    signal,
    paramsSerializer = defaultParamsSerializer,
    validateStatus = defaultValidateStatus,
    maxRedirects = 5,
    withCredentials = false,
  } = options;

  // Use provided plugins
  const allMiddleware = [...plugins];

  const run = compose(allMiddleware);

  async function request<T = any>(requestOptions: RequestOptions): Promise<T> {
    // Build URL
    const url = buildURL(baseURL, requestOptions.url, requestOptions.query, paramsSerializer);
    
    // Merge headers
    const headers = mergeHeaders(defaultHeaders, requestOptions.headers);
    
    // Normalize body
    const body = normalizeBody(requestOptions.body, headers);
    
    // Combine timeout and signal
    const { signal: combinedSignal, cleanup } = combineTimeoutAndSignal(
      requestOptions.signal || signal, 
      requestOptions.timeout || timeout
    );
    
    // Generate request ID
    const requestId = generateRequestId();
    
    try {
      // Create request
      const req = new Request(url, {
        method: requestOptions.method || 'GET',
        headers,
        body,
        signal: combinedSignal,
      });
      
      // Create context
      const context: Context = {
        request: req,
        response: undefined,
        error: undefined,
        retryCount: 0,
        startTime: performance.now(),
        metadata: {
          requestId,
          ...requestOptions.meta,
        },
        // Legacy properties
        req,
        res: undefined,
        signal: combinedSignal,
        meta: {
          requestId,
          startTime: performance.now(),
          ...requestOptions.meta,
        },
        state: {},
      };
      
      // Run middleware pipeline
      await run(context, async () => {
        try {
          context.response = await transport(context.request);
          context.res = context.response;
        } catch (error) {
          context.error = error as Error;
          throw error;
        }
      });
      
      if (!context.res) {
        throw new Error('No response from transport');
      }
      
      // Validate status
      if (!validateStatus(context.res.status)) {
        const status = context.res.status;
        const message = `Request failed with status ${status}`;
        
        if (status >= 400 && status < 500) {
          throw new ClientError(message, status, context.req, context.res, undefined, requestId);
        } else if (status >= 500) {
          throw new ServerError(message, status, context.req, context.res, undefined, requestId);
        } else {
          throw new AdvancedClientFetchError(message, status, context.req, context.res, undefined, requestId);
        }
      }
      
      // Handle response based on responseType
      return await handleResponse<T>(context.res, context.req, requestOptions.responseType);
      
    } catch (error) {
      throw transformError(error as Error, requestId);
    } finally {
      cleanup?.();
    }
  }

  // HTTP method shortcuts
  // Fast path for simple GET requests
  const createMethod = (method: HttpMethod) => {
    return <T = any>(url: string, options: Omit<RequestOptions, 'url' | 'method'> = {}): Promise<T> => {
      // Fast path for simple requests
      if (method === 'GET' && Object.keys(options).length === 0) {
        return request<T>({ url, method });
      }
      return request<T>({ ...options, url, method });
    };
  };

  const createMethodWithBody = (method: HttpMethod) => {
    return <T = unknown, D extends BodyInit | string | number | boolean | object | null = BodyInit | string | number | boolean | object | null>(
      url: string,
      data?: D,
      options: Omit<RequestOptions, 'url' | 'method' | 'body'> = {}
    ): Promise<T> => {
      return request<T>({ ...options, url, method, body: data });
    };
  };

  // Response type helpers
  const createResponseHelper = (responseType: ResponseType) => {
    return <T = any>(url: string, options: Omit<RequestOptions, 'url'> = {}): Promise<T> => {
      return request<T>({ ...options, url, responseType });
    };
  };

  return Object.assign(request, {
    request,
    get: createMethod('GET'),
    post: createMethodWithBody('POST'),
    put: createMethodWithBody('PUT'),
    patch: createMethodWithBody('PATCH'),
    delete: createMethod('DELETE'),
    head: createMethod('HEAD'),
    options: createMethod('OPTIONS'),
    json: createResponseHelper('json'),
    text: createResponseHelper('text'),
    blob: createResponseHelper('blob'),
    arrayBuffer: createResponseHelper('arrayBuffer'),
    stream: createResponseHelper('stream'),
  });
}

/**
 * Default transport function
 */
const defaultTransport: Transport = async (request: Request): Promise<Response> => {
  try {
    return await fetch(request);
  } catch (error) {
    throw new NetworkError(
      `Network error: ${(error as Error).message}`,
      request
    );
  }
};

/**
 * Default query parameter serializer
 */
const defaultParamsSerializer = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, String(v)));
      } else {
        searchParams.set(key, String(value));
      }
    }
  });
  
  return searchParams.toString();
};

/**
 * Default status validator
 */
const defaultValidateStatus = (status: number): boolean => {
  return status >= 200 && status < 300;
};

/**
 * Handle response based on response type
 */
async function handleResponse<T>(response: Response, request: Request, responseType?: ResponseType): Promise<T> {
  // Handle different response types
  try {
    switch (responseType) {
      case 'json':
        return await response.json() as T;
      case 'text':
        return await response.text() as T;
      case 'blob':
        return await response.blob() as T;
      case 'arrayBuffer':
        return await response.arrayBuffer() as T;
      case 'stream':
        return response.body as T;
      case 'document':
        // For document type, return the response as-is
        return response as T;
      default:
        // Auto-detect based on content type
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          return await response.json() as T;
        }
        if (contentType?.includes('text/')) {
          return await response.text() as T;
        }
        return response as T;
    }
  } catch (error) {
    throw new AdvancedClientFetchError(
      `Failed to parse response: ${(error as Error).message}`,
      response.status,
      request,
      response,
      error
    );
  }
}

/**
 * Transform error to appropriate type
 */
function transformError(error: Error, requestId?: string): Error {
  // Already transformed
  if (error instanceof BaseHttpError || error instanceof AdvancedClientFetchAbortError || error instanceof NetworkError) {
    return error;
  }
  
  // AbortError
  if (error.name === 'AbortError') {
    return new AdvancedClientFetchAbortError(error.message, 'aborted');
  }
  
  // Network errors
  if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('connection')) {
    return new NetworkError(
      `Network error: ${error.message}`,
      new Request('')
    );
  }
  
  // Timeout errors
  if (error.message.includes('timeout') || error.message.includes('timed out')) {
    return new AdvancedClientFetchAbortError(error.message, 'timeout');
  }
  
  // Generic error with request ID
  const genericError = new Error(`Request failed: ${error.message}`);
  if (requestId) {
    (genericError as any).requestId = requestId;
  }
  return genericError;
}

/**
 * Create a client with default configuration
 */
export function createDefaultClient(): Client {
  return createClient({
    headers: {
      'User-Agent': 'advanced-client-fetch/1.0.0',
    },
  });
}

/**
 * Create a client for a specific base URL
 */
export function createClientFor(baseURL: string, options: Omit<ClientOptions, 'baseURL'> = {}): Client {
  return createClient({
    ...options,
    baseURL,
  });
}

// Re-export types for convenience
export type { Client, ClientOptions } from './types';