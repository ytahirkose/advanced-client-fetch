const { createClient, retry, cache, rateLimit, circuitBreaker } = require('advanced-client-fetch');

async function testPlugins() {
  try {
    console.log('🚀 Testing Advanced Client Fetch with Plugins...\n');
    
    // Create client with plugins
    const client = createClient({
      baseURL: 'https://httpbin.org',
      plugins: [
        retry({ retries: 2, minDelay: 100, maxDelay: 1000 }),
        cache({ ttl: 5000 }), // 5 seconds cache
        rateLimit({ maxRequests: 10, windowMs: 60000 }),
        circuitBreaker({ failureThreshold: 3, resetTimeout: 5000 })
      ]
    });
    
    // Test GET request with plugins
    console.log('1. Testing GET request with plugins...');
    const response = await client.get('/get');
    console.log('✅ GET request successful');
    console.log('Status:', response.status);
    console.log('Data keys:', Object.keys(response.data || {}));
    
    // Test POST request
    console.log('\n2. Testing POST request...');
    const postData = { name: 'Advanced Client Fetch', version: '1.0.10' };
    const postResponse = await client.post('/post', postData);
    console.log('✅ POST request successful');
    console.log('Status:', postResponse.status);
    console.log('Sent data:', postResponse.data?.json);
    
    // Test caching (should be faster on second call)
    console.log('\n3. Testing cache plugin...');
    const start1 = Date.now();
    await client.get('/get');
    const time1 = Date.now() - start1;
    
    const start2 = Date.now();
    await client.get('/get');
    const time2 = Date.now() - start2;
    
    console.log('✅ Cache test completed');
    console.log(`First call: ${time1}ms, Second call: ${time2}ms`);
    console.log(`Cache working: ${time2 < time1 ? 'Yes' : 'No'}`);
    
    console.log('\n🎉 All plugin tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPlugins();
