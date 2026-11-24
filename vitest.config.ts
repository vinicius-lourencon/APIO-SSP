import { configDefaults, defineConfig } from "vitest/config";
import path from "node:path";

// Separate from vite.config.ts so tests don't mount the Express API (which opens sisapa.db).
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./client"),
      "@shared": path.resolve(import.meta.dirname, "./shared"),
    },
  },
  test: {
    // Local Python virtualenv, if present, is not part of the app
    exclude: [...configDefaults.exclude, ".venv/**"],
  },
});
