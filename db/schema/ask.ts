import { pgTable, uuid, text, integer, boolean, timestamp, index } from "drizzle-orm/pg-core";

/**
 * Ask Sully — the portfolio-wide chat overlay's rate-limit bookkeeping.
 * Deliberately separate from `agentRuns` (the fit-agent's table): chat turns
 * are far more frequent than one-shot fit assessments and carry no
 * verdict/company to record — this is pure per-IP + daily cap tracking, not a
 * telemetry surface. IPs are stored only as a salted hash (same salt as the
 * fit-agent — see `lib/agent/rate-limit.ts`), never raw.
 */
export const askRuns = pgTable(
  "ask_runs",
  {
    id: uuid().primaryKey().defaultRandom(),
    ipHash: text().notNull(),
    inputHash: text().notNull(), // sha256 of the current turn only, not the transcript
    durationMs: integer(),
    capped: boolean().notNull().default(false),
    error: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("ask_runs_created_idx").on(t.createdAt),
    index("ask_runs_ip_idx").on(t.ipHash, t.createdAt),
  ],
);

export type AskRun = typeof askRuns.$inferSelect;
