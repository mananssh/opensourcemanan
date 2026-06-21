import { pgTable, uuid, text, integer, boolean, timestamp, index } from "drizzle-orm/pg-core";

/**
 * Sully agent — operational tables (NOT content). The live `/api/fit` route is
 * public, so it needs abuse protection and quota stewardship without standing up
 * new infra: we reuse the shared CockroachDB rather than add Upstash/KV.
 *
 * - `agentRuns`  — one row per assessment: rate-limiting source of truth
 *   (per-IP window + global daily cap) AND the Telemetry-axis seam (verdict /
 *   duration / capped / error), DB-local until a provider is chosen. IPs are
 *   stored only as a salted hash — never raw (oss-safety / PII).
 * - `agentCache` — a tiny TTL key/value store. v1 caches Tavily company-research
 *   so the free web-search tier survives repeated/identical lookups. It never
 *   caches the trace or a full result — the live thinking must be real each run.
 */

export const agentRuns = pgTable(
  "agent_runs",
  {
    id: uuid().primaryKey().defaultRandom(),
    ipHash: text().notNull(), // sha256(ip + secret), truncated — never the raw IP
    inputHash: text().notNull(), // sha256 of the normalized JD — telemetry/dedupe only
    verdict: text(), // strong | plausible | not_a_fit | null (errored/capped)
    company: text(),
    durationMs: integer(),
    capped: boolean().notNull().default(false),
    error: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("agent_runs_created_idx").on(t.createdAt),
    index("agent_runs_ip_idx").on(t.ipHash, t.createdAt),
  ],
);

export const agentCache = pgTable(
  "agent_cache",
  {
    key: text().primaryKey(), // e.g. "tavily:<company-slug>"
    value: text().notNull(), // JSON string
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("agent_cache_expires_idx").on(t.expiresAt)],
);

export type AgentRun = typeof agentRuns.$inferSelect;
export type AgentCache = typeof agentCache.$inferSelect;
