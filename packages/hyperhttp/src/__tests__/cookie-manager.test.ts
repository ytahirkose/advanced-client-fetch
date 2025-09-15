/**
 * Tests for cookie management
 */

import { describe, it, expect, vi } from 'vitest';
import {
  MemoryCookieJar,
  createCookieMiddleware,
  createCookieJar,
  parseCookies,
  formatCookies,
} from '../cookie-manager.js';

describe('Cookie Management', () => {
  describe('MemoryCookieJar', () => {
    let cookieJar: MemoryCookieJar;

    beforeEach(() => {
      cookieJar = new MemoryCookieJar();
    });

    it('should set and get cookies', async () => {
      await cookieJar.set('https://example.com', 'test=value; Domain=example.com; Path=/');

      const cookies = await cookieJar.get('https://example.com');
      expect(cookies).toBe('test=value');
    });

    it('should delete cookies', async () => {
      await cookieJar.set('https://example.com', 'test=value; Domain=example.com; Path=/');

      let cookies = await cookieJar.get('https://example.com');
      expect(cookies).toBe('test=value');
      
      await cookieJar.delete('https://example.com', 'test');
      cookies = await cookieJar.get('https://example.com');
      expect(cookies).toBe('');
    });

    it('should clear all cookies', async () => {
      await cookieJar.set('https://example.com', 'test1=value1; Domain=example.com; Path=/');
      await cookieJar.set('https://example.com', 'test2=value2; Domain=example.com; Path=/');

      const allCookies = cookieJar.getAllCookies();
      expect(allCookies.size).toBeGreaterThan(0);
      
      await cookieJar.clear();
      const clearedCookies = cookieJar.getAllCookies();
      expect(clearedCookies.size).toBe(0);
    });

    it('should get cookies for URL', async () => {
      await cookieJar.set('https://example.com', 'test=value; Domain=example.com; Path=/');

      const cookies = await cookieJar.get('https://example.com/api');
      expect(cookies).toBe('test=value');
    });

    it('should set cookies from response', async () => {
      const response = new Response('', {
        headers: {
          'Set-Cookie': 'test=value; Domain=example.com; Path=/; HttpOnly',
        },
      });

      await cookieJar.set('https://example.com', 'test=value; Domain=example.com; Path=/; HttpOnly');
      
      const cookies = await cookieJar.get('https://example.com');
      expect(cookies).toBe('test=value');
    });

    it('should handle expired cookies', async () => {
      const expiredDate = new Date(Date.now() - 1000);
      
      await cookieJar.set('https://example.com', `test=value; Domain=example.com; Path=/; Expires=${expiredDate.toUTCString()}`);

      const cookies = await cookieJar.get('https://example.com');
      expect(cookies).toBe('');
    });

    it('should handle max-age cookies', async () => {
      await cookieJar.set('https://example.com', 'test=value; Domain=example.com; Path=/; Max-Age=-1');

      const cookies = await cookieJar.get('https://example.com');
      expect(cookies).toBe('');
    });
  });

  describe('parseCookies', () => {
    it('should parse cookie string', () => {
      const cookies = parseCookies('test1=value1; test2=value2; test3=value3');
      
      expect(cookies.get('test1')).toBe('value1');
      expect(cookies.get('test2')).toBe('value2');
      expect(cookies.get('test3')).toBe('value3');
    });

    it('should handle empty cookie string', () => {
      const cookies = parseCookies('');
      expect(cookies.size).toBe(0);
    });

    it('should handle malformed cookies', () => {
      const cookies = parseCookies('invalid; test=value; another=invalid');
      
      expect(cookies.get('test')).toBe('value');
      expect(cookies.get('invalid')).toBeUndefined();
      expect(cookies.get('another')).toBe('invalid');
    });
  });

  describe('formatCookies', () => {
    it('should format cookies map to string', () => {
      const cookies = new Map([
        ['test1', 'value1'],
        ['test2', 'value2'],
        ['test3', 'value3'],
      ]);

      const formatted = formatCookies(cookies);
      expect(formatted).toBe('test1=value1; test2=value2; test3=value3');
    });

    it('should handle empty cookies map', () => {
      const cookies = new Map();
      const formatted = formatCookies(cookies);
      expect(formatted).toBe('');
    });
  });

  describe('createCookieJar', () => {
    it('should create cookie jar', () => {
      const jar = createCookieJar();
      expect(jar).toBeInstanceOf(MemoryCookieJar);
    });
  });

  describe('createCookieMiddleware', () => {
    it('should create cookie middleware', () => {
      const middleware = createCookieMiddleware();
      expect(typeof middleware).toBe('function');
    });
  });
});
