/**
 * Tests for HyperHTTP client
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient, createDefaultClient, createClientFor } from '../client.js';
import { HyperHttpError, HyperAbortError, NetworkError } from '../errors.js';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('HyperHTTP Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createClient', () => {
    it('should create a client with default options', () => {
      const client = createClient();
      expect(client).toBeDefined();
      expect(typeof client.request).toBe('function');
      expect(typeof client.get).toBe('function');
      expect(typeof client.post).toBe('function');
    });

    it('should create a client with custom options', () => {
      const client = createClient({
        baseURL: 'https://api.example.com',
        headers: { 'Authorization': 'Bearer token' },
      });
      expect(client).toBeDefined();
    });
  });

  describe('createDefaultClient', () => {
    it('should create a default client', () => {
      const client = createDefaultClient();
      expect(client).toBeDefined();
    });
  });

  describe('createClientFor', () => {
    it('should create a client for a specific base URL', () => {
      const client = createClientFor('https://api.example.com');
      expect(client).toBeDefined();
    });
  });

  describe('HTTP methods', () => {
    let client: ReturnType<typeof createClient>;

    beforeEach(() => {
      client = createClient();
    });

    it('should make GET requests', async () => {
      const mockResponse = new Response('{"data": "test"}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await client.get('https://api.example.com/test');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: 'https://api.example.com/test',
        })
      );
    });

    it('should make POST requests', async () => {
      const mockResponse = new Response('{"data": "created"}', {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await client.post('https://api.example.com/test', { name: 'test' });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: 'https://api.example.com/test',
        })
      );
    });

    it('should make PUT requests', async () => {
      const mockResponse = new Response('{"data": "updated"}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await client.put('https://api.example.com/test', { name: 'test' });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'PUT',
          url: 'https://api.example.com/test',
        })
      );
    });

    it('should make PATCH requests', async () => {
      const mockResponse = new Response('{"data": "patched"}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await client.patch('https://api.example.com/test', { name: 'test' });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'PATCH',
          url: 'https://api.example.com/test',
        })
      );
    });

    it('should make DELETE requests', async () => {
      const mockResponse = new Response(null, {
        status: 204,
      });
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await client.delete('https://api.example.com/test');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'DELETE',
          url: 'https://api.example.com/test',
        })
      );
    });

    it('should make HEAD requests', async () => {
      const mockResponse = new Response('', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await client.head('https://api.example.com/test');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(Request)
      );
    });

    it('should make OPTIONS requests', async () => {
      const mockResponse = new Response('', {
        status: 200,
        headers: { 'Allow': 'GET, POST' },
      });
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await client.options('https://api.example.com/test');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'OPTIONS',
          url: 'https://api.example.com/test',
        })
      );
    });
  });

  describe('Response handling', () => {
    let client: ReturnType<typeof createClient>;

    beforeEach(() => {
      client = createClient();
    });

    it('should handle JSON responses', async () => {
      const mockResponse = new Response('{"data": "test"}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await client.json('https://api.example.com/test');
      expect(result).toEqual({ data: 'test' });
    });

    it('should handle text responses', async () => {
      const mockResponse = new Response('Hello World', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await client.text('https://api.example.com/test');
      expect(result).toBe('Hello World');
    });

    it('should handle blob responses', async () => {
      const mockBlob = new Blob(['test data'], { type: 'text/plain' });
      const mockResponse = new Response(mockBlob, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await client.blob('https://api.example.com/test');
      expect(result).toBeInstanceOf(Blob);
    });

    it('should handle array buffer responses', async () => {
      const mockArrayBuffer = new ArrayBuffer(8);
      const mockResponse = new Response(mockArrayBuffer, {
        status: 200,
        headers: { 'Content-Type': 'application/octet-stream' },
      });
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await client.arrayBuffer('https://api.example.com/test');
      expect(result).toBeInstanceOf(ArrayBuffer);
    });

    it('should handle stream responses', async () => {
      const mockStream = new ReadableStream();
      const mockResponse = new Response(mockStream, {
        status: 200,
        headers: { 'Content-Type': 'application/octet-stream' },
      });
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await client.stream('https://api.example.com/test');
      expect(result).toBeInstanceOf(ReadableStream);
    });
  });

  describe('Error handling', () => {
    let client: ReturnType<typeof createClient>;

    beforeEach(() => {
      client = createClient();
    });

    it('should handle HTTP errors', async () => {
      const mockResponse = new Response('Not Found', {
        status: 404,
        statusText: 'Not Found',
      });
      mockFetch.mockResolvedValueOnce(mockResponse);

      await expect(client.get('https://api.example.com/test')).rejects.toThrow(HyperHttpError);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(client.get('https://api.example.com/test')).rejects.toThrow(NetworkError);
    });

    it('should handle abort errors', async () => {
      const abortController = new AbortController();
      abortController.abort();

      await expect(client.get('https://api.example.com/test', {
        signal: abortController.signal,
      })).rejects.toThrow();
    });
  });

  describe('Request configuration', () => {
    let client: ReturnType<typeof createClient>;

    beforeEach(() => {
      client = createClient();
    });

    it('should handle query parameters', async () => {
      const mockResponse = new Response('{"data": "test"}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
      mockFetch.mockResolvedValueOnce(mockResponse);

      await client.get('https://api.example.com/test', {
        query: { page: 1, limit: 10 },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://api.example.com/test?page=1&limit=10',
        })
      );
    });

    it('should handle custom headers', async () => {
      const mockResponse = new Response('{"data": "test"}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
      mockFetch.mockResolvedValueOnce(mockResponse);

      await client.get('https://api.example.com/test', {
        headers: { 'Authorization': 'Bearer token' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.any(Headers),
        })
      );
      
      // Check headers separately
      const call = mockFetch.mock.calls[0][0];
      expect(call.headers.get('Authorization')).toBe('Bearer token');
    });

    it('should handle request body', async () => {
      const mockResponse = new Response('{"data": "created"}', {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
      mockFetch.mockResolvedValueOnce(mockResponse);

      await client.post('https://api.example.com/test', { name: 'test' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(Request)
      );
    });

    it('should handle timeout', async () => {
      const mockResponse = new Response('{"data": "test"}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
      mockFetch.mockResolvedValueOnce(mockResponse);

      await client.get('https://api.example.com/test', {
        timeout: 5000,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
    });
  });
});
