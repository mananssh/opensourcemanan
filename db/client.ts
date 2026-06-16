import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * The shared database client — the Data-axis primitive every feature imports.
 *
 *   import { db } from "@/db/client";
 *   import { posts } from "@/db/schema";
 *   const rows = await db.select().from(posts);
 *
 * CockroachDB (Postgres-compatible) over postgres.js. A single connection is
 * reused per warm serverless instance and cached on globalThis in dev so HMR
 * doesn't open a new pool on every reload.
 *
 * Initialization is lazy: importing this module never connects or throws, so it
 * is safe at build time without DATABASE_URL (CI runs `next build` with no DB).
 * The first actual query initializes the client and throws if DATABASE_URL is
 * still unset.
 */
type Db = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  _pgClient?: ReturnType<typeof postgres>;
};

let instance: Db | undefined;

function getDb(): Db {
  if (instance) return instance;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env.local (see .env.example) and to the deployment environment.",
    );
  }
  // max: 1 — serverless functions should not fan out connections.
  const client = globalForDb._pgClient ?? postgres(connectionString, { max: 1 });
  if (process.env.NODE_ENV !== "production") globalForDb._pgClient = client;
  instance = drizzle(client, { schema, casing: "snake_case" });
  return instance;
}

export const db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    const real = getDb() as object;
    const value = Reflect.get(real, prop, receiver);
    return typeof value === "function" ? value.bind(real) : value;
  },
});
