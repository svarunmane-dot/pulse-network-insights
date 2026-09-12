import js from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", ".output", ".vinxi"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "server-only",
              message:
                "TanStack Start does not use the Next.js `server-only` package. Rename the module to `*.server.ts` or mark it with `@tanstack/react-start/server-only`.",
            },
          ],
        },
      ],
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  // --- PCAP isolation boundary -------------------------------------------
  // src/pcap/** must stay offline and storage-free: no backend client, no
  // server functions, no analytics, no persistence, no network primitives.
  {
    files: ["src/pcap/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@supabase/*",
                "**/integrations/supabase/**",
                "@/integrations/supabase/**",
                "*.functions",
                "**/*.functions",
                "@/lib/*.functions",
                "*.server",
                "**/*.server",
              ],
              message:
                "src/pcap/** is an offline analysis boundary: no backend, server-function, or server-module imports.",
            },
          ],
        },
      ],
      "no-restricted-globals": [
        "error",
        { name: "fetch", message: "PCAP boundary: no network access." },
        { name: "XMLHttpRequest", message: "PCAP boundary: no network access." },
        { name: "WebSocket", message: "PCAP boundary: no network access." },
        { name: "EventSource", message: "PCAP boundary: no network access." },
        { name: "importScripts", message: "PCAP boundary: no remote code loading." },
        { name: "sendBeacon", message: "PCAP boundary: no telemetry." },
        { name: "gtag", message: "PCAP boundary: no analytics." },
        { name: "dataLayer", message: "PCAP boundary: no analytics." },
        { name: "localStorage", message: "PCAP boundary: no persistence of capture data." },
        { name: "sessionStorage", message: "PCAP boundary: no persistence of capture data." },
        { name: "indexedDB", message: "PCAP boundary: no persistence of capture data." },
        { name: "console", message: "PCAP boundary: no logging of capture contents." },
      ],
      "no-console": "error",
      "no-restricted-properties": [
        "error",
        { object: "navigator", property: "sendBeacon", message: "PCAP boundary: no telemetry." },
        { object: "window", property: "fetch", message: "PCAP boundary: no network access." },
        { object: "self", property: "fetch", message: "PCAP boundary: no network access." },
        { object: "globalThis", property: "fetch", message: "PCAP boundary: no network access." },
      ],
    },
  },
  eslintPluginPrettier,
);
