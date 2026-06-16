/**
 * Shared resilient-read helper for blog queries. Only EXPECTED pre-setup errors
 * (a table missing before its migration runs, or no DATABASE_URL) degrade to an
 * empty fallback so pages render gracefully; real failures throw so they surface.
 */
function isExpectedEmptyDbError(error: unknown): boolean {
  let e: unknown = error;
  for (let i = 0; i < 5 && e; i++) {
    const o = e as { code?: unknown; message?: unknown; cause?: unknown };
    if (o.code === "42P01") return true; // undefined_table (pre-migration)
    if (
      typeof o.message === "string" &&
      (o.message.includes("DATABASE_URL is not set") ||
        o.message.includes("does not exist"))
    ) {
      return true;
    }
    e = o.cause;
  }
  return false;
}

export async function safeDb<T>(
  fn: () => Promise<T>,
  emptyFallback: T,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (isExpectedEmptyDbError(error)) {
      console.warn("[blog] DB not ready, returning empty:", error);
      return emptyFallback;
    }
    throw error;
  }
}
