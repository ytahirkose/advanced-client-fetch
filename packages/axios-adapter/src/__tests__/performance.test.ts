/**
 * Tests for Performance Monitoring
 */

import { describe, it, expect } from 'vitest';
import { globalPerformanceMonitor, memoryMonitor } from '../performance';

describe('Performance Monitoring', () => {
  it('should track request metrics', () => {
    const requestId = 'test-request';
    
    globalPerformanceMonitor.startRequest(requestId);
    globalPerformanceMonitor.endRequest(requestId, true);
    
    const metrics = globalPerformanceMonitor.getMetrics();
    expect(metrics.requestCount).toBe(1);
    expect(metrics.successCount).toBe(1);
  });

  it('should get memory usage', () => {
    const usage = memoryMonitor.getMemoryUsage();
    expect(usage).toBeDefined();
  });
});