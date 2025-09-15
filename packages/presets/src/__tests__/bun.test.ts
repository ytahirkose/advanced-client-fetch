/**
 * Tests for HyperHTTP Bun presets
 */

import { describe, it, expect, vi } from 'vitest';
import {
  createBunClient,
  createMinimalBunClient,
  createFullBunClient,
  createAPIServerClient,
  createDatabaseClient,
  createMicroserviceClient,
  createBatchClient,
  createRealTimeClient,
  createStreamingClient,
  createWebSocketClient,
  createServerlessClient,
} from '../bun.js';

// Mock the dependencies
vi.mock('hyperhttp-core', () => ({
  createClient: vi.fn((options) => ({
    request: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    json: vi.fn(),
    _options: options,
  })),
}));

vi.mock('hyperhttp-plugins', () => ({
  retry: vi.fn((options) => ({ type: 'retry', options })),
  timeout: vi.fn((options) => ({ type: 'timeout', options })),
  cache: vi.fn((options) => ({ type: 'cache', options })),
  rateLimit: vi.fn((options) => ({ type: 'rateLimit', options })),
  circuitBreaker: vi.fn((options) => ({ type: 'circuitBreaker', options })),
  dedupe: vi.fn((options) => ({ type: 'dedupe', options })),
  metrics: vi.fn((options) => ({ type: 'metrics', options })),
}));

describe('HyperHTTP Bun Presets', () => {
  describe('createBunClient', () => {
    it('should create client with default configuration', () => {
      const client = createBunClient();
      
      expect(client).toBeDefined();
      expect(client._options.headers['User-Agent']).toBe('hyperhttp-bun/0.1.0');
      expect(client._options.middleware).toBeDefined();
    });

    it('should create client with custom baseURL', () => {
      const client = createBunClient({ baseURL: 'https://api.example.com' });
      
      expect(client._options.baseURL).toBe('https://api.example.com');
    });

    it('should disable all middleware when specified', () => {
      const client = createBunClient({
        retry: false,
        timeout: false,
        cache: false,
        rateLimit: false,
        circuitBreaker: false,
        dedupe: false,
        metrics: false,
      });
      
      expect(client._options.middleware).toHaveLength(0);
    });

    it('should handle Bun-specific options', () => {
      const client = createBunClient({
        bun: {
          fetch: globalThis.fetch,
          AbortController: globalThis.AbortController,
          AbortSignal: globalThis.AbortSignal,
        },
      });
      
      expect(client).toBeDefined();
    });
  });

  describe('createMinimalBunClient', () => {
    it('should create client with minimal configuration', () => {
      const client = createMinimalBunClient('https://api.example.com');
      
      expect(client).toBeDefined();
      expect(client._options.baseURL).toBe('https://api.example.com');
      expect(client._options.middleware).toHaveLength(0);
    });
  });

  describe('createFullBunClient', () => {
    it('should create client with full configuration', () => {
      const client = createFullBunClient();
      
      expect(client).toBeDefined();
      expect(client._options.middleware.length).toBeGreaterThan(0);
    });
  });

  describe('createAPIServerClient', () => {
    it('should create client optimized for API server', () => {
      const client = createAPIServerClient();
      
      expect(client).toBeDefined();
      expect(client._options.middleware.length).toBeGreaterThan(0);
    });
  });

  describe('createDatabaseClient', () => {
    it('should create client optimized for database operations', () => {
      const client = createDatabaseClient();
      
      expect(client).toBeDefined();
      expect(client._options.middleware.length).toBeGreaterThan(0);
    });
  });

  describe('createMicroserviceClient', () => {
    it('should create client optimized for microservices', () => {
      const client = createMicroserviceClient();
      
      expect(client).toBeDefined();
      expect(client._options.middleware.length).toBeGreaterThan(0);
    });
  });

  describe('createBatchClient', () => {
    it('should create client optimized for batch processing', () => {
      const client = createBatchClient();
      
      expect(client).toBeDefined();
      expect(client._options.middleware.length).toBeGreaterThan(0);
    });
  });

  describe('createRealTimeClient', () => {
    it('should create client optimized for real-time', () => {
      const client = createRealTimeClient();
      
      expect(client).toBeDefined();
      expect(client._options.middleware.length).toBeGreaterThan(0);
    });
  });

  describe('createStreamingClient', () => {
    it('should create client optimized for streaming', () => {
      const client = createStreamingClient();
      
      expect(client).toBeDefined();
      expect(client._options.middleware.length).toBeGreaterThan(0);
    });
  });

  describe('createWebSocketClient', () => {
    it('should create client optimized for WebSocket', () => {
      const client = createWebSocketClient();
      
      expect(client).toBeDefined();
      expect(client._options.middleware.length).toBeGreaterThan(0);
    });
  });

  describe('createServerlessClient', () => {
    it('should create client optimized for serverless', () => {
      const client = createServerlessClient();
      
      expect(client).toBeDefined();
      expect(client._options.middleware.length).toBeGreaterThan(0);
    });
  });
});
