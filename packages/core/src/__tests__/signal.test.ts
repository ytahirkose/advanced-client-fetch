/**
 * Signal utilities tests
 */

import { describe, it, expect, vi } from 'vitest';
import {
  combineSignals,
  combineTimeoutAndSignal,
  createTimeoutSignal,
  isAborted,
  createDelayedSignal,
  createNextTickSignal,
  createNeverAbortSignal,
  createAbortedSignal
} from '../signal.js';

describe('combineSignals', () => {
  it('should return single signal when only one provided', () => {
    const signal = new AbortController().signal;
    const combined = combineSignals(signal);
    
    expect(combined).toBe(signal);
  });

  it('should return new signal when multiple signals provided', () => {
    const signal1 = new AbortController().signal;
    const signal2 = new AbortController().signal;
    const combined = combineSignals(signal1, signal2);
    
    expect(combined).not.toBe(signal1);
    expect(combined).not.toBe(signal2);
  });

  it('should return new signal when no signals provided', () => {
    const combined = combineSignals();
    
    expect(combined).toBeDefined();
    expect(combined.aborted).toBe(false);
  });

  it('should abort when any signal aborts', () => {
    const controller1 = new AbortController();
    const controller2 = new AbortController();
    const combined = combineSignals(controller1.signal, controller2.signal);
    
    expect(combined.aborted).toBe(false);
    
    controller1.abort();
    
    expect(combined.aborted).toBe(true);
  });
});

describe('combineTimeoutAndSignal', () => {
  it('should return original signal when no timeout', () => {
    const signal = new AbortController().signal;
    const { signal: combined, cleanup } = combineTimeoutAndSignal(signal);
    
    expect(combined).toBe(signal);
    expect(cleanup).toBeUndefined();
  });

  it('should return new signal with timeout', () => {
    const signal = new AbortController().signal;
    const { signal: combined, cleanup } = combineTimeoutAndSignal(signal, 1000);
    
    expect(combined).not.toBe(signal);
    expect(cleanup).toBeDefined();
    expect(typeof cleanup).toBe('function');
  });

  it('should abort after timeout', async () => {
    const { signal, cleanup } = combineTimeoutAndSignal(undefined, 100);
    
    expect(signal.aborted).toBe(false);
    
    await new Promise(resolve => setTimeout(resolve, 150));
    
    expect(signal.aborted).toBe(true);
    
    cleanup?.();
  });

  it('should abort when original signal aborts', () => {
    const controller = new AbortController();
    const { signal, cleanup } = combineTimeoutAndSignal(controller.signal, 1000);
    
    expect(signal.aborted).toBe(false);
    
    controller.abort();
    
    expect(signal.aborted).toBe(true);
    
    cleanup?.();
  });
});

describe('createTimeoutSignal', () => {
  it('should create signal that aborts after timeout', async () => {
    const signal = createTimeoutSignal(100);
    
    expect(signal.aborted).toBe(false);
    
    await new Promise(resolve => setTimeout(resolve, 150));
    
    expect(signal.aborted).toBe(true);
  });
});

describe('isAborted', () => {
  it('should return true for aborted signal', () => {
    const controller = new AbortController();
    controller.abort();
    
    expect(isAborted(controller.signal)).toBe(true);
  });

  it('should return false for non-aborted signal', () => {
    const controller = new AbortController();
    
    expect(isAborted(controller.signal)).toBe(false);
  });

  it('should return false for undefined signal', () => {
    expect(isAborted(undefined)).toBe(false);
  });
});

describe('createDelayedSignal', () => {
  it('should create signal that aborts after delay', async () => {
    const signal = createDelayedSignal(100);
    
    expect(signal.aborted).toBe(false);
    
    await new Promise(resolve => setTimeout(resolve, 150));
    
    expect(signal.aborted).toBe(true);
  });
});

describe('createNextTickSignal', () => {
  it('should create signal that aborts on next tick', async () => {
    const signal = createNextTickSignal();
    
    expect(signal.aborted).toBe(false);
    
    await new Promise(resolve => setImmediate(resolve));
    
    expect(signal.aborted).toBe(true);
  });
});

describe('createNeverAbortSignal', () => {
  it('should create signal that never aborts', () => {
    const signal = createNeverAbortSignal();
    
    expect(signal.aborted).toBe(false);
  });
});

describe('createAbortedSignal', () => {
  it('should create signal that is already aborted', () => {
    const signal = createAbortedSignal();
    
    expect(signal.aborted).toBe(true);
  });
});
