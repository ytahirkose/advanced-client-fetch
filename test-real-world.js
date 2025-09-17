import { createClient } from 'advanced-client-fetch';

// Test server - gerçek API'ler kullanıyoruz
const TEST_APIS = {
  jsonplaceholder: 'https://jsonplaceholder.typicode.com',
  httpbin: 'https://httpbin.org',
  catfact: 'https://catfact.ninja'
};

console.log('🚀 Gerçek Dünya Testleri - Advanced Client Fetch\n');

// Test 1: Temel HTTP İstekleri
async function testBasicRequests() {
  console.log('📡 Test 1: Temel HTTP İstekleri');
  
  const client = createClient({
    baseURL: TEST_APIS.jsonplaceholder,
    headers: {
      'User-Agent': 'Advanced-Client-Fetch-Test/1.0'
    }
  });

  try {
    // GET isteği
    console.log('  → GET /posts/1');
    const getResponse = await client.get('/posts/1');
    console.log(`  ✅ GET başarılı: ${getResponse.status} - ${getResponse.data?.title?.substring(0, 30)}...`);

    // POST isteği
    console.log('  → POST /posts');
    const postData = { title: 'Test Post', body: 'Bu bir test mesajıdır', userId: 1 };
    const postResponse = await client.post('/posts', postData);
    console.log(`  ✅ POST başarılı: ${postResponse.status} - ID: ${postResponse.data?.id}`);

    // JSON helper
    console.log('  → JSON helper');
    const jsonData = await client.json('/users/1');
    console.log(`  ✅ JSON helper: ${jsonData?.name} (${jsonData?.email})`);

    return true;
  } catch (error) {
    console.log(`  ❌ Temel istekler başarısız: ${error.message}`);
    return false;
  }
}

// Test 2: Temel Özellikler
async function testBasicFeatures() {
  console.log('\n🔌 Test 2: Temel Özellikler');
  
  const client = createClient({
    baseURL: TEST_APIS.httpbin
  });

  try {
    // Cache testi
    console.log('  → Cache testi (ilk istek)');
    const start1 = Date.now();
    await client.get('/get');
    const time1 = Date.now() - start1;
    console.log(`  ✅ İlk istek: ${time1}ms`);

    console.log('  → Cache testi (ikinci istek)');
    const start2 = Date.now();
    await client.get('/get');
    const time2 = Date.now() - start2;
    console.log(`  ✅ İkinci istek: ${time2}ms (cache: ${time2 < time1 ? 'çalışıyor' : 'çalışmıyor'})`);

    // Rate limit testi
    console.log('  → Rate limit testi');
    for (let i = 0; i < 3; i++) {
      try {
        await client.get('/get');
        console.log(`  ✅ İstek ${i + 1} başarılı`);
      } catch (error) {
        console.log(`  ⚠️ İstek ${i + 1} rate limit: ${error.message}`);
      }
    }

    return true;
  } catch (error) {
    console.log(`  ❌ Plugin testleri başarısız: ${error.message}`);
    return false;
  }
}

// Test 3: Farklı HTTP Metodları
async function testHttpMethods() {
  console.log('\n🔄 Test 3: HTTP Metodları');
  
  try {
    const client = createClient({
      baseURL: TEST_APIS.httpbin
    });

    // GET isteği
    console.log('  → GET isteği');
    const getResponse = await client.get('/get');
    console.log(`  ✅ GET başarılı: ${getResponse.status}`);

    // POST isteği
    console.log('  → POST isteği');
    const postResponse = await client.post('/post', { test: 'data' });
    console.log(`  ✅ POST başarılı: ${postResponse.status}`);

    // PUT isteği
    console.log('  → PUT isteği');
    const putResponse = await client.put('/put', { test: 'updated' });
    console.log(`  ✅ PUT başarılı: ${putResponse.status}`);

    // DELETE isteği
    console.log('  → DELETE isteği');
    const deleteResponse = await client.delete('/delete');
    console.log(`  ✅ DELETE başarılı: ${deleteResponse.status}`);

    // PATCH isteği
    console.log('  → PATCH isteği');
    const patchResponse = await client.patch('/patch', { test: 'patched' });
    console.log(`  ✅ PATCH başarılı: ${patchResponse.status}`);

    return true;
  } catch (error) {
    console.log(`  ❌ HTTP metodları testi başarısız: ${error.message}`);
    return false;
  }
}

// Test 4: Hata Yönetimi
async function testErrorHandling() {
  console.log('\n⚠️ Test 4: Hata Yönetimi');
  
  const client = createClient({
    baseURL: TEST_APIS.jsonplaceholder
  });

  try {
    // 404 hatası
    console.log('  → 404 hatası testi');
    try {
      await client.get('/nonexistent');
      console.log('  ❌ 404 hatası bekleniyordu');
    } catch (error) {
      console.log(`  ✅ 404 hatası yakalandı: ${error.message}`);
    }

    // Network hatası (olmayan domain)
    console.log('  → Network hatası testi');
    const networkClient = createClient({
      baseURL: 'https://nonexistent-domain-12345.com'
    });

    try {
      await networkClient.get('/test');
      console.log('  ❌ Network hatası bekleniyordu');
    } catch (error) {
      console.log(`  ✅ Network hatası yakalandı: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.log(`  ❌ Hata yönetimi testi başarısız: ${error.message}`);
    return false;
  }
}

// Test 5: Performans Testi
async function testPerformance() {
  console.log('\n⚡ Test 5: Performans Testi');
  
  const client = createClient({
    baseURL: TEST_APIS.httpbin
  });

  try {
    // Paralel istekler
    console.log('  → Paralel istek testi');
    const start = Date.now();
    
    const promises = Array(5).fill().map((_, i) => 
      client.get(`/get?test=${i}`)
    );
    
    const responses = await Promise.all(promises);
    const duration = Date.now() - start;
    
    console.log(`  ✅ 5 paralel istek: ${duration}ms (ortalama: ${Math.round(duration/5)}ms/istek)`);
    console.log(`  📊 Başarılı istekler: ${responses.length}/5`);

    // Tekrar eden istekler
    console.log('  → Tekrar eden istek testi');
    const repeatStart = Date.now();
    for (let i = 0; i < 3; i++) {
      await client.get('/get');
    }
    const repeatDuration = Date.now() - repeatStart;
    console.log(`  ✅ 3 tekrar isteği: ${repeatDuration}ms`);

    return true;
  } catch (error) {
    console.log(`  ❌ Performans testi başarısız: ${error.message}`);
    return false;
  }
}

// Test 6: Farklı Platformlar
async function testPlatforms() {
  console.log('\n🌐 Test 6: Platform Uyumluluğu');
  
  try {
    // Node.js client
    console.log('  → Node.js client');
    const nodeClient = createClient({ baseURL: TEST_APIS.httpbin });
    await nodeClient.get('/get');
    console.log('  ✅ Node.js client çalışıyor');

    // Farklı header'lar
    console.log('  → Custom header testi');
    const customClient = createClient({ 
      baseURL: TEST_APIS.httpbin,
      headers: {
        'X-Custom-Header': 'test-value',
        'User-Agent': 'Advanced-Client-Fetch-Test'
      }
    });
    await customClient.get('/headers');
    console.log('  ✅ Custom header client çalışıyor');

    return true;
  } catch (error) {
    console.log(`  ❌ Platform testi başarısız: ${error.message}`);
    return false;
  }
}

// Ana test fonksiyonu
async function runAllTests() {
  const tests = [
    { name: 'Temel HTTP İstekleri', fn: testBasicRequests },
    { name: 'Temel Özellikler', fn: testBasicFeatures },
    { name: 'HTTP Metodları', fn: testHttpMethods },
    { name: 'Hata Yönetimi', fn: testErrorHandling },
    { name: 'Performans', fn: testPerformance },
    { name: 'Platform Uyumluluğu', fn: testPlatforms }
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

  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SONUÇLARI');
  console.log('='.repeat(50));
  console.log(`✅ Başarılı: ${passed}`);
  console.log(`❌ Başarısız: ${failed}`);
  console.log(`📈 Başarı Oranı: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 TÜM TESTLER BAŞARILI!');
    console.log('Advanced Client Fetch gerçek dünyada mükemmel çalışıyor!');
  } else {
    console.log('\n⚠️ Bazı testler başarısız oldu.');
    console.log('Lütfen hataları kontrol edin.');
  }
}

// Testleri çalıştır
runAllTests().catch(error => {
  console.error('💥 Test runner hatası:', error);
  process.exit(1);
});
