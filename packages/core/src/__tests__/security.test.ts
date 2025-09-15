/**
 * Tests for security utilities
 */

import { describe, it, expect, vi } from 'vitest';
import {
  isPrivateIP,
  isLocalhost,
  validateUrlForSSRF,
  cleanHopByHopHeaders,
  blockDangerousHeaders,
  createSSRFProtection,
  createRedirectSecurity,
  createSecurityMiddleware,
  sanitizeHeaders,
  validateRequestSize,
  createRequestSizeValidation,
} from '../security.js';

describe('Security', () => {
  describe('isPrivateIP', () => {
    it('should detect private IPs', () => {
      expect(isPrivateIP('10.0.0.1')).toBe(true);
      expect(isPrivateIP('192.168.1.1')).toBe(true);
      expect(isPrivateIP('172.16.0.1')).toBe(true);
      expect(isPrivateIP('127.0.0.1')).toBe(true);
      expect(isPrivateIP('169.254.0.1')).toBe(true);
    });

    it('should not detect public IPs as private', () => {
      expect(isPrivateIP('8.8.8.8')).toBe(false);
      expect(isPrivateIP('1.1.1.1')).toBe(false);
      expect(isPrivateIP('google.com')).toBe(false);
    });
  });

  describe('isLocalhost', () => {
    it('should detect localhost', () => {
      expect(isLocalhost('localhost')).toBe(true);
      expect(isLocalhost('127.0.0.1')).toBe(true);
      expect(isLocalhost('::1')).toBe(true);
      expect(isLocalhost('127.0.0.1')).toBe(true);
    });

    it('should not detect non-localhost as localhost', () => {
      expect(isLocalhost('google.com')).toBe(false);
      expect(isLocalhost('8.8.8.8')).toBe(false);
    });
  });

  describe('validateUrlForSSRF', () => {
    it('should allow public URLs', () => {
      expect(validateUrlForSSRF('https://google.com')).toBe(true);
      expect(validateUrlForSSRF('https://api.github.com')).toBe(true);
    });

    it('should block private IPs when configured', () => {
      expect(validateUrlForSSRF('http://10.0.0.1', { blockPrivateIPs: true })).toBe(false);
      expect(validateUrlForSSRF('http://192.168.1.1', { blockPrivateIPs: true })).toBe(false);
    });

    it('should block localhost when configured', () => {
      expect(validateUrlForSSRF('http://localhost', { blockLocalhost: true })).toBe(false);
      expect(validateUrlForSSRF('http://127.0.0.1', { blockLocalhost: true })).toBe(false);
    });

    it('should allow URLs in allowed domains', () => {
      expect(validateUrlForSSRF('https://api.example.com', { 
        allowedHosts: ['example.com'] 
      })).toBe(true);
    });

    it('should block URLs not in allowed domains', () => {
      expect(validateUrlForSSRF('https://malicious.com', { 
        allowedHosts: ['example.com'] 
      })).toBe(false);
    });
  });

  describe('cleanHopByHopHeaders', () => {
    it('should remove hop-by-hop headers', () => {
      const headers = new Headers({
        'Connection': 'keep-alive',
        'Keep-Alive': 'timeout=5',
        'Authorization': 'Bearer token',
        'Content-Type': 'application/json',
      });

      const cleaned = cleanHopByHopHeaders(headers);
      expect(cleaned.get('Connection')).toBeNull();
      expect(cleaned.get('Keep-Alive')).toBeNull();
      expect(cleaned.get('Authorization')).toBe('Bearer token');
      expect(cleaned.get('Content-Type')).toBe('application/json');
    });
  });

  describe('blockDangerousHeaders', () => {
    it('should block dangerous headers', () => {
      const headers = new Headers({
        'Host': 'malicious.com',
        'Origin': 'https://evil.com',
        'Authorization': 'Bearer token',
        'Content-Type': 'application/json',
      });

      const blocked = blockDangerousHeaders(headers);
      expect(blocked.get('Host')).toBeNull();
      expect(blocked.get('Origin')).toBeNull();
      expect(blocked.get('Authorization')).toBe('Bearer token');
      expect(blocked.get('Content-Type')).toBe('application/json');
    });
  });

  describe('sanitizeHeaders', () => {
    it('should remove control characters', () => {
      const testValue = 'value\x00with\x1Fcontrol';
      const normalValue = 'normal value';
      
      // Create headers object manually
      const headersObj = {
        'X-Test': testValue,
        'X-Normal': normalValue,
      };

      const sanitized = sanitizeHeaders(headersObj);
      expect(sanitized.get('X-Test')).toBe('valuewithcontrol');
      expect(sanitized.get('X-Normal')).toBe('normal value');
    });
  });

  describe('validateRequestSize', () => {
    it('should validate request size', () => {
      const smallRequest = new Request('https://example.com', {
        headers: { 'Content-Length': '1000' },
      });
      const largeRequest = new Request('https://example.com', {
        headers: { 'Content-Length': '20000000' },
      });

      expect(validateRequestSize(smallRequest, 1000000)).toBe(true);
      expect(validateRequestSize(largeRequest, 1000000)).toBe(false);
    });
  });

  describe('createSSRFProtection', () => {
    it('should create SSRF protection middleware', () => {
      const middleware = createSSRFProtection();
      expect(typeof middleware).toBe('function');
    });
  });

  describe('createRedirectSecurity', () => {
    it('should create redirect security middleware', () => {
      const middleware = createRedirectSecurity();
      expect(typeof middleware).toBe('function');
    });
  });

  describe('createSecurityMiddleware', () => {
    it('should create security middleware', () => {
      const middleware = createSecurityMiddleware();
      expect(typeof middleware).toBe('function');
    });
  });

  describe('createRequestSizeValidation', () => {
    it('should create request size validation middleware', () => {
      const middleware = createRequestSizeValidation(1000000);
      expect(typeof middleware).toBe('function');
    });
  });
});
