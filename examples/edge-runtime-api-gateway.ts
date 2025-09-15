/**
 * Edge Runtime API Gateway with HyperHTTP
 * 
 * This example demonstrates how HyperHTTP works in edge runtimes
 * like Cloudflare Workers, Vercel Edge Functions, and Deno Deploy.
 */

import { createEdgeClient } from '@hyperhttp/presets/edge';
import { retry, cache, dedupe, rateLimit } from 'hyperhttp-plugins';

// ============================================================================
// 1. CLOUDFLARE WORKERS
// ============================================================================

// cloudflare-worker.js
export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext) {
    // Create edge-optimized client
    const client = createEdgeClient({
      baseURL: 'https://api.example.com',
      retry: { retries: 2, jitter: true },
      cache: { ttl: 300000 }, // 5 minutes
      dedupe: true,
      rateLimit: {
        maxRequests: 1000,
        windowMs: 60000
      }
    });

    try {
      // Handle different routes
      const url = new URL(request.url);
      
      if (url.pathname.startsWith('/api/users')) {
        return await handleUsersRoute(client, request);
      } else if (url.pathname.startsWith('/api/orders')) {
        return await handleOrdersRoute(client, request);
      } else if (url.pathname.startsWith('/api/products')) {
        return await handleProductsRoute(client, request);
      } else {
        return new Response('Not Found', { status: 404 });
      }
    } catch (error) {
      console.error('API Gateway error:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }
};

async function handleUsersRoute(client: any, request: Request) {
  const url = new URL(request.url);
  const userId = url.pathname.split('/').pop();
  
  if (request.method === 'GET') {
    if (userId) {
      // Get specific user
      const response = await client.get(`/users/${userId}`);
      return new Response(JSON.stringify(response.data), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // Get all users
      const response = await client.get('/users');
      return new Response(JSON.stringify(response.data), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } else if (request.method === 'POST') {
    // Create user
    const body = await request.json();
    const response = await client.post('/users', body);
    return new Response(JSON.stringify(response.data), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return new Response('Method Not Allowed', { status: 405 });
}

async function handleOrdersRoute(client: any, request: Request) {
  const url = new URL(request.url);
  const orderId = url.pathname.split('/').pop();
  
  if (request.method === 'GET') {
    if (orderId) {
      // Get specific order
      const response = await client.get(`/orders/${orderId}`);
      return new Response(JSON.stringify(response.data), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // Get orders with query parameters
      const query = url.searchParams.toString();
      const response = await client.get(`/orders?${query}`);
      return new Response(JSON.stringify(response.data), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  return new Response('Method Not Allowed', { status: 405 });
}

async function handleProductsRoute(client: any, request: Request) {
  const url = new URL(request.url);
  const productId = url.pathname.split('/').pop();
  
  if (request.method === 'GET') {
    if (productId) {
      // Get specific product (cached)
      const response = await client.get(`/products/${productId}`);
      return new Response(JSON.stringify(response.data), {
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300' // 5 minutes
        }
      });
    } else {
      // Get products with search
      const query = url.searchParams.toString();
      const response = await client.get(`/products?${query}`);
      return new Response(JSON.stringify(response.data), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  return new Response('Method Not Allowed', { status: 405 });
}

// ============================================================================
// 2. VERCEL EDGE FUNCTIONS
// ============================================================================

// app/api/users/route.ts
export const runtime = 'edge';

const client = createEdgeClient({
  baseURL: process.env.API_BASE_URL,
  retry: { retries: 3, jitter: true },
  cache: { ttl: 600000 }, // 10 minutes
  dedupe: true
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.toString();
    
    const response = await client.get(`/users?${query}`);
    
    return Response.json(response.data, {
      headers: {
        'Cache-Control': 'public, max-age=300',
        'CDN-Cache-Control': 'public, max-age=600'
      }
    });
  } catch (error) {
    console.error('Users API error:', error);
    return Response.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await client.post('/users', body);
    
    return Response.json(response.data, { status: 201 });
  } catch (error) {
    console.error('User creation error:', error);
    return Response.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

// ============================================================================
// 3. DENO DEPLOY
// ============================================================================

// main.ts
const client = createEdgeClient({
  baseURL: 'https://api.example.com',
  retry: { retries: 2 },
  cache: { ttl: 300000 },
  dedupe: true
});

Deno.serve(async (request: Request) => {
  const url = new URL(request.url);
  
  try {
    if (url.pathname.startsWith('/api/')) {
      // Proxy API requests
      const apiPath = url.pathname.replace('/api', '');
      const query = url.searchParams.toString();
      const fullPath = query ? `${apiPath}?${query}` : apiPath;
      
      const response = await client.request({
        url: fullPath,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        body: request.body
      });
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
    } else {
      // Serve static content
      return new Response('Hello from Deno Deploy!');
    }
  } catch (error) {
    console.error('Deno Deploy error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
});

// ============================================================================
// 4. BUN EDGE RUNTIME
// ============================================================================

// bun-edge.ts
const client = createEdgeClient({
  baseURL: 'https://api.example.com',
  retry: { retries: 3, jitter: true },
  cache: { ttl: 300000 },
  dedupe: true
});

Bun.serve({
  port: 3000,
  async fetch(request: Request) {
    const url = new URL(request.url);
    
    try {
      if (url.pathname.startsWith('/api/')) {
        // Handle API requests
        const apiPath = url.pathname.replace('/api', '');
        const query = url.searchParams.toString();
        const fullPath = query ? `${apiPath}?${query}` : apiPath;
        
        const response = await client.request({
          url: fullPath,
          method: request.method,
          headers: Object.fromEntries(request.headers.entries()),
          body: request.body
        });
        
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
      } else {
        // Serve static content
        return new Response('Hello from Bun Edge!');
      }
    } catch (error) {
      console.error('Bun Edge error:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }
});

// ============================================================================
// 5. ADVANCED EDGE GATEWAY
// ============================================================================

class EdgeAPIGateway {
  private client = createEdgeClient({
    baseURL: 'https://api.example.com',
    retry: { retries: 2, jitter: true },
    cache: { ttl: 300000 },
    dedupe: true,
    rateLimit: {
      maxRequests: 1000,
      windowMs: 60000
    }
  });

  async handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    
    try {
      // Route to appropriate handler
      if (path.startsWith('/api/users')) {
        return await this.handleUsers(request);
      } else if (path.startsWith('/api/orders')) {
        return await this.handleOrders(request);
      } else if (path.startsWith('/api/products')) {
        return await this.handleProducts(request);
      } else if (path.startsWith('/api/search')) {
        return await this.handleSearch(request);
      } else {
        return new Response('Not Found', { status: 404 });
      }
    } catch (error) {
      console.error('Gateway error:', error);
      return this.handleError(error);
    }
  }

  private async handleUsers(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const userId = url.pathname.split('/').pop();
    
    if (request.method === 'GET') {
      if (userId) {
        const response = await this.client.get(`/users/${userId}`);
        return Response.json(response.data);
      } else {
        const query = url.searchParams.toString();
        const response = await this.client.get(`/users?${query}`);
        return Response.json(response.data);
      }
    } else if (request.method === 'POST') {
      const body = await request.json();
      const response = await this.client.post('/users', body);
      return Response.json(response.data, { status: 201 });
    }
    
    return new Response('Method Not Allowed', { status: 405 });
  }

  private async handleOrders(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const orderId = url.pathname.split('/').pop();
    
    if (request.method === 'GET') {
      if (orderId) {
        const response = await this.client.get(`/orders/${orderId}`);
        return Response.json(response.data);
      } else {
        const query = url.searchParams.toString();
        const response = await this.client.get(`/orders?${query}`);
        return Response.json(response.data);
      }
    }
    
    return new Response('Method Not Allowed', { status: 405 });
  }

  private async handleProducts(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const productId = url.pathname.split('/').pop();
    
    if (request.method === 'GET') {
      if (productId) {
        // This will be cached
        const response = await this.client.get(`/products/${productId}`);
        return Response.json(response.data, {
          headers: {
            'Cache-Control': 'public, max-age=300',
            'CDN-Cache-Control': 'public, max-age=600'
          }
        });
      } else {
        const query = url.searchParams.toString();
        const response = await this.client.get(`/products?${query}`);
        return Response.json(response.data);
      }
    }
    
    return new Response('Method Not Allowed', { status: 405 });
  }

  private async handleSearch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const query = url.searchParams.toString();
    
    if (request.method === 'GET') {
      // Search will be cached and deduplicated
      const response = await this.client.get(`/search?${query}`);
      return Response.json(response.data, {
        headers: {
          'Cache-Control': 'public, max-age=60', // 1 minute
          'CDN-Cache-Control': 'public, max-age=300' // 5 minutes
        }
      });
    }
    
    return new Response('Method Not Allowed', { status: 405 });
  }

  private handleError(error: any): Response {
    if (error.name === 'RateLimitError') {
      return new Response('Too Many Requests', { status: 429 });
    } else if (error.name === 'TimeoutError') {
      return new Response('Request Timeout', { status: 408 });
    } else if (error.name === 'NetworkError') {
      return new Response('Service Unavailable', { status: 503 });
    } else {
      return new Response('Internal Server Error', { status: 500 });
    }
  }
}

// ============================================================================
// 6. USAGE EXAMPLE
// ============================================================================

async function example() {
  const gateway = new EdgeAPIGateway();
  
  // Simulate requests
  const requests = [
    new Request('https://example.com/api/users'),
    new Request('https://example.com/api/users/123'),
    new Request('https://example.com/api/products'),
    new Request('https://example.com/api/search?q=typescript')
  ];
  
  for (const request of requests) {
    try {
      const response = await gateway.handleRequest(request);
      const data = await response.json();
      console.log('Response:', data);
    } catch (error) {
      console.error('Request failed:', error);
    }
  }
}

export default example;
