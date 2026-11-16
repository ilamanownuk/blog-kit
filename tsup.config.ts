import { mkdir, readFile, writeFile } from "node:fs/promises";
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
      // styles.css is the plain file (default look always wins over resets/preflight);
      // styles.layered.css wraps the same rules in `@layer blog-kit` for easy overrides.
      const css = await readFile("src/styles.css", "utf8");
      await writeFile("dist/styles.css", css);
      await writeFile("dist/styles.layered.css", `@layer blog-kit {\n${css}\n}\n`);
    },
  },
  { ...common, entry: { renderer: "src/renderer/index.tsx" } },
  { ...common, entry: { server: "src/server/index.ts" } },
]);
