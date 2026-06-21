import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { agentCache } from "@/db/schema";
import { safeDb } from "@/lib/blog/safe-db";

/**
 * Company web-research via Tavily. DEGRADATION-SAFE: a missing key, a 429/quota
 * exhaustion, a network error, or a bad response all resolve to `null` — never a
 * throw — so the web_corpus node skips web and continues on the local corpus.
 *
 * Results are cached in `agent_cache` (keyed by company, 7-day TTL) so the free
 * tier survives repeated lookups. Only tool output is cached — never the trace.
 */

export interface WebResearch {
  findings: string; // a short company summary
  sources: number; // how many results backed it
}

const TTL_MS = 7 * 24 * 60 * 60 * 1000;

function cacheKey(company: string): string {
  return `tavily:${company.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 80)}`;
}

async function readCache(key: string): Promise<WebResearch | null> {
  return safeDb(async () => {
    const rows = await db.select().from(agentCache).where(eq(agentCache.key, key)).limit(1);
    const row = rows[0];
    if (!row || new Date(row.expiresAt).getTime() < Date.now()) return null;
    return JSON.parse(row.value) as WebResearch;
  }, null);
}

async function writeCache(key: string, value: WebResearch): Promise<void> {
  await safeDb(async () => {
    const expiresAt = new Date(Date.now() + TTL_MS);
    await db
      .insert(agentCache)
      .values({ key, value: JSON.stringify(value), expiresAt })
      .onConflictDoUpdate({ target: agentCache.key, set: { value: JSON.stringify(value), expiresAt } });
    return null;
  }, null);
}

export async function researchCompany(
  company: string,
  signal?: AbortSignal,
): Promise<WebResearch | null> {
  const key = process.env.TAVILY_API_KEY;
  if (!key || !company.trim()) return null;

  const ck = cacheKey(company);
  const cached = await readCache(ck);
  if (cached) return cached;

  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({
        query: `What does ${company} do? Their engineering, products, and tech stack.`,
        max_results: 4,
        include_answer: true,
        search_depth: "basic",
      }),
      signal,
    });
    if (!res.ok) return null; // 429 / quota / anything → degrade silently

    const data = (await res.json()) as {
      answer?: string;
      results?: { title?: string; content?: string }[];
    };
    const results = data.results ?? [];
    const findings =
      (data.answer && data.answer.trim()) ||
      results
        .slice(0, 3)
        .map((r) => `${r.title}: ${r.content}`)
        .join(" ")
        .slice(0, 1200);
    if (!findings) return null;

    const value: WebResearch = { findings, sources: results.length };
    await writeCache(ck, value);
    return value;
  } catch {
    return null; // network/abort → degrade
  }
}
