import { describe, it, expect } from 'vitest';
import { 
  validateUrlForSSRF, 
  cleanHopByHopHeaders, 
  blockDangerousHeaders,
  validateRequestSize,
  createSecurityMiddleware 
} from '../index';

describe('Security Features', () => {
  describe('validateUrlForSSRF', () => {
    it('should allow valid URLs', () => {
      expect(validateUrlForSSRF('https://api.example.com')).toBe(true);
      expect(validateUrlForSSRF('https://httpbin.org')).toBe(true);
    });

    it('should block localhost when enabled', () => {
      expect(validateUrlForSSRF('http://localhost:3000', { blockLocalhost: true })).toBe(false);
      expect(validateUrlForSSRF('http://127.0.0.1:3000', { blockLocalhost: true })).toBe(false);
    });

    it('should block private IPs when enabled', () => {
      expect(validateUrlForSSRF('http://192.168.1.1', { blockPrivateIPs: true })).toBe(false);
      expect(validateUrlForSSRF('http://10.0.0.1', { blockPrivateIPs: true })).toBe(false);
    });

    it('should allow only allowed domains', () => {
      expect(validateUrlForSSRF('https://api.example.com', { allowedDomains: ['api.example.com'] })).toBe(true);
      expect(validateUrlForSSRF('https://evil.com', { allowedDomains: ['api.example.com'] })).toBe(false);
    });

    it('should handle wildcard domains', () => {
      expect(validateUrlForSSRF('https://sub.api.example.com', { allowedDomains: ['*.api.example.com'] })).toBe(true);
      expect(validateUrlForSSRF('https://api.example.com', { allowedDomains: ['*.api.example.com'] })).toBe(true);
    });
  });

  describe('cleanHopByHopHeaders', () => {
    it('should remove hop-by-hop headers', () => {
      const headers = new Headers({
        'content-type': 'application/json',
        'connection': 'keep-alive',
        'authorization': 'Bearer token'
      });

      const cleaned = cleanHopByHopHeaders(headers);
      
      expect(cleaned.get('content-type')).toBe('application/json');
      expect(cleaned.get('authorization')).toBe('Bearer token');
      expect(cleaned.get('connection')).toBeNull();
    });
  });

  describe('blockDangerousHeaders', () => {
    it('should block dangerous headers', () => {
      const headers = new Headers({
        'content-type': 'application/json',
        'host': 'evil.com',
        'authorization': 'Bearer token'
      });

      const safe = blockDangerousHeaders(headers);
      
      expect(safe.get('content-type')).toBe('application/json');
      expect(safe.get('authorization')).toBe('Bearer token');
      expect(safe.get('host')).toBeNull();
    });
  });

  describe('validateRequestSize', () => {
    it('should validate request size', () => {
      const request = new Request('https://api.example.com', {
        method: 'POST',
        headers: { 'content-length': '1024' },
        body: 'test'
      });

      expect(validateRequestSize(request, 2048)).toBe(true);
      expect(validateRequestSize(request, 512)).toBe(false);
    });
  });

  describe('createSecurityMiddleware', () => {
    it('should create security middleware', () => {
      const middleware = createSecurityMiddleware({
        ssrfProtection: true,
        blockPrivateIPs: true
      });

      expect(typeof middleware).toBe('function');
    });
  });
});
