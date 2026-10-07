import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Аватар, логонууд нь хэрэглэгчийн Supabase Storage-д хуулсан (2MB хүртэл) жижиг
      // зургууд бөгөөд дурын хэмжээтэй тул <img> ашиглана. next/image нь өргөн/өндөр,
      // remotePatterns шаарддаг ба давуу тал нь энд бага.
      "@next/next/no-img-element": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
