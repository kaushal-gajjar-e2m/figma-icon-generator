import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  root: resolve(rootDir, "src/ui"),
  build: {
    outDir: resolve(rootDir, "dist"),
    // Keep dist/code.js (esbuild output) when Vite rebuilds the UI
    emptyOutDir: false,
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
    rollupOptions: {
      input: resolve(rootDir, "src/ui/index.html"),
    },
  },
});
