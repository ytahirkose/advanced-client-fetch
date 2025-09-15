/**
 * Signal utilities for HyperHTTP
 */

export interface SignalOptions {
  timeout?: number;
  signal?: AbortSignal;
}

/**
 * Create timeout signal
 */
export function createTimeoutSignal(timeout: number): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();
  
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);
  
  const cleanup = () => {
    clearTimeout(timeoutId);
  };
  
  return { signal: controller.signal, cleanup };
}

/**
 * Combine multiple signals
 */
export function combineSignals(...signals: (AbortSignal | undefined)[]): AbortSignal {
  const controller = new AbortController();
  
  for (const signal of signals) {
    if (signal) {
      if (signal.aborted) {
        controller.abort();
        return controller.signal;
      }
      
      signal.addEventListener('abort', () => {
        controller.abort();
      });
    }
  }
  
  return controller.signal;
}

/**
 * Create signal with timeout
 */
export function createSignalWithTimeout(options: SignalOptions): AbortSignal {
  const { timeout, signal } = options;
  
  if (!timeout) {
    return signal || new AbortController().signal;
  }
  
  const timeoutSignal = createTimeoutSignal(timeout);
  
  if (!signal) {
    return timeoutSignal;
  }
  
  return combineSignals(signal, timeoutSignal);
}

/**
 * Check if signal is aborted
 */
export function isAborted(signal?: AbortSignal): boolean {
  return signal?.aborted || false;
}

/**
 * Create abort error
 */
export function createAbortError(reason?: string): Error {
  const error = new Error(reason || 'Operation aborted');
  error.name = 'AbortError';
  return error;
}

/**
 * Combine timeout with signal
 */
export function combineTimeoutAndSignal(signal?: AbortSignal, timeout?: number): { signal?: AbortSignal; cleanup?: () => void } {
  if (!timeout) {
    return { signal, cleanup: undefined };
  }
  
  if (!signal) {
    const { signal: timeoutSignal } = createTimeoutSignal(timeout);
    return { signal: timeoutSignal, cleanup: undefined };
  }
  
  const { signal: timeoutSignal } = createTimeoutSignal(timeout);
  const combinedSignal = combineSignals(signal, timeoutSignal);
  return { signal: combinedSignal, cleanup: undefined };
}

/**
 * Race promise with signal
 */
export function raceWithSignal<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) {
    return promise;
  }
  
  if (signal.aborted) {
    return Promise.reject(createAbortError('Signal aborted'));
  }
  
  return new Promise((resolve, reject) => {
    const abortHandler = () => {
      reject(createAbortError('Operation aborted'));
    };
    
    signal.addEventListener('abort', abortHandler);
    
    promise
      .then(resolve)
      .catch(reject)
      .finally(() => {
        signal.removeEventListener('abort', abortHandler);
      });
  });
}
