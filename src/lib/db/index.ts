import * as schema from "./schema";

function createDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const url = process.env.DATABASE_URL;

  // Use postgres.js for local/standard PostgreSQL, Neon for serverless
  if (url.includes("neon.tech") || url.includes("neon.") || process.env.USE_NEON === "true") {
    const { neon } = require("@neondatabase/serverless");
    const { drizzle } = require("drizzle-orm/neon-http");
    const sql = neon(url);
    return drizzle(sql, { schema });
  } else {
    const postgres = require("postgres");
    const { drizzle } = require("drizzle-orm/postgres-js");
    const sql = postgres(url);
    return drizzle(sql, { schema });
  }
}

let _db: ReturnType<typeof createDb> | undefined;

export function getDb() {
  if (!_db) {
    _db = createDb();
  }
  return _db;
}

// Lazy getter for import convenience — accessed at request time, not at module load time
export const db = new Proxy({} as ReturnType<typeof createDb>, {
  get(_, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export type Database = ReturnType<typeof createDb>;
