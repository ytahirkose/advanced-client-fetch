/**
 * Axios adapter for Advanced Client Fetch
 * Provides Axios-compatible interface
 */

import { createClient } from 'advanced-client-fetch';
import type { ClientOptions } from 'advanced-client-fetch';
import type { AxiosRequestConfig, AxiosResponse, AxiosError, AxiosInstance, AxiosInterceptorManager } from './types';
import { AxiosErrorFactory, BaseAxiosError } from './errors';

export interface AxiosAdapterOptions extends ClientOptions {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  validateStatus?: (status: number) => boolean;
  transformRequest?: ((data: unknown, headers?: Record<string, string>) => unknown)[];
  transformResponse?: ((data: unknown) => unknown)[];
  paramsSerializer?: (params: Record<string, unknown>) => string;
  maxRedirects?: number;
  withCredentials?: boolean;
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer' | 'stream' | 'document';
}

export interface AxiosAdapterInstance extends AxiosInstance {
  defaults: AxiosRequestConfig;
  interceptors: {
    request: AxiosInterceptorManager<AxiosRequestConfig>;
    response: AxiosInterceptorManager<AxiosResponse>;
  };
}

/**
 * Create Axios-compatible adapter
 */
export function createAxiosAdapter(options: AxiosAdapterOptions = {}): AxiosAdapterInstance {
  const client = createClient({
    baseURL: options.baseURL,
    timeout: options.timeout,
    headers: options.headers,
    validateStatus: options.validateStatus,
    paramsSerializer: options.paramsSerializer,
    maxRedirects: options.maxRedirects,
    withCredentials: options.withCredentials,
    ...options
  });

  // Request/Response interceptors storage
  const requestInterceptors: Array<{
    id: number;
    onFulfilled?: (config: AxiosRequestConfig) => AxiosRequestConfig | Promise<AxiosRequestConfig>;
    onRejected?: (error: AxiosError) => AxiosError | Promise<AxiosError>;
  }> = [];
  
  const responseInterceptors: Array<{
    id: number;
    onFulfilled?: (response: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>;
    onRejected?: (error: AxiosError) => AxiosError | Promise<AxiosError>;
  }> = [];

  let interceptorId = 0;

  // Convert Advanced Client Fetch response to Axios response
  function convertResponse(response: Response, config: AxiosRequestConfig): AxiosResponse {
    return {
      data: response.body,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      config,
      request: response
    };
  }

  // Convert Axios config to Advanced Client Fetch options
  function convertConfig(config: AxiosRequestConfig): ClientOptions {
    return {
      method: config.method?.toUpperCase() as any,
      headers: config.headers,
      body: config.data,
      timeout: config.timeout,
      signal: config.signal,
      query: config.params,
      responseType: config.responseType,
    };
  }

  // Apply request interceptors
  async function applyRequestInterceptors(config: AxiosRequestConfig): Promise<AxiosRequestConfig> {
    let processedConfig = config;
    for (const interceptor of requestInterceptors) {
      if (interceptor.onFulfilled) {
        processedConfig = await interceptor.onFulfilled(processedConfig);
      }
    }
    return processedConfig;
  }

  // Apply response interceptors
  async function applyResponseInterceptors(response: AxiosResponse): Promise<AxiosResponse> {
    let processedResponse = response;
    for (const interceptor of responseInterceptors) {
      if (interceptor.onFulfilled) {
        processedResponse = await interceptor.onFulfilled(processedResponse);
      }
    }
    return processedResponse;
  }

  // Apply error interceptors
  async function applyErrorInterceptors(error: AxiosError): Promise<AxiosError> {
    let processedError = error;
    for (const interceptor of responseInterceptors) {
      if (interceptor.onRejected) {
        processedError = await interceptor.onRejected(processedError);
      }
    }
    return processedError;
  }

  // Axios-like interface
  const adapter: AxiosAdapterInstance = {
    // HTTP methods
    get: async (url: string, config?: AxiosRequestConfig) => {
      try {
        const processedConfig = await applyRequestInterceptors({ ...config, method: 'GET', url });
        const response = await client.get(url, convertConfig(processedConfig));
        const axiosResponse = convertResponse(response, processedConfig);
        return await applyResponseInterceptors(axiosResponse);
      } catch (error) {
        throw await applyErrorInterceptors(transformError(error as Error, { method: 'GET', url }));
      }
    },

    post: async (url: string, data?: unknown, config?: AxiosRequestConfig) => {
      try {
        const processedConfig = await applyRequestInterceptors({ ...config, method: 'POST', url, data });
        const response = await client.post(url, data, convertConfig(processedConfig));
        const axiosResponse = convertResponse(response, processedConfig);
        return await applyResponseInterceptors(axiosResponse);
      } catch (error) {
        throw await applyErrorInterceptors(transformError(error as Error, { method: 'POST', url, data }));
      }
    },

    put: async (url: string, data?: unknown, config?: AxiosRequestConfig) => {
      try {
        const processedConfig = await applyRequestInterceptors({ ...config, method: 'PUT', url, data });
        const response = await client.put(url, data, convertConfig(processedConfig));
        const axiosResponse = convertResponse(response, processedConfig);
        return await applyResponseInterceptors(axiosResponse);
      } catch (error) {
        throw await applyErrorInterceptors(transformError(error as Error, { method: 'PUT', url, data }));
      }
    },

    patch: async (url: string, data?: unknown, config?: AxiosRequestConfig) => {
      try {
        const processedConfig = await applyRequestInterceptors({ ...config, method: 'PATCH', url, data });
        const response = await client.patch(url, data, convertConfig(processedConfig));
        const axiosResponse = convertResponse(response, processedConfig);
        return await applyResponseInterceptors(axiosResponse);
      } catch (error) {
        throw await applyErrorInterceptors(transformError(error as Error, { method: 'PATCH', url, data }));
      }
    },

    delete: async (url: string, config?: AxiosRequestConfig) => {
      try {
        const processedConfig = await applyRequestInterceptors({ ...config, method: 'DELETE', url });
        const response = await client.delete(url, convertConfig(processedConfig));
        const axiosResponse = convertResponse(response, processedConfig);
        return await applyResponseInterceptors(axiosResponse);
      } catch (error) {
        throw await applyErrorInterceptors(transformError(error as Error, { method: 'DELETE', url }));
      }
    },

    head: async (url: string, config?: AxiosRequestConfig) => {
      try {
        const processedConfig = await applyRequestInterceptors({ ...config, method: 'HEAD', url });
        const response = await client.head(url, convertConfig(processedConfig));
        const axiosResponse = convertResponse(response, processedConfig);
        return await applyResponseInterceptors(axiosResponse);
      } catch (error) {
        throw await applyErrorInterceptors(transformError(error as Error, { method: 'HEAD', url }));
      }
    },

    options: async (url: string, config?: AxiosRequestConfig) => {
      try {
        const processedConfig = await applyRequestInterceptors({ ...config, method: 'OPTIONS', url });
        const response = await client.options(url, convertConfig(processedConfig));
        const axiosResponse = convertResponse(response, processedConfig);
        return await applyResponseInterceptors(axiosResponse);
      } catch (error) {
        throw await applyErrorInterceptors(transformError(error as Error, { method: 'OPTIONS', url }));
      }
    },

    // Request method with full config
    request: async (config: AxiosRequestConfig) => {
      try {
        const processedConfig = await applyRequestInterceptors(config);
        const method = processedConfig.method?.toLowerCase() || 'get';
        const url = processedConfig.url!;
        const data = processedConfig.data;
        
        let response: Response;
        switch (method) {
          case 'get':
            response = await client.get(url, convertConfig(processedConfig));
            break;
          case 'post':
            response = await client.post(url, data, convertConfig(processedConfig));
            break;
          case 'put':
            response = await client.put(url, data, convertConfig(processedConfig));
            break;
          case 'patch':
            response = await client.patch(url, data, convertConfig(processedConfig));
            break;
          case 'delete':
            response = await client.delete(url, convertConfig(processedConfig));
            break;
          case 'head':
            response = await client.head(url, convertConfig(processedConfig));
            break;
          case 'options':
            response = await client.options(url, convertConfig(processedConfig));
            break;
          default:
            throw new Error(`Unsupported method: ${method}`);
        }
        
        const axiosResponse = convertResponse(response, processedConfig);
        return await applyResponseInterceptors(axiosResponse);
      } catch (error) {
        throw await applyErrorInterceptors(transformError(error as Error, config));
      }
    },

    // Axios interceptors
    interceptors: {
      request: {
        use: (onFulfilled?: (config: AxiosRequestConfig) => AxiosRequestConfig | Promise<AxiosRequestConfig>, onRejected?: (error: AxiosError) => AxiosError | Promise<AxiosError>) => {
          const id = ++interceptorId;
          requestInterceptors.push({ id, onFulfilled, onRejected });
          return id;
        },
        eject: (id: number) => {
          const index = requestInterceptors.findIndex(i => i.id === id);
          if (index !== -1) {
            requestInterceptors.splice(index, 1);
          }
        },
        clear: () => {
          requestInterceptors.length = 0;
        }
      },
      response: {
        use: (onFulfilled?: (response: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>, onRejected?: (error: AxiosError) => AxiosError | Promise<AxiosError>) => {
          const id = ++interceptorId;
          responseInterceptors.push({ id, onFulfilled, onRejected });
          return id;
        },
        eject: (id: number) => {
          const index = responseInterceptors.findIndex(i => i.id === id);
          if (index !== -1) {
            responseInterceptors.splice(index, 1);
          }
        },
        clear: () => {
          responseInterceptors.length = 0;
        }
      }
    },
    
    // Axios defaults
    defaults: {
      headers: options.headers || {},
      timeout: options.timeout || 0,
      baseURL: options.baseURL,
      validateStatus: options.validateStatus || ((status: number) => status >= 200 && status < 300),
      transformRequest: options.transformRequest || [],
      transformResponse: options.transformResponse || [],
      paramsSerializer: options.paramsSerializer,
      maxRedirects: options.maxRedirects || 5,
      withCredentials: options.withCredentials || false,
      responseType: options.responseType || 'json'
    },

    // Additional Axios-like properties
    create: (config?: AxiosAdapterOptions) => createAxiosAdapter({ ...options, ...config }),
    
    // Cancel token support (simplified)
    CancelToken: {
      source: () => ({
        token: new AbortController().signal,
        cancel: (message?: string) => {
          console.log('Cancel token triggered:', message);
        }
      })
    },
    
    // Axios version
    VERSION: '1.0.0'
  };

  return adapter;
}

/**
 * Transform error to Axios-compatible error
 */
function transformError(error: Error, config: AxiosRequestConfig): AxiosError {
  if (error.name === 'AbortError') {
    return AxiosErrorFactory.createAbortError(error.message, config);
  }
  
  if (error.message.includes('timeout')) {
    return AxiosErrorFactory.createTimeoutError(error.message, config);
  }
  
  if (error.message.includes('network') || error.message.includes('fetch')) {
    return AxiosErrorFactory.createNetworkError(error.message, config);
  }
  
  // Generic error
  return new BaseAxiosError(error.message, config);
}

// Default export

// Named exports
export { createAxiosAdapter as createAdapter };
export { createAxiosAdapter as createAxiosInstance };

// Re-export types
export type { AxiosRequestConfig, AxiosResponse, AxiosError, AxiosInstance } from './types.js';