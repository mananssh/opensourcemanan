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

/** `{ error }` is surfaced inline by AdminForm; identical shape to the blog's. */
export type PortfolioState = { error?: string };

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

/** Portfolio assets are public; make the uploaded object world-readable. */
async function publishImage(key: string | null): Promise<void> {
  if (key) await makePublic(key);
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
  const photoKey = str(fd, "photoKey") || null;
  try {
    await publishImage(photoKey);
  } catch {
    return { error: "Couldn't process the photo. Try again." };
  }
  const data = {
    name: str(fd, "name"),
    tagline: str(fd, "tagline"),
    intro: str(fd, "intro"),
    now: str(fd, "now"),
    email: str(fd, "email"),
    linkedin: str(fd, "linkedin"),
    github: str(fd, "github") || null,
    location: str(fd, "location"),
    languages: parseLanguages(str(fd, "languages")),
    photoKey,
    resumeKey: str(fd, "resumeKey") || null, // a URL or GCS key
    updatedAt: new Date(),
  };
  const [existing] = await db.select({ id: profile.id }).from(profile).limit(1);
  if (existing) {
    const [prev] = await db
      .select({ photoKey: profile.photoKey })
      .from(profile)
      .where(eq(profile.id, existing.id))
      .limit(1);
    await db.update(profile).set(data).where(eq(profile.id, existing.id));
    if (prev?.photoKey && prev.photoKey !== photoKey) {
      await deleteObject(prev.photoKey).catch(() => {});
    }
  } else {
    await db.insert(profile).values(data);
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

  const explicit = str(fd, "slug");
  const slug = slugify(explicit || name);
  const [clash] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.slug, slug), id ? ne(projects.id, id) : undefined))
    .limit(1);
  if (clash) return { error: `The slug "${slug}" is taken — choose another.` };

  try {
    await publishImage(coverImageKey);
  } catch {
    return { error: "Couldn't process the cover image. Try again." };
  }

  let oldCover: string | null = null;
  if (id) {
    const [prev] = await db
      .select({ coverImageKey: projects.coverImageKey })
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);
    oldCover = prev?.coverImageKey ?? null;
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
    featured: fd.get("featured") === "on",
    sortOrder: num(fd, "sortOrder"),
    updatedAt: new Date(),
  };
  try {
    if (id) await db.update(projects).set(data).where(eq(projects.id, id));
    else await db.insert(projects).values(data);
  } catch (e) {
    if (isUniqueViolation(e)) return { error: "That slug was just taken." };
    throw e;
  }
  if (oldCover && oldCover !== coverImageKey) {
    await deleteObject(oldCover).catch(() => {});
  }
  revalidatePortfolio();
  redirect("/admin/projects");
}

export async function deleteProject(fd: FormData): Promise<void> {
  await requireOwner();
  const id = str(fd, "id");
  if (id) {
    const [row] = await db
      .select({ coverImageKey: projects.coverImageKey })
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);
    await db.delete(projects).where(eq(projects.id, id));
    if (row?.coverImageKey) await deleteObject(row.coverImageKey).catch(() => {});
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
  const data = {
    org,
    role,
    startedAt: date(fd, "startedAt"),
    endedAt: date(fd, "endedAt"),
    location: str(fd, "location") || null,
    blurb: str(fd, "blurb"),
    body: str(fd, "body"),
    sortOrder: num(fd, "sortOrder"),
    updatedAt: new Date(),
  };
  if (id) await db.update(experiences).set(data).where(eq(experiences.id, id));
  else await db.insert(experiences).values(data);
  revalidatePortfolio();
  redirect("/admin/experience");
}

export async function deleteExperience(fd: FormData): Promise<void> {
  await requireOwner();
  const id = str(fd, "id");
  if (id) await db.delete(experiences).where(eq(experiences.id, id));
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

  const explicit = str(fd, "slug");
  const slug = slugify(explicit || event);
  const [clash] = await db
    .select({ id: hackathons.id })
    .from(hackathons)
    .where(and(eq(hackathons.slug, slug), id ? ne(hackathons.id, id) : undefined))
    .limit(1);
  if (clash) return { error: `The slug "${slug}" is taken — choose another.` };

  try {
    await publishImage(coverImageKey);
  } catch {
    return { error: "Couldn't process the cover image. Try again." };
  }

  let oldCover: string | null = null;
  if (id) {
    const [prev] = await db
      .select({ coverImageKey: hackathons.coverImageKey })
      .from(hackathons)
      .where(eq(hackathons.id, id))
      .limit(1);
    oldCover = prev?.coverImageKey ?? null;
  }

  const data = {
    slug,
    event,
    result: str(fd, "result"),
    happenedAt: date(fd, "happenedAt"),
    blurb: str(fd, "blurb"),
    body: str(fd, "body"),
    projectSlug: str(fd, "projectSlug") || null,
    stack: csv(fd, "stack"),
    coverImageKey,
    sortOrder: num(fd, "sortOrder"),
    updatedAt: new Date(),
  };
  try {
    if (id) await db.update(hackathons).set(data).where(eq(hackathons.id, id));
    else await db.insert(hackathons).values(data);
  } catch (e) {
    if (isUniqueViolation(e)) return { error: "That slug was just taken." };
    throw e;
  }
  if (oldCover && oldCover !== coverImageKey) {
    await deleteObject(oldCover).catch(() => {});
  }
  revalidatePortfolio();
  redirect("/admin/hackathons");
}

export async function deleteHackathon(fd: FormData): Promise<void> {
  await requireOwner();
  const id = str(fd, "id");
  if (id) {
    const [row] = await db
      .select({ coverImageKey: hackathons.coverImageKey })
      .from(hackathons)
      .where(eq(hackathons.id, id))
      .limit(1);
    await db.delete(hackathons).where(eq(hackathons.id, id));
    if (row?.coverImageKey) await deleteObject(row.coverImageKey).catch(() => {});
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
  if (id) await db.update(capabilities).set(data).where(eq(capabilities.id, id));
  else await db.insert(capabilities).values(data);
  revalidatePortfolio();
  redirect("/admin/capabilities");
}

export async function deleteCapability(fd: FormData): Promise<void> {
  await requireOwner();
  const id = str(fd, "id");
  if (id) await db.delete(capabilities).where(eq(capabilities.id, id));
  revalidatePortfolio();
  redirect("/admin/capabilities");
}
