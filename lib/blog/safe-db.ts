/**
 * Shared resilient-read helper for blog queries. Only EXPECTED pre-setup errors
 * (a table missing before its migration runs, or no DATABASE_URL) degrade to an
 * empty fallback so pages render gracefully; real failures throw so they surface.
 */
function isExpectedEmptyDbError(error: unknown): boolean {
  let e: unknown = error;
  for (let i = 0; i < 5 && e; i++) {
    const o = e as { code?: unknown; message?: unknown; cause?: unknown };
    // Only the genuine pre-setup conditions degrade to empty:
    //   - 42P01 undefined_table (a table missing before its migration runs)
    //   - our own thrown "DATABASE_URL is not set" message
    // We deliberately do NOT match the substring "does not exist" anymore: it
    // also fires for undefined_column (42703), undefined_function, etc., which
    // are real bugs (e.g. a bad migration) that must surface, not silently
    // render "no posts".
    if (o.code === "42P01") return true;
    if (
      typeof o.message === "string" &&
      o.message.includes("DATABASE_URL is not set")
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
