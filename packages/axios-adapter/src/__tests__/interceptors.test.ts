/**
 * Tests for Axios Interceptors
 */

import { describe, it, expect } from 'vitest';
import { AxiosInterceptorManager } from '../interceptors';

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
});