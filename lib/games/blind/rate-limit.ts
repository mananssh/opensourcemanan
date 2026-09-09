import "server-only";

/** Lightweight in-memory IP rate limit for Blind extract (no DB). Resets on cold start. */

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = Number(process.env.BLIND_EXTRACT_IP_HOURLY_CAP ?? 12);

const hits = new Map<string, { count: number; resetAt: number }>();

export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "unknown";
}

export function checkExtractRateLimit(ip: string): { ok: true } | { ok: false } {
  const now = Date.now();
  const row = hits.get(ip);
  if (!row || now >= row.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true };
  }
  if (row.count >= MAX_PER_WINDOW) return { ok: false };
  row.count += 1;
  return { ok: true };
}
