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
} from './types.js';
import { compose } from './compose.js';
import { buildURL, mergeHeaders, normalizeBody, generateRequestId } from './utils.js';
import { combineTimeoutAndSignal } from './signal.js';
import { HyperHttpError, HyperAbortError, NetworkError } from './errors.js';

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
  } = options;

  // Use provided plugins
  const allMiddleware = [...plugins];

  const run = compose(allMiddleware);

  async function request<T = any>(requestOptions: RequestOptions): Promise<T> {
    // Use the same middleware for all requests
    const runRequest = run;
    
    // Build URL
    const url = buildURL(baseURL, requestOptions.url, requestOptions.query);
    
    // Merge headers
    const headers = mergeHeaders(defaultHeaders, requestOptions.headers);
    
    // Normalize body
    const body = normalizeBody(requestOptions.body, headers);
    
    // Combine timeout and signal
    const { signal: combinedSignal, cleanup } = combineTimeoutAndSignal(requestOptions.signal, requestOptions.timeout || timeout);
    
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
        req,
        res: undefined,
        signal: combinedSignal || new AbortController().signal,
        meta: {
          requestId,
          startTime: Date.now(),
          ...requestOptions.meta,
        },
        state: {},
      };
      
      // Run middleware pipeline
      await runRequest(context, async () => {
        try {
          context.res = await transport(context.req);
        } catch (error) {
          context.error = error as Error;
          throw error;
        }
      });
      
      if (!context.res) {
        throw new Error('No response from transport');
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
  const createMethod = (method: HttpMethod) => {
    return <T = any>(url: string, options: Omit<RequestOptions, 'url' | 'method'> = {}): Promise<T> => {
      return request<T>({ ...options, url, method });
    };
  };

  const createMethodWithBody = (method: HttpMethod) => {
    return <T = any>(
      url: string,
      data?: any,
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
      request,
      error as Error
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
 * Handle response based on response type
 */
async function handleResponse<T>(response: Response, request: Request, responseType?: ResponseType): Promise<T> {
  // Check for HTTP errors
  if (!response.ok) {
    throw new HyperHttpError(
      `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      request,
      response
    );
  }
  
  // Handle different response types
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
}

/**
 * Transform error to appropriate type
 */
function transformError(error: Error, requestId?: string): Error {
  // Already transformed
  if (error instanceof HyperHttpError || error instanceof HyperAbortError || error instanceof NetworkError) {
    return error;
  }
  
  // AbortError
  if (error.name === 'AbortError') {
    return new HyperAbortError(error.message, 'aborted');
  }
  
  // Generic error
  return new Error(`Request failed: ${error.message}`);
}

/**
 * Create a client with default configuration
 */
export function createDefaultClient(): Client {
  return createClient({
    headers: {
      'User-Agent': 'hyperhttp/0.1.0',
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
