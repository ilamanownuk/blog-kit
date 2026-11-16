import { copyFile, mkdir } from "node:fs/promises";
import { defineConfig } from "tsup";

const common = {
  format: ["esm", "cjs"] as ("esm" | "cjs")[],
  dts: true,
  sourcemap: true,
  target: "es2022",
  // peers + dependencies are external by default in tsup
};

export default defineConfig([
  {
    ...common,
    entry: { index: "src/editor/index.ts" },
    clean: true,
    // esbuild drops module directives while bundling, so re-add it as a banner.
    banner: { js: '"use client";' },
    async onSuccess() {
      await mkdir("dist", { recursive: true });
      await copyFile("src/styles.css", "dist/styles.css");
    },
  },
  { ...common, entry: { renderer: "src/renderer/index.tsx" } },
  { ...common, entry: { server: "src/server/index.ts" } },
]);
