const { createClient } = require('advanced-client-fetch');

async function test() {
  try {
    const client = createClient({
      baseURL: 'https://httpbin.org'
    });
    
    const response = await client.get('/get');
    console.log('✅ Test başarılı!');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
  } catch (error) {
    console.error('❌ Test başarısız:', error.message);
  }
}

test();
