/**
 * Tests for Node.js agent utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  createHttpAgent, 
  createHttpsAgent, 
  createNodeTransport,
  createProxyMiddleware,
  isNodeEnvironment,
  getDefaultNodeAgentOptions
} from '../node-agent.js';

describe('Node Agent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isNodeEnvironment', () => {
    it('should detect Node.js environment', () => {
      expect(isNodeEnvironment()).toBe(true);
    });
  });

  describe('getDefaultNodeAgentOptions', () => {
    it('should return default options', () => {
      const options = getDefaultNodeAgentOptions();
      expect(options).toEqual({
        keepAlive: true,
        maxSockets: 50,
        maxFreeSockets: 10,
        timeout: 0,
      });
    });
  });

  describe('createHttpAgent', () => {
    it('should create HTTP agent with options', () => {
      const options = {
        keepAlive: true,
        maxSockets: 100,
        connectionTimeout: 10000,
      };
      
      const agent = createHttpAgent(options);
      expect(agent).toBeDefined();
      expect(agent.options.keepAlive).toBe(true);
      expect(agent.options.maxSockets).toBe(100);
    });
  });

  describe('createHttpsAgent', () => {
    it('should create HTTPS agent with options', () => {
      const options = {
        keepAlive: true,
        maxSockets: 100,
        ssl: {
          rejectUnauthorized: false,
        },
      };
      
      const agent = createHttpsAgent(options);
      expect(agent).toBeDefined();
      expect(agent.options.keepAlive).toBe(true);
      expect(agent.options.maxSockets).toBe(100);
    });
  });

  describe('createNodeTransport', () => {
    it('should create transport function', () => {
      const transport = createNodeTransport();
      expect(typeof transport).toBe('function');
    });
  });

  describe('createProxyMiddleware', () => {
    it('should create proxy middleware with string URL', () => {
      const middleware = createProxyMiddleware('http://proxy:8080');
      expect(typeof middleware).toBe('function');
    });

    it('should create proxy middleware with config object', () => {
      const config = {
        url: 'http://proxy:8080',
        auth: {
          username: 'user',
          password: 'pass',
        },
        headers: {
          'X-Custom': 'value',
        },
      };
      
      const middleware = createProxyMiddleware(config);
      expect(typeof middleware).toBe('function');
    });
  });
});
