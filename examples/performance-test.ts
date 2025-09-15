/**
 * Performance test for Advanced Client Fetch
 */

import { createClient } from '../packages/core/dist/index.js';
import { retry, timeout, cache, dedupe } from '../packages/plugins/dist/index.js';

// Create optimized client
const client = createClient({
  baseURL: 'https://httpbin.org',
  middleware: [
    retry({ retries: 2, minDelay: 50, maxDelay: 500 }),
    timeout({ timeout: 5000 }),
    cache({ ttl: 30000 }), // 30 second cache
    dedupe({ ttl: 10000 }), // 10 second deduplication
  ],
});

async function measureTime<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  console.log(`⏱️  ${name}: ${(end - start).toFixed(2)}ms`);
  return result;
}

async function testConcurrentRequests() {
  console.log('🚀 Testing concurrent requests...');
  
  const promises = Array.from({ length: 10 }, (_, i) =>
    measureTime(`Request ${i + 1}`, () =>
      client.get('/delay/1') // 1 second delay
    )
  );
  
  const results = await Promise.all(promises);
  console.log('✅ All concurrent requests completed');
  return results;
}

async function testCachePerformance() {
  console.log('🚀 Testing cache performance...');
  
  // First request (cache miss)
  await measureTime('Cache miss', () => client.get('/json'));
  
  // Second request (cache hit)
  await measureTime('Cache hit', () => client.get('/json'));
  
  // Third request (cache hit)
  await measureTime('Cache hit 2', () => client.get('/json'));
}

async function testDeduplication() {
  console.log('🚀 Testing request deduplication...');
  
  const start = performance.now();
  
  // These should be deduplicated
  const promises = Array.from({ length: 5 }, () =>
    client.get('/delay/2') // 2 second delay
  );
  
  const results = await Promise.all(promises);
  const end = performance.now();
  
  console.log(`✅ Deduplication test: ${(end - start).toFixed(2)}ms (should be ~2s, not 10s)`);
  return results;
}

async function testRetryPerformance() {
  console.log('🚀 Testing retry performance...');
  
  try {
    // This will fail and retry
    await measureTime('Retry test', () =>
      client.get('/status/500')
    );
  } catch (error) {
    console.log('✅ Retry test completed (expected failure)');
  }
}

async function main() {
  try {
    console.log('🚀 Advanced Client Fetch Performance Test\n');
    
    // Test basic performance
    await measureTime('Basic GET', () => client.get('/json'));
    
    // Test concurrent requests
    await testConcurrentRequests();
    
    // Test cache performance
    await testCachePerformance();
    
    // Test deduplication
    await testDeduplication();
    
    // Test retry performance
    await testRetryPerformance();
    
    console.log('\n🎉 Performance tests completed!');
    
  } catch (error) {
    console.error('❌ Performance test error:', error);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
