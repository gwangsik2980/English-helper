/**
 * Tests need their own PostgreSQL database because setup wipes it.
 * Override with TEST_DATABASE_URL; never point it at real data.
 */
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/english_quest_test";
