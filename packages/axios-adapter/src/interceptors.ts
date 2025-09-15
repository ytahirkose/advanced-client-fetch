/**
 * Interceptor management for Axios compatibility
 */

export interface Interceptor<T> {
  onFulfilled?: (value: T) => T | Promise<T>;
  onRejected?: (error: any) => any;
}

export class AxiosInterceptorManager<T> {
  private interceptors: Array<Interceptor<T> & { id: number }> = [];
  private nextId = 0;

  use(
    onFulfilled?: (value: T) => T | Promise<T>,
    onRejected?: (error: any) => any
  ): number {
    const id = this.nextId++;
    this.interceptors.push({ id, onFulfilled, onRejected });
    return id;
  }

  eject(id: number): void {
    const index = this.interceptors.findIndex(interceptor => interceptor.id === id);
    if (index !== -1) {
      this.interceptors.splice(index, 1);
    }
  }

  clear(): void {
    this.interceptors = [];
  }

  async runHandlers(value: T): Promise<T> {
    let result = value;
    
    for (const interceptor of this.interceptors) {
      if (interceptor.onFulfilled) {
        result = await interceptor.onFulfilled(result);
      }
    }
    
    return result;
  }

  async runErrorHandlers(error: any): Promise<any> {
    let result = error;
    
    for (const interceptor of this.interceptors) {
      if (interceptor.onRejected) {
        result = await interceptor.onRejected(result);
      }
    }
    
    return result;
  }
}

export function createInterceptorManager<T>(): AxiosInterceptorManager<T> {
  return new AxiosInterceptorManager<T>();
}