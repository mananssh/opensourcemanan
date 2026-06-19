import { cache } from "react";
import { eq, asc, desc } from "drizzle-orm";
import { db } from "@/db/client";
import {
  profile,
  projects,
  experiences,
  hackathons,
  capabilities,
  type Profile,
  type Project,
  type Experience,
  type Hackathon,
  type Capability,
} from "@/db/schema";
import { safeDb } from "@/lib/blog/safe-db";

/**
 * Portfolio store — all content is public, so no session filtering. Reads are
 * deduped per request via cache() and resilient to the pre-migration window via
 * safeDb (shared with the blog).
 */

/** The singleton profile row (or null before it's seeded). */
export const getProfile = cache(async (): Promise<Profile | null> => {
  return safeDb(async () => {
    const rows = await db.select().from(profile).limit(1);
    return rows[0] ?? null;
  }, null);
});

export const listProjects = cache(
  async (opts?: { featuredOnly?: boolean }): Promise<Project[]> => {
    return safeDb(async () => {
      const rows = await db
        .select()
        .from(projects)
        .orderBy(asc(projects.sortOrder), asc(projects.name));
      return opts?.featuredOnly ? rows.filter((p) => p.featured) : rows;
    }, []);
  },
);

export const getProject = cache(async (slug: string): Promise<Project | null> => {
  return safeDb(async () => {
    const rows = await db
      .select()
      .from(projects)
      .where(eq(projects.slug, slug))
      .limit(1);
    return rows[0] ?? null;
  }, null);
});

export const listExperiences = cache(async (): Promise<Experience[]> => {
  return safeDb(async () => {
    // Newest first; nulls (undated) sink via sortOrder fallback.
    return db
      .select()
      .from(experiences)
      .orderBy(desc(experiences.startedAt), asc(experiences.sortOrder));
  }, []);
});

export const listHackathons = cache(async (): Promise<Hackathon[]> => {
  return safeDb(async () => {
    return db
      .select()
      .from(hackathons)
      .orderBy(asc(hackathons.sortOrder), desc(hackathons.happenedAt));
  }, []);
});

export const getHackathon = cache(
  async (slug: string): Promise<Hackathon | null> => {
    return safeDb(async () => {
      const rows = await db
        .select()
        .from(hackathons)
        .where(eq(hackathons.slug, slug))
        .limit(1);
      return rows[0] ?? null;
    }, null);
  },
);

/** By-id getters for the admin edit pages (content is public; no guard here —
 *  the admin routes themselves are owner-gated). */
export async function getProjectById(id: string): Promise<Project | null> {
  return safeDb(async () => {
    const rows = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    return rows[0] ?? null;
  }, null);
}
export async function getExperienceById(id: string): Promise<Experience | null> {
  return safeDb(async () => {
    const rows = await db.select().from(experiences).where(eq(experiences.id, id)).limit(1);
    return rows[0] ?? null;
  }, null);
}
export async function getHackathonById(id: string): Promise<Hackathon | null> {
  return safeDb(async () => {
    const rows = await db.select().from(hackathons).where(eq(hackathons.id, id)).limit(1);
    return rows[0] ?? null;
  }, null);
}
export async function getCapabilityById(id: string): Promise<Capability | null> {
  return safeDb(async () => {
    const rows = await db.select().from(capabilities).where(eq(capabilities.id, id)).limit(1);
    return rows[0] ?? null;
  }, null);
}

export const listCapabilities = cache(async (): Promise<Capability[]> => {
  return safeDb(async () => {
    return db
      .select()
      .from(capabilities)
      .orderBy(asc(capabilities.sortOrder), asc(capabilities.groupName));
  }, []);
});
