/**
 * Tests for Axios Interceptors
 */

import { describe, it, expect } from 'vitest';
import { AxiosInterceptorManager, createInterceptorManager } from '../interceptors';

describe('Axios Interceptors', () => {
  it('should create interceptor manager', () => {
    const manager = new AxiosInterceptorManager();
    expect(manager).toBeDefined();
  });

  it('should add and remove interceptors', () => {
    const manager = new AxiosInterceptorManager();
    const id = manager.use(
      (value) => value,
      (error) => error
    );
    
    expect(id).toBe(0);
    expect(manager['interceptors']).toHaveLength(1);
    
    manager.eject(id);
    expect(manager['interceptors']).toHaveLength(0);
  });

  it('should run request interceptors', async () => {
    const manager = new AxiosInterceptorManager<any>();
    let called = false;
    
    manager.use((config: any) => {
      called = true;
      config.headers = { ...config.headers, 'X-Test': 'intercepted' };
      return config;
    });
    
    const result = await manager.runHandlers({ url: '/test' });
    expect(called).toBe(true);
    expect((result as any).headers?.['X-Test']).toBe('intercepted');
  });

  it('should run response interceptors', async () => {
    const manager = new AxiosInterceptorManager<any>();
    let called = false;
    
    manager.use((response: any) => {
      called = true;
      response.data = { ...response.data, intercepted: true };
      return response;
    });
    
    const mockResponse = { data: {}, status: 200 };
    const result = await manager.runHandlers(mockResponse);
    expect(called).toBe(true);
    expect((result as any).data.intercepted).toBe(true);
  });

  it('should handle interceptor errors', async () => {
    const manager = new AxiosInterceptorManager();
    
    manager.use(
      (config) => {
        throw new Error('Interceptor error');
      },
      (error) => {
        expect(error.message).toBe('Interceptor error');
        return Promise.reject(error);
      }
    );
    
    await expect(manager.runHandlers({ url: '/test' })).rejects.toThrow('Interceptor error');
  });

  it('should clear all interceptors', () => {
    const manager = new AxiosInterceptorManager();
    
    manager.use(() => ({}));
    manager.use(() => ({}));
    expect(manager['interceptors']).toHaveLength(2);
    
    manager.clear();
    expect(manager['interceptors']).toHaveLength(0);
  });
});