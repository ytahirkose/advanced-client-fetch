// Test ana paket
console.log('Testing advanced-client-fetch...');

try {
  const acf = require('advanced-client-fetch');
  console.log('✅ Ana paket yüklendi!');
  console.log('📦 Mevcut exportlar:', Object.keys(acf).slice(0, 10));
  
  // Test client oluşturma
  if (acf.createClient) {
    console.log('✅ createClient fonksiyonu mevcut');
  }
  
  // Test plugin'ler
  if (acf.retryPlugin) {
    console.log('✅ retryPlugin mevcut');
  }
  
  if (acf.cachePlugin) {
    console.log('✅ cachePlugin mevcut');
  }
  
  // Test preset'ler
  if (acf.createNodeClient) {
    console.log('✅ createNodeClient mevcut');
  }
  
  if (acf.createEdgeClient) {
    console.log('✅ createEdgeClient mevcut');
  }
  
  console.log('🎉 Ana paket başarıyla çalışıyor!');
  
} catch (error) {
  console.error('❌ Hata:', error.message);
}
