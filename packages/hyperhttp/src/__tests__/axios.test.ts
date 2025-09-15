import { describe, it, expect, vi } from 'vitest';
import { createAxiosAdapter, AxiosError } from '../index';

// Mock fetch
global.fetch = vi.fn();

describe('Axios Compatibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createAxiosAdapter', () => {
    it('should create an Axios-compatible client', () => {
      const axios = createAxiosAdapter({ baseURL: 'https://api.example.com' });
      expect(axios).toBeDefined();
      expect(typeof axios.get).toBe('function');
      expect(typeof axios.post).toBe('function');
      expect(typeof axios.put).toBe('function');
      expect(typeof axios.patch).toBe('function');
      expect(typeof axios.delete).toBe('function');
      expect(typeof axios.head).toBe('function');
      expect(typeof axios.options).toBe('function');
      expect(typeof axios.request).toBe('function');
      expect(axios.defaults).toBeDefined();
      expect(axios.interceptors).toBeDefined();
    });

    it('should make GET requests', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ data: 'test' })
      };
      
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const axios = createAxiosAdapter({ baseURL: 'https://api.example.com' });
      const response = await axios.get('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(Request)
      );
      expect(response.status).toBe(200);
      expect(response.data).toEqual({ data: 'test' });
      expect(response.config).toBeDefined();
    });

    it('should make POST requests', async () => {
      const mockResponse = {
        ok: true,
        status: 201,
        statusText: 'Created',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ id: 1 })
      };
      
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const axios = createAxiosAdapter({ baseURL: 'https://api.example.com' });
      const response = await axios.post('/test', { name: 'test' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(Request)
      );
      expect(response.status).toBe(201);
      expect(response.data).toEqual({ id: 1 });
    });
  });

  describe('AxiosError', () => {
    it('should create AxiosError with correct properties', () => {
      const config = { url: '/test', method: 'GET' };
      const error = new AxiosError('Test error', 'TEST_ERROR', config);
      
      expect(error.message).toBe('Test error');
      expect(error.config).toBe(config);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.isAxiosError).toBe(true);
    });

    it('should identify AxiosError correctly', () => {
      const config = { url: '/test', method: 'GET' };
      const error = new AxiosError('Test error', undefined, config);
      
      expect(AxiosError.isAxiosError(error)).toBe(true);
      expect(AxiosError.isAxiosError(new Error('Regular error'))).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should throw AxiosError for HTTP errors', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers(),
        json: () => Promise.resolve({ error: 'Not found' })
      };
      
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const axios = createAxiosAdapter({ baseURL: 'https://api.example.com' });
      
      await expect(axios.get('/test')).rejects.toThrow(AxiosError);
    });

    it('should throw AxiosError for network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new TypeError('Network error'));

      const axios = createAxiosAdapter({ baseURL: 'https://api.example.com' });
      
      await expect(axios.get('/test')).rejects.toThrow(AxiosError);
    });
  });
});
