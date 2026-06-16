# Changelog

## 2026-06-16

- **12:37 · `ef0241a` · perf:** Cache MDX compilation so posts don't recompile Shiki per request
  Properly resolve DA #3 without route-level static rendering (which 500'd gated
  posts, ADR 0011). The post route stays dynamic for visibility gating, but the
  expensive MDX compile (runs Shiki) is wrapped in unstable_cache keyed by the
  source — identical content compiles once and is reused across requests; editing
  a post changes the source and recompiles. Renders via @mdx-js/mdx compile/run,
  keeping the body server-rendered RSC with MDX components intact (replaces
  next-mdx-remote). See ADR 0012.
- **12:27 · `ecbc337` · fix:** Fix 500 on gated blog posts (revert route-level static rendering)
  Gated posts 500'd in production with DYNAMIC_SERVER_USAGE: route-level
  `revalidate`/`generateStaticParams` put the post route in static mode, but the
  gated path reads the session (cookies), which is disallowed during static
  generation. Reverted the post route to fully dynamic so visibility gating works
  again (public 200, gated → sign-in). The DA #3 perf goal will be met by caching
  MDX compilation instead of route-level static rendering (ADR 0011 updated).
- **12:13 · `8f7a4f5` · feat:** Spotify-style category tiles + static/ISR rendering for public posts
  - Categories now read as real sections, not tags: each has an accent color and
    an optional cover image, rendered as Spotify-style genre tiles under a "Browse"
    subheading (color block + title + merged corner art). Posts list under a
    "Latest" subheading, newest-first (explicit publishedAt desc tiebreak).
  - Public blog posts now render statically/ISR (generateStaticParams +
    getPublicPost, no session read) so MDX + Shiki aren't recompiled per request;
    gated posts stay dynamic via the session-aware path (ADR 0011, resolves the
    deferred DA #3). Adds accentColor + coverImageKey to categories (migration).
- **11:52 · `e5e61c8` · feat:** Blog Phase 1 — Kinetic Mono theme, posts/categories, public reading, SEO
  The blog at /blog, built as the first content system on the shared primitives.
  
  - Per-vertical theming (ADR 0010): font tokens generalized; a .vertical-blog
    scope gives the blog its own "Kinetic Mono" look (Archivo / Hanken Grotesk /
    JetBrains Mono, high-contrast + hot vermilion accent), light and dark. Editorial
    pages moved into an (site) route group with their own chrome; /blog has its own.
  - First real DB tables: posts + categories (visibility enum) and migration.
  - Visibility layer (public/authed/allowlist/owner, most-restrictive) enforced
    server-side in the store; gated rows never reach the client or sitemap/RSS.
  - MDX posts via next-mdx-remote/rsc with code highlighting (Shiki, dual theme),
    auto heading anchors + table of contents, and reading-time.
  - Listing, post detail, and category landing pages (category description hero).
  - Core SEO: per-post metadata, JSON-LD, sitemap, robots, RSS feed. /blog in nav.
  
  Authoring (admin) comes in Phase 2; pages render a graceful empty state until
  there are posts.
- **10:43 · `6b9b1af` · fix:** Make the shared bucket private with per-object access (safe by default)
  Revise the storage primitive so the GCS bucket is no longer blanket-public —
  which would have exposed every vertical's files and gated content's images.
  The bucket is now private; objects are private by default and read via
  short-lived signed URLs (getReadUrl) only for authorized viewers. An object is
  world-readable only via an explicit makePublic(key) (public post covers, OG
  images → stable CDN publicUrl). Keeps one bucket safe for every vertical.
  Updated ADR 0009 and agent-kit/storage.md (bucket stays private, fine-grained
  ACLs, no allUsers).
- **10:25 · `b4d7410` · feat:** Add the shared GCS storage primitive (presigned uploads, key-in-DB)
  Third shared resource alongside DB and auth: one Google Cloud Storage bucket
  (opensourcemanan) for the whole site. lib/storage/gcs.ts exposes
  createUploadUrl (presigned v4 PUT), publicUrl, and deleteObject; keys are
  namespaced per vertical (blog/…, projects/…) and the DB stores the key, not the
  blob. An owner-gated POST /api/storage/upload-url issues upload URLs so the
  browser uploads straight to GCS. Objects are public-read (CDN-cacheable). Lazy
  singleton client — build-safe without creds. Docs: agent-kit/storage.md,
  ADR 0009; requires GCP_SERVICE_ACCOUNT (+ optional GCS_BUCKET).
- **09:08 · `95fcd1f` · feat:** Add NextAuth v5 (Google OAuth) as the shared Access-axis primitive
  NextAuth v5 (Auth.js) with Google OAuth and JWT sessions, configured once in
  lib/auth.ts. Features declare access via server-side guards — requireAuth()
  (any signed-in user) and requireOwner() (OWNER_EMAILS allowlist) — never
  re-checking sessions themselves. Adds the route handler, session typing, and an
  editorial /sign-in page (server-action sign in/out). Checks run server-side, not
  in Proxy (Next 16's renamed Middleware), per Next 16 guidance. Requires
  AUTH_SECRET, AUTH_GOOGLE_ID/SECRET, OWNER_EMAILS (ADR 0008).
- **08:36 · `88a9944` · feat:** Add the shared CockroachDB database primitive (Drizzle)
  Stand up the shared Data-axis foundation: one CockroachDB (Postgres-compatible)
  database that every feature adds tables to. Drizzle ORM + drizzle-kit provide
  the TypeScript schema, migrations, and type-safe queries; `db/client.ts` is a
  lazy serverless-safe singleton and `db/schema/index.ts` is the aggregation
  point. The rule — change the schema file, run `npm run db:generate`, commit the
  migration — is enforced by a new "DB schema in sync" CI check, and a Migrate
  workflow applies migrations on merge to main. No feature tables yet; the
  pipeline is ready for the first one. Requires a DATABASE_URL secret (ADR 0007).

## 2026-06-15

- **22:59 · `83fa062` · refactor:** Extract a single page-width container and widen the measure
  The page width was hardcoded as `max-w-2xl` in five places (header, footer,
  and all three pages). Extracted it into one `container-editorial` utility in
  the design system, so the site measure is a single source of truth — change it
  once, everywhere. Widened from 42rem to 48rem (max-w-3xl) so wide screens feel
  less empty while keeping an editorial line length.
- **22:50 · `b652c64` · feat:** Add the /osm manifesto page
  A single public page at /osm describing what OSM is, in a few punchy words.
  Heightens the Editorial Logbook system (no divergence): oversized Fraunces
  hero with a pulsing accent, a ghosted OSM watermark for depth, a mono ethos
  strip, and a printed-style colophon. Staggered CSS-only reveal on load
  (respects prefers-reduced-motion), light + dark via tokens (ADR 0005), design
  reviewed first (ADR 0006). Reusable `.reveal`/`.accent-pulse` motion primitives
  added to the design system; reachable via a config-driven "About" nav entry.
- **22:34 · `9fc3221` · feat:** Color-code changelog type tags and show commit time
  Each changelog entry's type (feat/fix/perf/refactor/docs/test/chore/ci) now
  renders as a highlighted chip with its own muted, paper-harmonized color —
  defined for both light and dark (ADR 0005). The commit time (HH:MM) is shown
  alongside the short hash in each entry's meta line.
- **22:00 · `3d63698` · feat:** Editorial Logbook design system, OSM rebrand, and mandatory light/dark theming
  Give OSM a real identity, replacing the untouched create-next-app look.
  
  - **Editorial Logbook** aesthetic: Fraunces (display) + Newsreader (body) +
    JetBrains Mono, warm paper/ink palette with an oxblood/terracotta accent,
    subtle paper grain, hairline rules, small-caps mono labels.
  - **Semantic design tokens** in `globals.css`, defined for both themes — the
    shared UI-primitive layer features build on.
  - **Mandatory light/dark toggle** as a global primitive (next-themes +
    `ThemeToggle`), class-based, no flash. Every feature must support both modes
    (ADR 0005).
  - **Rebrand to OSM**: wordmark in header/footer; "Manan Shah" now appears once,
    quietly, in the footer.
  - Redesigned the home page (journal masthead + config-driven section index) and
    the /changelog page (editorial treatment).
  - **Process**: new `/design-review` skill and a conscious-design-review
    requirement before building UI (ADR 0006); conventions and Definition of Done
    updated with both rules.
- **16:22 · `614e103` · fix:** Merge same-day changelog entries under one date heading
  `scripts/compile-changelog.mjs` now folds new entries into an existing
  same-date section (newest on top) instead of prepending a duplicate
  `## YYYY-MM-DD` heading, so shipping multiple times in one day no longer
  splits the changelog into repeated date groups. `lib/changelog.ts` also
  coalesces duplicate date headings defensively when parsing, and the
  already-duplicated CHANGELOG.md is collapsed into a single section.
- **14:47 · `5a6e2f1` · feat:** Add a public /changelog page rendered from the changeset system
  The changelog is now a public artifact at `/changelog`, rendered as a
  polished, Vercel-style page. It's built as a system, not static content:
  `lib/changelog.ts` parses the compiled `CHANGELOG.md` into structured
  entries (the changelog store), and `app/changelog/page.tsx` renders them
  server-side with per-type badges, commit hashes, and Markdown bodies.
  Source of truth stays the changeset pipeline — no duplication. Also adds a
  config-driven site header (`lib/site-nav.ts`) so new sections become
  reachable by editing a list. Markdown (not MDX) per ADR 0003.
- **14:47 · `5a6e2f1` · ci:** Automate changelog compilation on merge to main
  Add a Release workflow that compiles pending changesets into CHANGELOG.md
  after every merge to main and opens a small auto-merging PR with the
  result — so /changelog updates itself without weakening branch protection.
  Requires a RELEASE_TOKEN PAT (see ADR 0004). Closes the gap where the
  changelog only updated via a manual `npm run changelog`.
- **19:53 · `6b71af4` · fix:** Use the directory/SKILL.md layout for project skills
  Project skills must live at `.claude/skills/<name>/SKILL.md` (the skill
  name derives from the directory) to be discovered by Claude Code. Moved
  the five flat `.claude/skills/<name>.md` files into that layout so
  /commit, /ship, /oss-check, /devils-advocate, and /feature appear.
- **19:53 · `6b71af4` · chore:** Establish the agentic coding architecture
  Set up the foundation for safe, DRY, extensible development:
  agent-kit/ as the single source of truth for conventions, the four-axis
  model, and the systems-not-static principle; docs/ with architecture and
  ADRs; a homegrown changeset system; Claude Code skills (/commit, /ship,
  /oss-check, /devils-advocate, /feature); and CI with typecheck, lint,
  build, gitleaks secret scanning, and a changeset-present check.
