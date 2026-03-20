import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "data/**",
      "services/**",
      "drizzle.config.ts",
      "next.config.ts",
      "postcss.config.mjs",
      "eslint.config.mjs",
    ],
  },
  ...nextVitals,
  ...nextTypescript,
];

export default eslintConfig;
