/**
 * Basic Usage Example
 * 
 * This example shows how to use HyperHTTP for basic HTTP requests
 * with different methods and options.
 */

import { createClient } from '@hyperhttp/core';
import { retry, cache, rateLimit } from '@hyperhttp/plugins';

// Create a client with plugins
const client = createClient({
  baseURL: 'https://jsonplaceholder.typicode.com',
  plugins: [
    retry({ retries: 3 }),
    cache({ ttl: 60000 }),
    rateLimit({ requests: 100, window: 60000 })
  ]
});

async function basicExample() {
  try {
    // GET request
    console.log('=== GET Request ===');
    const users = await client.get('/users');
    console.log('Users:', users.data.length);

    // GET with query parameters
    console.log('\n=== GET with Query Params ===');
    const posts = await client.get('/posts', {
      params: { userId: 1, _limit: 5 }
    });
    console.log('Posts:', posts.data.length);

    // POST request
    console.log('\n=== POST Request ===');
    const newPost = await client.post('/posts', {
      title: 'My New Post',
      body: 'This is the content of my new post',
      userId: 1
    });
    console.log('Created post:', newPost.data.id);

    // PUT request
    console.log('\n=== PUT Request ===');
    const updatedPost = await client.put('/posts/1', {
      id: 1,
      title: 'Updated Post Title',
      body: 'Updated content',
      userId: 1
    });
    console.log('Updated post:', updatedPost.data.title);

    // PATCH request
    console.log('\n=== PATCH Request ===');
    const patchedPost = await client.patch('/posts/1', {
      title: 'Patched Title'
    });
    console.log('Patched post:', patchedPost.data.title);

    // DELETE request
    console.log('\n=== DELETE Request ===');
    await client.delete('/posts/1');
    console.log('Post deleted successfully');

    // Request with custom headers
    console.log('\n=== Request with Headers ===');
    const response = await client.get('/users/1', {
      headers: {
        'X-Custom-Header': 'MyValue',
        'Accept': 'application/json'
      }
    });
    console.log('User with custom headers:', response.data.name);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the example
basicExample();
