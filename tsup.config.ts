import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  minify: false,
  treeshake: true,
  external: ['@advanced-client-fetch/core', '@advanced-client-fetch/plugins', '@advanced-client-fetch/presets', '@advanced-client-fetch/axios-adapter'],
  esbuildOptions(options) {
    options.conditions = ['node', 'import'];
  },
});
