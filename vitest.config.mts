import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { TEST_DATABASE_URL } from "./tests/support/test-db";

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
    env: { DATABASE_URL: TEST_DATABASE_URL, DATABASE_URL_UNPOOLED: TEST_DATABASE_URL, ANTHROPIC_API_KEY: "", RESEND_API_KEY: "" },
    // Tests share one database.
    fileParallelism: false,
  },
});
