/**
 * Tests for Storage implementations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  MemoryStorage,
  TimedMemoryStorage,
  CountableMemoryStorage,
  StorageUtils,
  createMemoryStorage,
  createTimedStorage,
  createCountableStorage,
} from '../storage.js';

describe('Storage', () => {
  describe('MemoryStorage', () => {
    let storage: MemoryStorage<string>;

    beforeEach(() => {
      storage = new MemoryStorage<string>();
    });

    it('should store and retrieve values', async () => {
      await storage.set('key1', 'value1');
      const value = await storage.get('key1');
      expect(value).toBe('value1');
    });

    it('should return undefined for non-existent keys', async () => {
      const value = await storage.get('nonexistent');
      expect(value).toBeUndefined();
    });

    it('should delete values', async () => {
      await storage.set('key1', 'value1');
      await storage.delete('key1');
      const value = await storage.get('key1');
      expect(value).toBeUndefined();
    });

    it('should clear all values', async () => {
      await storage.set('key1', 'value1');
      await storage.set('key2', 'value2');
      await storage.clear();
      
      expect(await storage.get('key1')).toBeUndefined();
      expect(await storage.get('key2')).toBeUndefined();
    });

    it('should return correct size', async () => {
      expect(storage.size()).toBe(0);
      
      await storage.set('key1', 'value1');
      expect(storage.size()).toBe(1);
      
      await storage.set('key2', 'value2');
      expect(storage.size()).toBe(2);
    });

    it('should return keys', async () => {
      await storage.set('key1', 'value1');
      await storage.set('key2', 'value2');
      
      const keys = storage.keys();
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toHaveLength(2);
    });

    it('should return values', async () => {
      await storage.set('key1', 'value1');
      await storage.set('key2', 'value2');
      
      const values = storage.values();
      expect(values).toContain('value1');
      expect(values).toContain('value2');
      expect(values).toHaveLength(2);
    });

    it('should return entries', async () => {
      await storage.set('key1', 'value1');
      await storage.set('key2', 'value2');
      
      const entries = storage.entries();
      expect(entries).toContainEqual(['key1', 'value1']);
      expect(entries).toContainEqual(['key2', 'value2']);
      expect(entries).toHaveLength(2);
    });

    it('should handle TTL', async () => {
      await storage.set('key1', 'value1', 100);
      
      // Should exist immediately
      expect(await storage.get('key1')).toBe('value1');
      
      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should be undefined after TTL
      expect(await storage.get('key1')).toBeUndefined();
    });
  });

  describe('TimedMemoryStorage', () => {
    let storage: TimedMemoryStorage<number>;

    beforeEach(() => {
      storage = new TimedMemoryStorage<number>();
    });

    it('should increment values', async () => {
      const value = await storage.increment('key1', 1000);
      expect(value).toBe(0); // Initial value
      
      const value2 = await storage.increment('key1', 1000);
      expect(value2).toBe(1); // Incremented value
    });

    it('should reset values', async () => {
      await storage.increment('key1', 1000);
      await storage.increment('key1', 1000);
      
      await storage.reset('key1');
      
      const value = await storage.increment('key1', 1000);
      expect(value).toBe(0); // Should start from 0 again
    });

    it('should handle window expiration', async () => {
      await storage.increment('key1', 100);
      await storage.increment('key1', 100);
      
      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should start from 0 again
      const value = await storage.increment('key1', 100);
      expect(value).toBe(0);
    });
  });

  describe('CountableMemoryStorage', () => {
    let storage: CountableMemoryStorage<number>;

    beforeEach(() => {
      storage = new CountableMemoryStorage<number>();
    });

    it('should increment and decrement values', async () => {
      const value1 = await storage.increment('key1');
      expect(value1).toBe(1);
      
      const value2 = await storage.increment('key1');
      expect(value2).toBe(2);
      
      const value3 = await storage.decrement('key1');
      expect(value3).toBe(1);
    });

    it('should not go below zero', async () => {
      const value1 = await storage.decrement('key1');
      expect(value1).toBe(0);
      
      const value2 = await storage.decrement('key1');
      expect(value2).toBe(0);
    });

    it('should get count', async () => {
      await storage.increment('key1');
      await storage.increment('key1');
      
      const count = await storage.getCount('key1');
      expect(count).toBe(2);
    });
  });

  describe('StorageUtils', () => {
    it('should create memory storage', () => {
      const storage = StorageUtils.createMemoryStorage<string>();
      expect(storage).toBeInstanceOf(MemoryStorage);
    });

    it('should create timed storage', () => {
      const storage = StorageUtils.createTimedStorage<number>();
      expect(storage).toBeInstanceOf(TimedMemoryStorage);
    });

    it('should create countable storage', () => {
      const storage = StorageUtils.createCountableStorage<number>();
      expect(storage).toBeInstanceOf(CountableMemoryStorage);
    });

    it('should create TTL storage', () => {
      const storage = StorageUtils.createTTLStorage<string>(5000);
      expect(storage).toBeInstanceOf(MemoryStorage);
    });

    it('should create limited storage', async () => {
      const storage = StorageUtils.createLimitedStorage<string>(2);
      
      await storage.set('key1', 'value1');
      await storage.set('key2', 'value2');
      await storage.set('key3', 'value3'); // Should remove key1
      
      expect(await storage.get('key1')).toBeUndefined();
      expect(await storage.get('key2')).toBe('value2');
      expect(await storage.get('key3')).toBe('value3');
    });

    it('should create LRU storage', async () => {
      const storage = StorageUtils.createLRUStorage<string>(2);
      
      await storage.set('key1', 'value1');
      await storage.set('key2', 'value2');
      
      // Access key1 to make it most recently used
      await storage.get('key1');
      
      // Add key3, should remove key2 (least recently used)
      await storage.set('key3', 'value3');
      
      expect(await storage.get('key1')).toBe('value1');
      expect(await storage.get('key2')).toBeUndefined();
      expect(await storage.get('key3')).toBe('value3');
    });

    it('should create stats storage', async () => {
      const storage = StorageUtils.createStatsStorage<string>();
      
      await storage.set('key1', 'value1');
      await storage.get('key1');
      await storage.get('nonexistent');
      await storage.delete('key1');
      await storage.clear();
      
      const stats = storage.getStats();
      expect(stats.sets).toBe(1);
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.deletes).toBe(1);
      expect(stats.clears).toBe(1);
    });
  });

  describe('Convenience functions', () => {
    it('should create memory storage', () => {
      const storage = createMemoryStorage<string>();
      expect(storage).toBeInstanceOf(MemoryStorage);
    });

    it('should create timed storage', () => {
      const storage = createTimedStorage<number>();
      expect(storage).toBeInstanceOf(TimedMemoryStorage);
    });

    it('should create countable storage', () => {
      const storage = createCountableStorage<number>();
      expect(storage).toBeInstanceOf(CountableMemoryStorage);
    });
  });
});
