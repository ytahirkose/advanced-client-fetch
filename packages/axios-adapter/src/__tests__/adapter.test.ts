/**
 * Tests for Axios Adapter
 */

import { describe, it, expect } from 'vitest';
import { createAxiosInstance } from '../adapter';

describe('Axios Adapter', () => {
  it('should create axios instance', () => {
    const axios = createAxiosInstance();
    expect(axios).toBeDefined();
    expect(typeof axios.request).toBe('function');
    expect(typeof axios.get).toBe('function');
    expect(typeof axios.post).toBe('function');
  });

  it('should have correct defaults', () => {
    const axios = createAxiosInstance({
      baseURL: 'https://api.example.com',
      timeout: 5000,
    });

    expect(axios.defaults.baseURL).toBe('https://api.example.com');
    expect(axios.defaults.timeout).toBe(5000);
  });
});