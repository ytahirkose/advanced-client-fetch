/**
 * Type definitions for Axios compatibility
 */

import type { Headers, Request, AbortSignal } from 'hyperhttp-core';

export interface AxiosRequestConfig {
  url?: string;
  method?: string;
  baseURL?: string;
  headers?: Record<string, string> | Headers;
  params?: Record<string, any>;
  data?: any;
  timeout?: number;
  signal?: AbortSignal;
  responseType?: 'json' | 'text' | 'blob' | 'arrayBuffer' | 'stream';
  meta?: Record<string, any>;
}

export interface AxiosResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
  config: AxiosRequestConfig;
  request: Request;
}

export interface AxiosError extends Error {
  config: AxiosRequestConfig;
  code?: string;
  request?: Request;
  response?: AxiosResponse;
  isAxiosError: boolean;
}

export interface AxiosInstance {
  request<T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  head<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  options<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  create(config?: AxiosRequestConfig): AxiosInstance;
  defaults: AxiosRequestConfig;
  interceptors: {
    request: AxiosInterceptorManager<AxiosRequestConfig>;
    response: AxiosInterceptorManager<AxiosResponse>;
  };
}

export interface AxiosStatic extends AxiosInstance {
  create(config?: AxiosRequestConfig): AxiosInstance;
  isAxiosError(error: any): error is AxiosError;
}

export interface AxiosInterceptorManager<T> {
  use(
    onFulfilled?: (value: T) => T | Promise<T>,
    onRejected?: (error: any) => any
  ): number;
  eject(id: number): void;
  clear(): void;
}

export interface CancelToken {
  promise: Promise<any>;
  reason?: any;
  throwIfRequested(): void;
}

export interface CancelTokenSource {
  token: CancelToken;
  cancel: (message?: string) => void;
}

export type Cancel = (message?: string) => void;

export type ResponseType = 'json' | 'text' | 'blob' | 'arrayBuffer' | 'stream';

export type AxiosTransformer = (data: any, headers?: Headers) => any;

export interface AxiosBasicCredentials {
  username: string;
  password: string;
}

export interface AxiosProxyConfig {
  host: string;
  port: number;
  auth?: AxiosBasicCredentials;
  protocol?: string;
}

export interface AxiosProgressEvent {
  loaded: number;
  total?: number;
  lengthComputable: boolean;
}

export interface AxiosTransitionalConfig {
  silentJSONParsing?: boolean;
  forcedJSONParsing?: boolean;
  clarifyTimeoutError?: boolean;
}

export interface AxiosFormSerializerConfig {
  visitor?: (value: any, key: string, path: string[], helpers: any) => any;
  dots?: boolean;
  metaTokens?: boolean;
  indexes?: boolean | null;
}

export type AxiosLookupFunction = (ip: string, family: number) => string;