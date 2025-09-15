import { defineConfig } from "tsup";

const isProd = process.env.NODE_ENV === "production";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    core: "src/core.ts",
    plugins: "src/plugins.ts",
    presets: "src/presets.ts",
    axios: "src/axios.ts",
  },
  format: ["esm", "cjs"],
  dts: false,
  splitting: true,
  sourcemap: !isProd,
  clean: true,
  minify: isProd,
  treeshake: true,
  external: ["hyperhttp-core", "hyperhttp-plugins", "hyperhttp-presets", "hyperhttp-axios-adapter"],
  target: "es2022",
  outDir: "dist",
  platform: "neutral",
  tsconfig: "./tsconfig.json",
});
