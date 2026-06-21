import "server-only";
import { createHash } from "node:crypto";
import { and, count, eq, gt } from "drizzle-orm";
import { db } from "@/db/client";
import { agentRuns } from "@/db/schema";
import { safeDb } from "@/lib/blog/safe-db";

/**
 * Quota stewardship for the public /api/fit route, on the shared DB (no new
 * infra). A global daily cap protects the free model/search tiers from being
 * drained; a per-IP hourly window blunts single-source abuse. IPs are only ever
 * stored as a salted hash.
 */

const DAILY_CAP = Number(process.env.AGENT_DAILY_CAP ?? 200);
const IP_HOURLY_CAP = Number(process.env.AGENT_IP_HOURLY_CAP ?? 12);
const MAX_INPUT_CHARS = Number(process.env.AGENT_MAX_INPUT_CHARS ?? 4000);

export { MAX_INPUT_CHARS };

const SALT = process.env.AUTH_SECRET ?? "sully-dev-salt";

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

export type RateDecision = { allowed: true } | { allowed: false; reason: "daily" | "ip" };

/** Fails OPEN on a DB error — the demo shouldn't die when the counter hiccups. */
export async function checkRateLimit(ipHash: string): Promise<RateDecision> {
  return safeDb<RateDecision>(async () => {
    const now = Date.now();
    const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const hourAgo = new Date(now - 60 * 60 * 1000);

    const [daily] = await db
      .select({ n: count() })
      .from(agentRuns)
      .where(gt(agentRuns.createdAt, dayAgo));
    if ((daily?.n ?? 0) >= DAILY_CAP) return { allowed: false, reason: "daily" };

    const [perIp] = await db
      .select({ n: count() })
      .from(agentRuns)
      .where(and(eq(agentRuns.ipHash, ipHash), gt(agentRuns.createdAt, hourAgo)));
    if ((perIp?.n ?? 0) >= IP_HOURLY_CAP) return { allowed: false, reason: "ip" };

    return { allowed: true };
  }, { allowed: true });
}

export interface RunLog {
  ipHash: string;
  inputHash: string;
  verdict?: string | null;
  company?: string | null;
  durationMs?: number | null;
  capped?: boolean;
  error?: string | null;
}

export async function logRun(entry: RunLog): Promise<void> {
  await safeDb(async () => {
    await db.insert(agentRuns).values({
      ipHash: entry.ipHash,
      inputHash: entry.inputHash,
      verdict: entry.verdict ?? null,
      company: entry.company ?? null,
      durationMs: entry.durationMs ?? null,
      capped: entry.capped ?? false,
      error: entry.error ?? null,
    });
    return null;
  }, null);
}
