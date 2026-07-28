/**
 * Pure, client-safe @handle helpers. Kept separate from identity.ts (which pulls
 * in the DB client) so client components — the onboarding/settings forms — can
 * validate and preview handles without dragging server code into the bundle.
 */

export const HANDLE_RE = /^[a-z0-9_]{3,20}$/;

/**
 * Handles that would collide with a static route under /movies, or are reserved
 * for future/UX reasons. app/movies/[handle] is a dynamic segment; Next resolves
 * static siblings first, but reserving these keeps handles unambiguous and future
 * routes safe to add.
 */
export const RESERVED_HANDLES = new Set([
  "welcome",
  "settings",
  "u",
  "api",
  "admin",
  "me",
  "new",
  "edit",
  "search",
  "share",
  "wrapped",
  "friends",
  "following",
  "followers",
  "about",
  "login",
  "logout",
  "signin",
  "signout",
]);

/** Normalize user input to the canonical handle form (lowercase, no leading @). */
export function normalizeHandle(input: string): string {
  return input.trim().toLowerCase().replace(/^@+/, "");
}

/** Validate a normalized handle: format + not reserved. Returns an error or null. */
export function handleError(handle: string): string | null {
  if (!HANDLE_RE.test(handle)) {
    return "Handles are 3–20 characters: lowercase letters, numbers, or underscores.";
  }
  if (RESERVED_HANDLES.has(handle)) return "That handle is reserved. Pick another.";
  return null;
}
