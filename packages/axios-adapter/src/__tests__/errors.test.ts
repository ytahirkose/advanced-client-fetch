/**
 * Tests for Axios Errors
 */

import { describe, it, expect } from 'vitest';
import { AxiosErrorFactory } from '../errors';

describe('Axios Errors', () => {
  it('should create HTTP error', () => {
    const error = AxiosErrorFactory.createHttpError(
      'Not Found',
      { url: '/test' },
      '404'
    );
    
    expect(error).toBeDefined();
    expect(error.message).toBe('Not Found');
    expect(error.code).toBe('404');
    expect(error.isAxiosError).toBe(true);
  });

  it('should create network error', () => {
    const error = AxiosErrorFactory.createNetworkError(
      'Network Error',
      { url: '/test' }
    );
    
    expect(error).toBeDefined();
    expect(error.message).toBe('Network Error');
    expect(error.code).toBe('NETWORK_ERROR');
  });
});