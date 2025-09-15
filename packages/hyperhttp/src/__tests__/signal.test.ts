/**
 * Tests for HyperHTTP signal utilities
 */

import { describe, it, expect, vi } from 'vitest';
import {
  combineSignals,
  createTimeoutSignal,
  combineTimeoutAndSignal,
  isAborted,
  waitForAbort,
  createDelaySignal,
  raceWithSignal,
  withTimeoutAndSignal,
} from '../signal.js';

describe('HyperHTTP Signal Utils', () => {
  describe('combineSignals', () => {
    it('should return undefined for empty array', () => {
      expect(combineSignals()).toBeUndefined();
    });

    it('should return single signal when only one provided', () => {
      const signal = new AbortController().signal;
      expect(combineSignals(signal)).toBe(signal);
    });

    it('should combine multiple signals', () => {
      const signal1 = new AbortController().signal;
      const signal2 = new AbortController().signal;
      const combined = combineSignals(signal1, signal2);
      
      expect(combined).toBeDefined();
      expect(combined).not.toBe(signal1);
      expect(combined).not.toBe(signal2);
    });

    it('should handle undefined signals', () => {
      const signal = new AbortController().signal;
      const combined = combineSignals(undefined, signal, undefined);
      
      expect(combined).toBe(signal);
    });
  });

  describe('createTimeoutSignal', () => {
    it('should create timeout signal with cleanup', () => {
      const { signal, cleanup } = createTimeoutSignal(100);
      
      expect(signal).toBeDefined();
      expect(typeof cleanup).toBe('function');
    });

    it('should abort signal after timeout', async () => {
      const { signal } = createTimeoutSignal(50);
      
      await new Promise(resolve => setTimeout(resolve, 60));
      expect(signal.aborted).toBe(true);
    });

    it('should not abort signal before timeout', async () => {
      const { signal } = createTimeoutSignal(100);
      
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(signal.aborted).toBe(false);
    });
  });

  describe('combineTimeoutAndSignal', () => {
    it('should combine timeout with existing signal', () => {
      const signal = new AbortController().signal;
      const { signal: combined, cleanup } = combineTimeoutAndSignal(signal, 100);
      
      expect(combined).toBeDefined();
      expect(typeof cleanup).toBe('function');
    });

    it('should create timeout signal when no existing signal', () => {
      const { signal, cleanup } = combineTimeoutAndSignal(undefined, 100);
      
      expect(signal).toBeDefined();
      expect(typeof cleanup).toBe('function');
    });

    it('should return existing signal when no timeout', () => {
      const signal = new AbortController().signal;
      const { signal: combined, cleanup } = combineTimeoutAndSignal(signal);
      
      expect(combined).toBe(signal);
      expect(cleanup).toBeDefined();
    });

    it('should return undefined when no signal and no timeout', () => {
      const { signal, cleanup } = combineTimeoutAndSignal();
      
      expect(signal).toBeUndefined();
      expect(cleanup).toBeDefined();
    });
  });

  describe('isAborted', () => {
    it('should return true for aborted signal', () => {
      const controller = new AbortController();
      controller.abort();
      
      expect(isAborted(controller.signal)).toBe(true);
    });

    it('should return false for non-aborted signal', () => {
      const signal = new AbortController().signal;
      
      expect(isAborted(signal)).toBe(false);
    });

    it('should return false for undefined signal', () => {
      expect(isAborted(undefined)).toBe(false);
    });
  });

  describe('waitForAbort', () => {
    it('should reject when signal is already aborted', async () => {
      const controller = new AbortController();
      controller.abort();
      
      await expect(waitForAbort(controller.signal)).rejects.toThrow('Signal already aborted');
    });

    it('should reject when signal is aborted', async () => {
      const controller = new AbortController();
      const promise = waitForAbort(controller.signal);
      
      setTimeout(() => controller.abort(), 50);
      
      await expect(promise).rejects.toThrow('Signal aborted');
    });
  });

  describe('createDelaySignal', () => {
    it('should create delay signal with cleanup', () => {
      const { signal, cleanup } = createDelaySignal(100);
      
      expect(signal).toBeDefined();
      expect(typeof cleanup).toBe('function');
    });

    it('should abort signal after delay', async () => {
      const { signal } = createDelaySignal(50);
      
      await new Promise(resolve => setTimeout(resolve, 60));
      expect(signal.aborted).toBe(true);
    });
  });

  describe('raceWithSignal', () => {
    it('should return promise result when signal is not provided', async () => {
      const promise = Promise.resolve('success');
      const result = await raceWithSignal(promise);
      
      expect(result).toBe('success');
    });

    it('should return promise result when signal is not aborted', async () => {
      const promise = Promise.resolve('success');
      const signal = new AbortController().signal;
      const result = await raceWithSignal(promise, signal);
      
      expect(result).toBe('success');
    });

    it('should reject when signal is already aborted', async () => {
      const promise = Promise.resolve('success');
      const controller = new AbortController();
      controller.abort();
      
      await expect(raceWithSignal(promise, controller.signal)).rejects.toThrow('Signal already aborted');
    });

    it('should reject when signal is aborted during execution', async () => {
      const promise = new Promise(resolve => setTimeout(() => resolve('success'), 100));
      const controller = new AbortController();
      
      const racePromise = raceWithSignal(promise, controller.signal);
      setTimeout(() => controller.abort(), 50);
      
      await expect(racePromise).rejects.toThrow('Signal aborted');
    });
  });

  describe('withTimeoutAndSignal', () => {
    it('should return promise result when no timeout and no signal', async () => {
      const promise = Promise.resolve('success');
      const result = await withTimeoutAndSignal(promise);
      
      expect(result).toBe('success');
    });

    it('should return promise result when timeout is not exceeded', async () => {
      const promise = new Promise(resolve => setTimeout(() => resolve('success'), 50));
      const result = await withTimeoutAndSignal(promise, 100);
      
      expect(result).toBe('success');
    });

    it('should reject when timeout is exceeded', async () => {
      const promise = new Promise(resolve => setTimeout(() => resolve('success'), 100));
      
      await expect(withTimeoutAndSignal(promise, 50)).rejects.toThrow();
    });

    it('should reject when signal is aborted', async () => {
      const promise = new Promise(resolve => setTimeout(() => resolve('success'), 100));
      const controller = new AbortController();
      
      const timeoutPromise = withTimeoutAndSignal(promise, 200, controller.signal);
      setTimeout(() => controller.abort(), 50);
      
      await expect(timeoutPromise).rejects.toThrow();
    });
  });
});
