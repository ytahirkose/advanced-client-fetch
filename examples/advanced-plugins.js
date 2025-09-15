/**
 * Advanced Plugins Example
 * 
 * This example shows how to use advanced plugins
 * for production-ready HTTP clients.
 */

import { createClient } from '@hyperhttp/core';
import { 
  retry, 
  cache, 
  rateLimit, 
  circuitBreaker, 
  dedupe, 
  metrics 
} from '@hyperhttp/plugins';

// Create a production-ready client
const client = createClient({
  baseURL: 'https://api.example.com',
  plugins: [
    // Retry with exponential backoff
    retry({
      retries: 3,
      minDelay: 1000,
      maxDelay: 10000,
      respectRetryAfter: true,
      onRetry: (attempt, delay, error) => {
        console.log(`Retry attempt ${attempt} after ${delay}ms:`, error.message);
      }
    }),

    // Cache with SWR
    cache({
      ttl: 60000,
      staleWhileRevalidate: true,
      keyGenerator: (req) => `${req.method}:${req.url}`
    }),

    // Rate limiting
    rateLimit({
      requests: 100,
      window: 60000,
      keyGenerator: (req) => req.url,
      onLimitReached: (key, limit) => {
        console.log(`Rate limit reached for ${key}: ${limit}`);
      }
    }),

    // Circuit breaker
    circuitBreaker({
      failureThreshold: 5,
      window: 60000,
      resetTimeout: 30000,
      onStateChange: (key, state, failures) => {
        console.log(`Circuit breaker ${key} changed to ${state} (${failures} failures)`);
      }
    }),

    // Request deduplication
    dedupe({
      maxAge: 30000,
      maxPending: 10,
      keyGenerator: (req) => `${req.method}:${req.url}`,
      onDedupe: (key) => {
        console.log(`Request deduplicated: ${key}`);
      }
    }),

    // Metrics collection
    metrics({
      onMetrics: (data) => {
        console.log('Request metrics:', {
          url: data.url,
          method: data.method,
          status: data.status,
          duration: data.duration,
          retries: data.retries,
          cacheHit: data.cacheHit
        });
      },
      sampling: 0.1 // 10% sampling
    })
  ]
});

async function advancedExample() {
  try {
    console.log('=== Advanced Plugins Example ===');
    
    // Make multiple requests to test plugins
    const promises = [
      client.get('/users'),
      client.get('/users'), // Should be deduplicated
      client.get('/posts'),
      client.get('/comments')
    ];

    const responses = await Promise.all(promises);
    console.log('All requests completed:', responses.length);

    // Test error handling
    try {
      await client.get('/nonexistent');
    } catch (error) {
      console.log('Error handled by plugins:', error.message);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the example
advancedExample();
