import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // UI UX Pro Max / Cursor skill install (local tooling, not app code)
    ".cursor/**",
    // Vendor registry components (Kokonut UI / Bklit) — lint upstream, not here
    "components/kokonutui/**",
    "components/charts/**",
  ]),
]);

export default eslintConfig;
