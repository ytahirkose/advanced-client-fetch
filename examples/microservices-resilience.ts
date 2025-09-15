/**
 * Microservices Resilience with HyperHTTP
 * 
 * This example demonstrates how HyperHTTP provides production-ready
 * resilience features for microservices communication.
 */

import { createNodeClient } from '@hyperhttp/presets/node';
import { retry, cache, circuitBreaker, rateLimit, dedupe, metrics } from 'hyperhttp-plugins';

// ============================================================================
// 1. USER SERVICE CLIENT
// ============================================================================

const userService = createNodeClient({
  baseURL: 'https://user-service.internal',
  agent: {
    keepAlive: true,
    maxSockets: 100
  },
  middleware: [
    // Retry with exponential backoff
    retry({
      retries: 3,
      minDelay: 100,
      maxDelay: 2000,
      factor: 2,
      jitter: true,
      respectRetryAfter: true,
      retryAfterCap: 30000,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      retryOn: (error) => {
        // Retry on network errors and 5xx status codes
        if (error.status >= 500) return true;
        if (error.name === 'NetworkError') return true;
        return false;
      },
      onRetry: (info) => {
        console.log(`User service retry attempt ${info.attempt} after ${info.delay}ms`);
      }
    }),
    
    // Circuit breaker for fault tolerance
    circuitBreaker({
      failureThreshold: 5,
      windowMs: 60000, // 1 minute
      resetTimeout: 30000, // 30 seconds
      keyGenerator: (request) => {
        // Per-host circuit breaker
        const url = new URL(request.url);
        return `user-service:${url.hostname}`;
      },
      onStateChange: (state, key) => {
        console.log(`User service circuit breaker state changed to ${state} for ${key}`);
      }
    }),
    
    // Rate limiting
    rateLimit({
      maxRequests: 1000,
      windowMs: 60000, // 1 minute
      algorithm: 'sliding-window',
      keyGenerator: (request) => {
        // Per-service rate limiting
        return 'user-service';
      }
    }),
    
    // Request deduplication
    dedupe({
      timeout: 30000, // 30 seconds
      maxPending: 100,
      keyGenerator: (request) => {
        // Dedupe based on method, URL, and body hash
        const body = request.body ? JSON.stringify(request.body) : '';
        return `${request.method}:${request.url}:${body}`;
      }
    }),
    
    // Metrics collection
    metrics({
      collectSizes: true,
      collectTiming: true,
      collectRetries: true,
      collectCache: true,
      onMetric: (metric) => {
        console.log('User service metric:', metric);
      }
    })
  ]
});

// ============================================================================
// 2. ORDER SERVICE CLIENT
// ============================================================================

const orderService = createNodeClient({
  baseURL: 'https://order-service.internal',
  agent: {
    keepAlive: true,
    maxSockets: 50
  },
  middleware: [
    retry({
      retries: 5, // More retries for critical service
      minDelay: 200,
      maxDelay: 5000,
      factor: 1.5,
      jitter: true,
      respectRetryAfter: true
    }),
    
    circuitBreaker({
      failureThreshold: 3, // Lower threshold for critical service
      windowMs: 30000,
      resetTimeout: 60000,
      keyGenerator: (request) => `order-service:${new URL(request.url).hostname}`
    }),
    
    rateLimit({
      maxRequests: 500,
      windowMs: 60000,
      algorithm: 'token-bucket'
    }),
    
    cache({
      ttl: 300000, // 5 minutes
      respectHeaders: true,
      staleWhileRevalidate: true,
      keyGenerator: (request) => {
        // Only cache GET requests
        if (request.method === 'GET') {
          return `order-cache:${request.url}`;
        }
        return null;
      }
    })
  ]
});

// ============================================================================
// 3. PAYMENT SERVICE CLIENT
// ============================================================================

const paymentService = createNodeClient({
  baseURL: 'https://payment-service.internal',
  agent: {
    keepAlive: true,
    maxSockets: 20
  },
  middleware: [
    retry({
      retries: 2, // Fewer retries for payment service
      minDelay: 500,
      maxDelay: 2000,
      factor: 2,
      jitter: true,
      retryOn: (error) => {
        // Only retry on network errors, not on business logic errors
        return error.name === 'NetworkError' || error.status >= 500;
      }
    }),
    
    circuitBreaker({
      failureThreshold: 2, // Very low threshold for payment service
      windowMs: 120000, // 2 minutes
      resetTimeout: 300000, // 5 minutes
      keyGenerator: (request) => `payment-service:${new URL(request.url).hostname}`
    }),
    
    rateLimit({
      maxRequests: 100, // Lower rate limit for payment service
      windowMs: 60000,
      algorithm: 'sliding-window'
    }),
    
    timeout({
      timeout: 10000, // 10 second timeout for payment service
      timeoutPerAttempt: 5000
    })
  ]
});

// ============================================================================
// 4. BUSINESS LOGIC WITH RESILIENCE
// ============================================================================

class OrderService {
  private userService = userService;
  private orderService = orderService;
  private paymentService = paymentService;

  async createOrder(userId: string, items: any[]) {
    try {
      // 1. Validate user (with retry and circuit breaker)
      const user = await this.userService.get(`/users/${userId}`);
      if (!user.ok) {
        throw new Error('User not found');
      }

      // 2. Create order (with retry and circuit breaker)
      const order = await this.orderService.post('/orders', {
        userId,
        items,
        status: 'pending'
      });

      // 3. Process payment (with retry and circuit breaker)
      const payment = await this.paymentService.post('/payments', {
        orderId: order.data.id,
        amount: order.data.total,
        currency: 'USD'
      });

      // 4. Update order status
      const updatedOrder = await this.orderService.put(`/orders/${order.data.id}`, {
        status: 'paid',
        paymentId: payment.data.id
      });

      return updatedOrder.data;

    } catch (error) {
      console.error('Order creation failed:', error);
      
      // Handle different types of failures
      if (error.name === 'CircuitBreakerError') {
        throw new Error('Service temporarily unavailable');
      } else if (error.name === 'RateLimitError') {
        throw new Error('Too many requests, please try again later');
      } else if (error.name === 'TimeoutError') {
        throw new Error('Request timed out, please try again');
      } else {
        throw error;
      }
    }
  }

  async getOrder(orderId: string) {
    try {
      // This request will be cached and deduplicated
      const response = await this.orderService.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Order fetch failed:', error);
      throw error;
    }
  }

  async getUserOrders(userId: string) {
    try {
      // This request will be cached
      const response = await this.orderService.get(`/orders?userId=${userId}`);
      return response.data;
    } catch (error) {
      console.error('User orders fetch failed:', error);
      throw error;
    }
  }
}

// ============================================================================
// 5. HEALTH CHECK AND MONITORING
// ============================================================================

class ServiceHealthChecker {
  private services = {
    user: userService,
    order: orderService,
    payment: paymentService
  };

  async checkAllServices() {
    const health = {};
    
    for (const [name, service] of Object.entries(this.services)) {
      try {
        const start = Date.now();
        const response = await service.get('/health');
        const duration = Date.now() - start;
        
        health[name] = {
          status: 'healthy',
          responseTime: duration,
          statusCode: response.status
        };
      } catch (error) {
        health[name] = {
          status: 'unhealthy',
          error: error.message,
          errorType: error.name
        };
      }
    }
    
    return health;
  }

  async getMetrics() {
    // Collect metrics from all services
    const metrics = {};
    
    for (const [name, service] of Object.entries(this.services)) {
      // In a real implementation, you would collect metrics
      // from the metrics plugin
      metrics[name] = {
        requests: 0,
        retries: 0,
        cacheHits: 0,
        circuitBreakerTrips: 0,
        averageResponseTime: 0
      };
    }
    
    return metrics;
  }
}

// ============================================================================
// 6. GRACEFUL DEGRADATION
// ============================================================================

class ResilientOrderService extends OrderService {
  async createOrder(userId: string, items: any[]) {
    try {
      return await super.createOrder(userId, items);
    } catch (error) {
      // Graceful degradation: create order without payment
      if (error.message.includes('payment')) {
        console.warn('Payment service unavailable, creating order without payment');
        
        const order = await this.orderService.post('/orders', {
          userId,
          items,
          status: 'pending_payment'
        });
        
        return order.data;
      }
      
      throw error;
    }
  }

  async getOrderWithFallback(orderId: string) {
    try {
      return await this.getOrder(orderId);
    } catch (error) {
      // Fallback to cache or database
      console.warn('Order service unavailable, using fallback');
      
      // In a real implementation, you would fallback to a database
      // or cached data
      return {
        id: orderId,
        status: 'unknown',
        message: 'Service temporarily unavailable'
      };
    }
  }
}

// ============================================================================
// 7. USAGE EXAMPLE
// ============================================================================

async function example() {
  const orderService = new ResilientOrderService();
  const healthChecker = new ServiceHealthChecker();
  
  try {
    // Check service health
    const health = await healthChecker.checkAllServices();
    console.log('Service health:', health);
    
    // Create order with resilience
    const order = await orderService.createOrder('user123', [
      { id: 'item1', quantity: 2, price: 10.99 },
      { id: 'item2', quantity: 1, price: 5.99 }
    ]);
    
    console.log('Order created:', order);
    
    // Get order with fallback
    const orderDetails = await orderService.getOrderWithFallback(order.id);
    console.log('Order details:', orderDetails);
    
  } catch (error) {
    console.error('Order service error:', error);
  }
}

export default example;
