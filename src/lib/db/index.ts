import type { NeonDatabase } from "drizzle-orm/neon-serverless";
import type { PgTransaction, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type { TablesRelationalConfig } from "drizzle-orm";
import * as schema from "./schema";

type DbInstance = NeonDatabase<typeof schema>;

function createDb(): DbInstance {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const url = process.env.DATABASE_URL;

  // Use postgres.js for local/standard PostgreSQL, Neon for serverless
  if (url.includes("neon.tech") || url.includes("neon.") || process.env.USE_NEON === "true") {
    const { Pool } = require("@neondatabase/serverless");
    const { drizzle } = require("drizzle-orm/neon-serverless");
    const pool = new Pool({ connectionString: url });
    return drizzle(pool, { schema });
  } else {
    const postgres = require("postgres");
    const { drizzle } = require("drizzle-orm/postgres-js");
    const sql = postgres(url);
    return drizzle(sql, { schema }) as unknown as DbInstance;
  }
}

let _db: DbInstance | undefined;

export function getDb(): DbInstance {
  if (!_db) {
    _db = createDb();
  }
  return _db;
}

// Lazy getter for import convenience — accessed at request time, not at module load time
export const db = new Proxy({} as DbInstance, {
  get(_, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export type Database = DbInstance;
/** Transaction handle — same API surface as Database, usable inside db.transaction() callbacks */
export type Transaction = PgTransaction<PgQueryResultHKT, Record<string, unknown>, TablesRelationalConfig>;
