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

    it('should set and get cookies', () => {
      cookieJar.set('test', 'value', {
        domain: 'example.com',
        path: '/',
      });

      expect(cookieJar.get('test')).toBe('value');
    });

    it('should delete cookies', () => {
      cookieJar.set('test', 'value', {
        domain: 'example.com',
        path: '/',
      });

      expect(cookieJar.get('test')).toBe('value');
      
      cookieJar.delete('test', 'example.com', '/');
      expect(cookieJar.get('test')).toBeUndefined();
    });

    it('should clear all cookies', () => {
      cookieJar.set('test1', 'value1', {
        domain: 'example.com',
        path: '/',
      });
      cookieJar.set('test2', 'value2', {
        domain: 'example.com',
        path: '/',
      });

      expect(cookieJar.getAll()).toHaveLength(2);
      
      cookieJar.clear();
      expect(cookieJar.getAll()).toHaveLength(0);
    });

    it('should get cookies for URL', () => {
      cookieJar.set('test', 'value', {
        domain: 'example.com',
        path: '/',
      });

      const cookies = cookieJar.getForUrl('https://example.com/api');
      expect(cookies).toBe('test=value');
    });

    it('should set cookies from response', () => {
      const response = new Response('', {
        headers: {
          'Set-Cookie': 'test=value; Domain=example.com; Path=/; HttpOnly',
        },
      });

      cookieJar.setFromResponse(response, 'https://example.com');
      
      expect(cookieJar.get('test')).toBe('value');
    });

    it('should handle expired cookies', () => {
      const expiredDate = new Date(Date.now() - 1000);
      
      cookieJar.set({
        name: 'test',
        value: 'value',
        domain: 'example.com',
        path: '/',
        expires: expiredDate,
      });

      expect(cookieJar.get('test')).toBeUndefined();
    });

    it('should handle max-age cookies', () => {
      cookieJar.set({
        name: 'test',
        value: 'value',
        domain: 'example.com',
        path: '/',
        maxAge: -1, // Expired
      });

      expect(cookieJar.get('test')).toBeUndefined();
    });
  });

  describe('parseCookies', () => {
    it('should parse cookie string', () => {
      const cookies = parseCookies('test1=value1; test2=value2; test3=value3');
      
      expect(cookies.find(c => c.name === 'test1')?.value).toBe('value1');
      expect(cookies.find(c => c.name === 'test2')?.value).toBe('value2');
      expect(cookies.find(c => c.name === 'test3')?.value).toBe('value3');
    });

    it('should handle empty cookie string', () => {
      const cookies = parseCookies('');
      expect(cookies.length).toBe(0);
    });

    it('should handle malformed cookies', () => {
      const cookies = parseCookies('invalid; test=value; another=invalid');
      
      expect(cookies.find(c => c.name === 'test')?.value).toBe('value');
      expect(cookies.find(c => c.name === 'invalid')).toBeUndefined();
      expect(cookies.find(c => c.name === 'another')?.value).toBe('invalid');
    });
  });

  describe('formatCookies', () => {
    it('should format cookies map to string', () => {
      const cookies = [
        { name: 'test1', value: 'value1' },
        { name: 'test2', value: 'value2' },
        { name: 'test3', value: 'value3' },
      ];

      const formatted = formatCookies(cookies);
      expect(formatted).toBe('test1=value1; test2=value2; test3=value3');
    });

    it('should handle empty cookies map', () => {
      const cookies: any[] = [];
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
