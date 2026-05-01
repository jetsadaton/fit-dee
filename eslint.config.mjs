import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

export default [
  ...compat.extends("next/core-web-vitals"),
  { ignores: [".next/**", "node_modules/**", "drizzle/migrations/**"] },
  {
    files: ["*.config.{js,mjs,cjs,ts}"],
    rules: { "import/no-anonymous-default-export": "off" },
  },
];
