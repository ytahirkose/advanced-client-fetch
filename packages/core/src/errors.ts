/**
 * Unified Error System for Advanced Client Fetch
 */

import type { Request, Response, AbortSignal } from './types';

// Re-export for backward compatibility
export type HttpError = BaseHttpError;

/**
 * Base error class for all Advanced Client Fetch errors
 */
export abstract class BaseError extends Error {
  abstract readonly code: string;
  abstract readonly name: string;
  
  constructor(message: string) {
    super(message);
    
    // Preserve stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Base HTTP error class
 */
export abstract class BaseHttpError<T = unknown> extends BaseError {
  abstract readonly name: string;
  
  constructor(
    message: string,
    public readonly status: number,
    public readonly request: Request,
    public readonly response?: Response,
    public readonly data?: T,
    public readonly requestId?: string
  ) {
    super(message);
  }

  static isHttpError(error: any): error is BaseHttpError {
    return error instanceof BaseHttpError;
  }
}

/**
 * Client error (4xx status codes)
 */
export class ClientError<T = unknown> extends BaseHttpError<T> {
  readonly code = 'CLIENT_ERROR';
  readonly name = 'ClientError';
  
  constructor(
    message: string,
    status: number,
    request: Request,
    response?: Response,
    data?: T,
    requestId?: string
  ) {
    super(message, status, request, response, data, requestId);
  }
}

/**
 * Server error (5xx status codes)
 */
export class ServerError<T = unknown> extends BaseHttpError<T> {
  readonly code = 'SERVER_ERROR';
  readonly name = 'ServerError';
  
  constructor(
    message: string,
    status: number,
    request: Request,
    response?: Response,
    data?: T,
    requestId?: string
  ) {
    super(message, status, request, response, data, requestId);
  }
}

/**
 * Network error (connection issues)
 */
export class NetworkError<T = unknown> extends BaseHttpError<T> {
  readonly code = 'NETWORK_ERROR';
  readonly name = 'NetworkError';

  constructor(
    message: string,
    request: Request,
    response?: Response,
    data?: T,
    requestId?: string
  ) {
    super(message, 0, request, response, data, requestId);
  }
}

/**
 * Legacy HTTP error class for backward compatibility
 * @deprecated Use ClientError or ServerError instead
 */
export class AdvancedClientFetchError extends BaseHttpError {
  readonly code = 'HTTP_ERROR';
  readonly name = 'AdvancedClientFetchError';

  constructor(
    message: string,
    status: number,
    request: Request,
    response?: Response,
    data?: any,
    requestId?: string
  ) {
    super(message, status, request, response, data, requestId);
  }
}

/**
 * Abort error class
 */
export abstract class BaseAbortError extends BaseError {
  abstract readonly code: string;
  abstract readonly name: string;
  public readonly reason?: string;
  public readonly signal?: AbortSignal;

  constructor(message: string, reason?: string, signal?: AbortSignal) {
    super(message);
    this.reason = reason;
    this.signal = signal;
  }

  static isAbortError(error: any): error is BaseAbortError {
    return error instanceof BaseAbortError || error.name === 'AbortError';
  }
}

// Re-export for backward compatibility
export type AbortError = BaseAbortError;

/**
 * Legacy abort error class for backward compatibility
 * @deprecated Use AbortError instead
 */
export class AdvancedClientFetchAbortError extends BaseAbortError {
  readonly code = 'ABORT_ERROR';
  readonly name = 'AdvancedClientFetchAbortError';

  constructor(message: string, reason?: string, signal?: AbortSignal) {
    super(message, reason, signal);
  }
}

/**
 * Timeout error class
 */
export class TimeoutError extends BaseAbortError {
  readonly code = 'TIMEOUT_ERROR';
  readonly name = 'TimeoutError';
  public readonly timeout: number;

  constructor(timeout: number, signal?: AbortSignal) {
    super(`Request timed out after ${timeout}ms`, 'timeout', signal);
    this.timeout = timeout;
  }

  static isTimeoutError(error: any): error is TimeoutError {
    return error instanceof TimeoutError;
  }
}

/**
 * Legacy network error class for backward compatibility
 * @deprecated Use NetworkError from HttpError hierarchy instead
 */
export class LegacyNetworkError extends BaseError {
  readonly code = 'NETWORK_ERROR';
  readonly name = 'LegacyNetworkError';
  public readonly request: Request;
  public readonly cause?: Error;

  constructor(message: string, request: Request, cause?: Error) {
    super(message);
    this.request = request;
    this.cause = cause;
  }

  static isNetworkError(error: any): error is LegacyNetworkError {
    return error instanceof LegacyNetworkError;
  }
}

/**
 * Retry error class
 */
export class RetryError extends BaseError {
  readonly code = 'RETRY_ERROR';
  readonly name = 'RetryError';
  public readonly attempts: number;
  public readonly lastError?: Error;

  constructor(message: string, attempts: number, lastError?: Error) {
    super(message);
    this.attempts = attempts;
    this.lastError = lastError;
  }

  static isRetryError(error: any): error is RetryError {
    return error instanceof RetryError;
  }
}

/**
 * Validation error class
 */
export class ValidationError extends BaseError {
  readonly code = 'VALIDATION_ERROR';
  readonly name = 'ValidationError';
  public readonly field?: string;
  public readonly value?: any;

  constructor(message: string, field?: string, value?: any) {
    super(message);
    this.field = field;
    this.value = value;
  }

  static isValidationError(error: any): error is ValidationError {
    return error instanceof ValidationError;
  }
}

/**
 * Configuration error class
 */
export class ConfigurationError extends BaseError {
  readonly code = 'CONFIGURATION_ERROR';
  readonly name = 'ConfigurationError';
  public readonly option?: string;

  constructor(message: string, option?: string) {
    super(message);
    this.option = option;
  }

  static isConfigurationError(error: any): error is ConfigurationError {
    return error instanceof ConfigurationError;
  }
}

/**
 * Rate limit error class
 */
export class RateLimitError extends BaseHttpError {
  readonly code = 'RATE_LIMIT_ERROR';
  readonly name = 'RateLimitError';
  public readonly retryAfter?: number;
  public readonly limit?: number;
  public readonly remaining?: number;

  constructor(
    message: string,
    request: Request,
    response?: Response,
    retryAfter?: number,
    limit?: number,
    remaining?: number
  ) {
    super(message, 429, request, response);
    this.retryAfter = retryAfter;
    this.limit = limit;
    this.remaining = remaining;
  }

  static isRateLimitError(error: any): error is RateLimitError {
    return error instanceof RateLimitError;
  }
}

/**
 * Circuit breaker error class
 */
export class CircuitBreakerError extends BaseError {
  readonly code = 'CIRCUIT_BREAKER_ERROR';
  readonly name = 'CircuitBreakerError';
  public readonly state: 'open' | 'half-open' | 'closed';
  public readonly failureCount: number;
  public readonly nextAttempt?: number;

  constructor(
    message: string,
    state: 'open' | 'half-open' | 'closed',
    failureCount: number,
    nextAttempt?: number
  ) {
    super(message);
    this.state = state;
    this.failureCount = failureCount;
    this.nextAttempt = nextAttempt;
  }

  static isCircuitBreakerError(error: any): error is CircuitBreakerError {
    return error instanceof CircuitBreakerError;
  }
}

/**
 * Get error code from HTTP status
 */
function getErrorCode(status: number): string {
  if (status >= 400 && status < 500) {
    return 'CLIENT_ERROR';
  }
  
  if (status >= 500) {
    return 'SERVER_ERROR';
  }
  
  return 'UNKNOWN_ERROR';
}

/**
 * Check if error is an HTTP error
 */
export function isHttpError(error: any): error is BaseHttpError {
  return error instanceof BaseHttpError;
}

/**
 * Check if error is an abort error
 */
export function isAbortError(error: any): error is BaseAbortError {
  return error instanceof BaseAbortError || error.name === 'AbortError';
}

/**
 * Check if error is a timeout error
 */
export function isTimeoutError(error: any): error is TimeoutError {
  return error instanceof TimeoutError;
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: any): error is NetworkError {
  return error instanceof NetworkError;
}

/**
 * Check if error is a retry error
 */
export function isRetryError(error: any): error is RetryError {
  return error instanceof RetryError;
}

/**
 * Check if error is a validation error
 */
export function isValidationError(error: any): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * Check if error is a configuration error
 */
export function isConfigurationError(error: any): error is ConfigurationError {
  return error instanceof ConfigurationError;
}

/**
 * Check if error is a rate limit error
 */
export function isRateLimitError(error: any): error is RateLimitError {
  return error instanceof RateLimitError;
}

/**
 * Check if error is a circuit breaker error
 */
export function isCircuitBreakerError(error: any): error is CircuitBreakerError {
  return error instanceof CircuitBreakerError;
}

// Re-export types for convenience
// HttpError and AbortError are now defined in this file