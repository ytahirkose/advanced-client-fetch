import { describe, it, expect, vi } from 'vitest';
import { 
  createNodeClient, 
  createEdgeClient, 
  createBrowserClient, 
  createDenoClient, 
  createBunClient 
} from '../index';

// Mock fetch
global.fetch = vi.fn();

describe('Platform Presets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createNodeClient', () => {
    it('should create a Node.js client with appropriate plugins', () => {
      const client = createNodeClient({
        baseURL: 'https://api.example.com'
      });
      
      expect(client).toBeDefined();
      expect(typeof client.get).toBe('function');
      expect(typeof client.post).toBe('function');
    });

    it('should make requests successfully', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ data: 'test' })
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);

      const client = createNodeClient({ baseURL: 'https://api.example.com' });
      const response = await client.get('/test');

      expect(response.status).toBe(200);
      expect(response.data).toEqual({ data: 'test' });
    });
  });

  describe('createEdgeClient', () => {
    it('should create an Edge client with appropriate plugins', () => {
      const client = createEdgeClient({
        baseURL: 'https://api.example.com'
      });
      
      expect(client).toBeDefined();
      expect(typeof client.get).toBe('function');
      expect(typeof client.post).toBe('function');
    });

    it('should make requests successfully', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ data: 'test' })
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);

      const client = createEdgeClient({ baseURL: 'https://api.example.com' });
      const response = await client.get('/test');

      expect(response.status).toBe(200);
      expect(response.data).toEqual({ data: 'test' });
    });
  });

  describe('createBrowserClient', () => {
    it('should create a Browser client with appropriate plugins', () => {
      const client = createBrowserClient({
        baseURL: 'https://api.example.com'
      });
      
      expect(client).toBeDefined();
      expect(typeof client.get).toBe('function');
      expect(typeof client.post).toBe('function');
    });

    it('should make requests successfully', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ data: 'test' })
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);

      const client = createBrowserClient({ baseURL: 'https://api.example.com' });
      const response = await client.get('/test');

      expect(response.status).toBe(200);
      expect(response.data).toEqual({ data: 'test' });
    });
  });

  describe('createDenoClient', () => {
    it('should create a Deno client with appropriate plugins', () => {
      const client = createDenoClient({
        baseURL: 'https://api.example.com'
      });
      
      expect(client).toBeDefined();
      expect(typeof client.get).toBe('function');
      expect(typeof client.post).toBe('function');
    });

    it('should make requests successfully', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ data: 'test' })
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);

      const client = createDenoClient({ baseURL: 'https://api.example.com' });
      const response = await client.get('/test');

      expect(response.status).toBe(200);
      expect(response.data).toEqual({ data: 'test' });
    });
  });

  describe('createBunClient', () => {
    it('should create a Bun client with appropriate plugins', () => {
      const client = createBunClient({
        baseURL: 'https://api.example.com'
      });
      
      expect(client).toBeDefined();
      expect(typeof client.get).toBe('function');
      expect(typeof client.post).toBe('function');
    });

    it('should make requests successfully', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ data: 'test' })
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);

      const client = createBunClient({ baseURL: 'https://api.example.com' });
      const response = await client.get('/test');

      expect(response.status).toBe(200);
      expect(response.data).toEqual({ data: 'test' });
    });
  });
});
