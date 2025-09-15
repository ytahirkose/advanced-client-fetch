/**
 * Axios-compatible types for Advanced Client Fetch
 */

import type { Request, Response } from '@advanced-client-fetch/core';

// Axios-compatible request config
export interface AxiosRequestConfig {
  url?: string;
  method?: string;
  baseURL?: string;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: unknown;
  timeout?: number;
  signal?: AbortSignal;
  validateStatus?: (status: number) => boolean;
  transformRequest?: ((data: unknown, headers?: Record<string, string>) => unknown)[];
  transformResponse?: ((data: unknown) => unknown)[];
  paramsSerializer?: (params: Record<string, any>) => string;
  maxRedirects?: number;
  withCredentials?: boolean;
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer' | 'stream' | 'document';
  maxContentLength?: number;
  maxBodyLength?: number;
  proxy?: {
    host: string;
    port: number;
    auth?: {
      username: string;
      password: string;
    };
  };
  auth?: {
    username: string;
    password: string;
  };
  xsrfCookieName?: string;
  xsrfHeaderName?: string;
  onUploadProgress?: (progressEvent: any) => void;
  onDownloadProgress?: (progressEvent: any) => void;
  cancelToken?: any;
  xsrfCookieName?: string;
  xsrfHeaderName?: string;
  proxy?: {
    host: string;
    port: number;
    auth?: {
      username: string;
      password: string;
    };
  };
  httpAgent?: any;
  httpsAgent?: any;
  adapter?: any;
  decompress?: boolean;
  maxRedirects?: number;
  socketPath?: string;
  httpAgent?: any;
  httpsAgent?: any;
  family?: 4 | 6;
  lookup?: any;
  beforeRedirect?: (options: any, responseDetails: any) => void;
  transitional?: {
    silentJSONParsing?: boolean;
    forcedJSONParsing?: boolean;
    clarifyTimeoutError?: boolean;
  };
  env?: {
    FormData?: any;
  };
  formSerializer?: {
    visitor?: (value: any, key: string, path: string, helpers: any) => any;
    dots?: boolean;
    metaTokens?: boolean;
    indexes?: boolean;
  };
  maxRate?: number | [number, number];
  onRateLimit?: (retryAfter: number, options: any) => void;
  onRedirect?: (options: any, responseDetails: any) => void;
  onResponse?: (response: AxiosResponse) => void;
  onError?: (error: AxiosError) => void;
}

// Axios-compatible response
export interface AxiosResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: AxiosRequestConfig;
  request: Request;
}

// Axios-compatible error
export interface AxiosError<T = any> extends Error {
  config: AxiosRequestConfig;
  code?: string;
  request?: Request;
  response?: AxiosResponse<T>;
  isAxiosError: boolean;
  toJSON(): object;
}

// Axios instance interface
export interface AxiosInstance {
  <T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  
  request<T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  head<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  options<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  
  defaults: AxiosRequestConfig;
  interceptors: {
    request: AxiosInterceptorManager<AxiosRequestConfig>;
    response: AxiosInterceptorManager<AxiosResponse>;
  };
  
  create(config?: AxiosRequestConfig): AxiosInstance;
  getUri(config?: AxiosRequestConfig): string;
  CancelToken: any;
  isCancel(value: any): boolean;
  all<T>(values: (T | Promise<T>)[]): Promise<T[]>;
  spread<T, R>(callback: (...args: T[]) => R): (array: T[]) => R;
  isAxiosError(payload: any): payload is AxiosError;
}

// Interceptor manager interface
export interface AxiosInterceptorManager<V> {
  use<T = V>(
    onFulfilled?: (value: V) => T | Promise<T>,
    onRejected?: (error: any) => any
  ): number;
  eject(id: number): void;
  clear(): void;
}

// Cancel token interface
export interface CancelToken {
  promise: Promise<Cancel>;
  reason?: Cancel;
  throwIfRequested(): void;
}

export interface Cancel {
  message?: string;
}

export interface Canceler {
  (message?: string): void;
}

export interface CancelTokenSource {
  token: CancelToken;
  cancel: Canceler;
}

export interface CancelTokenStatic {
  new (executor: (cancel: Canceler) => void): CancelToken;
  source(): CancelTokenSource;
}

// Static properties
export interface AxiosStatic extends AxiosInstance {
  create(config?: AxiosRequestConfig): AxiosInstance;
  Cancel: any;
  CancelToken: CancelTokenStatic;
  isCancel(value: any): boolean;
  all<T>(values: (T | Promise<T>)[]): Promise<T[]>;
  spread<T, R>(callback: (...args: T[]) => R): (array: T[]) => R;
  isAxiosError(payload: any): payload is AxiosError;
}