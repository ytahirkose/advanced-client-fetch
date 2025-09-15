/**
 * Platform Presets Example
 * 
 * This example shows how to use platform-specific presets
 * for different JavaScript runtimes.
 */

// Node.js
import { createNodeClient } from '@hyperhttp/presets';

const nodeClient = createNodeClient({
  baseURL: 'https://api.example.com',
  plugins: [
    // Node.js specific plugins
  ]
});

// Edge Runtime (Vercel, Cloudflare Workers)
import { createEdgeClient } from '@hyperhttp/presets';

const edgeClient = createEdgeClient({
  baseURL: 'https://api.example.com',
  plugins: [
    // Edge-specific plugins
  ]
});

// Browser
import { createBrowserClient } from '@hyperhttp/presets';

const browserClient = createBrowserClient({
  baseURL: 'https://api.example.com',
  plugins: [
    // Browser-specific plugins
  ]
});

// Deno
import { createDenoClient } from '@hyperhttp/presets';

const denoClient = createDenoClient({
  baseURL: 'https://api.example.com',
  plugins: [
    // Deno-specific plugins
  ]
});

// Bun
import { createBunClient } from '@hyperhttp/presets';

const bunClient = createBunClient({
  baseURL: 'https://api.example.com',
  plugins: [
    // Bun-specific plugins
  ]
});

async function platformExample() {
  try {
    // Use the appropriate client for your platform
    const response = await nodeClient.get('/users');
    console.log('Platform-specific response:', response.data);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the example
platformExample();
