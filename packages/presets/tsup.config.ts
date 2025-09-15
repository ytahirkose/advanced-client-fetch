import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    node: 'src/node.ts',
    edge: 'src/edge.ts',
    browser: 'src/browser.ts',
    deno: 'src/deno.ts',
    bun: 'src/bun.ts',
  },
  format: ['esm', 'cjs'],
  dts: false, // DTS handled by core package
  sourcemap: false,          // sourcemap üretme → dosya boyutunu artırır
  clean: true,
  splitting: true, // Enable code splitting for better tree shaking
  minify: 'terser',          // esbuild yerine terser
  terserOptions: {
    compress: {
      passes: 3,             // daha agresif optimizasyon (varsayılan 1)
      drop_console: true,    // console.log kaldır
      drop_debugger: true,   // debugger kaldır
      pure_getters: true,    // getter'lar yan etkisiz sayılır
      unsafe: true           // daha agresif (ama dikkat)
    },
    mangle: {
      toplevel: true,        // global seviyedeki isimleri bile kısalt
    },
    format: {
      comments: false        // yorumları sil
    }
  },
  
  external: [
    '@advanced-client-fetch/core', 
    '@advanced-client-fetch/plugins',
    // Mark Node.js built-ins as external
    'fs',
    'path',
    'url',
    'util',
    'crypto',
    'stream',
    'events',
    'buffer',
    'os',
    'http',
    'https',
    'zlib'
  ],
        esbuildOptions(options) {
          options.conditions = ['node', 'import'];
          options.target = 'es2020'; // Modern target for better performance
          options.define = {
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
          };
          // Ultra aggressive optimization for smallest bundle size
          options.minify = true;
          options.minifyIdentifiers = true;
          options.minifySyntax = true;
          options.minifyWhitespace = true;
          options.drop = ['console', 'debugger'];
          options.treeShaking = true;
          options.legalComments = 'none';
          options.charset = 'ascii';
          options.keepNames = false;
          options.mangleProps = /^_/;
          // Additional aggressive optimizations
          options.ignoreAnnotations = true;
          options.pure = ['console.log', 'console.info', 'console.debug'];
          options.resolveExtensions = ['.js', '.ts', '.json'];
          options.mainFields = ['module', 'main'];
          options.conditions = ['node', 'import', 'require'];
        },
  // Minimal banner for production
  banner: {
    js: '/* ACF-PR */'
  },
  // Platform-specific builds
  platform: 'node',
  // Bundle analysis
  metafile: true,
  // Optimize for production
  env: {
    NODE_ENV: 'production'
  }
});