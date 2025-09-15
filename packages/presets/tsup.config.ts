import { defineConfig } from "tsup";

const isProd = process.env.NODE_ENV === "production";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    edge: "src/edge.ts",
    node: "src/node.ts",
    browser: "src/browser.ts",
    deno: "src/deno.ts",
    bun: "src/bun.ts",
  },
  format: ["esm", "cjs"],
  dts: false,
  splitting: true,
  sourcemap: !isProd,
  clean: true,
  minify: isProd,
  treeshake: true,
  external: ["hyperhttp-core", "hyperhttp-plugins"],
  target: "es2022",
  outDir: "dist",
  platform: "neutral",
  tsconfig: "./tsconfig.json",
});
