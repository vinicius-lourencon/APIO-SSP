import { configDefaults, defineConfig } from "vitest/config";
import path from "node:path";

// Separate from vite.config.ts so tests don't mount the Express API (which opens sisapa.db).
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  test: {
    // Graphify tooling lives next to the app (Python venv, generated graph): never collect tests there
    exclude: [...configDefaults.exclude, ".venv/**", "graphify-out/**", "tools/**"],
  },
});
