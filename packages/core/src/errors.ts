/**
 * Error classes for HyperHTTP
 */

import type { Request, Response, AbortSignal } from './types.js';

/**
 * Base HTTP error class
 */
export class HyperHttpError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly request: Request;
  public readonly response?: Response;
  public readonly data?: any;
  public readonly requestId?: string;

  constructor(
    message: string,
    status: number,
    request: Request,
    response?: Response,
    data?: any,
    requestId?: string
  ) {
    super(message);
    this.name = 'HyperHttpError';
    this.status = status;
    this.code = getErrorCode(status);
    this.request = request;
    this.response = response;
    this.data = data;
    this.requestId = requestId;
  }

  static isHttpError(error: any): error is HyperHttpError {
    return error instanceof HyperHttpError;
  }
}

/**
 * Abort error class
 */
export class HyperAbortError extends Error {
  public readonly name = 'AbortError';
  public readonly reason?: string;
  public readonly signal?: AbortSignal;

  constructor(message: string, reason?: string, signal?: AbortSignal) {
    super(message);
    Object.defineProperty(this, 'name', { value: 'AbortError', writable: false });
    this.reason = reason;
    this.signal = signal;
  }

  static isAbortError(error: any): error is HyperAbortError {
    return error instanceof HyperAbortError || error.name === 'AbortError';
  }
}

/**
 * Timeout error class
 */
export class TimeoutError extends HyperAbortError {
  public readonly timeout: number;

  constructor(timeout: number, signal?: AbortSignal) {
    super(`Request timed out after ${timeout}ms`, 'timeout', signal);
    Object.defineProperty(this, 'name', { value: 'TimeoutError', writable: false });
    this.timeout = timeout;
  }
}

/**
 * Network error class
 */
export class NetworkError extends Error {
  public readonly code = 'NETWORK_ERROR';
  public readonly request: Request;
  public readonly cause?: Error;

  constructor(message: string, request: Request, cause?: Error) {
    super(message);
    Object.defineProperty(this, 'name', { value: 'NetworkError', writable: false });
    this.request = request;
    this.cause = cause;
  }

  static isNetworkError(error: any): error is NetworkError {
    return error instanceof NetworkError;
  }
}

/**
 * Retry error class
 */
export class RetryError extends Error {
  public readonly code = 'RETRY_ERROR';
  public readonly attempts: number;
  public readonly lastError?: Error;

  constructor(message: string, attempts: number, lastError?: Error) {
    super(message);
    Object.defineProperty(this, 'name', { value: 'RetryError', writable: false });
    this.attempts = attempts;
    this.lastError = lastError;
  }
}

/**
 * Validation error class
 */
export class ValidationError extends Error {
  public readonly code = 'VALIDATION_ERROR';
  public readonly field?: string;
  public readonly value?: any;

  constructor(message: string, field?: string, value?: any) {
    super(message);
    Object.defineProperty(this, 'name', { value: 'ValidationError', writable: false });
    this.field = field;
    this.value = value;
  }
}

/**
 * Configuration error class
 */
export class ConfigurationError extends Error {
  public readonly code = 'CONFIGURATION_ERROR';
  public readonly option?: string;

  constructor(message: string, option?: string) {
    super(message);
    Object.defineProperty(this, 'name', { value: 'ConfigurationError', writable: false });
    this.option = option;
  }
}

/**
 * Rate limit error class
 */
export class RateLimitError extends HyperHttpError {
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
    Object.defineProperty(this, 'name', { value: 'RateLimitError', writable: false });
    this.retryAfter = retryAfter;
    this.limit = limit;
    this.remaining = remaining;
  }
}

/**
 * Circuit breaker error class
 */
export class CircuitBreakerError extends Error {
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
    Object.defineProperty(this, 'name', { value: 'CircuitBreakerError', writable: false });
    this.state = state;
    this.failureCount = failureCount;
    this.nextAttempt = nextAttempt;
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
export function isHttpError(error: any): error is HyperHttpError {
  return error instanceof HyperHttpError;
}

/**
 * Check if error is an abort error
 */
export function isAbortError(error: any): error is HyperAbortError {
  return error instanceof HyperAbortError || error.name === 'AbortError';
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