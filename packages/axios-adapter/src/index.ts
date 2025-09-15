/**
 * HyperHTTP Axios Adapter - Axios compatibility layer (No axios dependency!)
 */

// Main exports
export {
  AxiosAdapter,
  createAxiosInstance,
  convertAxiosConfigToHyperHTTP,
  convertHyperHTTPResponseToAxios,
  createAxiosStatic,
} from './adapter';

// Type exports
export type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  AxiosStatic,
  CancelToken,
  CancelTokenSource,
  Cancel,
  ResponseType,
  AxiosTransformer,
  AxiosBasicCredentials,
  AxiosProxyConfig,
  AxiosProgressEvent,
  AxiosTransitionalConfig,
  AxiosFormSerializerConfig,
  AxiosLookupFunction,
} from './types';

// Error exports
export {
  BaseAxiosError,
  AxiosHttpError,
  AxiosAbortError,
  AxiosNetworkError,
  AxiosTimeoutError,
  AxiosRateLimitError,
  AxiosCircuitBreakerError,
  AxiosValidationError,
  AxiosConfigurationError,
  AxiosErrorFactory,
} from './errors';

// Transformer exports
export {
  applyRequestTransformers,
  applyResponseTransformers,
  defaultRequestTransformers,
  defaultResponseTransformers,
  createContentTypeTransformer,
  createFormDataTransformer,
  createURLSearchParamsTransformer,
  createContentTypeResponseTransformer,
  createXMLResponseTransformer,
  createTextResponseTransformer,
  createBinaryResponseTransformer,
  createErrorResponseTransformer,
  createStatusCodeResponseTransformer,
  createPaginationResponseTransformer,
  createRateLimitResponseTransformer,
  createCacheResponseTransformer,
  createCORSResponseTransformer,
  createSecurityResponseTransformer,
  createCustomHeadersResponseTransformer,
  createMetadataResponseTransformer,
  createDebugResponseTransformer,
  createLoggingResponseTransformer,
} from './transformers';

// Validation exports
export {
  isValidMethod,
  isValidUrl,
  isValidTimeout,
  isValidHeaders,
  validateRequestConfig,
  sanitizeRequestConfig,
  createValidationError,
} from './validation';

// Performance exports
export {
  globalPerformanceMonitor,
  requestDeduplicationCache,
  memoryMonitor,
  type PerformanceMetrics,
  type RequestTiming,
} from './performance';

// Import for default instance
import { createAxiosInstance, createAxiosStatic } from './adapter';

// Default Axios instance
export const axios = createAxiosInstance();

// Axios static (like axios.create)
export const axiosStatic = createAxiosStatic();

// Re-export for convenience
export default axios;