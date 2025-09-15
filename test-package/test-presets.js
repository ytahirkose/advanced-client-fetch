const { 
  createNodeClient, 
  createEdgeClient, 
  createBrowserClient, 
  createDenoClient, 
  createBunClient 
} = require('advanced-client-fetch');

async function testPlatformPresets() {
  try {
    console.log('🚀 Testing Platform Presets...\n');
    
    // Test Node.js client
    console.log('1. Testing Node.js client...');
    const nodeClient = createNodeClient({
      baseURL: 'https://httpbin.org'
    });
    
    const nodeResponse = await nodeClient.get('/get');
    console.log('✅ Node.js client works');
    console.log('Status:', nodeResponse.status);
    
    // Test Edge client
    console.log('\n2. Testing Edge client...');
    const edgeClient = createEdgeClient({
      baseURL: 'https://httpbin.org'
    });
    
    const edgeResponse = await edgeClient.get('/get');
    console.log('✅ Edge client works');
    console.log('Status:', edgeResponse.status);
    
    // Test Browser client
    console.log('\n3. Testing Browser client...');
    const browserClient = createBrowserClient({
      baseURL: 'https://httpbin.org'
    });
    
    const browserResponse = await browserClient.get('/get');
    console.log('✅ Browser client works');
    console.log('Status:', browserResponse.status);
    
    // Test Deno client
    console.log('\n4. Testing Deno client...');
    const denoClient = createDenoClient({
      baseURL: 'https://httpbin.org'
    });
    
    const denoResponse = await denoClient.get('/get');
    console.log('✅ Deno client works');
    console.log('Status:', denoResponse.status);
    
    // Test Bun client
    console.log('\n5. Testing Bun client...');
    const bunClient = createBunClient({
      baseURL: 'https://httpbin.org'
    });
    
    const bunResponse = await bunClient.get('/get');
    console.log('✅ Bun client works');
    console.log('Status:', bunResponse.status);
    
    console.log('\n🎉 All platform presets work!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPlatformPresets();
