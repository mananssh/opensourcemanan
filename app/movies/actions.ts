"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/db/client";
import { watchers, watchEntries, follows } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { getViewer, requireViewer, getWatcherByHandle } from "@/lib/movies/identity";
import { normalizeHandle, handleError } from "@/lib/movies/handle";
import { getTitle } from "@/lib/movies/tmdb";
import { toCard, type MovieCard, type WatchStatusValue } from "@/lib/movies/queries";
import type { FormState } from "@/components/admin/form-state";

const STATUSES: WatchStatusValue[] = ["watched", "watching", "watchlist"];

function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function revalidateViewer(handle: string): void {
  revalidatePath("/movies");
  revalidatePath(`/movies/${handle}`);
}

/**
 * Onboarding: claim a unique @handle and create the watcher row. Uses requireAuth
 * (NOT requireViewer — the row doesn't exist yet) and seeds name/avatar from the
 * Google session. The DB unique constraint is the race-safe backstop.
 */
export async function claimHandle(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireAuth();
  const email = session.user?.email?.toLowerCase();
  if (!email) return { error: "No account email on this session." };

  // Already onboarded → straight to the tracker.
  if (await getViewer()) redirect("/movies");

  const handle = normalizeHandle(str(formData, "handle"));
  const err = handleError(handle);
  if (err) return { error: err };

  try {
    await db.insert(watchers).values({
      email,
      handle,
      displayName: session.user?.name ?? null,
      avatarUrl: session.user?.image ?? null,
    });
  } catch (e) {
    // Unique violation on handle or email (double-submit) → friendly message.
    const code = (e as { code?: string })?.code;
    if (code === "23505") return { error: "That handle is taken. Try another." };
    throw e;
  }
  redirect("/movies");
}

/** Edit profile: display name, bio, and (optionally) a new handle. Owner of the row only. */
export async function saveProfile(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const viewer = await requireViewer();
  const displayName = str(formData, "displayName").slice(0, 60) || null;
  const bio = str(formData, "bio").slice(0, 280) || null;
  const nextHandle = normalizeHandle(str(formData, "handle"));

  const patch: {
    displayName: string | null;
    bio: string | null;
    handle?: string;
    updatedAt: Date;
  } = { displayName, bio, updatedAt: new Date() };

  if (nextHandle && nextHandle !== viewer.handle) {
    const err = handleError(nextHandle);
    if (err) return { error: err };
    patch.handle = nextHandle;
  }

  try {
    await db.update(watchers).set(patch).where(eq(watchers.id, viewer.id));
  } catch (e) {
    if ((e as { code?: string })?.code === "23505")
      return { error: "That handle is taken. Try another." };
    throw e;
  }
  revalidateViewer(patch.handle ?? viewer.handle);
  return {};
}

export interface AddEntryInput {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  posterPath: string | null;
  releaseYear: number | null;
  status?: WatchStatusValue;
}

export type AddEntryResult =
  | { ok: true; card: MovieCard }
  | { ok: false; error: string };

/**
 * Log a title (defaults to "watched" — the one-tap habit). Enriches runtime +
 * genres from TMDB best-effort. Idempotent: re-adding an already-logged title
 * returns the existing row rather than erroring.
 */
export async function addEntry(input: AddEntryInput): Promise<AddEntryResult> {
  const viewer = await requireViewer();

  const tmdbId = Number(input.tmdbId);
  if (!Number.isInteger(tmdbId) || tmdbId <= 0)
    return { ok: false, error: "Invalid title." };
  const mediaType: "movie" | "tv" = input.mediaType === "tv" ? "tv" : "movie";
  const title = String(input.title ?? "").trim().slice(0, 300) || "Untitled";
  const status = STATUSES.includes(input.status as WatchStatusValue)
    ? (input.status as WatchStatusValue)
    : "watched";

  const detail = await getTitle(mediaType, tmdbId).catch(() => null);

  const values = {
    viewerId: viewer.id,
    tmdbId,
    mediaType,
    title: detail?.title ?? title,
    posterPath: detail?.posterPath ?? input.posterPath ?? null,
    releaseYear: detail?.releaseYear ?? input.releaseYear ?? null,
    runtimeMinutes: detail?.runtimeMinutes ?? null,
    genres: detail?.genres ?? [],
    status,
    // Watched now unless it's a queued watchlist item.
    watchedOn:
      status === "watchlist" ? null : new Date().toISOString().slice(0, 10),
  };

  const inserted = await db
    .insert(watchEntries)
    .values(values)
    .onConflictDoNothing({
      target: [
        watchEntries.viewerId,
        watchEntries.tmdbId,
        watchEntries.mediaType,
      ],
    })
    .returning();

  let row = inserted[0];
  if (!row) {
    // Already logged — return the existing row.
    const existing = await db
      .select()
      .from(watchEntries)
      .where(
        and(
          eq(watchEntries.viewerId, viewer.id),
          eq(watchEntries.tmdbId, tmdbId),
          eq(watchEntries.mediaType, mediaType),
        ),
      )
      .limit(1);
    row = existing[0];
    if (!row) return { ok: false, error: "Could not save that title." };
  }

  revalidateViewer(viewer.handle);
  return { ok: true, card: toCard(row) };
}

export interface UpdateEntryInput {
  id: string;
  rating?: number | null;
  status?: WatchStatusValue;
  watchedOn?: string | null;
  note?: string | null;
  favorite?: boolean;
}

/** Patch one of the viewer's own entries. Ownership-checked. */
export async function updateEntry(
  input: UpdateEntryInput,
): Promise<{ ok: boolean; error?: string }> {
  const viewer = await requireViewer();
  const id = String(input.id ?? "");
  if (!id) return { ok: false, error: "Missing entry." };

  const owned = await db
    .select({ id: watchEntries.id })
    .from(watchEntries)
    .where(and(eq(watchEntries.id, id), eq(watchEntries.viewerId, viewer.id)))
    .limit(1);
  if (!owned[0]) return { ok: false, error: "Not found." };

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (input.rating !== undefined) {
    patch.rating =
      input.rating == null
        ? null
        : Math.max(0, Math.min(10, Math.round(input.rating))) || null;
  }
  if (input.status !== undefined && STATUSES.includes(input.status))
    patch.status = input.status;
  if (input.watchedOn !== undefined)
    patch.watchedOn = input.watchedOn ? input.watchedOn.slice(0, 10) : null;
  if (input.note !== undefined)
    patch.note = input.note ? input.note.slice(0, 2000) : null;
  if (input.favorite !== undefined) patch.favorite = Boolean(input.favorite);

  await db.update(watchEntries).set(patch).where(eq(watchEntries.id, id));
  revalidateViewer(viewer.handle);
  return { ok: true };
}

/** Delete one of the viewer's own entries. Ownership-checked (no-op otherwise). */
export async function deleteEntry(input: { id: string }): Promise<void> {
  const viewer = await requireViewer();
  const id = String(input.id ?? "");
  if (!id) return;
  await db
    .delete(watchEntries)
    .where(and(eq(watchEntries.id, id), eq(watchEntries.viewerId, viewer.id)));
  revalidateViewer(viewer.handle);
}

export type FollowResult =
  | { ok: true; following: boolean }
  | { ok: false; error: string };

/**
 * Follow a watcher by exact @handle. Deliberately exact-match only — no fuzzy
 * discovery (Reel is "not social media"). Idempotent via the composite PK.
 */
export async function follow(handle: string): Promise<FollowResult> {
  const viewer = await requireViewer();
  const target = await getWatcherByHandle(handle);
  if (!target) return { ok: false, error: "No one with that handle." };
  if (target.id === viewer.id)
    return { ok: false, error: "You can't follow yourself." };

  await db
    .insert(follows)
    .values({ followerId: viewer.id, followeeId: target.id })
    .onConflictDoNothing();
  revalidatePath("/movies");
  revalidatePath(`/movies/${target.handle}`);
  return { ok: true, following: true };
}

/** Unfollow a watcher by exact @handle. */
export async function unfollow(handle: string): Promise<FollowResult> {
  const viewer = await requireViewer();
  const target = await getWatcherByHandle(handle);
  if (!target) return { ok: false, error: "No one with that handle." };

  await db
    .delete(follows)
    .where(
      and(
        eq(follows.followerId, viewer.id),
        eq(follows.followeeId, target.id),
      ),
    );
  revalidatePath("/movies");
  revalidatePath(`/movies/${target.handle}`);
  return { ok: true, following: false };
}
