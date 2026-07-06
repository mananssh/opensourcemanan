"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, ne } from "drizzle-orm";
import GithubSlugger from "github-slugger";
import { db } from "@/db/client";
import {
  profile,
  projects,
  experiences,
  hackathons,
  capabilities,
} from "@/db/schema";
import { requireOwner } from "@/lib/auth";
import { makePublic, deleteObject } from "@/lib/storage/gcs";
import type { FormState } from "@/components/admin/form-state";

/** `{ error }` is surfaced inline by AdminForm — the shared shape every
 *  vertical's admin actions use (components/admin/form-state.ts). */
export type PortfolioState = FormState;

function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}
function num(fd: FormData, key: string): number {
  return Number(str(fd, key)) || 0;
}
function csv(fd: FormData, key: string): string[] {
  return str(fd, key)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
function date(fd: FormData, key: string): Date | null {
  const v = str(fd, key);
  return v ? new Date(v) : null;
}
function slugify(s: string): string {
  return new GithubSlugger().slug(s);
}
function isUniqueViolation(e: unknown): boolean {
  let cur: unknown = e;
  for (let i = 0; i < 5 && cur; i++) {
    const o = cur as { code?: unknown; cause?: unknown };
    if (o.code === "23505") return true;
    cur = o.cause;
  }
  return false;
}

/**
 * Runs a save's insert/update, translating any DB failure into the inline
 * `{error}` shape instead of letting it throw past the form and into Next's
 * default (unstyled) error boundary, which would also drop the user's input.
 */
async function saveRow(op: () => Promise<unknown>): Promise<PortfolioState | null> {
  try {
    await op();
    return null;
  } catch (e) {
    if (isUniqueViolation(e)) return { error: "That slug was just taken." };
    console.error("[admin] save failed:", e);
    return { error: "Couldn't save. Try again." };
  }
}

/** Best-effort delete: logs but never throws, so a DB hiccup on delete doesn't
 *  crash the admin panel — consistent with how storage cleanup is handled. */
async function deleteRow(op: () => Promise<unknown>): Promise<void> {
  try {
    await op();
  } catch (e) {
    console.error("[admin] delete failed:", e);
  }
}

/** "label: level" lines → [{name, level}]. */
function parseLanguages(text: string): { name: string; level: string }[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const i = l.indexOf(":");
      return i === -1
        ? { name: l, level: "" }
        : { name: l.slice(0, i).trim(), level: l.slice(i + 1).trim() };
    });
}
/** "label | url" lines → [{label, url}]. */
function parseLinks(text: string): { label: string; url: string }[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [label, url] = l.split("|").map((s) => s.trim());
      return { label: label ?? "", url: url ?? "" };
    })
    .filter((x) => x.label && x.url);
}

/** A hidden field holding a JSON array of object keys (MultiImageUpload). */
function jsonKeys(fd: FormData, key: string): string[] {
  try {
    const v = JSON.parse(str(fd, key) || "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Portfolio assets are public; make the uploaded object(s) world-readable. */
async function publishAsset(key: string | null): Promise<void> {
  if (key) await makePublic(key);
}
async function publishAssets(keys: string[]): Promise<void> {
  await Promise.all(keys.map((k) => makePublic(k)));
}
/** Delete objects in `before` that are no longer in `after` (gallery edits). */
async function cleanupRemoved(before: string[], after: string[]): Promise<void> {
  const keep = new Set(after);
  await Promise.all(
    before.filter((k) => !keep.has(k)).map((k) => deleteObject(k).catch(() => {})),
  );
}
function revalidatePortfolio(): void {
  revalidatePath("/", "layout"); // the portfolio reads at root + galleries
  revalidatePath("/admin", "layout");
}

// ── Profile (singleton) ────────────────────────────────────────────────────
export async function saveProfile(
  _p: PortfolioState,
  fd: FormData,
): Promise<PortfolioState> {
  await requireOwner();
  const name = str(fd, "name");
  if (!name) return { error: "Name is required." };
  const photoKey = str(fd, "photoKey") || null;
  const resumeKey = str(fd, "resumeKey") || null;
  try {
    await publishAsset(photoKey);
    await publishAsset(resumeKey);
  } catch {
    return { error: "Couldn't process an uploaded file. Try again." };
  }
  const data = {
    name,
    tagline: str(fd, "tagline"),
    intro: str(fd, "intro"),
    now: str(fd, "now"),
    email: str(fd, "email"),
    linkedin: str(fd, "linkedin"),
    github: str(fd, "github") || null,
    location: str(fd, "location"),
    languages: parseLanguages(str(fd, "languages")),
    photoKey,
    resumeKey,
    updatedAt: new Date(),
  };
  const [existing] = await db.select({ id: profile.id }).from(profile).limit(1);
  let prevKeys: { photoKey: string | null; resumeKey: string | null } | undefined;
  if (existing) {
    [prevKeys] = await db
      .select({ photoKey: profile.photoKey, resumeKey: profile.resumeKey })
      .from(profile)
      .where(eq(profile.id, existing.id))
      .limit(1);
  }
  const err = await saveRow(() =>
    existing ? db.update(profile).set(data).where(eq(profile.id, existing.id)) : db.insert(profile).values(data),
  );
  if (err) return err;
  if (prevKeys?.photoKey && prevKeys.photoKey !== photoKey) {
    await deleteObject(prevKeys.photoKey).catch(() => {});
  }
  if (prevKeys?.resumeKey && prevKeys.resumeKey !== resumeKey) {
    await deleteObject(prevKeys.resumeKey).catch(() => {});
  }
  revalidatePortfolio();
  redirect("/admin");
}

// ── Projects ────────────────────────────────────────────────────────────────
export async function saveProject(
  _p: PortfolioState,
  fd: FormData,
): Promise<PortfolioState> {
  await requireOwner();
  const id = str(fd, "id");
  const name = str(fd, "name");
  if (!name) return { error: "Name is required." };
  const coverImageKey = str(fd, "coverImageKey") || null;
  const imageKeys = jsonKeys(fd, "imageKeys");

  const explicit = str(fd, "slug");
  const slug = slugify(explicit || name);
  const [clash] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.slug, slug), id ? ne(projects.id, id) : undefined))
    .limit(1);
  if (clash) return { error: `The slug "${slug}" is taken — choose another.` };

  try {
    await publishAsset(coverImageKey);
    await publishAssets(imageKeys);
  } catch {
    return { error: "Couldn't process an image. Try again." };
  }

  let oldCover: string | null = null;
  let oldGallery: string[] = [];
  if (id) {
    const [prev] = await db
      .select({ coverImageKey: projects.coverImageKey, imageKeys: projects.imageKeys })
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);
    oldCover = prev?.coverImageKey ?? null;
    oldGallery = prev?.imageKeys ?? [];
  }

  const data = {
    slug,
    name,
    blurb: str(fd, "blurb"),
    body: str(fd, "body"),
    stack: csv(fd, "stack"),
    links: parseLinks(str(fd, "links")),
    award: str(fd, "award") || null,
    year: str(fd, "year") || null,
    coverImageKey,
    imageKeys,
    featured: fd.get("featured") === "on",
    sortOrder: num(fd, "sortOrder"),
    updatedAt: new Date(),
  };
  const err = await saveRow(() =>
    id ? db.update(projects).set(data).where(eq(projects.id, id)) : db.insert(projects).values(data),
  );
  if (err) return err;
  if (oldCover && oldCover !== coverImageKey) {
    await deleteObject(oldCover).catch(() => {});
  }
  await cleanupRemoved(oldGallery, imageKeys);
  revalidatePortfolio();
  redirect("/admin/projects");
}

export async function deleteProject(fd: FormData): Promise<void> {
  await requireOwner();
  const id = str(fd, "id");
  if (id) {
    const [row] = await db
      .select({ coverImageKey: projects.coverImageKey, imageKeys: projects.imageKeys })
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);
    await deleteRow(() => db.delete(projects).where(eq(projects.id, id)));
    if (row?.coverImageKey) await deleteObject(row.coverImageKey).catch(() => {});
    await cleanupRemoved(row?.imageKeys ?? [], []);
  }
  revalidatePortfolio();
  redirect("/admin/projects");
}

// ── Experiences ───────────────────────────────────────────────────────────
export async function saveExperience(
  _p: PortfolioState,
  fd: FormData,
): Promise<PortfolioState> {
  await requireOwner();
  const id = str(fd, "id");
  const org = str(fd, "org");
  const role = str(fd, "role");
  if (!org || !role) return { error: "Org and role are required." };
  const logoKey = str(fd, "logoKey") || null;
  try {
    await publishAsset(logoKey);
  } catch {
    return { error: "Couldn't process the logo. Try again." };
  }
  let oldLogo: string | null = null;
  if (id) {
    const [prev] = await db
      .select({ logoKey: experiences.logoKey })
      .from(experiences)
      .where(eq(experiences.id, id))
      .limit(1);
    oldLogo = prev?.logoKey ?? null;
  }
  const data = {
    org,
    role,
    startedAt: date(fd, "startedAt"),
    endedAt: date(fd, "endedAt"),
    location: str(fd, "location") || null,
    blurb: str(fd, "blurb"),
    body: str(fd, "body"),
    logoKey,
    sortOrder: num(fd, "sortOrder"),
    updatedAt: new Date(),
  };
  const err = await saveRow(() =>
    id ? db.update(experiences).set(data).where(eq(experiences.id, id)) : db.insert(experiences).values(data),
  );
  if (err) return err;
  if (oldLogo && oldLogo !== logoKey) await deleteObject(oldLogo).catch(() => {});
  revalidatePortfolio();
  redirect("/admin/experience");
}

export async function deleteExperience(fd: FormData): Promise<void> {
  await requireOwner();
  const id = str(fd, "id");
  if (id) {
    const [row] = await db
      .select({ logoKey: experiences.logoKey })
      .from(experiences)
      .where(eq(experiences.id, id))
      .limit(1);
    await deleteRow(() => db.delete(experiences).where(eq(experiences.id, id)));
    if (row?.logoKey) await deleteObject(row.logoKey).catch(() => {});
  }
  revalidatePortfolio();
  redirect("/admin/experience");
}

// ── Hackathons ──────────────────────────────────────────────────────────────
export async function saveHackathon(
  _p: PortfolioState,
  fd: FormData,
): Promise<PortfolioState> {
  await requireOwner();
  const id = str(fd, "id");
  const event = str(fd, "event");
  if (!event) return { error: "Event is required." };
  const coverImageKey = str(fd, "coverImageKey") || null;
  const imageKeys = jsonKeys(fd, "imageKeys");

  const explicit = str(fd, "slug");
  const slug = slugify(explicit || event);
  const [clash] = await db
    .select({ id: hackathons.id })
    .from(hackathons)
    .where(and(eq(hackathons.slug, slug), id ? ne(hackathons.id, id) : undefined))
    .limit(1);
  if (clash) return { error: `The slug "${slug}" is taken — choose another.` };

  const projectSlug = str(fd, "projectSlug") || null;
  if (projectSlug) {
    const [linkedProject] = await db
      .select({ slug: projects.slug })
      .from(projects)
      .where(eq(projects.slug, projectSlug))
      .limit(1);
    if (!linkedProject) return { error: `No project with slug "${projectSlug}" exists.` };
  }

  try {
    await publishAsset(coverImageKey);
    await publishAssets(imageKeys);
  } catch {
    return { error: "Couldn't process an image. Try again." };
  }

  let oldCover: string | null = null;
  let oldGallery: string[] = [];
  if (id) {
    const [prev] = await db
      .select({ coverImageKey: hackathons.coverImageKey, imageKeys: hackathons.imageKeys })
      .from(hackathons)
      .where(eq(hackathons.id, id))
      .limit(1);
    oldCover = prev?.coverImageKey ?? null;
    oldGallery = prev?.imageKeys ?? [];
  }

  const data = {
    slug,
    event,
    result: str(fd, "result"),
    happenedAt: date(fd, "happenedAt"),
    blurb: str(fd, "blurb"),
    body: str(fd, "body"),
    projectSlug,
    stack: csv(fd, "stack"),
    coverImageKey,
    imageKeys,
    sortOrder: num(fd, "sortOrder"),
    updatedAt: new Date(),
  };
  const err = await saveRow(() =>
    id ? db.update(hackathons).set(data).where(eq(hackathons.id, id)) : db.insert(hackathons).values(data),
  );
  if (err) return err;
  if (oldCover && oldCover !== coverImageKey) {
    await deleteObject(oldCover).catch(() => {});
  }
  await cleanupRemoved(oldGallery, imageKeys);
  revalidatePortfolio();
  redirect("/admin/hackathons");
}

export async function deleteHackathon(fd: FormData): Promise<void> {
  await requireOwner();
  const id = str(fd, "id");
  if (id) {
    const [row] = await db
      .select({ coverImageKey: hackathons.coverImageKey, imageKeys: hackathons.imageKeys })
      .from(hackathons)
      .where(eq(hackathons.id, id))
      .limit(1);
    await deleteRow(() => db.delete(hackathons).where(eq(hackathons.id, id)));
    if (row?.coverImageKey) await deleteObject(row.coverImageKey).catch(() => {});
    await cleanupRemoved(row?.imageKeys ?? [], []);
  }
  revalidatePortfolio();
  redirect("/admin/hackathons");
}

// ── Capabilities ────────────────────────────────────────────────────────────
export async function saveCapability(
  _p: PortfolioState,
  fd: FormData,
): Promise<PortfolioState> {
  await requireOwner();
  const id = str(fd, "id");
  const groupName = str(fd, "groupName");
  if (!groupName) return { error: "Group name is required." };
  const data = {
    groupName,
    items: csv(fd, "items"),
    sortOrder: num(fd, "sortOrder"),
    updatedAt: new Date(),
  };
  const err = await saveRow(() =>
    id ? db.update(capabilities).set(data).where(eq(capabilities.id, id)) : db.insert(capabilities).values(data),
  );
  if (err) return err;
  revalidatePortfolio();
  redirect("/admin/capabilities");
}

export async function deleteCapability(fd: FormData): Promise<void> {
  await requireOwner();
  const id = str(fd, "id");
  if (id) await deleteRow(() => db.delete(capabilities).where(eq(capabilities.id, id)));
  revalidatePortfolio();
  redirect("/admin/capabilities");
}
