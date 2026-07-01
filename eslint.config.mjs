import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextVitals,
  ...nextTypescript,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "public/dorvell/**",
      "tmp/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
