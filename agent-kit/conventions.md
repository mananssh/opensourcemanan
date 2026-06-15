# Conventions

> The mission *is* the architecture. Adding a feature should be assembling existing pieces, never rebuilding plumbing. DRY is the top principle; extensibility is the goal.

## 1. Systems, not static content

**Never hardcode content as pages.** Every content feature is a *system*: a data model, a store, dynamic rendering, and an authoring/create path.

- A blog is a **blog system** — you create a post, it persists, it appears. Not a new `.tsx` per article.
- Projects, notes, talks, bookmarks — same shape. They are **configurations of one reusable content-system primitive**, not separate builds.

The content-system primitive (to be built when the first content feature lands) is roughly:

```
defineCollection({
  name: 'posts',
  schema: { title, slug, body, publishedAt, tags, visibility },
  access: 'public',        // see axis 1 below
  telemetry: 'pageview',   // see axis 3
})
// → gives you: typed store access, dynamic routes, an authoring path, list/detail rendering
```

When you reach for a new hardcoded page, stop and ask: *is this content that will grow?* If yes, it's a collection on the primitive, not a page.

## 2. The four-axis model

Every feature is a composition of four **orthogonal, independently-chosen** concerns. A new feature picks one value per axis and inherits the shared machinery for each — it does not reimplement any of them.

| Axis | Options | Shared machinery (build once, reuse always) |
|------|---------|----------------------------------------------|
| **Access** | `public` · `authed` · `role`/`owner` | NextAuth config + one `requireAuth()` guard + middleware matcher. Declarative — a feature *declares* its access, never re-checks sessions. |
| **Data** | `static` · `db` · `external` | One data-access layer; the content-system primitive sits on top. Swapping a source must not ripple into features. |
| **Telemetry** | `none` · `pageview` · `events` | One provider-agnostic `track()` seam. Features call `track()`; the provider is swappable in one place. |
| **Rendering** | `page` · `api` · `both` | Shared layout, nav, and **one UI-primitive layer** (design tokens + components). Style once. |

If these four stay decoupled, "add a private blog with analytics" = collection + `authed` + `pageview` + existing renderer. **Zero new infrastructure.** That is the test every design decision must pass.

## 3. Feature-module convention

A feature is **self-contained** and **registers into shared shells** rather than owning private copies of layout/data/auth logic.

- Co-locate a feature's code under one module directory.
- Declare its four-axis choices in a manifest/config, not scattered through the code.
- Surface area (nav entry, gated routes, telemetry opt-in) is **config-driven** — adding a feature is mostly editing a manifest, not wiring.
- Use `/feature` to scaffold — it generates the system skeleton against this convention.

## 4. Frontend & theming

Two non-negotiables for anything with a UI:

- **Light *and* dark, always.** Every feature must support both themes — never ship a single mode. The toggle is a global primitive (`components/theme-toggle.tsx`, ADR 0005); features inherit it. Colors may differ per feature, but reference **semantic design tokens** (`bg-paper`, `text-ink`, `text-accent`, `border-rule`, … defined for both themes in `app/globals.css`) — never hardcode a hex that only works in one mode. A new feature defining its own palette must define it for **both** `:root` and `.dark`.
- **Conscious design review before building UI.** Do not default to generic/AI-slop aesthetics (system fonts, Inter, purple-on-white, predictable layouts). Before implementing a new surface, run **`/design-review`** (ADR 0006) to commit to an aesthetic direction, distinctive type, and a light+dark token set. Match the existing **Editorial Logbook** system unless a feature deliberately and consciously diverges.

## 5. Code style

- **TypeScript everywhere.** No `any` without a written reason. Prefer `type`/`interface` at module boundaries.
- Match surrounding code: naming, comment density, idiom.
- Read `node_modules/next/dist/docs/` before writing Next.js code — **this Next.js (16.x) diverges from training-data assumptions** (see root `AGENTS.md`).
- Server-only secrets never reach the client. Validate external input at the boundary.
- Prefer composition and small shared primitives over copy-paste. If you write something twice, extract it.

## 5. Definition of done

See [definition-of-done.md](./definition-of-done.md). In short: typecheck + lint + build green, a changeset added, oss-safety passed, docs updated.
