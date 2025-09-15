const { createAxiosAdapter, AxiosError } = require('advanced-client-fetch');

async function testAxiosCompatibility() {
  try {
    console.log('🚀 Testing Axios Compatibility...\n');
    
    // Create Axios-compatible client
    const axios = createAxiosAdapter({
      baseURL: 'https://httpbin.org',
      headers: {
        'User-Agent': 'advanced-client-fetch/1.0.11'
      }
    });
    
    // Test GET request (Axios style)
    console.log('1. Testing GET request (Axios style)...');
    const response = await axios.get('/get');
    console.log('✅ GET request successful');
    console.log('Status:', response.status);
    console.log('Data keys:', Object.keys(response.data || {}));
    console.log('Is Axios response:', response.config ? 'Yes' : 'No');
    
    // Test POST request (Axios style)
    console.log('\n2. Testing POST request (Axios style)...');
    const postData = { name: 'Advanced Client Fetch', version: '1.0.11' };
    const postResponse = await axios.post('/post', postData);
    console.log('✅ POST request successful');
    console.log('Status:', postResponse.status);
    console.log('Sent data:', postResponse.data?.json);
    
    // Test error handling (Axios style)
    console.log('\n3. Testing error handling (Axios style)...');
    try {
      await axios.get('/status/404');
    } catch (error) {
      console.log('✅ Error handling works');
      console.log('Is Axios error:', AxiosError.isAxiosError(error));
      console.log('Error status:', error.response?.status);
      console.log('Error message:', error.message);
    }
    
    // Test all HTTP methods
    console.log('\n4. Testing all HTTP methods...');
    await axios.put('/put', { method: 'PUT' });
    console.log('✅ PUT method works');
    
    await axios.patch('/patch', { method: 'PATCH' });
    console.log('✅ PATCH method works');
    
    await axios.delete('/delete');
    console.log('✅ DELETE method works');
    
    await axios.head('/get');
    console.log('✅ HEAD method works');
    
    await axios.options('/get');
    console.log('✅ OPTIONS method works');
    
    console.log('\n🎉 All Axios compatibility tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAxiosCompatibility();
