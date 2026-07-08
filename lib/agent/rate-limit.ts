import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, count, eq, gt } from "drizzle-orm";
import type { PgColumn, PgTableWithColumns } from "drizzle-orm/pg-core";
import { db } from "@/db/client";
import { agentRuns } from "@/db/schema";

/**
 * Quota stewardship for the public /api/fit route, on the shared DB (no new
 * infra). A global daily cap protects the free model/search tiers from being
 * drained; a per-IP hourly window blunts single-source abuse. IPs are only ever
 * stored as a salted hash.
 *
 * Unlike the blog's `safeDb` (which only degrades on expected pre-migration
 * errors and lets real bugs surface), this module fails open on ANY DB error —
 * the rate limiter guards a public demo, not correctness-critical data, so a
 * DB hiccup should degrade the cap rather than 500 the whole route.
 */

const DAILY_CAP = Number(process.env.AGENT_DAILY_CAP ?? 200);
const IP_HOURLY_CAP = Number(process.env.AGENT_IP_HOURLY_CAP ?? 12);
const MAX_INPUT_CHARS = Number(process.env.AGENT_MAX_INPUT_CHARS ?? 4000);

export { MAX_INPUT_CHARS };

// A fixed fallback salt would be a known constant in this public repo, making
// the "IPs are never stored raw" guarantee trivially reversible. Fall back to
// a random per-boot salt instead — hashes just need to be stable within a
// warm instance (like the model-router's lane circuit breaker, this resets on
// cold start, which is fine for a rate-limit window measured in hours).
if (!process.env.AUTH_SECRET) {
  console.warn(
    "[sully] AUTH_SECRET is unset — IP hashing uses an ephemeral random salt for this instance. Set AUTH_SECRET for a stable salt.",
  );
}
const SALT = process.env.AUTH_SECRET ?? randomBytes(32).toString("hex");

export function hashIp(ip: string): string {
  return createHash("sha256").update(`${ip}:${SALT}`).digest("hex").slice(0, 32);
}

export function hashInput(input: string): string {
  return createHash("sha256").update(input.trim().toLowerCase()).digest("hex").slice(0, 32);
}

export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "unknown";
}

export type RateDecision =
  | { allowed: true; runId: string | null }
  | { allowed: false; reason: "daily" | "ip" };

export interface RunOutcome {
  ipHash: string;
  inputHash: string;
  durationMs?: number | null;
  capped?: boolean;
  error?: string | null;
}

/** The column shape every rate-limited run table must expose (see `db/schema/agent.ts`, `db/schema/ask.ts`). */
interface RunColumns extends Record<string, PgColumn> {
  id: PgColumn;
  ipHash: PgColumn;
  inputHash: PgColumn;
  durationMs: PgColumn;
  capped: PgColumn;
  error: PgColumn;
  createdAt: PgColumn;
}
// `agentRuns` and `askRuns` are two distinct Drizzle table types with extra columns
// beyond this common shape (agentRuns has verdict/company); every read/write below
// only ever touches RunColumns, so callers bridge with `asRunTable` at the instantiation site.
export type RunTable = PgTableWithColumns<{ name: string; schema: undefined; columns: RunColumns; dialect: "pg" }>;

/** The exact columns the factory reads/writes — spelled out, since `keyof RunColumns` widens to `string`. */
type RequiredRunColumn = "id" | "ipHash" | "inputHash" | "durationMs" | "capped" | "error" | "createdAt";

/**
 * Bridge a concrete table to `RunTable` WITH a compile-time guard that it still
 * carries every column the factory touches. A bare `as unknown as RunTable`
 * would silently accept a table that later drops/renames one of these columns —
 * and since the limiter fails OPEN, that would disable the cap in prod with only
 * a console warning. This turns such drift into a CI type error instead.
 */
export function asRunTable<T extends Record<RequiredRunColumn, PgColumn>>(table: T): RunTable {
  return table as unknown as RunTable;
}

/**
 * A reserve-then-finish rate limiter, shared by any run table with the common
 * `RunColumns` shape. A global daily cap protects shared infra (DB, free model
 * tiers) from being drained; a per-IP hourly window blunts single-source abuse.
 *
 * `checkAndReserve` checks both caps AND reserves the slot by inserting the run
 * row in the same transaction, so the count a concurrent request sees already
 * includes this one — closing the race where a row is only written at stream
 * completion (up to a route's `maxDuration` later), which would let concurrent
 * or rapid-fire requests all read the same pre-increment count and pass.
 *
 * Fails OPEN on any DB error (including an unmigrated table) — a rate limiter
 * guards a public demo, not correctness-critical data, so a DB hiccup should
 * degrade the cap rather than break the route.
 *
 * `toPatch` lets a feature persist columns beyond the common shape (e.g. the
 * fit-agent's `verdict`/`company`) without the shared factory knowing about them.
 */
export function createRateLimiter<E extends RunOutcome>(opts: {
  table: RunTable;
  dailyCap: number;
  ipHourlyCap: number;
  toPatch?: (entry: E) => Record<string, unknown>;
}) {
  const { table, dailyCap, ipHourlyCap, toPatch = () => ({}) } = opts;

  async function checkAndReserve(ipHash: string, inputHash: string): Promise<RateDecision> {
    try {
      return await db.transaction(async (tx) => {
        const now = Date.now();
        const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
        const hourAgo = new Date(now - 60 * 60 * 1000);

        const [daily] = await tx.select({ n: count() }).from(table).where(gt(table.createdAt, dayAgo));
        if ((daily?.n ?? 0) >= dailyCap) return { allowed: false, reason: "daily" };

        const [perIp] = await tx
          .select({ n: count() })
          .from(table)
          .where(and(eq(table.ipHash, ipHash), gt(table.createdAt, hourAgo)));
        if ((perIp?.n ?? 0) >= ipHourlyCap) return { allowed: false, reason: "ip" };

        const [row] = await tx.insert(table).values({ ipHash, inputHash }).returning({ id: table.id });
        return { allowed: true, runId: (row?.id as string | undefined) ?? null };
      });
    } catch (error) {
      console.warn("[rate-limit] check failed, failing open:", error);
      return { allowed: true, runId: null };
    }
  }

  /** Never throws — telemetry must not be able to break the stream. */
  async function finishRun(runId: string | null, entry: E): Promise<void> {
    try {
      const patch = {
        durationMs: entry.durationMs ?? null,
        capped: entry.capped ?? false,
        error: entry.error ?? null,
        ...toPatch(entry),
      };
      if (runId) {
        await db.update(table).set(patch).where(eq(table.id, runId));
      } else {
        await db.insert(table).values({ ipHash: entry.ipHash, inputHash: entry.inputHash, ...patch });
      }
    } catch (error) {
      console.error("[rate-limit] failed to record run outcome:", error);
    }
  }

  return { checkAndReserve, finishRun };
}

export interface FitRunOutcome extends RunOutcome {
  verdict?: string | null;
  company?: string | null;
}

export const { checkAndReserve, finishRun } = createRateLimiter<FitRunOutcome>({
  table: asRunTable(agentRuns),
  dailyCap: DAILY_CAP,
  ipHourlyCap: IP_HOURLY_CAP,
  toPatch: (entry) => ({ verdict: entry.verdict ?? null, company: entry.company ?? null }),
});
