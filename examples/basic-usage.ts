/**
 * Basic usage example for HyperHTTP
 */

import { createClient } from '../packages/core/dist/index.js';
import { retry, timeout } from '../packages/plugins/dist/index.js';

// Create a basic client
const client = createClient({
  baseURL: 'https://jsonplaceholder.typicode.com',
  headers: {
    'User-Agent': 'hyperhttp/0.1.0',
  },
  middleware: [
    retry({ retries: 3, minDelay: 100, maxDelay: 2000 }),
    timeout({ timeout: 10000 }),
  ],
});

async function main() {
  try {
    console.log('🚀 Testing HyperHTTP...');
    
    // GET request
    const users = await client.get('/users');
    console.log('✅ GET /users:', users.length, 'users');
    
    // POST request
    const newPost = await client.post('/posts', {
      title: 'HyperHTTP Test',
      body: 'This is a test post',
      userId: 1,
    });
    console.log('✅ POST /posts:', newPost.id);
    
    // JSON helper
    const post = await client.json<{ id: number; title: string }>('/posts/1');
    console.log('✅ JSON helper:', post.title);
    
    // Text helper
    const text = await client.text('/posts/1');
    console.log('✅ Text helper:', text.length, 'characters');
    
    console.log('🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}