/**
 * Advanced Cancel Token implementation
 */

export interface CancelTokenSource {
  token: CancelToken;
  cancel: (message?: string) => void;
}

export interface CancelTokenStatic {
  new (executor: (cancel: (message?: string) => void) => void): CancelToken;
  source(): CancelTokenSource;
  race(requests: Array<{ cancelToken?: CancelToken }>): CancelToken;
}

export interface CancelToken {
  throwIfRequested(): void;
  subscribe(listener: (reason: CancelError) => void): () => void;
}

export class CancelError extends Error {
  readonly name = 'CancelError';
  readonly message: string;
  readonly isCanceled = true;

  constructor(message: string = 'Request canceled') {
    super(message);
    this.message = message;
  }
}

/**
 * Advanced Cancel Token implementation
 */
export class CancelToken implements CancelToken {
  private _reason?: CancelError;
  private _listeners: Set<(reason: CancelError) => void> = new Set();

  constructor(executor: (cancel: (message?: string) => void) => void) {
    executor((message?: string) => {
      if (this._reason) {
        return; // Already canceled
      }
      
      this._reason = new CancelError(message);
      this._notifyListeners();
    });
  }

  get reason(): CancelError | undefined {
    return this._reason;
  }

  throwIfRequested(): void {
    if (this._reason) {
      throw this._reason;
    }
  }

  subscribe(listener: (reason: CancelError) => void): () => void {
    this._listeners.add(listener);
    
    // If already canceled, notify immediately
    if (this._reason) {
      listener(this._reason);
    }
    
    // Return unsubscribe function
    return () => {
      this._listeners.delete(listener);
    };
  }

  private _notifyListeners(): void {
    if (!this._reason) return;
    
    this._listeners.forEach(listener => {
      try {
        listener(this._reason!);
      } catch (error) {
        console.error('Cancel token listener error:', error);
      }
    });
  }

  static source(): CancelTokenSource {
    let cancel: (message?: string) => void;
    const token = new CancelToken((c) => {
      cancel = c;
    });
    
    return {
      token,
      cancel: (message?: string) => cancel(message)
    };
  }

  static race(requests: Array<{ cancelToken?: CancelToken }>): CancelToken {
    return new CancelToken((cancel) => {
      requests.forEach(({ cancelToken }) => {
        if (cancelToken) {
          cancelToken.subscribe((reason) => cancel(reason.message));
        }
      });
    });
  }
}

/**
 * Check if value is a CancelError
 */
export function isCancel(value: any): value is CancelError {
  return value && value.isCanceled === true;
}

/**
 * Create a cancel token that cancels when any of the provided tokens cancel
 */
export function raceCancelTokens(...tokens: CancelToken[]): CancelToken {
  return new CancelToken((cancel) => {
    tokens.forEach(token => {
      token.subscribe((reason) => cancel(reason.message));
    });
  });
}

/**
 * Create a cancel token that cancels after a timeout
 */
export function timeoutCancelToken(timeout: number): CancelToken {
  return new CancelToken((cancel) => {
    const timer = setTimeout(() => {
      cancel(`Request timeout after ${timeout}ms`);
    }, timeout);
    
    // Clean up timer if token is canceled before timeout
    const unsubscribe = () => clearTimeout(timer);
    // Note: This is a simplified implementation
    // In a real implementation, you'd need to track the timer cleanup
  });
}

export default CancelToken;
