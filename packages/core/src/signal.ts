/**
 * Signal utilities for Advanced Client Fetch
 */

import type { AbortSignal } from './types';

/**
 * Combine multiple abort signals into one
 */
export function combineSignals(...signals: (AbortSignal | undefined)[]): AbortSignal {
  const validSignals = signals.filter((signal): signal is AbortSignal => !!signal);
  
  if (validSignals.length === 0) {
    return new AbortController().signal;
  }
  
  if (validSignals.length === 1) {
    return validSignals[0];
  }
  
  const controller = new AbortController();
  
  for (const signal of validSignals) {
    if (signal.aborted) {
      controller.abort();
      break;
    }
    
    signal.addEventListener('abort', () => {
      controller.abort();
    }, { once: true });
  }
  
  return controller.signal;
}

/**
 * Combine timeout and abort signal
 */
export function combineTimeoutAndSignal(
  signal?: AbortSignal,
  timeout?: number
): { signal: AbortSignal; cleanup: (() => void) | undefined } {
  if (!timeout || timeout <= 0) {
    return { signal: signal || new AbortController().signal, cleanup: undefined };
  }
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  let cleanup: (() => void) | undefined;
  
  if (signal) {
    if (signal.aborted) {
      clearTimeout(timeoutId);
      controller.abort();
    } else {
      const onAbort = () => {
        clearTimeout(timeoutId);
        controller.abort();
      };
      
      signal.addEventListener('abort', onAbort, { once: true });
      
      cleanup = () => {
        clearTimeout(timeoutId);
        signal.removeEventListener('abort', onAbort);
      };
    }
  } else {
    cleanup = () => clearTimeout(timeoutId);
  }
  
  return { signal: controller.signal, cleanup };
}

/**
 * Create a timeout signal
 */
export function createTimeoutSignal(timeout: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeout);
  return controller.signal;
}

/**
 * Check if signal is aborted
 */
export function isAborted(signal?: AbortSignal): boolean {
  return signal?.aborted ?? false;
}

/**
 * Create a signal that aborts after a delay
 */
export function createDelayedSignal(delay: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), delay);
  return controller.signal;
}

/**
 * Create a signal that aborts on the next tick
 */
export function createNextTickSignal(): AbortSignal {
  const controller = new AbortController();
  setImmediate(() => controller.abort());
  return controller.signal;
}

/**
 * Create a signal that never aborts
 */
export function createNeverAbortSignal(): AbortSignal {
  return new AbortController().signal;
}

/**
 * Create a signal that is already aborted
 */
export function createAbortedSignal(): AbortSignal {
  const controller = new AbortController();
  controller.abort();
  return controller.signal;
}