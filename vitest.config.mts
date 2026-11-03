import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./tests/support/server-only.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    globalSetup: ["tests/support/global-setup.ts"],
    env: { DATABASE_URL: "file:./test.db", ANTHROPIC_API_KEY: "" },
    // Tests share one SQLite file.
    fileParallelism: false,
  },
});
