import { defineConfig } from "tsup";

const isProd = process.env.NODE_ENV === "production";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    lite: "src/lite.ts",
    edge: "src/presets/edge.ts",
    node: "src/presets/node.ts",
  },
  format: ["esm", "cjs"],
  dts: false,
  splitting: true,
  sourcemap: !isProd,
  clean: true,
  minify: isProd,
  treeshake: true,
  external: ['node:stream', 'node:http', 'node:https', 'node:util', 'node-fetch', 'undici'],
  target: "es2022",
  outDir: "dist",
  platform: "neutral",
  tsconfig: "./tsconfig.json",
  define: {
    __DEV__: JSON.stringify(!isProd),
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV ?? "development"),
  },
});
