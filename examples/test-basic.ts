/**
 * Basic usage test for Advanced Client Fetch
 */

import { createClient } from '@advanced-client-fetch/core';
import { retry, timeout, cache } from '@advanced-client-fetch/plugins';

async function testBasicUsage() {
  console.log('🚀 Testing Advanced Client Fetch Basic Usage...\n');

  // Create client with basic configuration
  const client = createClient({
    baseURL: 'https://httpbin.org',
    headers: {
      'User-Agent': 'advanced-client-fetch-test/1.0',
    },
  });

  try {
    // Test GET request
    console.log('1. Testing GET request...');
    const response = await client.get('/get');
    console.log('✅ GET request successful');
    console.log('Response status:', response.status);
    console.log('Response data keys:', Object.keys(response.data || {}));

    // Test POST request
    console.log('\n2. Testing POST request...');
    const postData = { name: 'Advanced Client Fetch', version: '0.1.0' };
    const postResponse = await client.post('/post', postData);
    console.log('✅ POST request successful');
    console.log('Response status:', postResponse.status);
    console.log('Sent data:', postResponse.data?.json);

    // Test JSON helper
    console.log('\n3. Testing JSON helper...');
    const jsonResponse = await client.json('/json');
    console.log('✅ JSON helper successful');
    console.log('JSON data keys:', Object.keys(jsonResponse || {}));

    // Test with query parameters
    console.log('\n4. Testing query parameters...');
    const queryResponse = await client.get('/get', {
      query: { test: 'value', number: 123 }
    });
    console.log('✅ Query parameters successful');
    console.log('Query params:', queryResponse.data?.args);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function testWithPlugins() {
  console.log('\n🔌 Testing Advanced Client Fetch with Plugins...\n');

  // Create client with plugins
  const client = createClient({
    baseURL: 'https://httpbin.org',
    middleware: [
      retry({ retries: 2, minDelay: 100, maxDelay: 1000 }),
      timeout({ timeout: 10000 }),
      cache({ ttl: 30000 }),
    ],
  });

  try {
    // Test with retry (simulate failure)
    console.log('1. Testing retry plugin...');
    const response = await client.get('/status/500');
    console.log('Response status:', response.status);

    // Test with cache
    console.log('\n2. Testing cache plugin...');
    const start1 = Date.now();
    await client.get('/delay/1');
    const time1 = Date.now() - start1;
    console.log('First request time:', time1, 'ms');

    const start2 = Date.now();
    await client.get('/delay/1');
    const time2 = Date.now() - start2;
    console.log('Second request time (cached):', time2, 'ms');

    // Test timeout
    console.log('\n3. Testing timeout plugin...');
    try {
      await client.get('/delay/5', { timeout: 2000 });
    } catch (error) {
      console.log('✅ Timeout working:', error.message);
    }

  } catch (error) {
    console.error('❌ Plugin test failed:', error);
  }
}

async function testErrorHandling() {
  console.log('\n⚠️  Testing Error Handling...\n');

  const client = createClient({
    baseURL: 'https://httpbin.org',
  });

  try {
    // Test 404 error
    console.log('1. Testing 404 error...');
    await client.get('/nonexistent');
  } catch (error) {
    console.log('✅ 404 error caught:', error.message);
  }

  try {
    // Test 500 error
    console.log('\n2. Testing 500 error...');
    await client.get('/status/500');
  } catch (error) {
    console.log('✅ 500 error caught:', error.message);
  }

  try {
    // Test network error (invalid domain)
    console.log('\n3. Testing network error...');
    const badClient = createClient({ baseURL: 'https://invalid-domain-that-does-not-exist.com' });
    await badClient.get('/');
  } catch (error) {
    console.log('✅ Network error caught:', error.message);
  }
}

async function runTests() {
  console.log('🧪 Advanced Client Fetch Test Suite\n');
  console.log('=' .repeat(50));

  await testBasicUsage();
  await testWithPlugins();
  await testErrorHandling();

  console.log('\n' + '='.repeat(50));
  console.log('✅ All tests completed!');
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { testBasicUsage, testWithPlugins, testErrorHandling, runTests };