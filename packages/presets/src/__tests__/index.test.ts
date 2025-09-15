/**
 * Tests for HyperHTTP Presets index
 */

import { describe, it, expect } from 'vitest';
import * as presets from '../index.js';

describe('HyperHTTP Presets Index', () => {
  describe('Edge exports', () => {
    it('should export edge client functions', () => {
      expect(presets.createEdgeClient).toBeDefined();
      expect(presets.createMinimalEdgeClient).toBeDefined();
      expect(presets.createFullEdgeClient).toBeDefined();
      expect(presets.createAPIGatewayClient).toBeDefined();
      expect(presets.createCDNClient).toBeDefined();
    });
  });

  describe('Node exports', () => {
    it('should export node client functions', () => {
      expect(presets.createNodeClient).toBeDefined();
      expect(presets.createMinimalNodeClient).toBeDefined();
      expect(presets.createFullNodeClient).toBeDefined();
      expect(presets.createAPIServerClient).toBeDefined();
      expect(presets.createDatabaseClient).toBeDefined();
    });
  });

  describe('Browser exports', () => {
    it('should export browser client functions', () => {
      expect(presets.createBrowserClient).toBeDefined();
      expect(presets.createMinimalBrowserClient).toBeDefined();
      expect(presets.createFullBrowserClient).toBeDefined();
      expect(presets.createSPAClient).toBeDefined();
      expect(presets.createPWAClient).toBeDefined();
    });
  });

  describe('Deno exports', () => {
    it('should export deno client functions', () => {
      expect(presets.createDenoClient).toBeDefined();
      expect(presets.createMinimalDenoClient).toBeDefined();
      expect(presets.createFullDenoClient).toBeDefined();
    });
  });

  describe('Bun exports', () => {
    it('should export bun client functions', () => {
      expect(presets.createBunClient).toBeDefined();
      expect(presets.createMinimalBunClient).toBeDefined();
      expect(presets.createFullBunClient).toBeDefined();
    });
  });

  describe('Common functions', () => {
    it('should export common client functions', () => {
      // These functions are exported from multiple presets
      expect(presets.createMicroserviceClient).toBeDefined();
      expect(presets.createRealTimeClient).toBeDefined();
      expect(presets.createStreamingClient).toBeDefined();
      expect(presets.createWebSocketClient).toBeDefined();
      expect(presets.createBatchClient).toBeDefined();
      expect(presets.createServerlessClient).toBeDefined();
    });
  });
});
