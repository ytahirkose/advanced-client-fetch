import { defineConfig } from "tsup";

const isProd = process.env.NODE_ENV === "production";

export default defineConfig({
  entry: {
    index: "src/index.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  splitting: true,
  sourcemap: !isProd,
  clean: true,
  minify: isProd,
  treeshake: {
    moduleSideEffects: false,
    propertyReadSideEffects: false,
    unknownGlobalSideEffects: false,
  },
  external: [],
  target: "es2022",
  outDir: "dist",
  platform: "neutral",
  tsconfig: "./tsconfig.json",
  esbuildOptions(options) {
    options.treeShaking = true;
    options.minifyIdentifiers = isProd;
    options.minifySyntax = isProd;
    options.minifyWhitespace = isProd;
  },
});