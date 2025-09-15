import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/__tests__/**',
        '**/__mocks__/**',
        '**/coverage/**',
        '**/.nyc_output/**',
        '**/test/**',
        '**/tests/**',
        '**/spec/**',
        '**/specs/**',
        '**/*.d.ts',
        '**/types.ts',
        '**/index.ts'
      ]
    }
  }
});