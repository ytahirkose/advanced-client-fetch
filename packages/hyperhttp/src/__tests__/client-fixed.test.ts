import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createClient, HttpError, NetworkError, AbortError } from '../index';

// Mock fetch globally
global.fetch = vi.fn();

describe('Advanced Client Fetch - Fixed Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createClient', () => {
    it('should create a client with default options', () => {
      const client = createClient();
      expect(client).toBeDefined();
      expect(typeof client.get).toBe('function');
      expect(typeof client.post).toBe('function');
    });

    it('should create a client with custom options', () => {
      const client = createClient({
        baseURL: 'https://api.example.com',
        timeout: 5000,
        headers: { 'Authorization': 'Bearer token' }
      });
      expect(client).toBeDefined();
    });
  });

  describe('HTTP Methods', () => {
    it('should make GET requests', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ data: 'test' })
      };
      
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const client = createClient({ baseURL: 'https://api.example.com' });
      const response = await client.get('/test');

      expect(global.fetch).toHaveBeenCalledWith(expect.any(Request));
      expect(response.status).toBe(200);
      expect(response.data).toEqual({ data: 'test' });
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

      const client = createClient({ baseURL: 'https://api.example.com' });
      const response = await client.post('/test', { name: 'test' });

      expect(global.fetch).toHaveBeenCalledWith(expect.any(Request));
      expect(response.status).toBe(201);
      expect(response.data).toEqual({ id: 1 });
    });
  });

  describe('Error Handling', () => {
    it('should throw HttpError for HTTP errors', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ error: 'Not found' })
      };
      
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const client = createClient({ baseURL: 'https://api.example.com' });
      
      await expect(client.get('/test')).rejects.toThrow(HttpError);
    });

    it('should throw NetworkError for network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new TypeError('Network error'));

      const client = createClient({ baseURL: 'https://api.example.com' });
      
      await expect(client.get('/test')).rejects.toThrow(NetworkError);
    });

    it('should throw AbortError for aborted requests', async () => {
      (global.fetch as any).mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'));

      const client = createClient({ baseURL: 'https://api.example.com' });
      
      await expect(client.get('/test')).rejects.toThrow(AbortError);
    });
  });

  describe('Response Types', () => {
    it('should handle JSON responses', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ data: 'test' })
      };
      
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const client = createClient({ baseURL: 'https://api.example.com' });
      const response = await client.get('/test', { responseType: 'json' });

      expect(response.data).toEqual({ data: 'test' });
    });

    it('should handle text responses', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: () => Promise.resolve('test text')
      };
      
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const client = createClient({ baseURL: 'https://api.example.com' });
      const response = await client.get('/test', { responseType: 'text' });

      expect(response.data).toBe('test text');
    });
  });
});
