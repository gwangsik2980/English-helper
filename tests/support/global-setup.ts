import { execSync } from "node:child_process";
import { TEST_DATABASE_URL } from "./test-db";

/**
 * Empties the test database and applies the migrations on every run.
 * Refuses any database whose name does not end in "_test", so a mistyped
 * TEST_DATABASE_URL cannot wipe real data.
 */
export default function setup() {
  const dbName = new URL(TEST_DATABASE_URL).pathname.slice(1);
  if (!dbName.endsWith("_test")) {
    throw new Error(`Refusing to reset "${dbName}": the test database name must end in "_test".`);
  }
  const env = { ...process.env, DATABASE_URL: TEST_DATABASE_URL, DATABASE_URL_UNPOOLED: TEST_DATABASE_URL };
  execSync("npx prisma db execute --stdin --schema prisma/schema.prisma", {
    env,
    input: "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;",
    stdio: ["pipe", "ignore", "inherit"],
  });
  execSync("npx prisma migrate deploy", { env, stdio: ["ignore", "ignore", "inherit"] });
}
