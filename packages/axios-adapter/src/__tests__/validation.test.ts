/**
 * Tests for Validation
 */

import { describe, it, expect } from 'vitest';
import { validateRequestConfig, isValidMethod, isValidUrl } from '../validation';

describe('Validation', () => {
  it('should validate HTTP methods', () => {
    expect(isValidMethod('GET')).toBe(true);
    expect(isValidMethod('POST')).toBe(true);
    expect(isValidMethod('INVALID')).toBe(false);
  });

  it('should validate URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('http://localhost:3000')).toBe(true);
    expect(isValidUrl('invalid-url')).toBe(false);
  });

  it('should validate request config', () => {
    expect(() => {
      validateRequestConfig({
        url: 'https://example.com',
        method: 'GET',
        timeout: 5000,
      });
    }).not.toThrow();
  });
});