/**
 * Shared resilient-read helper for blog queries. Only EXPECTED pre-setup errors
 * (a table missing before its migration runs, or no DATABASE_URL) degrade to an
 * empty fallback so pages render gracefully; real failures throw so they surface.
 */
// SQLSTATEs that mean "schema not migrated yet", not "real bug". Both occur
// during the normal deploy window: a preview/prod build prerenders against the
// DB *before* the migrate-on-merge workflow has added the new table/column the
// new code references. We match on code (not the "does not exist" substring,
// which is too broad) so unrelated errors still surface.
const PRE_MIGRATION_CODES = new Set([
  "42P01", // undefined_table
  "42703", // undefined_column
]);

function isExpectedEmptyDbError(error: unknown): boolean {
  let e: unknown = error;
  for (let i = 0; i < 5 && e; i++) {
    const o = e as { code?: unknown; message?: unknown; cause?: unknown };
    if (typeof o.code === "string" && PRE_MIGRATION_CODES.has(o.code)) return true;
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
