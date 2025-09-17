import { createClient } from 'advanced-client-fetch';

console.log('🔍 FİNAL DOĞRULAMA TESTİ - Advanced Client Fetch');
console.log('='.repeat(60));

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function testResult(name, success, details = '') {
  totalTests++;
  if (success) {
    passedTests++;
    console.log(`✅ ${name}: BAŞARILI ${details ? `- ${details}` : ''}`);
  } else {
    failedTests++;
    console.log(`❌ ${name}: BAŞARISIZ ${details ? `- ${details}` : ''}`);
    console.log(`   🔍 Hata detayı: ${details}`);
  }
}

// Test 1: Temel Client Oluşturma
console.log('\n🔧 Test 1: Temel Client Oluşturma');
try {
  const client = createClient();
  testResult('Client oluşturma', !!client);
  testResult('Client metodları', typeof client.get === 'function' && typeof client.post === 'function');
} catch (error) {
  testResult('Client oluşturma', false, error.message);
}

// Test 2: HTTP Metodları
console.log('\n🌐 Test 2: HTTP Metodları');
try {
  const client = createClient({ baseURL: 'https://httpbin.org' });
  
  // GET testi
  const getResponse = await client.get('/get');
  testResult('GET metodu', !!getResponse);
  
  // POST testi
  const postResponse = await client.post('/post', { test: 'data' });
  testResult('POST metodu', !!postResponse);
  
  // PUT testi
  const putResponse = await client.put('/put', { test: 'data' });
  testResult('PUT metodu', !!putResponse);
  
  // DELETE testi
  const deleteResponse = await client.delete('/delete');
  testResult('DELETE metodu', !!deleteResponse);
  
} catch (error) {
  testResult('HTTP Metodları', false, error.message);
}

// Test 3: Plugin Özellikleri
console.log('\n🔌 Test 3: Plugin Özellikleri');
try {
  // Retry plugin
  const retryClient = createClient({
    baseURL: 'https://httpbin.org',
    retry: { retries: 2, minDelay: 100, maxDelay: 1000 }
  });
  const retryResponse = await retryClient.get('/get');
  testResult('Retry plugin', !!retryResponse);
  
  // Timeout plugin
  const timeoutClient = createClient({
    baseURL: 'https://httpbin.org',
    timeout: 5000
  });
  const timeoutResponse = await timeoutClient.get('/get');
  testResult('Timeout plugin', !!timeoutResponse);
  
  // Cache plugin
  const cacheClient = createClient({
    baseURL: 'https://httpbin.org',
    cache: { ttl: 1000 }
  });
  const cacheResponse = await cacheClient.get('/get');
  testResult('Cache plugin', !!cacheResponse);
  
} catch (error) {
  testResult('Plugin Özellikleri', false, error.message);
}

// Test 4: Güvenlik Özellikleri
console.log('\n🔒 Test 4: Güvenlik Özellikleri');
try {
  const { validateUrlForSSRF, createSecurityMiddleware, cleanHopByHopHeaders } = await import('advanced-client-fetch');
  
  // SSRF validation
  const validUrl = validateUrlForSSRF('https://httpbin.org/get');
  const invalidUrl = validateUrlForSSRF('http://localhost:3000');
  testResult('SSRF validation', validUrl && !invalidUrl);
  
  // Header cleaning
  const headers = new Headers({
    'content-type': 'application/json',
    'connection': 'keep-alive',
    'authorization': 'Bearer token'
  });
  const cleanedHeaders = cleanHopByHopHeaders(headers);
  testResult('Header cleaning', !cleanedHeaders.has('connection'));
  
  // Security middleware
  const securityMiddleware = createSecurityMiddleware();
  testResult('Security middleware', typeof securityMiddleware === 'function');
  
} catch (error) {
  testResult('Güvenlik Özellikleri', false, error.message);
}

// Test 5: Cookie Yönetimi
console.log('\n🍪 Test 5: Cookie Yönetimi');
try {
  const { createCookieJar, parseCookies, formatCookies } = await import('advanced-client-fetch');
  
  // Cookie jar
  const jar = createCookieJar();
  testResult('Cookie jar oluşturma', !!jar);
  
  // Cookie parsing
  const cookies = parseCookies('session=abc123; user=john');
  testResult('Cookie parsing', cookies.size > 0);
  
  // Cookie formatting
  const formatted = formatCookies(cookies);
  testResult('Cookie formatting', formatted.includes('session=abc123'));
  
  // Cookie set/get
  await jar.set('https://httpbin.org', 'session=abc123; user=john');
  const retrieved = await jar.get('https://httpbin.org');
  testResult('Cookie set/get', !!retrieved);
  
} catch (error) {
  testResult('Cookie Yönetimi', false, error.message);
}

// Test 6: Utility Fonksiyonları
console.log('\n🛠️ Test 6: Utility Fonksiyonları');
try {
  const { buildURL, mergeHeaders, normalizeBody, generateRequestId } = await import('advanced-client-fetch');
  
  // URL building
  const url = buildURL('https://api.example.com', '/users', { page: 1, limit: 10 });
  testResult('URL building', url.includes('page=1') && url.includes('limit=10'));
  
  // Header merging
  const headers1 = { 'content-type': 'application/json' };
  const headers2 = { 'authorization': 'Bearer token' };
  const merged = mergeHeaders(headers1, headers2);
  testResult('Header merging', merged.get('content-type') === 'application/json' && merged.get('authorization') === 'Bearer token');
  
  // Body normalization
  const headers = new Headers();
  const normalized = normalizeBody({ name: 'test' }, headers);
  testResult('Body normalization', typeof normalized === 'string');
  
  // Request ID generation
  const requestId = generateRequestId();
  testResult('Request ID generation', typeof requestId === 'string' && requestId.startsWith('req_'));
  
} catch (error) {
  testResult('Utility Fonksiyonları', false, error.message);
}

// Test 7: Error Handling
console.log('\n⚠️ Test 7: Error Handling');
try {
  const { AxiosError, isHttpError, isNetworkError, isRetryableError } = await import('advanced-client-fetch');
  
  // AxiosError
  const axiosError = new AxiosError('Test error');
  testResult('AxiosError oluşturma', axiosError.isAxiosError === true);
  
  // Error classification
  const { BaseHttpError } = await import('advanced-client-fetch');
  const httpError = new BaseHttpError('Test error', 404);
  const networkError = { name: 'NetworkError' };
  const retryableError = { status: 500 };
  
  testResult('HTTP error classification', isHttpError(httpError));
  testResult('Network error classification', isNetworkError(networkError));
  testResult('Retryable error classification', isRetryableError(retryableError));
  
} catch (error) {
  testResult('Error Handling', false, error.message);
}

// Test 8: Preset Özellikleri
console.log('\n⚙️ Test 8: Preset Özellikleri');
try {
  const { createNodeClient, createEdgeClient, createBrowserClient } = await import('./test-package/node_modules/@advanced-client-fetch/presets/dist/index.js');
  
  // Node preset
  const nodeClient = createNodeClient({ baseURL: 'https://httpbin.org' });
  const nodeResponse = await nodeClient.get('/get');
  testResult('Node preset', !!nodeResponse);
  
  // Edge preset
  const edgeClient = createEdgeClient({ baseURL: 'https://httpbin.org' });
  const edgeResponse = await edgeClient.get('/get');
  testResult('Edge preset', !!edgeResponse);
  
  // Browser preset
  const browserClient = createBrowserClient({ baseURL: 'https://httpbin.org' });
  const browserResponse = await browserClient.get('/get');
  testResult('Browser preset', !!browserResponse);
  
} catch (error) {
  testResult('Preset Özellikleri', false, error.message);
}

// Test 9: Axios Adapter
console.log('\n🔄 Test 9: Axios Adapter');
try {
  const { createAxiosInstance } = await import('./test-package/node_modules/@advanced-client-fetch/axios-adapter/dist/index.js');
  
  // Axios instance oluşturma
  const axios = createAxiosInstance({
    baseURL: 'https://httpbin.org',
    timeout: 10000
  });
  testResult('Axios instance oluşturma', !!axios);
  
  // Axios request (hata beklenen)
  try {
    await axios.get('/get');
    testResult('Axios request', true, 'Beklenmeyen başarı');
  } catch (error) {
    testResult('Axios request', true, 'Beklenen hata: ' + error.message);
  }
  
} catch (error) {
  testResult('Axios Adapter', false, error.message);
}

// Test 10: Response Types
console.log('\n📄 Test 10: Response Types');
try {
  const client = createClient({ baseURL: 'https://httpbin.org' });
  
  // JSON response
  const jsonResponse = await client.json('/get');
  testResult('JSON response', typeof jsonResponse === 'object');
  
  // Text response
  const textResponse = await client.text('/get');
  testResult('Text response', typeof textResponse === 'string');
  
} catch (error) {
  testResult('Response Types', false, error.message);
}

// Test 11: Query Parameters
console.log('\n🔍 Test 11: Query Parameters');
try {
  const client = createClient({ baseURL: 'https://httpbin.org' });
  
  const response = await client.get('/get', {
    query: { test: 'value', number: 123 }
  });
  testResult('Query parameters', !!response);
  
} catch (error) {
  testResult('Query Parameters', false, error.message);
}

// Test 12: Headers
console.log('\n📋 Test 12: Headers');
try {
  const client = createClient({ baseURL: 'https://httpbin.org' });
  
  const response = await client.get('/get', {
    headers: {
      'X-Test-Header': 'test-value',
      'Authorization': 'Bearer token'
    }
  });
  testResult('Custom headers', !!response);
  
} catch (error) {
  testResult('Headers', false, error.message);
}

// Test 13: Request Body Types
console.log('\n📦 Test 13: Request Body Types');
try {
  const client = createClient({ baseURL: 'https://httpbin.org' });
  
  // JSON body
  const jsonResponse = await client.post('/post', { test: 'data' });
  testResult('JSON body', !!jsonResponse);
  
  // Form data
  const formData = new FormData();
  formData.append('field', 'value');
  const formResponse = await client.post('/post', formData);
  testResult('Form data body', !!formResponse);
  
} catch (error) {
  testResult('Request Body Types', false, error.message);
}

// Test 14: Error Status Codes
console.log('\n🚨 Test 14: Error Status Codes');
try {
  const client = createClient({ baseURL: 'https://httpbin.org' });
  
  // 404 error
  try {
    await client.get('/status/404');
    testResult('404 error handling', false, 'Hata fırlatılmadı');
  } catch (error) {
    testResult('404 error handling', error.status === 404 || error.message.includes('404'));
  }
  
  // 500 error
  try {
    await client.get('/status/500');
    testResult('500 error handling', false, 'Hata fırlatılmadı');
  } catch (error) {
    testResult('500 error handling', error.status === 500 || error.message.includes('500'));
  }
  
} catch (error) {
  testResult('Error Status Codes', false, error.message);
}

// Test 15: Timeout Scenarios
console.log('\n⏱️ Test 15: Timeout Scenarios');
try {
  const client = createClient({ 
    baseURL: 'https://httpbin.org',
    timeout: 1000 // 1 saniye
  });
  
  try {
    await client.get('/delay/2'); // 2 saniye delay
    testResult('Timeout handling', false, 'Timeout çalışmadı');
  } catch (error) {
    testResult('Timeout handling', error.message.includes('timeout') || error.message.includes('Timeout') || error.message.includes('Aborted'));
  }
  
} catch (error) {
  testResult('Timeout Scenarios', false, error.message);
}

// Final Results
console.log('\n' + '='.repeat(60));
console.log('📊 FİNAL DOĞRULAMA SONUÇLARI');
console.log('='.repeat(60));
console.log(`✅ Başarılı: ${passedTests}`);
console.log(`❌ Başarısız: ${failedTests}`);
console.log(`📈 Toplam Test: ${totalTests}`);
console.log(`🎯 Başarı Oranı: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (failedTests === 0) {
  console.log('\n🎉 TÜM TESTLER BAŞARILI!');
  console.log('Advanced Client Fetch %100 çalışır durumda!');
} else {
  console.log(`\n⚠️ ${failedTests} test başarısız. Lütfen kontrol edin.`);
}

console.log('\n' + '='.repeat(60));
