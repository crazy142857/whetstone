import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...nextVitals,
  {
    rules: {
      "react/no-unescaped-entities": "off",
      // No React Compiler here; reading localStorage after mount is the
      // intended hydration-safe pattern.
      "react-hooks/set-state-in-effect": "off",
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  { ignores: [".next/**", "node_modules/**"] },
];
export default config;
