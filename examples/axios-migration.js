/**
 * Axios Migration Example
 * 
 * This example shows how to migrate from Axios to Advanced Client Fetch
 * using the Axios adapter for a smooth transition.
 */

import { createAxiosAdapter } from '@advanced-client-fetch/axios-adapter';
import { retry, cache, rateLimit } from '@advanced-client-fetch/plugins';

// Create Axios-compatible client
const axios = createAxiosAdapter({
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 5000,
  plugins: [
    retry({ retries: 3 }),
    cache({ ttl: 60000 }),
    rateLimit({ requests: 100, window: 60000 })
  ]
});

async function axiosMigrationExample() {
  try {
    // Same Axios API
    console.log('=== Axios-compatible API ===');
    
    // GET request (same as Axios)
    const response = await axios.get('/users');
    console.log('Users:', response.data.length);
    console.log('Status:', response.status);
    console.log('Headers:', response.headers);

    // POST request (same as Axios)
    const newPost = await axios.post('/posts', {
      title: 'My New Post',
      body: 'This is the content',
      userId: 1
    });
    console.log('Created post:', newPost.data.id);

    // Request with config (same as Axios)
    const config = {
      params: { userId: 1 },
      headers: { 'X-Custom-Header': 'MyValue' },
      timeout: 10000
    };
    
    const posts = await axios.get('/posts', config);
    console.log('Posts with config:', posts.data.length);

    // Error handling (same as Axios)
    try {
      await axios.get('/nonexistent');
    } catch (error) {
      console.log('Error status:', error.response?.status);
      console.log('Error message:', error.message);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the example
axiosMigrationExample();
