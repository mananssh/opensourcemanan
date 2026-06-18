# Changelog

## 2026-06-18

- **08:05 · `e99687d` · fix:** Stop sticky-note styles leaking onto every navbar
  The Thought Dump note styles used a `.sticky` class, which collides with
  Tailwind's `sticky` position utility that every vertical's sticky header uses —
  so the "tape" pseudo-element and hover/lift transform leaked onto all navbars.
  Renamed to `.sticky-note` (scoped to the dump notes only).
- **08:00 · `3c7b30c` · feat:** New vertical — Thought Dump, a sticky-note wall (text + images, public/private)
  The second content collection: a playful corkboard of sticky-note thoughts.
  - Two visibility modes mapped onto the shared gate — public (any signed-in user)
    and private (owner only); zero new auth code.
  - New "Sticky Desk" theme (.vertical-dump) with a handwriting font (Caveat),
    auto-assigned pastel notes with a slight tilt + tape, both light and dark.
  - Owner posts inline (text + one optional image); images are stored privately
    and served via short-lived signed URLs (so a public note's image still needs
    a login), not made world-readable.
  - Masonry wall + per-thought permalink (login-gated, noindexed); owner inline
    controls (pin, make public/private, delete-soft). Reuses storage, auth,
    visibility, theming tokens, motion, and the image-upload primitive.

## 2026-06-17

- **22:42 · `9d627d6` · ops:** Run the deployment prune on every merge to main
  The prune-deployments workflow now also triggers on push to main, so the
  deployment created by each merge is pruned down to the keep window right away
  (latest 3 production + 5 previews) instead of accumulating until the weekly cron.
  The weekly cron and manual dispatch remain as a safety net.
- **21:45 · `fa975b4` · feat:** Blog engagement — optimistic reactions, threaded/moderated/rate-limited comments, bookmarks
  Addresses the blog audit (§6, excluding telemetry/newsletter):
  - Reactions now update optimistically (instant heart + count) via useOptimistic.
  - Comments: one level of threaded replies, a per-user rate limit (5/min), and an
    inline error channel; owner moderation (hide/show) from the admin dashboard
    with a "hidden" badge — hidden comments drop from the public thread. The admin
    comment list is the in-app notification surface (email notify needs a provider,
    which is out of scope here).
  - Bookmarks: signed-in readers can save posts (optimistic Save button) and view
    them at /blog/bookmarks ("Saved" in the blog header).
- **21:34 · `1d1538f` · feat:** Blog data model & scale — indexes, scheduled publish, soft delete, featured, pagination
  Addresses the blog audit (§5):
  - Indexes on posts(status, publishedAt), posts(categoryId), comments(postId,
    createdAt) so listings are index-backed, not full scans.
  - Scheduled publishing: a future publishedAt with status published keeps a post
    hidden until its time (a single livePost() predicate enforces published +
    not-deleted + publishedAt <= now across every visitor query, detail access,
    feeds, sitemap and view counting).
  - Soft delete: deleting a post sets deletedAt (recoverable; comments/reactions/
    views and the cover image are kept) and it drops out of every list.
  - Featured posts: a flag + a "Featured" strip on the blog index.
  - Editor gains a publish-date (datetime-local) field and a Featured checkbox.
  - Search escapes LIKE wildcards (% and _ matched literally).
  - Blog index is paginated.
- **21:19 · `2d22246` · feat:** Blog reader UX & MDX polish — figures, accurate TOC, share, prev/next, footnotes
  Addresses the blog audit (§4):
  - Markdown images render as lazy <figure> elements (loading=lazy, decoding=async)
    with an optional caption from the image title.
  - Reading time strips code/JSX/markdown before counting and is sourced from the
    stored column everywhere (single source of truth).
  - The table of contents is collected during the same rehype pass that assigns
    heading ids, so anchors can never drift from the headings.
  - Heading self-links use an appended "#" affordance (aria-labelled) instead of
    wrapping the whole heading in an unannounced link.
  - Syntax-highlight token colors are scoped to code spans; line/word highlights
    now have theme-aware backgrounds (+ optional line numbers).
  - Added share controls (copy link + X), prev/next post navigation, and footnote
    styling.
- **21:09 · `7de6f65` · fix:** Blog accessibility pass — focus, skip link, ARIA, contrast, accessible TOC
  Addresses the blog audit (§3):
  - Skip-to-content link in both layouts (+ focusable #content target).
  - One global visible :focus-visible ring; removed color-only focus on search and
    admin inputs.
  - Reaction button exposes aria-pressed + a descriptive aria-label; copy-code
    buttons get an aria-label, a polite "Code copied" live region, and stay visible
    on touch devices.
  - --faint bumped to ≥4.5:1 (AA) in all four palettes; category tiles get a dark
    scrim so white labels stay legible on any accent color.
  - Table of contents is now a labelled landmark with a properly nested list, and
    shows as a collapsible panel above the article on mobile (was stranded below).
  - Scroll-to-top honors prefers-reduced-motion; progress bar marked decorative.
- **21:00 · `6d5f134` · feat:** Blog SEO pass — metadata, canonical, JSON-LD, richer RSS + JSON/per-category feeds
  Addresses the blog audit (§2):
  - Set metadataBase so OG/canonical/Twitter URLs resolve absolutely.
  - Per-post canonical, Twitter summary_large_image, OG url/modifiedTime, and
    robots noindex on drafts. Category/tag pages get canonicals + OG.
  - Post JSON-LD now includes author, image (OG), mainEntityOfPage, publisher and
    a BreadcrumbList; site-wide Person + WebSite JSON-LD added.
  - RSS rewritten: atom self-link, content/dc namespaces, language, lastBuildDate,
    per-item author + category, always-present description (excerpt or truncated
    body) + content:encoded; correct XML escaping. Auto-discovery <link> added.
  - New JSON Feed (/blog/feed.json) and per-category RSS
    (/blog/category/<slug>/feed.xml, public categories only).
  - Sitemap: dropped meaningless static-route lastmod, added category + tag pages,
    set changefreq/priority.
- **20:52 · `a144d29` · fix:** Harden blog security & data integrity (view endpoint, slugs, transactions, uploads)
  Closes the edge-case risks from the blog audit (§1):
  - View endpoint now validates a well-formed UUID maps to a published post and
    de-dupes per browser via a daily cookie — no more counting drafts or inflating
    via arbitrary IDs.
  - Duplicate slugs no longer crash the save: auto-derived slugs disambiguate
    (-2, -3…), explicitly-typed collisions return an inline error via a new
    action-state channel on the post/category forms (plus an unsaved-changes guard).
  - Post write + tag rewrite run in one transaction; cover-image publish failures
    abort the save instead of saving a broken reference.
  - safeDb only swallows true pre-setup errors (SQLSTATE 42P01 / missing
    DATABASE_URL), not any "does not exist" message.
  - Admin reads each call requireOwner() (guard co-located with the data, not just
    the layout).
  - Upload hardening: image-type allowlist (SVG blocked), 10 MB client cap, 5-min
    presign expiry, make-public validates the key prefix. Orphaned GCS objects are
    deleted on cover replace and on post/category delete. Inline category create no
    longer silently renames an existing category.
- **14:28 · `65dbbec` · feat:** Wider category art, shared vertical footer, changelog activity charts
  Three UI touches:
  - Blog category tiles: the corner cover image is wider so the tile reads less
    empty, keeping its vertical position.
  - New shared `VerticalFooter` — every vertical (currently /blog) gets quiet
    "← OSM" and "Changelog" links back to the common union, themed per vertical
    via semantic tokens. Verticals stay visually independent; only the home/log
    links are shared.
  - Changelog gains a minimal activity panel above the log: a GitHub-style
    contribution heatmap in accent intensities (our orange) and a
    type-distribution bar, both hand-rolled from the existing palette and design
    tokens (no charting lib). Type vocabulary synced to the commit taxonomy (adds
    style/build/ops; keeps ci for historical entries).
- **13:44 · `b12b621` · build:** Adopt fuller commit/changeset type taxonomy (adds ops, build, style)
  Documented the full Conventional Commits type set in agent-kit/commit-and-pr.md
  (feat, fix, refactor, perf, style, test, docs, build, ops, chore) with a table,
  optional scopes, and the `!` breaking-change indicator, based on qoomon's
  taxonomy. Notably `ops` (infra/CI/CD/deploy) and `build` (build tooling/deps)
  now have a home instead of being lumped into chore/feat. The changelog compiler
  and .changeset/README accept the same vocabulary (dropped the unused `ci` in
  favor of `ops`).
- **13:27 · `ae5cfc0` · feat:** Prune workflow gains a dry_run dispatch input
  The Prune deployments workflow now has a `dry_run` boolean dispatch input. When
  checked, it sets DRY_RUN=1 so the run lists what would be deleted and deletes
  nothing — making it safe to preview the delete list from the Actions tab before
  a real prune.
- **13:21 · `7f32b61` · feat:** Prune keeps latest 3 production + 5 preview deployments
  The deployment prune script previously kept every production deployment. It now
  keeps the latest 3 production (PRUNE_KEEP_PRODUCTION) alongside the latest 5
  previews (PRUNE_KEEP) and deletes the rest, sorted by recency. The live
  production deployment is always newest so it's always retained; the rollback
  window shrinks to the last 3 production builds. ADR 0013 + workflow input updated.
- **13:07 · `30d9cad` · feat:** Preview-deployment strategy — OAuth redirect proxy, build skip, pruning
  Handle Vercel deployment sprawl + preview sign-in (ADR 0013):
  - NextAuth redirectProxyUrl (AUTH_REDIRECT_PROXY_URL) so one Google redirect URI
    (prod) covers OAuth on every hashed preview deployment.
  - A Vercel Ignored Build Step script that skips deploys for the automated
    release/changelog and dependabot branches.
  - A prune script (npm prune-deploys) + weekly workflow that keep production and
    the latest 5 previews and delete the rest via the Vercel API (prod untouched;
    no-ops without VERCEL_* secrets).
- **12:16 · `066ed5b` · feat:** Edit + Delete controls directly on the admin posts/categories lists
  Surface editing and deletion of posts and categories right on the admin
  dashboard: each post and category row now has explicit Edit and Delete actions
  (delete asks for confirmation and shows a pending state). Previously editing
  meant clicking the title and delete lived only on the edit page.
- **12:00 · `ea2540a` · fix:** Wider, legible post editor (themed) + local draft autosave
  Fix the post editor reported issues: the create/edit form is now full-width
  (was a narrow left-aligned column); the editor content reuses the blog's prose
  styles so headings (h1–h6), paragraphs, lists, and task-list checkboxes render
  correctly inside the editor; and MDXEditor's theme variables are mapped onto our
  design tokens so it follows the light/dark palette and everything is legible
  (replacing the unreliable dark-theme toggle). Adds local draft autosave: the
  body is saved to localStorage as you type and restored on return (with a Discard
  option), so progress isn't lost to an accidental refresh/close.
- **11:24 · `365aeb6` · chore:** Favicon is now a lowercase serif "m."
  Render the favicon monogram in lowercase serif (Fraunces, the site display
  face) — "m." with the accent period. The serif font is fetched at build time
  since the icon route is static, with a graceful fallback.
- **11:12 · `5592cce` · chore:** Favicon monogram is now "M." instead of "o."
  Swap the favicon monogram from "o." to "M." — the period stays the brand accent.
- **11:08 · `ec0e6f0` · feat:** WYSIWYG MDX post editor (with image upload) + inline category creation
  The post body is now a full WYSIWYG MDX editor (@mdxeditor/editor): toolbar,
  formatting, links, tables, code blocks, a source-mode toggle for raw MDX, and a
  generic editor for custom components like <Callout>. Inserting an image uploads
  it straight to GCS (presigned PUT + made public) and drops it in at the cursor.
  The category field gains an inline "+ New category" that creates one without
  leaving the editor. New owner-gated routes: /api/storage/make-public and
  /api/blog/categories.
- **10:45 · `c9b7f5b` · fix:** Loading/pending state on all server-action buttons + comment delete
  Every button that runs a server action (reactions, post comment, admin save/
  delete/publish, comment moderation, sign in/out) now disables itself and shows
  a loading label while submitting (via a shared useFormStatus SubmitButton) — so
  there's clear feedback and rapid multi-clicks can no longer fire duplicate
  submissions (the cause of duplicate comments). Also: comment authors can delete
  their own comments, and the owner can delete any. Admin Save/Delete are split
  into separate forms so each shows an accurate pending state.
- **09:27 · `57a4518` · feat:** Polish — live MDX preview in the editor + nicer admin styling
  Admin polish: the post editor's MDX body now has a Write/Preview toggle with a
  live (approximate) render — Callouts and syntax highlighting still appear on the
  published page. The admin dashboard, forms, and nav are restyled into the
  Kinetic-Mono identity (cards, pill nav, better depth/spacing) while staying
  functional.
- **09:19 · `1bb98e3` · feat:** Polish — branded 404s, favicon, site/blog OG images, and post reading UX
  Site identity: a real OSM favicon (icon.tsx "o." monogram), branded 404 pages
  (editorial root + Kinetic-Mono blog), and default Open Graph cards for the
  editorial site and the blog (joining the per-post OG cards) so every page
  previews nicely when shared.
  
  Post reading polish: a top scroll-progress bar, a scroll-to-top button, and
  copy buttons on code blocks.
- **08:06 · `6f3baee` · feat:** Blog distribution — dynamic OG images + newsletter capture
  Phase 5 of the blog.
  
  - Dynamic per-post Open Graph images via next/og (1200x630, branded with the
    post title + category); auto-wired into each post's metadata. Session-less,
    effectively-public posts only.
  - Newsletter capture: an email signup form on the blog index (subscribe server
    action + useActionState client form), storing addresses in a subscribers
    table (provider integration deferred). Admin shows the subscriber count.

## 2026-06-16

- **16:55 · `ce2f61f` · feat:** Blog engagement — reactions, comments, and view counts
  Phase 4 of the blog.
  
  - Reactions: one like per signed-in user per post (toggle); count shown on the
    post. Clicking while signed out redirects to sign-in.
  - Comments: signed-in users post plaintext comments (shown immediately); the
    owner moderates (deletes) from the admin dashboard. Anonymous visitors see a
    sign-in prompt.
  - View counts: a per-post counter incremented once per browser session via a
    fire-and-forget beacon; shown in the post meta.
  
  Adds reactions/comments/post_views tables (migration) + a shared safe-db read
  helper (DRY).
- **14:58 · `477ba96` · feat:** Blog discovery — tags, search, and related posts
  Phase 3 of the blog.
  
  - Tags: tags + post_tags (m2m) tables and migration; edit tags (comma-separated)
    in the post admin (upserted + linked on save); tag chips on posts; tag landing
    pages at /blog/tag/[slug].
  - Search: full-text-ish search over title/excerpt/body of visible posts, at
    /blog/search (with a search box on the blog index). Visibility-filtered.
  - Related posts: each post shows up to 3 related (same category or shared tag),
    visibility-filtered.
- **13:17 · `c26f057` · feat:** Owner-gated blog admin CMS (create/edit/organize posts + categories)
  Phase 2 of the blog: an owner-gated admin at /blog/admin to author and manage
  content — retiring the seed scripts.
  
  - Dashboard listing all posts (incl. drafts) and categories, with publish/
    unpublish toggles.
  - Post editor: title, slug (auto from title), excerpt, MDX body, category,
    visibility + allowlist emails, status, cover image, and SEO fields. Reading
    time computed on save; preview by saving a draft and viewing it (owner-visible).
  - Category editor: name, slug, description, accent color, tile image, visibility,
    allowlist, sort order.
  - Image upload via the GCS storage primitive (presigned PUT; made public on
    save) — components/image-upload.tsx.
  - All writes are requireOwner server actions with revalidation; the admin layout
    gates every route (anon/non-owner redirected). Owner reaches it via the auth
    menu ("Blog admin").
- **12:53 · `56e9d43` · feat:** Global sign-in button + standalone verticals (nav IA)
  Add a persistent auth control (AuthButton) to every header: shows "Sign in"
  when logged out and a signed-in pill with a sign-out menu when logged in,
  powered by a client SessionProvider and reactive to sign-in. Themed with
  semantic tokens so it adapts per vertical. IA: OSM home is the directory (its
  index lists the verticals), so the site navbar is now just the wordmark + theme
  toggle + auth (no vertical links). Verticals stand alone — removed the blog's
  "← osm" header/footer backlinks. Static pages stay static (the auth control is a
  client island).
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
