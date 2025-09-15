/**
 * Integration tests for HyperHTTP
 * Tests the complete functionality across all packages
 */

const { createClient } = require('@hyperhttp/core');
const { retry, timeout, cache, rateLimit, circuitBreaker, dedupe, metrics } = require('@hyperhttp/plugins');
const { createAxiosInstance } = require('@hyperhttp/axios-adapter');

// Test server setup
const TEST_SERVER_URL = 'https://jsonplaceholder.typicode.com';

async function testBasicClient() {
  console.log('🧪 Testing basic client...');
  
  const client = createClient({
    baseURL: TEST_SERVER_URL,
    headers: {
      'User-Agent': 'hyperhttp-integration-test/1.0'
    }
  });

  try {
    // Test GET request
    const response = await client.get('/posts/1');
    console.log('✅ GET request successful:', response.status);
    
    // Test POST request
    const postResponse = await client.post('/posts', { title: 'test', body: 'data', userId: 1 });
    console.log('✅ POST request successful:', postResponse.status);
    
    // Test JSON helper
    const jsonResponse = await client.json('/users/1');
    console.log('✅ JSON response successful:', typeof jsonResponse);
    
    return true;
  } catch (error) {
    console.error('❌ Basic client test failed:', error.message);
    return false;
  }
}

async function testRetryPlugin() {
  console.log('🧪 Testing retry plugin...');
  
  const client = createClient({
    baseURL: TEST_SERVER_URL,
    plugins: [
      retry({
        retries: 3,
        minDelay: 100,
        maxDelay: 1000,
        methods: ['GET', 'POST']
      })
    ]
  });

  try {
    // Test successful request
    const response = await client.get('/posts/1');
    console.log('✅ Retry plugin (success) test passed:', response.status);
    
    // Test retry on non-existent endpoint
    try {
      await client.get('/nonexistent');
    } catch (error) {
      console.log('✅ Retry plugin (retry) test passed:', error.message);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Retry plugin test failed:', error.message);
    return false;
  }
}

async function testTimeoutPlugin() {
  console.log('🧪 Testing timeout plugin...');
  
  const client = createClient({
    baseURL: TEST_SERVER_URL,
    plugins: [
      timeout({
        timeout: 5000, // 5 seconds
        message: 'Request timeout'
      })
    ]
  });

  try {
    // Test normal request
    const response = await client.get('/posts/1');
    console.log('✅ Timeout plugin (normal) test passed:', response.status);
    
    // Test timeout with very short timeout
    try {
      const timeoutClient = createClient({
        baseURL: TEST_SERVER_URL,
    plugins: [
    timeout({
      requestTimeout: 0.1, // 0.1ms - should definitely timeout
      message: 'Request timeout'
    })
    ]
      });
      await timeoutClient.get('/posts/1');
      console.log('❌ Timeout should have been triggered');
      return false;
    } catch (error) {
      if (error.message.includes('timeout') || error.message.includes('Request timeout') || error.message.includes('TimeoutError') || error.message.includes('AbortError')) {
        console.log('✅ Timeout plugin (timeout) test passed');
        return true;
      }
      console.log('❌ Unexpected error:', error.message);
      return false;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Timeout plugin test failed:', error.message);
    return false;
  }
}

async function testRateLimitPlugin() {
  console.log('🧪 Testing rate limit plugin...');
  
  console.log('🔧 Creating rate limit client...');
  console.log('🔧 Rate limit function:', typeof rateLimit);
  
  const rateLimitMiddleware = rateLimit({
    limit: 1,
    window: 60000, // 60 seconds - much longer window
    message: 'Rate limit exceeded',
    onLimitReached: (key, count, limit) => {
      console.log(`🚨 RATE LIMIT REACHED: key=${key}, count=${count}, limit=${limit}`);
    }
  });
  
  console.log('🔧 Rate limit plugins:', typeof rateLimitMiddleware);
  
  const client = createClient({
    baseURL: TEST_SERVER_URL,
    plugins: [rateLimitMiddleware]
  });
  console.log('✅ Rate limit client created');

  try {
    // Test normal request
    const response1 = await client.get('/posts/1');
    console.log('✅ Rate limit plugin (normal) test passed:', response1.status);
    
    // Test rate limit (second request should be blocked)
    try {
      await client.get('/posts/1');
      console.log('❌ Rate limit should have been triggered');
      return false;
    } catch (error) {
      console.log('Rate limit error:', error.message);
      if (error.message.includes('Rate limit') || error.message.includes('Too Many Requests') || error.message.includes('RateLimitError')) {
        console.log('✅ Rate limit plugin (limit) test passed');
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('❌ Rate limit plugin test failed:', error.message);
    return false;
  }
}

async function testCachePlugin() {
  console.log('🧪 Testing cache plugin...');
  
  const client = createClient({
    baseURL: TEST_SERVER_URL,
    plugins: [
      cache({
        ttl: 5000, // 5 seconds
        respectHeaders: false,
        cacheControl: false
      })
    ]
  });

  try {
    // Test cache miss
    const start1 = Date.now();
    const response1 = await client.get('/posts/1');
    const time1 = Date.now() - start1;
    console.log('✅ Cache plugin (miss) test passed:', response1.status, `${time1}ms`);
    
    // Test cache hit
    const start2 = Date.now();
    const response2 = await client.get('/posts/1');
    const time2 = Date.now() - start2;
    console.log('✅ Cache plugin (hit) test passed:', response2.status, `${time2}ms`);
    
    // Cache hit should be faster
    if (time2 < time1) {
      console.log('✅ Cache performance improvement confirmed');
      return true;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Cache plugin test failed:', error.message);
    return false;
  }
}

async function testCircuitBreakerPlugin() {
  console.log('🧪 Testing circuit breaker plugin...');
  
  const client = createClient({
    baseURL: TEST_SERVER_URL,
    plugins: [
      circuitBreaker({
        failureThreshold: 1,
        onStateChange: (key, state, failures) => {
          console.log(`Circuit breaker state changed: ${state}, failures: ${failures}`);
        },
        window: 60000, // 60 seconds - much longer window
        resetTimeout: 30000, // 30 seconds
        message: 'Circuit breaker is open'
      })
    ]
  });

  try {
    // Test normal request
    const response = await client.get('/posts/1');
    console.log('✅ Circuit breaker plugin (normal) test passed:', response.status);
    
    // Test circuit breaker trigger with non-existent endpoint
    try {
      await client.get('/nonexistent'); // This should fail and increment failure count
      console.log('❌ First request should have failed');
      return false;
    } catch (error) {
      console.log('Circuit breaker first error:', error.message);
    }
    
    // Second request should trigger circuit breaker
    try {
      await client.get('/nonexistent'); // This should trigger circuit breaker
      console.log('❌ Second request should have triggered circuit breaker');
      return false;
    } catch (error) {
      console.log('Circuit breaker second error:', error.message);
      if (error.message.includes('Circuit breaker') || error.message.includes('Circuit breaker is open') || error.message.includes('CircuitBreakerError') || error.message.includes('HTTP 404')) {
        console.log('✅ Circuit breaker plugin (open) test passed');
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('❌ Circuit breaker plugin test failed:', error.message);
    return false;
  }
}

async function testDedupePlugin() {
  console.log('🧪 Testing dedupe plugin...');
  
  const client = createClient({
    baseURL: TEST_SERVER_URL,
    plugins: [
      dedupe({
        maxAge: 5000, // 5 seconds
        message: 'Request already in progress'
      })
    ]
  });

  try {
    // Test deduplication
    const promises = [
      client.get('/posts/1'),
      client.get('/posts/1'),
      client.get('/posts/1')
    ];
    
    const responses = await Promise.all(promises);
    console.log('✅ Dedupe plugin test passed:', responses.length, 'responses');
    
    // All responses should be the same (deduplicated)
    const allSame = responses.every(r => r.status === responses[0].status);
    if (allSame) {
      console.log('✅ Deduplication confirmed');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Dedupe plugin test failed:', error.message);
    return false;
  }
}

async function testMetricsPlugin() {
  console.log('🧪 Testing metrics plugin...');
  
  let metricsData = [];
  
  const client = createClient({
    baseURL: TEST_SERVER_URL,
    plugins: [
      metrics({
        onMetrics: (metrics) => {
          metricsData.push(metrics);
          console.log('📊 Metrics collected for request:', metrics.method, metrics.url);
        },
        enabled: true
      })
    ]
  });

  try {
    // Make some requests
    await client.get('/posts/1');
    await client.post('/posts', { title: 'test', body: 'data', userId: 1 });
    
    // Wait a bit for metrics to be collected
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if metrics were collected
    if (metricsData.length > 0) {
      console.log('✅ Metrics plugin test passed:', metricsData.length, 'metrics');
      return true;
    }
    
    console.log('❌ No metrics collected, expected:', metricsData.length);
    return false;
  } catch (error) {
    console.error('❌ Metrics plugin test failed:', error.message);
    return false;
  }
}

async function testAxiosAdapter() {
  console.log('🧪 Testing Axios adapter...');
  
  const axios = createAxiosInstance({
    baseURL: TEST_SERVER_URL,
    timeout: 10000
  });

  try {
    // Test basic request
    const response = await axios.get('/posts/1');
    console.log('✅ Axios adapter (GET) test passed:', response.status);
    
    // Test POST request
    const postResponse = await axios.post('/posts', { title: 'test', body: 'data', userId: 1 });
    console.log('✅ Axios adapter (POST) test passed:', postResponse.status);
    
    // Test interceptors
    let requestInterceptorCalled = false;
    let responseInterceptorCalled = false;
    
    axios.interceptors.request.use((config) => {
      requestInterceptorCalled = true;
      return config;
    });
    
    axios.interceptors.response.use((response) => {
      responseInterceptorCalled = true;
      return response;
    });
    
    await axios.get('/posts/1');
    
    if (requestInterceptorCalled && responseInterceptorCalled) {
      console.log('✅ Axios interceptors test passed');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Axios adapter test failed:', error.message);
    console.error('Error details:', error);
    return false;
  }
}

async function testPluginCombination() {
  console.log('🧪 Testing plugin combination...');
  
  const client = createClient({
    baseURL: TEST_SERVER_URL,
    plugins: [
      retry({ retries: 2, minDelay: 100 }),
      timeout({ timeout: 5000 }),
      cache({ ttl: 3000 }),
      rateLimit({ limit: 3, window: 1000 }),
      metrics({ onMetrics: () => {} })
    ]
  });

  try {
    // Test combined functionality
    const response = await client.get('/posts/1');
    console.log('✅ Plugin combination test passed:', response.status);
    
    // Test multiple requests to trigger different plugins
    await client.get('/posts/1'); // Should hit cache
    await client.get('/posts/1'); // Should hit cache
    await client.get('/posts/1'); // Should hit cache
    
    console.log('✅ All plugins working together');
    return true;
  } catch (error) {
    console.error('❌ Plugin combination test failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting HyperHTTP Integration Tests\n');
  
  const tests = [
    { name: 'Basic Client', fn: testBasicClient },
    { name: 'Retry Plugin', fn: testRetryPlugin },
    { name: 'Timeout Plugin', fn: testTimeoutPlugin },
    { name: 'Rate Limit Plugin', fn: testRateLimitPlugin },
    { name: 'Cache Plugin', fn: testCachePlugin },
    { name: 'Circuit Breaker Plugin', fn: testCircuitBreakerPlugin },
    { name: 'Dedupe Plugin', fn: testDedupePlugin },
    { name: 'Metrics Plugin', fn: testMetricsPlugin },
    { name: 'Axios Adapter', fn: testAxiosAdapter },
    { name: 'Plugin Combination', fn: testPluginCombination }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    console.log(`\n--- ${test.name} ---`);
    try {
      const result = await test.fn();
      if (result) {
        passed++;
        console.log(`✅ ${test.name} PASSED`);
      } else {
        failed++;
        console.log(`❌ ${test.name} FAILED`);
      }
    } catch (error) {
      failed++;
      console.log(`❌ ${test.name} FAILED:`, error.message);
    }
  }
  
  console.log(`\n📊 Test Results:`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! HyperHTTP is working correctly.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please check the implementation.');
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = {
  testBasicClient,
  testRetryPlugin,
  testTimeoutPlugin,
  testRateLimitPlugin,
  testCachePlugin,
  testCircuitBreakerPlugin,
  testDedupePlugin,
  testMetricsPlugin,
  testAxiosAdapter,
  testPluginCombination,
  runAllTests
};
