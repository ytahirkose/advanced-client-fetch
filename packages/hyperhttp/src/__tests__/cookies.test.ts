import { describe, it, expect } from 'vitest';
import { 
  createCookieJar, 
  parseCookies, 
  formatCookies,
  createCookieMiddleware 
} from '../index';

describe('Cookie Management', () => {
  describe('parseCookies', () => {
    it('should parse cookie header', () => {
      const cookies = parseCookies('name=value; another=test');
      
      expect(cookies).toHaveLength(2);
      expect(cookies[0]).toEqual({ name: 'name', value: 'value' });
      expect(cookies[1]).toEqual({ name: 'another', value: 'test' });
    });

    it('should handle empty cookie header', () => {
      const cookies = parseCookies('');
      expect(cookies).toHaveLength(0);
    });
  });

  describe('formatCookies', () => {
    it('should format cookies', () => {
      const cookies = [
        { name: 'name', value: 'value' },
        { name: 'another', value: 'test' }
      ];
      
      const formatted = formatCookies(cookies);
      expect(formatted).toBe('name=value; another=test');
    });
  });

  describe('createCookieJar', () => {
    it('should create cookie jar', () => {
      const jar = createCookieJar();
      
      expect(jar).toBeDefined();
      expect(typeof jar.get).toBe('function');
      expect(typeof jar.set).toBe('function');
      expect(typeof jar.clear).toBe('function');
    });

    it('should store and retrieve cookies', () => {
      const jar = createCookieJar();
      const cookies = [
        { name: 'session', value: 'abc123' },
        { name: 'user', value: 'john' }
      ];
      
      jar.set('https://api.example.com', cookies);
      const retrieved = jar.get('https://api.example.com');
      
      expect(retrieved).toHaveLength(2);
      expect(retrieved[0]).toEqual({ name: 'session', value: 'abc123' });
    });
  });

  describe('createCookieMiddleware', () => {
    it('should create cookie middleware', () => {
      const jar = createCookieJar();
      const middleware = createCookieMiddleware(jar);
      
      expect(typeof middleware).toBe('function');
    });
  });
});
