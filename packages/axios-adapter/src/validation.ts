/**
 * Validation utilities for Axios compatibility
 */

import type { AxiosRequestConfig } from './types';
import { AxiosValidationError } from './errors';

export function isValidMethod(method: string): boolean {
  const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
  return validMethods.includes(method.toUpperCase());
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isValidTimeout(timeout: number): boolean {
  return typeof timeout === 'number' && timeout >= 0;
}

export function isValidHeaders(headers: any): boolean {
  return headers === null || 
         headers === undefined || 
         typeof headers === 'object';
}

export function validateRequestConfig(config: AxiosRequestConfig): void {
  if (config.method && !isValidMethod(config.method)) {
    throw createValidationError(`Invalid method: ${config.method}`, config);
  }

  if (config.url && !isValidUrl(config.url)) {
    throw createValidationError(`Invalid URL: ${config.url}`, config);
  }

  if (config.timeout !== undefined && !isValidTimeout(config.timeout)) {
    throw createValidationError(`Invalid timeout: ${config.timeout}`, config);
  }

  if (config.headers && !isValidHeaders(config.headers)) {
    throw createValidationError('Invalid headers', config);
  }
}

export function sanitizeRequestConfig(config: AxiosRequestConfig): AxiosRequestConfig {
  const sanitized = { ...config };

  // Sanitize method
  if (sanitized.method) {
    sanitized.method = sanitized.method.toUpperCase();
  }

  // Sanitize headers
  if (sanitized.headers && typeof sanitized.headers === 'object') {
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(sanitized.headers)) {
      if (typeof value === 'string') {
        headers[key.toLowerCase()] = value;
      }
    }
    sanitized.headers = headers;
  }

  // Sanitize timeout
  if (sanitized.timeout !== undefined) {
    sanitized.timeout = Math.max(0, sanitized.timeout);
  }

  return sanitized;
}

export function createValidationError(
  message: string,
  config: AxiosRequestConfig
): AxiosValidationError {
  return new AxiosValidationError(message, config);
}