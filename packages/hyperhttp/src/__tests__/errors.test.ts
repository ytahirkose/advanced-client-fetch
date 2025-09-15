/**
 * Tests for HyperHTTP errors
 */

import { describe, it, expect } from 'vitest';
import {
  HyperHttpError,
  HyperAbortError,
  TimeoutError,
  NetworkError,
  RetryError,
  ValidationError,
  ConfigurationError,
} from '../errors.js';
import { isRetryableError, isRetryableResponse } from '../utils.js';

describe('HyperHTTP Errors', () => {
  describe('HyperHttpError', () => {
    it('should create HTTP error with status and message', () => {
      const request = new Request('https://example.com');
      const error = new HyperHttpError('Not Found', 404, request);
      
      expect(error.message).toBe('Not Found');
      expect(error.status).toBe(404);
      expect(error.code).toBe('CLIENT_ERROR');
      expect(error.request).toBe(request);
    });

    it('should set server error code for 5xx status', () => {
      const request = new Request('https://example.com');
      const error = new HyperHttpError('Internal Server Error', 500, request);
      
      expect(error.code).toBe('SERVER_ERROR');
    });

    it('should set unknown error code for other status', () => {
      const request = new Request('https://example.com');
      const error = new HyperHttpError('Unknown', 200, request);
      
      expect(error.code).toBe('UNKNOWN_ERROR');
    });

    it('should check if error is HTTP error', () => {
      const request = new Request('https://example.com');
      const error = new HyperHttpError('Not Found', 404, request);
      
      expect(HyperHttpError.isHttpError(error)).toBe(true);
      expect(HyperHttpError.isHttpError(new Error('test'))).toBe(false);
    });
  });

  describe('HyperAbortError', () => {
    it('should create abort error with message', () => {
      const error = new HyperAbortError('Request aborted');
      
      expect(error.message).toBe('Request aborted');
      expect(error.name).toBe('AbortError');
    });

    it('should create abort error with reason and signal', () => {
      const signal = new AbortController().signal;
      const error = new HyperAbortError('Request aborted', 'timeout', signal);
      
      expect(error.reason).toBe('timeout');
      expect(error.signal).toBe(signal);
    });

    it('should check if error is abort error', () => {
      const error = new HyperAbortError('Request aborted');
      
      expect(HyperAbortError.isAbortError(error)).toBe(true);
      expect(HyperAbortError.isAbortError(new Error('test'))).toBe(false);
    });
  });

  describe('TimeoutError', () => {
    it('should create timeout error with timeout value', () => {
      const signal = new AbortController().signal;
      const error = new TimeoutError(5000, signal);
      
      expect(error.message).toBe('Request timed out after 5000ms');
      expect(error.reason).toBe('timeout');
      expect(error.signal).toBe(signal);
    });
  });

  describe('NetworkError', () => {
    it('should create network error with message and request', () => {
      const request = new Request('https://example.com');
      const error = new NetworkError('Network error', request);
      
      expect(error.message).toBe('Network error');
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.request).toBe(request);
    });

    it('should create network error with cause', () => {
      const request = new Request('https://example.com');
      const cause = new Error('Connection failed');
      const error = new NetworkError('Network error', request, cause);
      
      expect(error.cause).toBe(cause);
    });

    it('should check if error is network error', () => {
      const request = new Request('https://example.com');
      const error = new NetworkError('Network error', request);
      
      expect(NetworkError.isNetworkError(error)).toBe(true);
      expect(NetworkError.isNetworkError(new Error('test'))).toBe(false);
    });
  });

  describe('RetryError', () => {
    it('should create retry error with attempts and last error', () => {
      const lastError = new Error('Last attempt failed');
      const error = new RetryError('All retries failed', 3, lastError);
      
      expect(error.message).toBe('All retries failed');
      expect(error.code).toBe('RETRY_ERROR');
      expect(error.attempts).toBe(3);
      expect(error.lastError).toBe(lastError);
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with message', () => {
      const error = new ValidationError('Invalid input');
      
      expect(error.message).toBe('Invalid input');
      expect(error.code).toBe('VALIDATION_ERROR');
    });

    it('should create validation error with field', () => {
      const error = new ValidationError('Invalid input', 'email');
      
      expect(error.field).toBe('email');
    });
  });

  describe('ConfigurationError', () => {
    it('should create configuration error with message', () => {
      const error = new ConfigurationError('Invalid configuration');
      
      expect(error.message).toBe('Invalid configuration');
      expect(error.code).toBe('CONFIGURATION_ERROR');
    });
  });

  describe('isRetryableError', () => {
    it('should return true for network errors', () => {
      const request = new Request('https://example.com');
      const error = new NetworkError('Network error', request);
      
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for timeout errors', () => {
      const error = new TimeoutError(5000);
      
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for HTTP 5xx errors', () => {
      const request = new Request('https://example.com');
      const error = new HyperHttpError('Server Error', 500, request);
      
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for HTTP 429 errors', () => {
      const request = new Request('https://example.com');
      const error = new HyperHttpError('Too Many Requests', 429, request);
      
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return false for HTTP 4xx errors (except 429)', () => {
      const request = new Request('https://example.com');
      const error = new HyperHttpError('Not Found', 404, request);
      
      expect(isRetryableError(error)).toBe(false);
    });

    it('should return false for abort errors (except timeout)', () => {
      const error = new HyperAbortError('Request aborted');
      
      expect(isRetryableError(error)).toBe(false);
    });

    it('should return false for other errors', () => {
      const error = new Error('Unknown error');
      
      expect(isRetryableError(error)).toBe(false);
    });
  });

  describe('isRetryableResponse', () => {
    it('should return true for 5xx responses', () => {
      const response = new Response('', { status: 500 });
      
      expect(isRetryableResponse(response)).toBe(true);
    });

    it('should return true for 429 responses', () => {
      const response = new Response('', { status: 429 });
      
      expect(isRetryableResponse(response)).toBe(true);
    });

    it('should return false for 2xx responses', () => {
      const response = new Response('', { status: 200 });
      
      expect(isRetryableResponse(response)).toBe(false);
    });

    it('should return false for 4xx responses (except 429)', () => {
      const response = new Response('', { status: 404 });
      
      expect(isRetryableResponse(response)).toBe(false);
    });
  });
});
