/**
 * CORS + Cookie Authentication Solution
 * 
 * This example demonstrates how Advanced Client Fetch solves the common CORS + cookie
 * authentication problem in frontend development.
 */

// ============================================================================
// 1. DEVELOPMENT SETUP (Vite Proxy)
// ============================================================================

// vite.config.ts
export const viteConfig = {
  server: {
    proxy: {
      '/api': {
        target: 'https://api.company.com',
        changeOrigin: true,
        configure: (proxy, options) => {
          // Advanced Client Fetch handles cookie forwarding automatically
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // Rewrite Set-Cookie headers for localhost
            const setCookieHeaders = proxyRes.headers['set-cookie'];
            if (setCookieHeaders) {
              const rewritten = setCookieHeaders.map(cookie => {
                return cookie
                  .replace(/Domain=api\.company\.com/gi, 'Domain=localhost')
                  .replace(/; Secure/gi, '') // Remove Secure for localhost
                  .replace(/SameSite=Strict/gi, 'SameSite=Lax'); // Relax SameSite
              });
              proxyRes.headers['set-cookie'] = rewritten;
            }
          });
        }
      }
    }
  }
};

// ============================================================================
// 2. FRONTEND CLIENT SETUP
// ============================================================================

import { createBrowserClient } from '@advanced-client-fetch/presets/browser';

// Create client with automatic cookie management
const apiClient = createBrowserClient({
  baseURL: '/api', // Proxy through same origin
  cookies: true,   // Automatic cookie management
  credentials: 'include', // Send cookies with requests
  cors: true,      // Handle CORS properly
  middleware: [
    // Additional middleware can be added here
  ]
});

// ============================================================================
// 3. AUTHENTICATION FLOW
// ============================================================================

class AuthService {
  private client = apiClient;

  async login(email: string, password: string) {
    try {
      // Login request - cookies will be automatically set
      const response = await this.client.post('/auth/login', {
        email,
        password
      });

      // Advanced Client Fetch automatically handles:
      // - Set-Cookie header parsing
      // - Cookie storage
      // - Cookie sending on subsequent requests
      
      return response.data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async getProfile() {
    try {
      // Profile request - cookies will be automatically sent
      const response = await this.client.get('/auth/profile');
      
      // No need to manually handle cookies!
      // Advanced Client Fetch does it automatically
      
      return response.data;
    } catch (error) {
      console.error('Profile fetch failed:', error);
      throw error;
    }
  }

  async logout() {
    try {
      // Logout request
      await this.client.post('/auth/logout');
      
      // Advanced Client Fetch will automatically clear cookies
      // when the server responds with Set-Cookie: auth_token=; Max-Age=0
      
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }
}

// ============================================================================
// 4. REACT HOOK INTEGRATION
// ============================================================================

import { useState, useEffect } from 'react';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const authService = new AuthService();

  useEffect(() => {
    // Check if user is already authenticated
    authService.getProfile()
      .then(user => {
        setUser(user);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const user = await authService.login(email, password);
      setUser(user);
      return user;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return { user, loading, login, logout };
}

// ============================================================================
// 5. ADVANCED COOKIE MANAGEMENT
// ============================================================================

import { createCookieJar, createCookieMiddleware } from '@advanced-client-fetch/core';

class AdvancedAuthService {
  private client = apiClient;
  private cookieJar = createCookieJar();

  constructor() {
    // Add custom cookie middleware
    this.client = createBrowserClient({
      baseURL: '/api',
      cookies: true,
      credentials: 'include',
      middleware: [
        createCookieMiddleware(this.cookieJar)
      ]
    });
  }

  async getAuthToken() {
    // Get specific cookie
    const token = this.cookieJar.get('auth_token');
    return token?.value;
  }

  async setAuthToken(token: string) {
    // Set specific cookie
    this.cookieJar.set({
      name: 'auth_token',
      value: token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false, // false for localhost
      sameSite: 'lax'
    });
  }

  async clearAuthToken() {
    // Clear specific cookie
    this.cookieJar.delete('auth_token', 'localhost', '/');
  }

  async getAllCookies() {
    // Get all cookies
    return this.cookieJar.getAll();
  }
}

// ============================================================================
// 6. PRODUCTION NGINX CONFIGURATION
// ============================================================================

export const nginxConfig = `
# nginx.conf
server {
    listen 80;
    server_name localhost;

    # Proxy API requests
    location /api/ {
        proxy_pass https://api.company.com/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Handle cookies
        proxy_cookie_domain api.company.com localhost;
        proxy_cookie_path / /;
        
        # CORS headers
        add_header Access-Control-Allow-Origin $http_origin;
        add_header Access-Control-Allow-Credentials true;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With";
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin $http_origin;
            add_header Access-Control-Allow-Credentials true;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With";
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type "text/plain; charset=utf-8";
            add_header Content-Length 0;
            return 204;
        }
    }
}
`;

// ============================================================================
// 7. USAGE EXAMPLE
// ============================================================================

async function example() {
  const authService = new AuthService();
  
  try {
    // Login - cookies are automatically handled
    const user = await authService.login('user@example.com', 'password');
    console.log('Logged in:', user);
    
    // Get profile - cookies are automatically sent
    const profile = await authService.getProfile();
    console.log('Profile:', profile);
    
    // Logout - cookies are automatically cleared
    await authService.logout();
    console.log('Logged out');
    
  } catch (error) {
    console.error('Authentication error:', error);
  }
}

export default example;
