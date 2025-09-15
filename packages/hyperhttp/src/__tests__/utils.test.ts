import { describe, it, expect } from 'vitest';
import { 
  buildURL, 
  mergeHeaders, 
  normalizeBody,
  generateRequestId,
  deepMerge,
  sleep,
  calculateBackoffDelay,
  parseRetryAfter,
  isAbsoluteURL,
  safeJSONParse,
  isRetryableError,
  isRetryableResponse
} from '../index';

describe('Utility Functions', () => {
  describe('buildURL', () => {
    it('should build URLs correctly', () => {
      expect(buildURL('https://api.example.com', '/users')).toBe('https://api.example.com/users');
      expect(buildURL('https://api.example.com/', '/users')).toBe('https://api.example.com/users');
      expect(buildURL('https://api.example.com', 'users')).toBe('https://api.example.com/users');
    });

    it('should handle query parameters', () => {
      const url = buildURL('https://api.example.com', '/users', { page: 1, limit: 10 });
      expect(url).toContain('page=1');
      expect(url).toContain('limit=10');
    });

    it('should handle absolute URLs', () => {
      expect(buildURL('https://api.example.com', 'https://other.com')).toBe('https://other.com');
    });
  });

  describe('mergeHeaders', () => {
    it('should merge headers correctly', () => {
      const headers1 = { 'content-type': 'application/json' };
      const headers2 = new Headers({ 'authorization': 'Bearer token' });
      
      const merged = mergeHeaders(headers1, headers2);
      
      expect(merged.get('content-type')).toBe('application/json');
      expect(merged.get('authorization')).toBe('Bearer token');
    });
  });

  describe('normalizeBody', () => {
    it('should normalize different body types', () => {
      expect(normalizeBody('string')).toBe('string');
      expect(normalizeBody({ name: 'test' })).toBe('{"name":"test"}');
      expect(normalizeBody(undefined)).toBeUndefined();
      expect(normalizeBody(null)).toBeUndefined();
    });
  });

  describe('generateRequestId', () => {
    it('should generate unique request IDs', () => {
      const id1 = generateRequestId();
      const id2 = generateRequestId();
      
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });
  });

  describe('deepMerge', () => {
    it('should merge objects deeply', () => {
      const target = { a: 1, b: { c: 2 } };
      const source = { b: { d: 3 }, e: 4 };
      
      const merged = deepMerge(target, source);
      
      expect(merged).toEqual({ a: 1, b: { c: 2, d: 3 }, e: 4 });
    });
  });

  describe('sleep', () => {
    it('should sleep for specified time', async () => {
      const start = Date.now();
      await sleep(10);
      const end = Date.now();
      
      expect(end - start).toBeGreaterThanOrEqual(10);
    });
  });

  describe('calculateBackoffDelay', () => {
    it('should calculate backoff delay', () => {
      const delay1 = calculateBackoffDelay(0, { minDelay: 100, factor: 2 });
      const delay2 = calculateBackoffDelay(1, { minDelay: 100, factor: 2 });
      const delay3 = calculateBackoffDelay(2, { minDelay: 100, factor: 2 });
      
      expect(delay1).toBe(100);
      expect(delay2).toBe(200);
      expect(delay3).toBe(400);
    });
  });

  describe('parseRetryAfter', () => {
    it('should parse retry after header', () => {
      expect(parseRetryAfter('5')).toBe(5000);
      expect(parseRetryAfter('invalid')).toBe(0);
    });
  });

  describe('isAbsoluteURL', () => {
    it('should detect absolute URLs', () => {
      expect(isAbsoluteURL('https://api.example.com')).toBe(true);
      expect(isAbsoluteURL('http://localhost:3000')).toBe(true);
      expect(isAbsoluteURL('/relative')).toBe(false);
      expect(isAbsoluteURL('relative')).toBe(false);
    });
  });

  describe('safeJSONParse', () => {
    it('should parse valid JSON', () => {
      expect(safeJSONParse('{"name":"test"}')).toEqual({ name: 'test' });
    });

    it('should return null for invalid JSON', () => {
      expect(safeJSONParse('invalid json')).toBeNull();
    });
  });

  describe('isRetryableError', () => {
    it('should identify retryable errors', () => {
      const networkError = new TypeError('fetch failed');
      const httpError = { status: 500 };
      const rateLimitError = { status: 429 };
      const clientError = { status: 400 };
      
      expect(isRetryableError(networkError)).toBe(true);
      expect(isRetryableError(httpError)).toBe(true);
      expect(isRetryableError(rateLimitError)).toBe(true);
      expect(isRetryableError(clientError)).toBe(false);
    });
  });

  describe('isRetryableResponse', () => {
    it('should identify retryable responses', () => {
      const serverError = new Response(null, { status: 500 });
      const rateLimit = new Response(null, { status: 429 });
      const clientError = new Response(null, { status: 400 });
      
      expect(isRetryableResponse(serverError)).toBe(true);
      expect(isRetryableResponse(rateLimit)).toBe(true);
      expect(isRetryableResponse(clientError)).toBe(false);
    });
  });
});
