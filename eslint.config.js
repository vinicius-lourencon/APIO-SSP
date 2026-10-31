import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    // shadcn/ui generated code (components/ui and its use-toast hook) is vendored, not maintained by hand
    // .venv: local Python virtualenv, if present (not part of the app)
    ignores: [
      "dist",
      "node_modules",
      ".venv",
      "client/components/ui/**",
      "client/hooks/use-toast.ts",
    ],
  },
  {
    files: ["**/*.{ts,tsx,js,mjs}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // DB rows and Express handlers are typed loosely across the codebase (tsconfig strict is off)
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
);
