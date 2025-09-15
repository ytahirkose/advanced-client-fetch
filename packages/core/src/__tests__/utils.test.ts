/**
 * Tests for HyperHTTP utilities
 */

import { describe, it, expect } from 'vitest';
import {
  isPlainObject,
  isURL,
  isHeaders,
  isIdempotentMethod,
  buildURL,
  mergeHeaders,
  normalizeBody,
  generateRequestId,
  deepMerge,
  sleep,
  calculateBackoffDelay,
  parseRetryAfter,
  isAbsoluteURL,
  getContentType,
  isJSONResponse,
  isTextResponse,
  safeJSONParse,
  cloneRequest,
  getRequestSize,
  getResponseSize,
} from '../utils.js';

describe('HyperHTTP Utils', () => {
  describe('isPlainObject', () => {
    it('should return true for plain objects', () => {
      expect(isPlainObject({})).toBe(true);
      expect(isPlainObject({ a: 1 })).toBe(true);
      expect(isPlainObject({ a: 1, b: 2 })).toBe(true);
    });

    it('should return false for non-plain objects', () => {
      expect(isPlainObject(null)).toBe(false);
      expect(isPlainObject(undefined)).toBe(false);
      expect(isPlainObject([])).toBe(false);
      expect(isPlainObject(new Date())).toBe(false);
      expect(isPlainObject(new RegExp('test'))).toBe(false);
      expect(isPlainObject('string')).toBe(false);
      expect(isPlainObject(123)).toBe(false);
      expect(isPlainObject(true)).toBe(false);
    });
  });

  describe('isURL', () => {
    it('should return true for URL objects', () => {
      expect(isURL(new URL('https://example.com'))).toBe(true);
      expect(isURL(new URL('http://localhost:3000'))).toBe(true);
    });

    it('should return false for non-URL objects', () => {
      expect(isURL('https://example.com')).toBe(false);
      expect(isURL({})).toBe(false);
      expect(isURL(null)).toBe(false);
    });
  });

  describe('isHeaders', () => {
    it('should return true for Headers objects', () => {
      expect(isHeaders(new Headers())).toBe(true);
      expect(isHeaders(new Headers({ 'Content-Type': 'application/json' }))).toBe(true);
    });

    it('should return false for non-Headers objects', () => {
      expect(isHeaders({})).toBe(false);
      expect(isHeaders('string')).toBe(false);
      expect(isHeaders(null)).toBe(false);
    });
  });

  describe('isIdempotentMethod', () => {
    it('should return true for idempotent methods', () => {
      expect(isIdempotentMethod('GET')).toBe(true);
      expect(isIdempotentMethod('HEAD')).toBe(true);
      expect(isIdempotentMethod('OPTIONS')).toBe(true);
      expect(isIdempotentMethod('PUT')).toBe(true);
      expect(isIdempotentMethod('DELETE')).toBe(true);
    });

    it('should return false for non-idempotent methods', () => {
      expect(isIdempotentMethod('POST')).toBe(false);
      expect(isIdempotentMethod('PATCH')).toBe(false);
    });
  });

  describe('buildURL', () => {
    it('should build URL with base URL and path', () => {
      expect(buildURL('https://api.example.com', '/users')).toBe('https://api.example.com/users');
      expect(buildURL('https://api.example.com', 'users')).toBe('https://api.example.com/users');
    });

    it('should handle absolute URLs', () => {
      expect(buildURL('https://api.example.com', 'https://other.com/users')).toBe('https://other.com/users');
    });

    it('should handle query parameters', () => {
      const result = buildURL('https://api.example.com', '/users', { page: 1, limit: 10 });
      expect(result).toBe('https://api.example.com/users?page=1&limit=10');
    });

    it('should handle array query parameters', () => {
      const result = buildURL('https://api.example.com', '/users', { tags: ['a', 'b'] });
      expect(result).toBe('https://api.example.com/users?tags=a&tags=b');
    });

    it('should handle null and undefined values', () => {
      const result = buildURL('https://api.example.com', '/users', { page: 1, limit: null, search: undefined });
      expect(result).toBe('https://api.example.com/users?page=1');
    });
  });

  describe('mergeHeaders', () => {
    it('should merge headers from multiple sources', () => {
      const headers1 = { 'Content-Type': 'application/json' };
      const headers2 = new Headers({ 'Authorization': 'Bearer token' });
      const headers3 = { 'X-Custom': 'value' };

      const result = mergeHeaders(headers1, headers2, headers3);
      expect(result.get('Content-Type')).toBe('application/json');
      expect(result.get('Authorization')).toBe('Bearer token');
      expect(result.get('X-Custom')).toBe('value');
    });

    it('should handle undefined sources', () => {
      const result = mergeHeaders(undefined, { 'Content-Type': 'application/json' }, undefined);
      expect(result.get('Content-Type')).toBe('application/json');
    });
  });

  describe('normalizeBody', () => {
    it('should handle string bodies', () => {
      const headers = new Headers();
      const result = normalizeBody('test', headers);
      expect(result).toBe('test');
    });

    it('should handle object bodies as JSON', () => {
      const headers = new Headers();
      const result = normalizeBody({ name: 'test' }, headers);
      expect(result).toBe('{"name":"test"}');
      expect(headers.get('Content-Type')).toBe('application/json; charset=utf-8');
    });

    it('should handle FormData bodies', () => {
      const headers = new Headers();
      const formData = new FormData();
      formData.append('name', 'test');
      const result = normalizeBody(formData, headers);
      expect(result).toBe(formData);
    });

    it('should handle null and undefined bodies', () => {
      const headers = new Headers();
      expect(normalizeBody(null, headers)).toBeUndefined();
      expect(normalizeBody(undefined, headers)).toBeUndefined();
    });
  });

  describe('generateRequestId', () => {
    it('should generate unique request IDs', () => {
      const id1 = generateRequestId();
      const id2 = generateRequestId();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^req_\d+_[a-z0-9]+$/);
    });
  });

  describe('deepMerge', () => {
    it('should merge objects deeply', () => {
      const target = { a: 1, b: { c: 2 } };
      const source = { b: { d: 3 }, e: 4 };
      const result = deepMerge(target, source);
      expect(result).toEqual({ a: 1, b: { c: 2, d: 3 }, e: 4 });
    });

    it('should handle multiple sources', () => {
      const target = { a: 1 };
      const source1 = { b: 2 };
      const source2 = { c: 3 };
      const result = deepMerge(target, source1, source2);
      expect(result).toEqual({ a: 1, b: 2, c: 3 });
    });
  });

  describe('sleep', () => {
    it('should sleep for the specified duration', async () => {
      const start = Date.now();
      await sleep(100);
      const end = Date.now();
      expect(end - start).toBeGreaterThanOrEqual(100);
    });
  });

  describe('calculateBackoffDelay', () => {
    it('should calculate exponential backoff delay', () => {
      const delay = calculateBackoffDelay(1, 100, 1000, 2, false);
      expect(delay).toBe(100);
    });

    it('should respect max delay', () => {
      const delay = calculateBackoffDelay(5, 100, 1000, 2, false);
      expect(delay).toBe(1000);
    });

    it('should add jitter when enabled', () => {
      const delay = calculateBackoffDelay(1, 100, 1000, 2, true);
      expect(delay).toBeGreaterThanOrEqual(0);
      expect(delay).toBeLessThanOrEqual(100);
    });
  });

  describe('parseRetryAfter', () => {
    it('should parse numeric retry after values', () => {
      expect(parseRetryAfter('5')).toBe(5000);
      expect(parseRetryAfter('10')).toBe(10000);
    });

    it('should parse HTTP date retry after values', () => {
      const futureDate = new Date(Date.now() + 5000).toUTCString();
      const delay = parseRetryAfter(futureDate);
      expect(delay).toBeGreaterThan(0);
      expect(delay).toBeLessThanOrEqual(5000);
    });

    it('should return 1 second for invalid values', () => {
      expect(parseRetryAfter('invalid')).toBe(1000);
    });
  });

  describe('isAbsoluteURL', () => {
    it('should return true for absolute URLs', () => {
      expect(isAbsoluteURL('https://example.com')).toBe(true);
      expect(isAbsoluteURL('http://localhost:3000')).toBe(true);
    });

    it('should return false for relative URLs', () => {
      expect(isAbsoluteURL('/path')).toBe(false);
      expect(isAbsoluteURL('path')).toBe(false);
    });
  });

  describe('getContentType', () => {
    it('should get content type from response', () => {
      const response = new Response('', {
        headers: { 'Content-Type': 'application/json' },
      });
      expect(getContentType(response)).toBe('application/json');
    });

    it('should return null for missing content type', () => {
      const response = new Response('', {
        headers: { 'content-type': '' }
      });
      expect(getContentType(response)).toBeNull();
    });
  });

  describe('isJSONResponse', () => {
    it('should return true for JSON responses', () => {
      const response = new Response('', {
        headers: { 'Content-Type': 'application/json' },
      });
      expect(isJSONResponse(response)).toBe(true);
    });

    it('should return false for non-JSON responses', () => {
      const response = new Response('', {
        headers: { 'Content-Type': 'text/plain' },
      });
      expect(isJSONResponse(response)).toBe(false);
    });
  });

  describe('isTextResponse', () => {
    it('should return true for text responses', () => {
      const response = new Response('', {
        headers: { 'Content-Type': 'text/plain' },
      });
      expect(isTextResponse(response)).toBe(true);
    });

    it('should return false for non-text responses', () => {
      const response = new Response('', {
        headers: { 'Content-Type': 'application/octet-stream' },
      });
      expect(isTextResponse(response)).toBe(false);
    });
  });

  describe('safeJSONParse', () => {
    it('should parse valid JSON', () => {
      expect(safeJSONParse('{"a": 1}')).toEqual({ a: 1 });
    });

    it('should return null for invalid JSON', () => {
      expect(safeJSONParse('invalid json')).toBeNull();
    });
  });

  describe('cloneRequest', () => {
    it('should clone request with overrides', () => {
      const original = new Request('https://example.com', { method: 'GET' });
      const cloned = cloneRequest(original, { method: 'POST' });
      expect(cloned.method).toBe('POST');
      expect(cloned.url).toBe('https://example.com/');
    });
  });

  describe('getRequestSize', () => {
    it('should calculate approximate request size', () => {
      const request = new Request('https://example.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"test": "data"}',
      });
      const size = getRequestSize(request);
      expect(size).toBeGreaterThan(0);
    });
  });

  describe('getResponseSize', () => {
    it('should get response size from content-length header', () => {
      const response = new Response('', {
        headers: { 'Content-Length': '100' },
      });
      expect(getResponseSize(response)).toBe(100);
    });

    it('should estimate size when content-length is missing', () => {
      const response = new Response('', {
        headers: { 'Content-Type': 'application/json' },
      });
      const size = getResponseSize(response);
      expect(size).toBeGreaterThan(0);
    });
  });
});
