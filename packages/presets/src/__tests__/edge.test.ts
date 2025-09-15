/**
 * Tests for HyperHTTP Edge presets
 */

import { describe, it, expect, vi } from 'vitest';
import {
  createEdgeClient,
  createMinimalEdgeClient,
  createFullEdgeClient,
  createAPIGatewayClient,
  createCDNClient,
  createWebSocketClient,
  createRealTimeClient,
  createStreamingClient,
  createBatchClient,
  createMicroserviceClient,
  createServerlessClient,
} from '../edge.js';

// Mock the dependencies
vi.mock('hyperhttp-core', () => ({
  createClient: vi.fn((options) => ({
    request: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    json: vi.fn(),
    _options: {
      ...options,
      headers: options?.headers || {},
      middleware: options?.middleware || [],
    },
  })),
  createPresetClient: vi.fn((platform, options, config, middlewareFactory) => ({
    request: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    json: vi.fn(),
    _platform: platform,
    _options: {
      ...options,
      headers: options?.headers || {},
      middleware: options?.middleware || [],
    },
    _config: config,
  })),
  createMinimalPresetClient: vi.fn((platform, options) => ({
    request: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    json: vi.fn(),
    _platform: platform,
    _options: {
      ...options,
      headers: options?.headers || {},
      middleware: options?.middleware || [],
    },
  })),
  createFullPresetClient: vi.fn((platform, options, config, middlewareFactory) => ({
    request: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    json: vi.fn(),
    _platform: platform,
    _options: {
      ...options,
      headers: options?.headers || {},
      middleware: options?.middleware || [],
    },
    _config: config,
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

describe('HyperHTTP Edge Presets', () => {
  describe('createEdgeClient', () => {
    it('should create client with default configuration', () => {
      const client = createEdgeClient();
      
      expect(client).toBeDefined();
      expect(client._options?.headers).toBeDefined();
      expect(client._options?.middleware).toBeDefined();
    });

    it('should create client with custom baseURL', () => {
      const client = createEdgeClient({ baseURL: 'https://api.example.com' });
      
      expect(client._options.baseURL).toBe('https://api.example.com');
    });

    it('should disable all middleware when specified', () => {
      const client = createEdgeClient({
        retry: false,
        timeout: false,
        cache: false,
        rateLimit: false,
        circuitBreaker: false,
        dedupe: false,
        metrics: false,
      });
      
      expect(client._options?.middleware).toHaveLength(0);
    });
  });

  describe('createMinimalEdgeClient', () => {
    it('should create client with minimal configuration', () => {
      const client = createMinimalEdgeClient('https://api.example.com');
      
      expect(client).toBeDefined();
      expect(client._options.baseURL).toBe('https://api.example.com');
      expect(client._options?.middleware).toHaveLength(0);
    });
  });

  describe('createFullEdgeClient', () => {
    it('should create client with full configuration', () => {
      const client = createFullEdgeClient();
      
      expect(client).toBeDefined();
      expect(client._options?.middleware).toBeDefined();
    });
  });

  describe('createAPIGatewayClient', () => {
    it('should create client optimized for API Gateway', () => {
      const client = createAPIGatewayClient();
      
      expect(client).toBeDefined();
      expect(client._options?.middleware).toBeDefined();
    });
  });

  describe('createCDNClient', () => {
    it('should create client optimized for CDN', () => {
      const client = createCDNClient();
      
      expect(client).toBeDefined();
      expect(client._options?.middleware).toBeDefined();
    });
  });

  describe('createWebSocketClient', () => {
    it('should create client optimized for WebSocket', () => {
      const client = createWebSocketClient();
      
      expect(client).toBeDefined();
      expect(client._options?.middleware).toBeDefined();
    });
  });

  describe('createRealTimeClient', () => {
    it('should create client optimized for real-time', () => {
      const client = createRealTimeClient();
      
      expect(client).toBeDefined();
      expect(client._options?.middleware).toBeDefined();
    });
  });

  describe('createStreamingClient', () => {
    it('should create client optimized for streaming', () => {
      const client = createStreamingClient();
      
      expect(client).toBeDefined();
      expect(client._options?.middleware).toBeDefined();
    });
  });

  describe('createBatchClient', () => {
    it('should create client optimized for batch processing', () => {
      const client = createBatchClient();
      
      expect(client).toBeDefined();
      expect(client._options?.middleware).toBeDefined();
    });
  });

  describe('createMicroserviceClient', () => {
    it('should create client optimized for microservices', () => {
      const client = createMicroserviceClient();
      
      expect(client).toBeDefined();
      expect(client._options?.middleware).toBeDefined();
    });
  });

  describe('createServerlessClient', () => {
    it('should create client optimized for serverless', () => {
      const client = createServerlessClient();
      
      expect(client).toBeDefined();
      expect(client._options?.middleware).toBeDefined();
    });
  });
});
