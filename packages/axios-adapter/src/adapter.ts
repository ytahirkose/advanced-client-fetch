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

/**
 * Convert Axios config to HyperHTTP options
 */
function convertAxiosConfigToHyperHTTP(config: AxiosRequestConfig): RequestOptions {
  return {
    url: config.url || '',
    method: config.method as any,
    headers: config.headers,
    query: config.params,
    body: config.data,
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
function convertHyperHTTPResponseToAxios(
  response: Response, 
  config: AxiosRequestConfig
): AxiosResponse {
  return {
    data: response.body,
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

  const axiosInstance = {
    async request<T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
      const hyperOptions = convertAxiosConfigToHyperHTTP(config);
      const response = await hyperClient.request<Response>(hyperOptions);
      return convertHyperHTTPResponseToAxios(response, config) as AxiosResponse<T>;
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
      request: {
        use: () => 0,
        eject: () => {},
        clear: () => {},
      },
      response: {
        use: () => 0,
        eject: () => {},
        clear: () => {},
      },
    } as any,
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