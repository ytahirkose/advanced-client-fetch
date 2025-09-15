/**
 * Error classes for Axios compatibility
 */

import type { AxiosError, AxiosRequestConfig, AxiosResponse } from './types';

export class BaseAxiosError extends Error implements AxiosError {
  public config: AxiosRequestConfig;
  public code?: string;
  public request?: any;
  public response?: AxiosResponse;
  public isAxiosError = true;

  constructor(
    message: string,
    config: AxiosRequestConfig,
    code?: string,
    request?: any,
    response?: AxiosResponse
  ) {
    super(message);
    this.name = 'AxiosError';
    this.config = config;
    this.code = code;
    this.request = request;
    this.response = response;
  }
}

export class AxiosHttpError extends BaseAxiosError {
  constructor(
    message: string,
    config: AxiosRequestConfig,
    code: string,
    request?: any,
    response?: AxiosResponse
  ) {
    super(message, config, code, request, response);
    this.name = 'AxiosHttpError';
  }
}

export class AxiosAbortError extends BaseAxiosError {
  constructor(
    message: string,
    config: AxiosRequestConfig,
    request?: any
  ) {
    super(message, config, 'ABORTED', request);
    this.name = 'AxiosAbortError';
  }
}

export class AxiosNetworkError extends BaseAxiosError {
  constructor(
    message: string,
    config: AxiosRequestConfig,
    request?: any
  ) {
    super(message, config, 'NETWORK_ERROR', request);
    this.name = 'AxiosNetworkError';
  }
}

export class AxiosTimeoutError extends BaseAxiosError {
  constructor(
    message: string,
    config: AxiosRequestConfig,
    request?: any
  ) {
    super(message, config, 'TIMEOUT', request);
    this.name = 'AxiosTimeoutError';
  }
}

export class AxiosRateLimitError extends BaseAxiosError {
  constructor(
    message: string,
    config: AxiosRequestConfig,
    request?: any,
    response?: AxiosResponse
  ) {
    super(message, config, 'RATE_LIMIT', request, response);
    this.name = 'AxiosRateLimitError';
  }
}

export class AxiosCircuitBreakerError extends BaseAxiosError {
  constructor(
    message: string,
    config: AxiosRequestConfig,
    request?: any
  ) {
    super(message, config, 'CIRCUIT_BREAKER', request);
    this.name = 'AxiosCircuitBreakerError';
  }
}

export class AxiosValidationError extends BaseAxiosError {
  constructor(
    message: string,
    config: AxiosRequestConfig,
    request?: any
  ) {
    super(message, config, 'VALIDATION_ERROR', request);
    this.name = 'AxiosValidationError';
  }
}

export class AxiosConfigurationError extends BaseAxiosError {
  constructor(
    message: string,
    config: AxiosRequestConfig
  ) {
    super(message, config, 'CONFIGURATION_ERROR');
    this.name = 'AxiosConfigurationError';
  }
}

export class AxiosErrorFactory {
  static createHttpError(
    message: string,
    config: AxiosRequestConfig,
    code: string,
    request?: any,
    response?: AxiosResponse
  ): AxiosHttpError {
    return new AxiosHttpError(message, config, code, request, response);
  }

  static createAbortError(
    message: string,
    config: AxiosRequestConfig,
    request?: any
  ): AxiosAbortError {
    return new AxiosAbortError(message, config, request);
  }

  static createNetworkError(
    message: string,
    config: AxiosRequestConfig,
    request?: any
  ): AxiosNetworkError {
    return new AxiosNetworkError(message, config, request);
  }

  static createTimeoutError(
    message: string,
    config: AxiosRequestConfig,
    request?: any
  ): AxiosTimeoutError {
    return new AxiosTimeoutError(message, config, request);
  }

  static createRateLimitError(
    message: string,
    config: AxiosRequestConfig,
    request?: any,
    response?: AxiosResponse
  ): AxiosRateLimitError {
    return new AxiosRateLimitError(message, config, request, response);
  }

  static createCircuitBreakerError(
    message: string,
    config: AxiosRequestConfig,
    request?: any
  ): AxiosCircuitBreakerError {
    return new AxiosCircuitBreakerError(message, config, request);
  }

  static createValidationError(
    message: string,
    config: AxiosRequestConfig,
    request?: any
  ): AxiosValidationError {
    return new AxiosValidationError(message, config, request);
  }

  static createConfigurationError(
    message: string,
    config: AxiosRequestConfig
  ): AxiosConfigurationError {
    return new AxiosConfigurationError(message, config);
  }
}