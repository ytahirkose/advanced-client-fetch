/**
 * Storage interfaces tests
 */

import { describe, it, expect } from 'vitest';
import type { 
  BaseStorage,
  TimedStorage,
  CountableStorage,
  CacheStorage
} from '../types.js';

describe('Storage Interfaces', () => {
  describe('BaseStorage', () => {
    it('should have correct method signatures', () => {
      // Mock implementation to test interface
      class MockStorage<T> implements BaseStorage<T> {
        async get(key: string): Promise<T | undefined> {
          return undefined;
        }
        
        async set(key: string, value: T, ttl?: number): Promise<void> {
          // Mock implementation
        }
        
        async delete(key: string): Promise<void> {
          // Mock implementation
        }
        
        async clear(): Promise<void> {
          // Mock implementation
        }
      }

      const storage = new MockStorage<string>();
      expect(storage.get).toBeDefined();
      expect(storage.set).toBeDefined();
      expect(storage.delete).toBeDefined();
      expect(storage.clear).toBeDefined();
    });

    it('should support generic types', () => {
      class MockStorage<T> implements BaseStorage<T> {
        async get(key: string): Promise<T | undefined> {
          return undefined;
        }
        
        async set(key: string, value: T, ttl?: number): Promise<void> {
          // Mock implementation
        }
        
        async delete(key: string): Promise<void> {
          // Mock implementation
        }
        
        async clear(): Promise<void> {
          // Mock implementation
        }
      }

      const stringStorage = new MockStorage<string>();
      const numberStorage = new MockStorage<number>();
      const objectStorage = new MockStorage<{ id: number; name: string }>();

      expect(stringStorage).toBeDefined();
      expect(numberStorage).toBeDefined();
      expect(objectStorage).toBeDefined();
    });
  });

  describe('TimedStorage', () => {
    it('should extend BaseStorage and add timed methods', () => {
      class MockTimedStorage<T> implements TimedStorage<T> {
        async get(key: string): Promise<T | undefined> {
          return undefined;
        }
        
        async set(key: string, value: T, ttl?: number): Promise<void> {
          // Mock implementation
        }
        
        async delete(key: string): Promise<void> {
          // Mock implementation
        }
        
        async clear(): Promise<void> {
          // Mock implementation
        }
        
        async increment(key: string, window: number): Promise<T> {
          return undefined as T;
        }
        
        async reset(key: string): Promise<void> {
          // Mock implementation
        }
      }

      const storage = new MockTimedStorage<number>();
      expect(storage.get).toBeDefined();
      expect(storage.set).toBeDefined();
      expect(storage.delete).toBeDefined();
      expect(storage.clear).toBeDefined();
      expect(storage.increment).toBeDefined();
      expect(storage.reset).toBeDefined();
    });
  });

  describe('CountableStorage', () => {
    it('should extend BaseStorage and add counting methods', () => {
      class MockCountableStorage<T> implements CountableStorage<T> {
        async get(key: string): Promise<T | undefined> {
          return undefined;
        }
        
        async set(key: string, value: T, ttl?: number): Promise<void> {
          // Mock implementation
        }
        
        async delete(key: string): Promise<void> {
          // Mock implementation
        }
        
        async clear(): Promise<void> {
          // Mock implementation
        }
        
        async increment(key: string): Promise<number> {
          return 0;
        }
        
        async decrement(key: string): Promise<number> {
          return 0;
        }
        
        async getCount(key: string): Promise<number> {
          return 0;
        }
      }

      const storage = new MockCountableStorage<string>();
      expect(storage.get).toBeDefined();
      expect(storage.set).toBeDefined();
      expect(storage.delete).toBeDefined();
      expect(storage.clear).toBeDefined();
      expect(storage.increment).toBeDefined();
      expect(storage.decrement).toBeDefined();
      expect(storage.getCount).toBeDefined();
    });
  });

  describe('CacheStorage', () => {
    it('should extend BaseStorage<Response>', () => {
      class MockCacheStorage implements CacheStorage {
        async get(key: string): Promise<Response | undefined> {
          return undefined;
        }
        
        async set(key: string, value: Response, ttl?: number): Promise<void> {
          // Mock implementation
        }
        
        async delete(key: string): Promise<void> {
          // Mock implementation
        }
        
        async clear(): Promise<void> {
          // Mock implementation
        }
      }

      const storage = new MockCacheStorage();
      expect(storage.get).toBeDefined();
      expect(storage.set).toBeDefined();
      expect(storage.delete).toBeDefined();
      expect(storage.clear).toBeDefined();
    });
  });
});
