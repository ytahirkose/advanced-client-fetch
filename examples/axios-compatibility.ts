/**
 * Axios compatibility example for HyperHTTP
 */

import { createAxiosInstance } from '../packages/axios-adapter/dist/index.js';
import { retry, timeout, cache } from '../packages/plugins/dist/index.js';

// Create axios-compatible instance
const axios = createAxiosInstance({
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 10000,
  headers: {
    'User-Agent': 'hyperhttp-axios/0.1.0',
  },
  middleware: [
    retry({ retries: 3 }),
    timeout({ timeout: 10000 }),
    cache({ ttl: 60000 }), // 1 minute cache
  ],
});

async function main() {
  try {
    console.log('🚀 Testing Axios Compatibility...');
    
    // GET request (axios style)
    const response = await axios.get('/users');
    console.log('✅ GET /users:', response.data.length, 'users');
    console.log('   Status:', response.status);
    console.log('   Headers:', Object.fromEntries(response.headers.entries()));
    
    // POST request (axios style)
    const postResponse = await axios.post('/posts', {
      title: 'HyperHTTP Axios Test',
      body: 'This is a test post using axios API',
      userId: 1,
    });
    console.log('✅ POST /posts:', postResponse.data.id);
    
    // Request with query parameters
    const queryResponse = await axios.get('/posts', {
      params: { userId: 1 },
    });
    console.log('✅ GET /posts?userId=1:', queryResponse.data.length, 'posts');
    
    // Request with custom headers
    const headerResponse = await axios.get('/posts/1', {
      headers: {
        'X-Custom-Header': 'test-value',
      },
    });
    console.log('✅ Custom headers:', headerResponse.data.title);
    
    // Error handling (axios style)
    try {
      await axios.get('/nonexistent');
    } catch (error: any) {
      console.log('✅ Error handling:', error.response?.status, error.message);
    }
    
    console.log('🎉 All axios compatibility tests passed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}