import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: false,
  clean: true,
  splitting: false,
  minify: 'terser',
  terserOptions: {
    compress: {
      passes: 3,
      drop_console: true,
      drop_debugger: true,
      pure_getters: true,
      unsafe: true
    },
    mangle: {
      toplevel: true,
    },
    format: {
      comments: false
    }
  },
  treeshake: true,
  external: [
    '@advanced-client-fetch/core',
    '@advanced-client-fetch/plugins',
    '@advanced-client-fetch/presets',
    '@advanced-client-fetch/axios-adapter'
  ],
  esbuildOptions(options) {
    options.conditions = ['node', 'import'];
    options.target = 'es2020';
    options.define = {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
    };
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
    options.ignoreAnnotations = true;
    options.pure = ['console.log', 'console.info', 'console.debug'];
    options.resolveExtensions = ['.js', '.ts', '.json'];
    options.mainFields = ['module', 'main'];
    options.conditions = ['node', 'import', 'require'];
  },
  banner: {
    js: '/* ACF */'
  },
  platform: 'node',
  metafile: true,
  env: {
    NODE_ENV: 'production'
  }
});