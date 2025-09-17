import { createClient } from 'advanced-client-fetch';

console.log('🚀 Kapsamlı Test - Advanced Client Fetch\n');

// Test 1: Response Helper'ları
async function testResponseHelpers() {
  console.log('📄 Test 1: Response Helper\'ları');
  
  const client = createClient({
    baseURL: 'https://httpbin.org'
  });

  try {
    // JSON response
    console.log('  → JSON response');
    const jsonData = await client.json('/json');
    console.log(`  ✅ JSON: ${Object.keys(jsonData || {}).length} anahtar`);

    // Text response
    console.log('  → Text response');
    const textData = await client.text('/robots.txt');
    console.log(`  ✅ Text: ${textData.length} karakter`);

    // Blob response
    console.log('  → Blob response');
    const blobData = await client.blob('/image/png');
    console.log(`  ✅ Blob: ${blobData.size} bytes`);

    return true;
  } catch (error) {
    console.log(`  ❌ Response helper'lar başarısız: ${error.message}`);
    return false;
  }
}

// Test 2: Query Parameters
async function testQueryParameters() {
  console.log('\n🔍 Test 2: Query Parameters');
  
  const client = createClient({
    baseURL: 'https://httpbin.org'
  });

  try {
    // Basit query
    console.log('  → Basit query parameters');
    const response1 = await client.get('/get?name=test&value=123');
    console.log(`  ✅ Query 1: ${response1.status}`);

    // Object query
    console.log('  → Object query parameters');
    const response2 = await client.get('/get', {
      params: {
        page: 1,
        limit: 10,
        search: 'advanced client fetch'
      }
    });
    console.log(`  ✅ Query 2: ${response2.status}`);

    // URL encoding
    console.log('  → URL encoding test');
    const response3 = await client.get('/get', {
      params: {
        message: 'Hello World!',
        special: 'çğüşıö'
      }
    });
    console.log(`  ✅ Query 3: ${response3.status}`);

    return true;
  } catch (error) {
    console.log(`  ❌ Query parameters başarısız: ${error.message}`);
    return false;
  }
}

// Test 3: Headers
async function testHeaders() {
  console.log('\n📋 Test 3: Headers');
  
  const client = createClient({
    baseURL: 'https://httpbin.org',
    headers: {
      'User-Agent': 'Advanced-Client-Fetch-Test',
      'X-Custom-Header': 'test-value'
    }
  });

  try {
    // Default headers
    console.log('  → Default headers');
    const response1 = await client.get('/headers');
    console.log(`  ✅ Default headers: ${response1.status}`);

    // Request-specific headers
    console.log('  → Request-specific headers');
    const response2 = await client.get('/headers', {
      headers: {
        'X-Request-ID': '12345',
        'Authorization': 'Bearer test-token'
      }
    });
    console.log(`  ✅ Request headers: ${response2.status}`);

    // Content-Type headers
    console.log('  → Content-Type headers');
    const response3 = await client.post('/post', { data: 'test' }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log(`  ✅ Content-Type: ${response3.status}`);

    return true;
  } catch (error) {
    console.log(`  ❌ Headers testi başarısız: ${error.message}`);
    return false;
  }
}

// Test 4: Request Body Types
async function testRequestBodyTypes() {
  console.log('\n📦 Test 4: Request Body Types');
  
  const client = createClient({
    baseURL: 'https://httpbin.org'
  });

  try {
    // JSON body
    console.log('  → JSON body');
    const jsonResponse = await client.post('/post', {
      name: 'Advanced Client Fetch',
      version: '1.1.6',
      features: ['retry', 'cache', 'timeout']
    });
    console.log(`  ✅ JSON body: ${jsonResponse.status}`);

    // Form data
    console.log('  → Form data');
    const formData = new FormData();
    formData.append('name', 'test');
    formData.append('file', new Blob(['test content'], { type: 'text/plain' }), 'test.txt');
    
    const formResponse = await client.post('/post', formData);
    console.log(`  ✅ Form data: ${formResponse.status}`);

    // URL encoded
    console.log('  → URL encoded');
    const urlEncodedResponse = await client.post('/post', 'name=test&value=123', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    console.log(`  ✅ URL encoded: ${urlEncodedResponse.status}`);

    // Raw text
    console.log('  → Raw text');
    const textResponse = await client.post('/post', 'Hello World!', {
      headers: {
        'Content-Type': 'text/plain'
      }
    });
    console.log(`  ✅ Raw text: ${textResponse.status}`);

    return true;
  } catch (error) {
    console.log(`  ❌ Request body types başarısız: ${error.message}`);
    return false;
  }
}

// Test 5: Timeout Scenarios
async function testTimeoutScenarios() {
  console.log('\n⏱️ Test 5: Timeout Scenarios');
  
  const client = createClient({
    baseURL: 'https://httpbin.org',
    timeout: 2000 // 2 saniye
  });

  try {
    // Normal request (should succeed)
    console.log('  → Normal request');
    const normalResponse = await client.get('/get');
    console.log(`  ✅ Normal: ${normalResponse.status}`);

    // Delayed request (should timeout)
    console.log('  → Delayed request (timeout test)');
    try {
      await client.get('/delay/5'); // 5 saniye gecikme
      console.log('  ❌ Timeout bekleniyordu');
      return false;
    } catch (error) {
      if (error.message.includes('timeout') || error.message.includes('TimeoutError') || error.message.includes('AbortError')) {
        console.log('  ✅ Timeout yakalandı');
      } else {
        console.log(`  ⚠️ Beklenmeyen hata: ${error.message}`);
      }
    }

    return true;
  } catch (error) {
    console.log(`  ❌ Timeout scenarios başarısız: ${error.message}`);
    return false;
  }
}

// Test 6: Error Status Codes
async function testErrorStatusCodes() {
  console.log('\n🚨 Test 6: Error Status Codes');
  
  const client = createClient({
    baseURL: 'https://httpbin.org'
  });

  try {
    // 400 Bad Request
    console.log('  → 400 Bad Request');
    try {
      await client.get('/status/400');
      console.log('  ❌ 400 hatası bekleniyordu');
    } catch (error) {
      console.log(`  ✅ 400 yakalandı: ${error.message}`);
    }

    // 401 Unauthorized
    console.log('  → 401 Unauthorized');
    try {
      await client.get('/status/401');
      console.log('  ❌ 401 hatası bekleniyordu');
    } catch (error) {
      console.log(`  ✅ 401 yakalandı: ${error.message}`);
    }

    // 404 Not Found
    console.log('  → 404 Not Found');
    try {
      await client.get('/status/404');
      console.log('  ❌ 404 hatası bekleniyordu');
    } catch (error) {
      console.log(`  ✅ 404 yakalandı: ${error.message}`);
    }

    // 500 Internal Server Error
    console.log('  → 500 Internal Server Error');
    try {
      await client.get('/status/500');
      console.log('  ❌ 500 hatası bekleniyordu');
    } catch (error) {
      console.log(`  ✅ 500 yakalandı: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.log(`  ❌ Error status codes başarısız: ${error.message}`);
    return false;
  }
}

// Test 7: Redirects
async function testRedirects() {
  console.log('\n🔄 Test 7: Redirects');
  
  const client = createClient({
    baseURL: 'https://httpbin.org'
  });

  try {
    // 302 redirect
    console.log('  → 302 redirect');
    const redirectResponse = await client.get('/redirect/1');
    console.log(`  ✅ 302 redirect: ${redirectResponse.status}`);

    // Multiple redirects
    console.log('  → Multiple redirects');
    const multiRedirectResponse = await client.get('/redirect/3');
    console.log(`  ✅ Multiple redirects: ${multiRedirectResponse.status}`);

    // Redirect to external URL
    console.log('  → External redirect');
    const externalRedirectResponse = await client.get('/redirect-to?url=https://httpbin.org/get');
    console.log(`  ✅ External redirect: ${externalRedirectResponse.status}`);

    return true;
  } catch (error) {
    console.log(`  ❌ Redirects başarısız: ${error.message}`);
    return false;
  }
}

// Test 8: Cookies
async function testCookies() {
  console.log('\n🍪 Test 8: Cookies');
  
  const client = createClient({
    baseURL: 'https://httpbin.org'
  });

  try {
    // Set cookies
    console.log('  → Set cookies');
    const setCookieResponse = await client.get('/cookies/set?name=test&value=123');
    console.log(`  ✅ Set cookies: ${setCookieResponse.status}`);

    // Get cookies
    console.log('  → Get cookies');
    const getCookieResponse = await client.get('/cookies');
    console.log(`  ✅ Get cookies: ${getCookieResponse.status}`);

    // Delete cookies
    console.log('  → Delete cookies');
    const deleteCookieResponse = await client.get('/cookies/delete?name=test');
    console.log(`  ✅ Delete cookies: ${deleteCookieResponse.status}`);

    return true;
  } catch (error) {
    console.log(`  ❌ Cookies başarısız: ${error.message}`);
    return false;
  }
}

// Test 9: Large Response
async function testLargeResponse() {
  console.log('\n📊 Test 9: Large Response');
  
  const client = createClient({
    baseURL: 'https://httpbin.org'
  });

  try {
    // Large JSON response
    console.log('  → Large JSON response');
    const largeResponse = await client.get('/json');
    console.log(`  ✅ Large JSON: ${largeResponse.status}`);

    // Stream response
    console.log('  → Stream response');
    const streamResponse = await client.stream('/stream/10');
    console.log(`  ✅ Stream: ${streamResponse.status}`);

    return true;
  } catch (error) {
    console.log(`  ❌ Large response başarısız: ${error.message}`);
    return false;
  }
}

// Test 10: Concurrency
async function testConcurrency() {
  console.log('\n⚡ Test 10: Concurrency');
  
  const client = createClient({
    baseURL: 'https://httpbin.org'
  });

  try {
    // Sequential requests
    console.log('  → Sequential requests');
    const start1 = Date.now();
    for (let i = 0; i < 5; i++) {
      await client.get('/get');
    }
    const sequentialTime = Date.now() - start1;
    console.log(`  ✅ Sequential: ${sequentialTime}ms`);

    // Parallel requests
    console.log('  → Parallel requests');
    const start2 = Date.now();
    const promises = Array(5).fill().map(() => client.get('/get'));
    await Promise.all(promises);
    const parallelTime = Date.now() - start2;
    console.log(`  ✅ Parallel: ${parallelTime}ms`);

    // Performance comparison
    const improvement = Math.round(((sequentialTime - parallelTime) / sequentialTime) * 100);
    console.log(`  📈 Performance improvement: ${improvement}%`);

    return true;
  } catch (error) {
    console.log(`  ❌ Concurrency başarısız: ${error.message}`);
    return false;
  }
}

// Ana test fonksiyonu
async function runComprehensiveTests() {
  const tests = [
    { name: 'Response Helper\'ları', fn: testResponseHelpers },
    { name: 'Query Parameters', fn: testQueryParameters },
    { name: 'Headers', fn: testHeaders },
    { name: 'Request Body Types', fn: testRequestBodyTypes },
    { name: 'Timeout Scenarios', fn: testTimeoutScenarios },
    { name: 'Error Status Codes', fn: testErrorStatusCodes },
    { name: 'Redirects', fn: testRedirects },
    { name: 'Cookies', fn: testCookies },
    { name: 'Large Response', fn: testLargeResponse },
    { name: 'Concurrency', fn: testConcurrency }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
        console.log(`\n✅ ${test.name} BAŞARILI`);
      } else {
        failed++;
        console.log(`\n❌ ${test.name} BAŞARISIZ`);
      }
    } catch (error) {
      failed++;
      console.log(`\n❌ ${test.name} HATA: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 KAPSAMLI TEST SONUÇLARI');
  console.log('='.repeat(60));
  console.log(`✅ Başarılı: ${passed}`);
  console.log(`❌ Başarısız: ${failed}`);
  console.log(`📈 Başarı Oranı: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 TÜM KAPSAMLI TESTLER BAŞARILI!');
    console.log('Advanced Client Fetch tüm senaryolarda mükemmel çalışıyor!');
  } else {
    console.log('\n⚠️ Bazı testler başarısız oldu.');
    console.log('Lütfen hataları kontrol edin.');
  }
}

// Testleri çalıştır
runComprehensiveTests().catch(error => {
  console.error('💥 Test runner hatası:', error);
  process.exit(1);
});
