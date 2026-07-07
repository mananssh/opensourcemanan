import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

/**
 * Portfolio — the root vertical (/), and OSM's third content collection. All
 * content is DB-backed (no hardcoded profile.ts) and public; the owner authors
 * it via the owner-gated admin. Images (photo, résumé, covers) are R2 object
 * keys under the `portfolio/` prefix, served public via publicUrl(key).
 */

/** Singleton row — the "about me" core. One row; the store reads the first. */
export const profile = pgTable("profile", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull().default(""),
  tagline: text().notNull().default(""),
  intro: text().notNull().default(""),
  now: text().notNull().default(""), // present-tense "what I'm building" note
  email: text().notNull().default(""),
  linkedin: text().notNull().default(""),
  github: text(),
  location: text().notNull().default(""),
  languages: jsonb()
    .$type<{ name: string; level: string }[]>()
    .notNull()
    .default([]),
  photoKey: text(), // object-storage key for the hero portrait
  resumeKey: text(), // object-storage key for the résumé PDF
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const projects = pgTable(
  "projects",
  {
    id: uuid().primaryKey().defaultRandom(),
    slug: text().notNull().unique(),
    name: text().notNull(),
    blurb: text().notNull().default(""), // one tight sentence (card)
    body: text().notNull().default(""), // full detail (markdown), for the modal/page
    stack: text().array().notNull().default([]),
    links: jsonb().$type<{ label: string; url: string }[]>().notNull().default([]),
    award: text(), // e.g. "Won Yantra Central Hack 2024"
    year: text(),
    coverImageKey: text(),
    imageKeys: text().array().notNull().default([]), // detail gallery
    featured: boolean().notNull().default(false), // surfaced on the landing
    sortOrder: integer().notNull().default(0),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("projects_sort_idx").on(t.sortOrder)],
);

export const experiences = pgTable(
  "experiences",
  {
    id: uuid().primaryKey().defaultRandom(),
    org: text().notNull(),
    role: text().notNull(),
    startedAt: timestamp({ withTimezone: true }), // for timeline ordering
    endedAt: timestamp({ withTimezone: true }), // null = present
    location: text(),
    blurb: text().notNull().default(""),
    body: text().notNull().default(""),
    logoKey: text(),
    sortOrder: integer().notNull().default(0),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("experiences_sort_idx").on(t.startedAt)],
);

export const hackathons = pgTable(
  "hackathons",
  {
    id: uuid().primaryKey().defaultRandom(),
    slug: text().notNull().unique(),
    event: text().notNull(),
    result: text().notNull().default(""), // e.g. "Winner", "1st runner-up"
    happenedAt: timestamp({ withTimezone: true }),
    blurb: text().notNull().default(""),
    body: text().notNull().default(""),
    projectSlug: text(), // optional link to a project
    coverImageKey: text(),
    imageKeys: text().array().notNull().default([]),
    stack: text().array().notNull().default([]),
    sortOrder: integer().notNull().default(0),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("hackathons_sort_idx").on(t.sortOrder)],
);

export const capabilities = pgTable(
  "capabilities",
  {
    id: uuid().primaryKey().defaultRandom(),
    groupName: text().notNull(),
    items: text().array().notNull().default([]),
    sortOrder: integer().notNull().default(0),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("capabilities_sort_idx").on(t.sortOrder)],
);

export type Profile = typeof profile.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Experience = typeof experiences.$inferSelect;
export type Hackathon = typeof hackathons.$inferSelect;
export type Capability = typeof capabilities.$inferSelect;
