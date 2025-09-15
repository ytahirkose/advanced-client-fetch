/**
 * Signal utilities for HyperHTTP
 * Handles AbortSignal combination and timeout management
 */

import type { AbortSignal } from './types.js';

/**
 * Combine multiple AbortSignals into one
 */
export function combineSignals(...signals: (AbortSignal | undefined)[]): AbortSignal | undefined {
  const validSignals = signals.filter((s): s is AbortSignal => s !== undefined);
  
  if (validSignals.length === 0) return undefined;
  if (validSignals.length === 1) return validSignals[0];
  
  // Use AbortSignal.any if available (Node.js 20+)
  if (typeof AbortSignal !== 'undefined' && 'any' in AbortSignal) {
    return (AbortSignal as any).any(validSignals);
  }
  
  // Fallback: create a combined signal
  const controller = new AbortController();
  
  const onAbort = () => {
    controller.abort();
  };
  
  for (const signal of validSignals) {
    if (signal.aborted) {
      controller.abort();
      break;
    }
    signal.addEventListener('abort', onAbort, { once: true });
  }
  
  return controller.signal;
}

/**
 * Create a timeout signal
 */
export function createTimeoutSignal(timeoutMs: number): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  const cleanup = () => {
    clearTimeout(timeoutId);
  };
  
  return { signal: controller.signal, cleanup };
}

/**
 * Combine timeout and existing signal
 */
export function combineTimeoutAndSignal(
  signal?: AbortSignal, 
  timeout?: number
): { signal?: AbortSignal; cleanup?: () => void } {
  if (!timeout || timeout <= 0) {
    return { signal, cleanup: () => {} };
  }
  
  const { signal: timeoutSignal, cleanup } = createTimeoutSignal(timeout);
  const combinedSignal = combineSignals(signal, timeoutSignal);
  
  return { signal: combinedSignal, cleanup };
}

/**
 * Check if signal is aborted
 */
export function isAborted(signal?: AbortSignal): boolean {
  return signal?.aborted ?? false;
}

/**
 * Wait for signal to be aborted
 */
export function waitForAbort(signal: AbortSignal): Promise<void> {
  if (signal.aborted) {
    return Promise.reject(new Error('Signal already aborted'));
  }
  
  return new Promise((_, reject) => {
    signal.addEventListener('abort', () => {
      reject(new Error('Signal aborted'));
    }, { once: true });
  });
}

/**
 * Create delay signal with cleanup
 */
export function createDelaySignal(delayMs: number): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), delayMs);
  
  const cleanup = () => {
    clearTimeout(timeoutId);
  };
  
  return { signal: controller.signal, cleanup };
}

/**
 * Race promise with signal
 */
export function raceWithSignal<T>(
  promise: Promise<T>, 
  signal?: AbortSignal
): Promise<T> {
  if (!signal) return promise;
  
  if (signal.aborted) {
    return Promise.reject(new Error('Signal already aborted'));
  }
  
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      reject(new Error('Signal aborted'));
    };
    
    signal.addEventListener('abort', onAbort, { once: true });
    
    promise
      .then(resolve)
      .catch(reject)
      .finally(() => {
        signal.removeEventListener('abort', onAbort);
      });
  });
}

/**
 * Wrap promise with timeout and signal
 */
export function withTimeoutAndSignal<T>(
  promise: Promise<T>,
  timeoutMs?: number,
  signal?: AbortSignal
): Promise<T> {
  if (!timeoutMs && !signal) return promise;
  
  const { signal: combinedSignal, cleanup } = combineTimeoutAndSignal(signal, timeoutMs);
  
  return raceWithSignal(promise, combinedSignal).finally(() => {
    cleanup?.();
  });
}