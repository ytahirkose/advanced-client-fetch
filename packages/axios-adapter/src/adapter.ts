/**
 * Axios Adapter for HyperHTTP
 * Provides axios-compatible API using HyperHTTP core
 */

import { createClient, RequestOptions, type Response } from 'hyperhttp-core';
import type { 
  AxiosInstance, 
  AxiosRequestConfig, 
  AxiosResponse, 
  AxiosStatic
} from './types';
import { AxiosInterceptorManager } from './interceptors';
import { 
  applyRequestTransformers, 
  applyResponseTransformers,
  defaultRequestTransformers,
  defaultResponseTransformers
} from './transformers';

/**
 * Convert Axios config to HyperHTTP options
 */
function convertAxiosConfigToHyperHTTP(config: AxiosRequestConfig): RequestOptions {
  // Apply request transformers to data
  let transformedData = config.data;
  if (transformedData && config.transformRequest) {
    const headers = new Headers(config.headers);
    transformedData = applyRequestTransformers(transformedData, headers, config.transformRequest);
  } else if (transformedData) {
    const headers = new Headers(config.headers);
    transformedData = applyRequestTransformers(transformedData, headers, defaultRequestTransformers);
  }

  return {
    url: config.url || '',
    method: config.method as any,
    headers: config.headers,
    query: config.params,
    body: transformedData,
    signal: config.signal,
    timeout: config.timeout,
    responseType: config.responseType as any,
    meta: {
      ...config.meta,
      baseURL: config.baseURL,
    },
  };
}

/**
 * Convert HyperHTTP response to Axios response
 */
async function convertHyperHTTPResponseToAxios(
  response: Response, 
  config: AxiosRequestConfig
): Promise<AxiosResponse> {
  // Get response data based on response type
  let data = response.body;
  
  // Handle different response types
  try {
    if (config.responseType === 'json' || !config.responseType) {
      try {
        data = await response.json();
      } catch {
        data = await response.text();
      }
    } else if (config.responseType === 'text') {
      data = await response.text();
    } else if (config.responseType === 'blob') {
      data = await response.blob();
    } else if (config.responseType === 'arraybuffer') {
      data = await response.arrayBuffer();
    } else {
      // Default to text
      data = await response.text();
    }
  } catch (error) {
    // Fallback to text if other methods fail
    try {
      data = await response.text();
    } catch (textError) {
      // If even text fails, return empty string
      data = '';
    }
  }

  // Apply response transformers
  if (config.transformResponse) {
    const headers = response.headers || new Headers();
    data = applyResponseTransformers(data, headers, config.transformResponse);
  } else {
    const headers = response.headers || new Headers();
    if (defaultResponseTransformers) {
      data = applyResponseTransformers(data, headers, defaultResponseTransformers);
    }
  }

  return {
    data,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
    config,
    request: response,
  };
}

/**
 * Create axios-compatible instance
 */
export function createAxiosInstance(config: AxiosRequestConfig = {}): AxiosInstance {
  const hyperClient = createClient({
    baseURL: config.baseURL,
    headers: config.headers,
  });

  // Create interceptor managers
  const requestInterceptors = new AxiosInterceptorManager<AxiosRequestConfig>();
  const responseInterceptors = new AxiosInterceptorManager<AxiosResponse>();

  const axiosInstance = {
    async request<T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
      try {
        // Run request interceptors
        const processedConfig = await requestInterceptors.runHandlers(config);
        
        const hyperOptions = convertAxiosConfigToHyperHTTP(processedConfig);
        const response = await hyperClient.request<Response>(hyperOptions);
        const axiosResponse = await convertHyperHTTPResponseToAxios(response, processedConfig) as AxiosResponse<T>;
        
        // Run response interceptors
        return await responseInterceptors.runHandlers(axiosResponse);
      } catch (error) {
        // Run error interceptors
        throw await responseInterceptors.runErrorHandlers(error);
      }
    },

    get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
      return axiosInstance.request<T>({ ...config, url, method: 'GET' });
    },

    post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
      return axiosInstance.request<T>({ ...config, url, method: 'POST', data });
    },

    put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
      return axiosInstance.request<T>({ ...config, url, method: 'PUT', data });
    },

    patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
      return axiosInstance.request<T>({ ...config, url, method: 'PATCH', data });
    },

    delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
      return axiosInstance.request<T>({ ...config, url, method: 'DELETE' });
    },

    head<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
      return axiosInstance.request<T>({ ...config, url, method: 'HEAD' });
    },

    options<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
      return axiosInstance.request<T>({ ...config, url, method: 'OPTIONS' });
    },

    create(config?: AxiosRequestConfig): AxiosInstance {
      return createAxiosInstance({ ...config });
    },

    defaults: config,
    interceptors: {
      request: requestInterceptors,
      response: responseInterceptors,
    },
  };

  return axiosInstance;
}

/**
 * Create axios static instance
 */
export function createAxiosStatic(): AxiosStatic {
  const axios = createAxiosInstance();
  
  return {
    ...axios,
    create: (config?: AxiosRequestConfig) => createAxiosInstance(config),
    isAxiosError: (error: any): error is any => {
      return error && typeof error === 'object' && error.isAxiosError === true;
    },
  } as AxiosStatic;
}

// Re-export for convenience
export { createAxiosInstance as AxiosAdapter };
export { convertAxiosConfigToHyperHTTP };
export { convertHyperHTTPResponseToAxios };