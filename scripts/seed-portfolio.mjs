#!/usr/bin/env node
/**
 * Seed the portfolio tables with Manan's real data. Idempotent: each table is
 * only seeded when empty, so re-running won't clobber edits you've made in the
 * admin. Pass --force to truncate + reseed all five tables.
 *
 * Run locally (Node 22+ loads .env):
 *   node --env-file=.env scripts/seed-portfolio.mjs
 *   node --env-file=.env scripts/seed-portfolio.mjs --force
 *
 * Photo / résumé are uploaded via the admin (they live on GCS, not here).
 * Copy marked TODO is placeholder — refine it in the admin once it's built.
 */
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set. Run with: node --env-file=.env scripts/seed-portfolio.mjs");
  process.exit(1);
}
const force = process.argv.includes("--force");
const sql = postgres(url, { max: 1 });

const d = (s) => (s ? new Date(s) : null);

const profileRow = {
  name: "Manan Shah",
  tagline: "Building @ Kello · Ex-Amazon", // TODO: sharper one-liner
  intro:
    "Final-year CS @ VIT Vellore. Software engineer who ships across full-stack, ML/CV, and AI infrastructure. Repeat hackathon winner. Aviation geek.", // TODO: refine
  now: "Building at Kello, an early-stage AI startup — shipping the product and the infrastructure under it.", // TODO: refine
  email: "manan04shah@gmail.com",
  linkedin: "https://linkedin.com/in/manan-shah-0918",
  github: null,
  location: "Mumbai, India",
  languages: [
    { name: "English", level: "native" },
    { name: "Hindi", level: "native" },
    { name: "Gujarati", level: "native" },
    { name: "French", level: "professional working" },
    { name: "Marathi", level: "limited" },
  ],
};

const projectRows = [
  {
    slug: "scriptsync",
    name: "ScriptSync",
    blurb:
      "Multilingual video translation done right — synced audio and on-screen text re-rendered in place, not just subtitles.",
    body: "Translates a video end to end: audio split per sentence with timing preserved and re-synced, plus on-screen text (notes, slides, handwriting) detected and re-rendered in place via computer vision. Built in 40 hours.",
    stack: ["Computer Vision", "Python", "React.js", "FastAPI"],
    links: [],
    award: "Won Yantra Central Hack 2024 (750 students, 123 teams)",
    year: "2024",
    featured: true,
    sortOrder: 0,
  },
  {
    slug: "forreal",
    name: "ForReal.",
    blurb:
      "A CNN that detects AI-generated / deepfaked audio and images at 93%+ accuracy.",
    body: "Trained on MFCC features of 80k+ audio files and 40k+ images to flag synthetic media. 93%+ accuracy.",
    stack: ["TensorFlow", "Keras", "CNNs", "React.js"],
    award: "2nd at Code4Change 2024",
    year: "2024",
    featured: true,
    sortOrder: 1,
  },
  {
    slug: "smart-board",
    name: "Smart-board",
    blurb:
      "Turns any surface into an interactive smartboard with just a phone camera.",
    body: "Gesture detection + computer vision + LLMs turn any surface into an interactive smartboard for a more immersive classroom — no hardware beyond a phone camera.",
    stack: ["Computer Vision", "LLMs", "Python"],
    award: "Won DevSOC 2025 (Healthcare & Education track)",
    year: "2025",
    featured: true,
    sortOrder: 2,
  },
  {
    slug: "visual-novel-generator",
    name: "Visual-novel generator",
    blurb:
      "Turns any text into an immersive audio-visual experience with a scored soundtrack.",
    body: "Generates a visual-novel-style experience from arbitrary text, complete with scored background music.",
    stack: ["Python", "Generative AI", "React.js"],
    award: "3rd at DevJams 2024",
    year: "2024",
    featured: false,
    sortOrder: 3,
  },
  {
    slug: "unipool",
    name: "UniPool",
    blurb: "A carpool app for university students — search, host, request, budget.",
    body: "Carpooling for students: search or host rides, send requests, and split budgets.",
    stack: ["React Native", "Go", "TypeScript", "Docker"],
    year: "2024",
    featured: false,
    sortOrder: 4,
  },
  {
    slug: "rubiks-cube-solver",
    name: "Rubik's Cube Solver",
    blurb: "A full-stack solver using Kociemba's algorithm and God's number.",
    body: "Solves any cube state with Kociemba's two-phase algorithm, bounded by God's number.",
    stack: ["Python", "FastAPI", "JavaScript"],
    featured: false,
    sortOrder: 5,
  },
];

const experienceRows = [
  {
    org: "Kello",
    role: "Software Engineer",
    startedAt: "2026-01-01",
    endedAt: null,
    location: "Bengaluru",
    blurb: "Building at a small, early-stage AI team.",
    body: "", // TODO
    sortOrder: 0,
  },
  {
    org: "Amazon",
    role: "SDE-I Intern",
    startedAt: "2025-07-01",
    endedAt: "2025-12-31",
    location: "Bengaluru",
    blurb:
      "Built the org's AI-initiative foundation — led the single-source-of-truth MCP server architecture across the organisation.",
    body: "Led development of the organisation's single-source-of-truth MCP server architecture — the foundation its AI initiatives build on.",
    sortOrder: 1,
  },
  {
    org: "VouchrIt",
    role: "Software Development Intern",
    startedAt: "2024-06-01",
    endedAt: "2024-08-31",
    location: "Mumbai",
    blurb: "",
    sortOrder: 2,
  },
  {
    org: "Vifr Technologies",
    role: "Research Intern",
    startedAt: "2023-01-01",
    endedAt: "2023-07-31",
    location: "Vellore",
    blurb: "",
    sortOrder: 3,
  },
  {
    org: "ACM-VIT",
    role: "Chapter leadership",
    startedAt: "2023-01-01",
    endedAt: null,
    location: "Vellore",
    blurb:
      "Core member → Senior Core → Chairperson → Advisory; helped lead a ~177-member chapter.",
    sortOrder: 4,
  },
];

const hackathonRows = [
  {
    slug: "yantra-2024",
    event: "Yantra Central Hack 2024",
    result: "Winner",
    happenedAt: "2024-01-01",
    blurb: "ScriptSync — multilingual video translation, built in 40 hours.",
    projectSlug: "scriptsync",
    stack: ["Computer Vision", "Python", "React.js", "FastAPI"],
    sortOrder: 0,
  },
  {
    slug: "code4change-2024",
    event: "Code4Change 2024",
    result: "1st runner-up",
    happenedAt: "2024-01-01",
    blurb: "ForReal. — deepfake detection at 93%+ accuracy.",
    projectSlug: "forreal",
    stack: ["TensorFlow", "Keras", "CNNs"],
    sortOrder: 1,
  },
  {
    slug: "devsoc-2025",
    event: "DevSOC 2025",
    result: "Track Winner — Healthcare & Education",
    happenedAt: "2025-01-01",
    blurb: "Smart-board — any surface into an interactive smartboard.",
    projectSlug: "smart-board",
    stack: ["Computer Vision", "LLMs"],
    sortOrder: 2,
  },
  {
    slug: "devjams-2024",
    event: "DevJams 2024",
    result: "3rd place",
    happenedAt: "2024-01-01",
    blurb: "Visual-novel generator — text into a scored audio-visual experience.",
    projectSlug: "visual-novel-generator",
    stack: ["Python", "Generative AI"],
    sortOrder: 3,
  },
];

const capabilityRows = [
  { groupName: "Languages", items: ["TypeScript", "Python", "Go", "C++", "Java", "JavaScript"], sortOrder: 0 },
  { groupName: "Frontend", items: ["React", "Next.js", "React Native", "Tailwind"], sortOrder: 1 },
  { groupName: "Backend", items: ["Node", "Express", "FastAPI", "Flask", "Django", "Spring"], sortOrder: 2 },
  { groupName: "AI / ML", items: ["TensorFlow", "Keras", "CNNs", "Computer Vision", "applied ML"], sortOrder: 3 },
  { groupName: "Cloud / infra", items: ["AWS", "AWS CDK", "Docker", "MCP architecture"], sortOrder: 4 },
];

async function isEmpty(table) {
  const [{ count }] = await sql`select count(*)::int as count from ${sql(table)}`;
  return count === 0;
}

async function seed(table, rows, insert) {
  if (force) await sql`truncate table ${sql(table)}`;
  if (!force && !(await isEmpty(table))) {
    console.log(`• ${table}: not empty — skipped (use --force to reseed)`);
    return;
  }
  for (const r of rows) await insert(r);
  console.log(`✓ ${table}: ${rows.length} rows`);
}

try {
  await seed("profile", [profileRow], (p) => sql`
    insert into profile (name, tagline, intro, now, email, linkedin, github, location, languages)
    values (${p.name}, ${p.tagline}, ${p.intro}, ${p.now}, ${p.email}, ${p.linkedin}, ${p.github}, ${p.location}, ${JSON.stringify(p.languages)}::jsonb)`);

  await seed("projects", projectRows, (p) => sql`
    insert into projects (slug, name, blurb, body, stack, links, award, year, featured, sort_order)
    values (${p.slug}, ${p.name}, ${p.blurb}, ${p.body ?? ""}, ${p.stack}, ${JSON.stringify(p.links ?? [])}::jsonb, ${p.award ?? null}, ${p.year ?? null}, ${p.featured ?? false}, ${p.sortOrder})`);

  await seed("experiences", experienceRows, (e) => sql`
    insert into experiences (org, role, started_at, ended_at, location, blurb, body, sort_order)
    values (${e.org}, ${e.role}, ${d(e.startedAt)}, ${d(e.endedAt)}, ${e.location ?? null}, ${e.blurb ?? ""}, ${e.body ?? ""}, ${e.sortOrder})`);

  await seed("hackathons", hackathonRows, (h) => sql`
    insert into hackathons (slug, event, result, happened_at, blurb, body, project_slug, stack, sort_order)
    values (${h.slug}, ${h.event}, ${h.result}, ${d(h.happenedAt)}, ${h.blurb ?? ""}, ${h.body ?? ""}, ${h.projectSlug ?? null}, ${h.stack ?? []}, ${h.sortOrder})`);

  await seed("capabilities", capabilityRows, (c) => sql`
    insert into capabilities (group_name, items, sort_order)
    values (${c.groupName}, ${c.items}, ${c.sortOrder})`);

  console.log("done");
} finally {
  await sql.end();
}
