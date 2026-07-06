import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, count, eq, gt } from "drizzle-orm";
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

/**
 * Checks both caps AND reserves the slot by inserting the run row in the same
 * transaction, so the count a concurrent request sees already includes this
 * one. This closes the race where the row was previously only written at
 * stream completion (up to `maxDuration` later): concurrent or rapid-fire
 * requests could all read the same pre-increment count and pass.
 *
 * Fails OPEN on any DB error (including if `agent_runs` isn't migrated yet) —
 * `runId: null` tells `finishRun` there's no reservation row to update.
 */
export async function checkAndReserve(ipHash: string, inputHash: string): Promise<RateDecision> {
  try {
    return await db.transaction(async (tx) => {
      const now = Date.now();
      const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
      const hourAgo = new Date(now - 60 * 60 * 1000);

      const [daily] = await tx
        .select({ n: count() })
        .from(agentRuns)
        .where(gt(agentRuns.createdAt, dayAgo));
      if ((daily?.n ?? 0) >= DAILY_CAP) return { allowed: false, reason: "daily" };

      const [perIp] = await tx
        .select({ n: count() })
        .from(agentRuns)
        .where(and(eq(agentRuns.ipHash, ipHash), gt(agentRuns.createdAt, hourAgo)));
      if ((perIp?.n ?? 0) >= IP_HOURLY_CAP) return { allowed: false, reason: "ip" };

      const [row] = await tx
        .insert(agentRuns)
        .values({ ipHash, inputHash })
        .returning({ id: agentRuns.id });
      return { allowed: true, runId: row?.id ?? null };
    });
  } catch (error) {
    console.warn("[sully] rate-limit check failed, failing open:", error);
    return { allowed: true, runId: null };
  }
}

export interface RunOutcome {
  ipHash: string;
  inputHash: string;
  verdict?: string | null;
  company?: string | null;
  durationMs?: number | null;
  capped?: boolean;
  error?: string | null;
}

/**
 * Records the final outcome of a run. If `runId` is set, updates the row that
 * `checkAndReserve` already inserted; otherwise (reservation failed, or this
 * is a capped request that never reserved a slot) inserts a fresh row.
 * Never throws — telemetry must not be able to break the stream.
 */
export async function finishRun(runId: string | null, entry: RunOutcome): Promise<void> {
  try {
    const patch = {
      verdict: entry.verdict ?? null,
      company: entry.company ?? null,
      durationMs: entry.durationMs ?? null,
      capped: entry.capped ?? false,
      error: entry.error ?? null,
    };
    if (runId) {
      await db.update(agentRuns).set(patch).where(eq(agentRuns.id, runId));
    } else {
      await db.insert(agentRuns).values({ ipHash: entry.ipHash, inputHash: entry.inputHash, ...patch });
    }
  } catch (error) {
    console.error("[sully] failed to record run outcome:", error);
  }
}
