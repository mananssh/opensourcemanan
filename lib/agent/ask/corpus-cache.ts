import "server-only";
import { loadCorpus, type Corpus } from "@/lib/agent/corpus";

const TTL_MS = 5 * 60 * 1000;
let cached: { value: Corpus; expiresAt: number } | null = null;

/**
 * Ask Sully is a multi-turn chat, called far more often per corpus-load than
 * one-shot fit runs — a short in-memory TTL avoids five DB queries per chat
 * turn. Ephemeral per-instance state, same precedent as the model-router's
 * lane circuit breaker: fine to reset on cold start for a 5-minute window.
 */
export async function loadCachedCorpus(): Promise<Corpus> {
  const now = Date.now();
  if (cached && cached.expiresAt > now) return cached.value;
  const value = await loadCorpus();
  cached = { value, expiresAt: now + TTL_MS };
  return value;
}
