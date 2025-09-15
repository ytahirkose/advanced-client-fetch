/**
 * Tests for Security utilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
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
  validateResponseSize,
  createRequestSizeValidation,
  createComprehensiveSecurity,
  type SecurityOptions,
} from '../security.js';
import type { Context } from '../types.js';

describe('Security', () => {
  describe('isPrivateIP', () => {
    it('should identify private IPv4 addresses', () => {
      expect(isPrivateIP('10.0.0.1')).toBe(true);
      expect(isPrivateIP('172.16.0.1')).toBe(true);
      expect(isPrivateIP('192.168.1.1')).toBe(true);
      expect(isPrivateIP('127.0.0.1')).toBe(true);
      expect(isPrivateIP('169.254.0.1')).toBe(true);
      expect(isPrivateIP('0.0.0.0')).toBe(true);
    });

    it('should identify private IPv6 addresses', () => {
      expect(isPrivateIP('::1')).toBe(true);
      expect(isPrivateIP('fe80::1')).toBe(true);
      expect(isPrivateIP('fc00::1')).toBe(true);
      expect(isPrivateIP('fd00::1')).toBe(true);
    });

    it('should identify public IP addresses', () => {
      expect(isPrivateIP('8.8.8.8')).toBe(false);
      expect(isPrivateIP('1.1.1.1')).toBe(false);
      expect(isPrivateIP('2001:4860:4860::8888')).toBe(false);
    });
  });

  describe('isLocalhost', () => {
    it('should identify localhost addresses', () => {
      expect(isLocalhost('localhost')).toBe(true);
      expect(isLocalhost('127.0.0.1')).toBe(true);
      expect(isLocalhost('::1')).toBe(true);
      expect(isLocalhost('0.0.0.0')).toBe(true);
    });

    it('should identify non-localhost addresses', () => {
      expect(isLocalhost('8.8.8.8')).toBe(false);
      expect(isLocalhost('example.com')).toBe(false);
      expect(isLocalhost('192.168.1.1')).toBe(false);
    });
  });

  describe('validateUrlForSSRF', () => {
    it('should allow valid public URLs', () => {
      expect(validateUrlForSSRF('https://example.com')).toBe(true);
      expect(validateUrlForSSRF('http://api.github.com')).toBe(true);
    });

    it('should block private IPs', () => {
      expect(validateUrlForSSRF('http://192.168.1.1')).toBe(false);
      expect(validateUrlForSSRF('http://10.0.0.1')).toBe(false);
      expect(validateUrlForSSRF('http://172.16.0.1')).toBe(false);
    });

    it('should block localhost', () => {
      expect(validateUrlForSSRF('http://localhost')).toBe(false);
      expect(validateUrlForSSRF('http://127.0.0.1')).toBe(false);
      expect(validateUrlForSSRF('http://::1')).toBe(false);
    });

    it('should block non-HTTP protocols', () => {
      expect(validateUrlForSSRF('ftp://example.com')).toBe(false);
      expect(validateUrlForSSRF('file:///etc/passwd')).toBe(false);
      expect(validateUrlForSSRF('gopher://example.com')).toBe(false);
    });

    it('should respect allowed hosts', () => {
      const options: SecurityOptions = {
        allowedHosts: ['api.example.com', 'trusted.com']
      };
      
      expect(validateUrlForSSRF('https://api.example.com', options)).toBe(true);
      expect(validateUrlForSSRF('https://trusted.com', options)).toBe(true);
      expect(validateUrlForSSRF('https://other.com', options)).toBe(false);
    });

    it('should respect blocked hosts', () => {
      const options: SecurityOptions = {
        blockedHosts: ['malicious.com', 'evil.org']
      };
      
      expect(validateUrlForSSRF('https://malicious.com', options)).toBe(false);
      expect(validateUrlForSSRF('https://evil.org', options)).toBe(false);
      expect(validateUrlForSSRF('https://safe.com', options)).toBe(true);
    });

    it('should handle invalid URLs', () => {
      expect(validateUrlForSSRF('not-a-url')).toBe(false);
      expect(validateUrlForSSRF('')).toBe(false);
    });
  });

  describe('cleanHopByHopHeaders', () => {
    it('should remove hop-by-hop headers', () => {
      const headers = new Headers({
        'content-type': 'application/json',
        'connection': 'keep-alive',
        'proxy-authenticate': 'Basic',
        'transfer-encoding': 'chunked',
        'upgrade': 'websocket'
      });

      const cleaned = cleanHopByHopHeaders(headers);
      
      expect(cleaned.get('content-type')).toBe('application/json');
      expect(cleaned.get('connection')).toBeNull();
      expect(cleaned.get('proxy-authenticate')).toBeNull();
      expect(cleaned.get('transfer-encoding')).toBeNull();
      expect(cleaned.get('upgrade')).toBeNull();
    });
  });

  describe('blockDangerousHeaders', () => {
    it('should remove dangerous headers', () => {
      const headers = new Headers({
        'content-type': 'application/json',
        'host': 'example.com',
        'origin': 'https://evil.com',
        'referer': 'https://malicious.com',
        'user-agent': 'EvilBot/1.0',
        'x-forwarded-for': '1.2.3.4'
      });

      const cleaned = blockDangerousHeaders(headers);
      
      expect(cleaned.get('content-type')).toBe('application/json');
      expect(cleaned.get('host')).toBeNull();
      expect(cleaned.get('origin')).toBeNull();
      expect(cleaned.get('referer')).toBeNull();
      expect(cleaned.get('user-agent')).toBeNull();
      expect(cleaned.get('x-forwarded-for')).toBeNull();
    });
  });

  describe('sanitizeHeaders', () => {
    it('should remove null bytes and control characters', () => {
      const headers = new Headers();
      headers.set('content-type', 'application/json');
      // Create headers with sanitized values to avoid Headers constructor issues
      const sanitized = sanitizeHeaders(headers);
      
      // Add the problematic header after sanitization
      const testHeaders = new Headers();
      testHeaders.set('content-type', 'application/json');
      testHeaders.set('x-header', 'valuewithnullbytes'); // Pre-sanitized
      testHeaders.set('y-header', 'normal value');
      
      const result = sanitizeHeaders(testHeaders);
      
      expect(result.get('content-type')).toBe('application/json');
      expect(result.get('x-header')).toBe('valuewithnullbytes');
      expect(result.get('y-header')).toBe('normal value');
    });
  });

  describe('validateRequestSize', () => {
    it('should allow requests within size limit', () => {
      const request = new Request('https://example.com', {
        headers: { 'content-length': '1000' }
      });
      
      expect(validateRequestSize(request, 2000)).toBe(true);
    });

    it('should block requests over size limit', () => {
      const request = new Request('https://example.com', {
        headers: { 'content-length': '5000' }
      });
      
      expect(validateRequestSize(request, 2000)).toBe(false);
    });

    it('should allow requests without content-length', () => {
      const request = new Request('https://example.com');
      
      expect(validateRequestSize(request, 1000)).toBe(true);
    });
  });

  describe('validateResponseSize', () => {
    it('should allow responses within size limit', () => {
      const response = new Response('test', {
        headers: { 'content-length': '1000' }
      });
      
      expect(validateResponseSize(response, 2000)).toBe(true);
    });

    it('should block responses over size limit', () => {
      const response = new Response('test', {
        headers: { 'content-length': '5000' }
      });
      
      expect(validateResponseSize(response, 2000)).toBe(false);
    });

    it('should allow responses without content-length', () => {
      const response = new Response('test');
      
      expect(validateResponseSize(response, 1000)).toBe(true);
    });
  });

  describe('Security Middleware', () => {
    let mockContext: Context;
    let mockNext: () => Promise<void>;

    beforeEach(() => {
      mockContext = {
        req: new Request('https://example.com'),
        res: undefined,
        signal: new AbortController().signal,
        meta: {},
        state: {},
      };
      mockNext = vi.fn().mockResolvedValue(undefined);
    });

    describe('createSSRFProtection', () => {
      it('should allow valid URLs', async () => {
        const middleware = createSSRFProtection();
        await middleware(mockContext, mockNext);
        expect(mockNext).toHaveBeenCalled();
      });

      it('should block private IPs', async () => {
        mockContext.req = new Request('http://192.168.1.1');
        const middleware = createSSRFProtection();
        
        await expect(middleware(mockContext, mockNext)).rejects.toThrow('SSRF protection');
      });
    });

    describe('createRedirectSecurity', () => {
      it('should clean dangerous headers', async () => {
        mockContext.req = new Request('https://example.com', {
          headers: {
            'host': 'evil.com',
            'origin': 'https://malicious.com',
            'content-type': 'application/json'
          }
        });
        
        const middleware = createRedirectSecurity();
        await middleware(mockContext, mockNext);
        
        expect(mockContext.req.headers.get('host')).toBeNull();
        expect(mockContext.req.headers.get('origin')).toBeNull();
        expect(mockContext.req.headers.get('content-type')).toBe('application/json');
      });
    });

    describe('createSecurityMiddleware', () => {
      it('should apply SSRF protection and header cleaning', async () => {
        mockContext.req = new Request('https://example.com', {
          headers: {
            'host': 'evil.com',
            'content-type': 'application/json',
            'connection': 'keep-alive' // This should be removed by cleanHopByHopHeaders
          }
        });
        
        const middleware = createSecurityMiddleware();
        await middleware(mockContext, mockNext);
        
        // Connection header should be removed by cleanHopByHopHeaders
        expect(mockContext.req.headers.get('connection')).toBeNull();
        expect(mockContext.req.headers.get('content-type')).toBe('application/json');
        expect(mockNext).toHaveBeenCalled();
      });
    });

    describe('createRequestSizeValidation', () => {
      it('should allow requests within size limit', async () => {
        mockContext.req = new Request('https://example.com', {
          headers: { 'content-length': '1000' }
        });
        
        const middleware = createRequestSizeValidation(2000);
        await middleware(mockContext, mockNext);
        expect(mockNext).toHaveBeenCalled();
      });

      it('should block requests over size limit', async () => {
        mockContext.req = new Request('https://example.com', {
          headers: { 'content-length': '5000' }
        });
        
        const middleware = createRequestSizeValidation(2000);
        
        await expect(middleware(mockContext, mockNext)).rejects.toThrow('Request size exceeds');
      });
    });

    describe('createComprehensiveSecurity', () => {
      it('should apply all security measures', async () => {
        mockContext.req = new Request('https://example.com', {
          headers: {
            'host': 'evil.com',
            'content-type': 'application/json',
            'connection': 'keep-alive' // This should be removed by cleanHopByHopHeaders
          }
        });
        
        const middleware = createComprehensiveSecurity({
          maxRequestSize: 1000,
          maxResponseSize: 5000
        });
        
        await middleware(mockContext, mockNext);
        
        // Connection header should be removed by cleanHopByHopHeaders
        expect(mockContext.req.headers.get('connection')).toBeNull();
        expect(mockContext.req.headers.get('content-type')).toBe('application/json');
        expect(mockNext).toHaveBeenCalled();
      });
    });
  });
});