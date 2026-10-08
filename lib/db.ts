import { createClient } from "@libsql/client";

// env nahi mila toh local file (sirf dev ke liye, Vercel pe Turso zaroori)
const db = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

let ready: Promise<unknown> | undefined;
export const getDb = async () => {
  ready ??= db.batch([
    `CREATE TABLE IF NOT EXISTS scores (
       id INTEGER PRIMARY KEY, game TEXT NOT NULL, name TEXT NOT NULL, score INTEGER NOT NULL,
       day TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL DEFAULT (unixepoch()))`,
    "CREATE INDEX IF NOT EXISTS idx_scores ON scores (game, day, score DESC)",
  ]);
  await ready;
  return db;
};
