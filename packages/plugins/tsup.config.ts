import { defineConfig } from "tsup";

const isProd = process.env.NODE_ENV === "production";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    retry: "src/retry.ts",
    timeout: "src/timeout.ts",
    cache: "src/cache.ts",
    circuitBreaker: "src/circuit-breaker.ts",
    rateLimit: "src/rate-limit.ts",
    dedupe: "src/dedupe.ts",
    metrics: "src/metrics.ts",
  },
  format: ["esm", "cjs"],
  dts: false,
  splitting: true,
  sourcemap: !isProd,
  clean: true,
  minify: isProd,
  treeshake: true,
  external: ["hyperhttp-core"],
  target: "es2022",
  outDir: "dist",
  platform: "neutral",
  tsconfig: "./tsconfig.json",
});
