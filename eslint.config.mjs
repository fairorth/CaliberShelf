import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // SHARED WITH THE IPHONE APP (docs/iphone-app.md §16). The Expo app imports
  // these files directly, so they must stay pure TypeScript: zod, each other,
  // nothing that only exists in Next.js or on the server. A rule that must
  // never disagree between web and phone (current value, gain math, tiers, The
  // Edit, validation) lives here once rather than being copied into the phone.
  // Adding a file to this list is how something becomes shareable.
  {
    files: [
      "src/lib/dates.ts",
      "src/lib/valuation.ts",
      "src/lib/queries/gain.ts",
      "src/lib/tiers.ts",
      "src/lib/the-edit.ts",
      "src/lib/photo-lab.ts",
      "src/lib/boxes.ts",
      "src/lib/rating.ts",
      "src/lib/rating-segments.ts",
      "src/lib/validations/**/*.ts",
      "src/lib/types/watch.ts",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "next",
                "next/*",
                "react",
                "react-dom",
                "server-only",
                "@supabase/*",
                "@anthropic-ai/*",
                "sharp",
                "fs",
                "path",
                "node:*",
                "@/lib/supabase/*",
                "@/lib/actions/*",
                "@/lib/queries/*",
                "@/components/*",
                "@/hooks/*",
                "@/app/*",
              ],
              message:
                "This file is shared with the iPhone app and must stay pure (see eslint.config.mjs / docs/iphone-app.md §16).",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Design hand-off reference bundles (third-party prototype runtime, not app code).
    "**/*Handoff*/**",
    "**/design_handoff_*/**",
    "design rebrand temp/**",
    // The Expo iPhone app has its own toolchain (mobile/package.json).
    "mobile/**",
  ]),
]);

export default eslintConfig;
