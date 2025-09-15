/**
 * Storage implementations for Advanced Client Fetch
 * Provides base storage classes and utilities
 */

import type { BaseStorage, TimedStorage, CountableStorage } from './types';

/**
 * Base memory storage implementation
 */
export abstract class BaseMemoryStorage<T> implements BaseStorage<T> {
  protected store = new Map<string, T>();
  protected timers = new Map<string, NodeJS.Timeout>();

  async get(key: string): Promise<T | undefined> {
    return this.store.get(key);
  }

  async set(key: string, value: T, ttl?: number): Promise<void> {
    this.store.set(key, value);
    
    if (ttl && ttl > 0) {
      this.setTimer(key, ttl);
    }
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
    this.clearTimer(key);
  }

  async has(key: string): Promise<boolean> {
    return this.store.has(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
    this.clearAllTimers();
  }

  protected setTimer(key: string, ttl: number): void {
    this.clearTimer(key);
    const timer = setTimeout(() => {
      this.store.delete(key);
      this.timers.delete(key);
    }, ttl);
    this.timers.set(key, timer);
  }

  protected clearTimer(key: string): void {
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
  }

  protected clearAllTimers(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
  }

  size(): number {
    return this.store.size;
  }

  keys(): string[] {
    return Array.from(this.store.keys());
  }

  values(): T[] {
    return Array.from(this.store.values());
  }

  entries(): Array<[string, T]> {
    return Array.from(this.store.entries());
  }
}

/**
 * Memory storage implementation
 */
export class MemoryStorage<T> extends BaseMemoryStorage<T> {
  // Inherits all functionality from BaseMemoryStorage
}

/**
 * Timed memory storage with increment/reset capabilities
 */
export class TimedMemoryStorage<T> extends BaseMemoryStorage<T> implements TimedStorage<T> {
  private counters = new Map<string, { value: T; timestamp: number }>();

  async increment(key: string, window: number): Promise<T> {
    const now = Date.now();
    const existing = this.counters.get(key);
    
    if (!existing || now - existing.timestamp >= window) {
      // Reset or create new counter
      const newValue = this.createInitialValue();
      this.counters.set(key, { value: newValue, timestamp: now });
      await this.set(key, newValue, window);
      return newValue;
    }
    
    // Increment existing counter
    const incrementedValue = this.incrementValue(existing.value);
    this.counters.set(key, { value: incrementedValue, timestamp: existing.timestamp });
    await this.set(key, incrementedValue, window - (now - existing.timestamp));
    return incrementedValue;
  }

  async reset(key: string): Promise<void> {
    this.counters.delete(key);
    await this.delete(key);
  }

  protected createInitialValue(): T {
    // Override in subclasses
    return 0 as T;
  }

  protected incrementValue(value: T): T {
    // Override in subclasses
    return ((value as any) + 1) as T;
  }
}

/**
 * Countable memory storage with increment/decrement capabilities
 */
export class CountableMemoryStorage<T> extends BaseMemoryStorage<T> implements CountableStorage<T> {
  private counters = new Map<string, number>();

  async increment(key: string): Promise<number> {
    const current = this.counters.get(key) || 0;
    const newValue = current + 1;
    this.counters.set(key, newValue);
    await this.set(key, newValue as T);
    return newValue;
  }

  async decrement(key: string): Promise<number> {
    const current = this.counters.get(key) || 0;
    const newValue = Math.max(0, current - 1);
    this.counters.set(key, newValue);
    await this.set(key, newValue as T);
    return newValue;
  }

  async getCount(key: string): Promise<number> {
    return this.counters.get(key) || 0;
  }
}

/**
 * Storage utility functions
 */
export class StorageUtils {
  /**
   * Create a memory storage instance
   */
  static createMemoryStorage<T>(): MemoryStorage<T> {
    return new MemoryStorage<T>();
  }

  /**
   * Create a timed storage instance
   */
  static createTimedStorage<T>(): TimedMemoryStorage<T> {
    return new TimedMemoryStorage<T>();
  }

  /**
   * Create a countable storage instance
   */
  static createCountableStorage<T>(): CountableMemoryStorage<T> {
    return new CountableMemoryStorage<T>();
  }

  /**
   * Create a storage with TTL support
   */
  static createTTLStorage<T>(defaultTTL: number = 300000): MemoryStorage<T> {
    return new MemoryStorage<T>();
  }

  /**
   * Create a storage with size limit
   */
  static createLimitedStorage<T>(maxSize: number = 1000): MemoryStorage<T> {
    const storage = new MemoryStorage<T>();
    const originalSet = storage.set.bind(storage);
    
    storage.set = async (key: string, value: T, ttl?: number) => {
      if (storage.size() >= maxSize) {
        // Remove oldest entry
        const firstKey = storage.keys()[0];
        if (firstKey) {
          await storage.delete(firstKey);
        }
      }
      return originalSet(key, value, ttl);
    };
    
    return storage;
  }

  /**
   * Create a storage with LRU eviction
   */
  static createLRUStorage<T>(maxSize: number = 1000): MemoryStorage<T> {
    const storage = new MemoryStorage<T>();
    const accessOrder: string[] = [];
    
    const originalGet = storage.get.bind(storage);
    const originalSet = storage.set.bind(storage);
    
    storage.get = async (key: string) => {
      const result = await originalGet(key);
      if (result !== undefined) {
        // Move to end (most recently used)
        const index = accessOrder.indexOf(key);
        if (index > -1) {
          accessOrder.splice(index, 1);
        }
        accessOrder.push(key);
      }
      return result;
    };
    
    storage.set = async (key: string, value: T, ttl?: number) => {
      if (storage.size() >= maxSize && !(await storage.has(key))) {
        // Remove least recently used
        const lruKey = accessOrder.shift();
        if (lruKey) {
          await storage.delete(lruKey);
        }
      }
      
      // Add to access order
      const index = accessOrder.indexOf(key);
      if (index > -1) {
        accessOrder.splice(index, 1);
      }
      accessOrder.push(key);
      
      return originalSet(key, value, ttl);
    };
    
    return storage;
  }

  /**
   * Create a storage with statistics
   */
  static createStatsStorage<T>(): MemoryStorage<T> & { getStats(): StorageStats } {
    const storage = new MemoryStorage<T>();
    const stats: StorageStats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      clears: 0
    };
    
    const originalGet = storage.get.bind(storage);
    const originalSet = storage.set.bind(storage);
    const originalDelete = storage.delete.bind(storage);
    const originalClear = storage.clear.bind(storage);
    
    storage.get = async (key: string) => {
      const result = await originalGet(key);
      if (result !== undefined) {
        stats.hits++;
      } else {
        stats.misses++;
      }
      return result;
    };
    
    storage.set = async (key: string, value: T, ttl?: number) => {
      stats.sets++;
      return originalSet(key, value, ttl);
    };
    
    storage.delete = async (key: string) => {
      stats.deletes++;
      return originalDelete(key);
    };
    
    storage.clear = async () => {
      stats.clears++;
      return originalClear();
    };
    
    (storage as any).getStats = () => ({ ...stats });
    
    return storage as MemoryStorage<T> & { getStats(): StorageStats };
  }
}

/**
 * Storage statistics interface
 */
export interface StorageStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  clears: number;
}

/**
 * Convenience functions for creating storage instances
 */
export function createMemoryStorage<T>(): MemoryStorage<T> {
  return StorageUtils.createMemoryStorage<T>();
}

export function createTimedStorage<T>(): TimedMemoryStorage<T> {
  return StorageUtils.createTimedStorage<T>();
}

export function createCountableStorage<T>(): CountableMemoryStorage<T> {
  return StorageUtils.createCountableStorage<T>();
}
