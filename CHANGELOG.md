# Changelog

## 2026-07-13

- **17:25 · `1f0d944` · feat:** scale the whole design system up on large screens via stepped root font-size
  On big monitors the site shrank to a strip: the widest container (`max-w-5xl`
  = 64rem = 1024px) covered barely 40% of a 1440p display, leaving the rest
  blank. Because every container, type size, and spacing token in the system is
  rem-based, the systemic fix is one primitive: step the root font-size up on
  large viewports, and every vertical scales proportionally — containers widen,
  type grows, and the reading measure stays identical in characters. No layout
  reflows differently.
  
  Steps (breakpoints resolve against the initial 16px, so they never shift):
  
  - ≥1600px → 17px root (`max-w-5xl` ≈ 68% of a 1600 display)
  - ≥1920px → 18.5px root (≈ 62% of 1920, up from 53%)
  - ≥2400px → 20.5px root (≈ 51–55% of 1440p glass, up from 40%)
  
  Laptops at ≤1536px keep the classic 16px baseline, untouched.
- **17:17 · `e95a9b6` · fix:** redesign every light-mode palette — low-glare toned paper, visible structure, AA-validated
  Light mode was glare-white (`#ffffff`/`#fbfbf9` paper) with invisible structure:
  surfaces indistinguishable from paper, hairline rules like `#e6e6e3` on
  `#fbfbf9` barely perceptible — simultaneously blinding and washed out.
  
  Redesigned all five light palettes in `app/globals.css` under one principle —
  "lamplight, not floodlight" — while keeping each vertical's identity:
  
  - **Root / OSM (Editorial Logbook)**: deepened parchment `#efe7d6`, raised cream
    surface, rules that read as structure.
  - **Blog (Kinetic Mono)**: warm newsprint `#ecebe5` — the contrast now comes
    from near-black ink, not white glare; vermilion deepened to `#c23315`.
  - **Dump (Sticky Desk)**: toned cool board `#dbe3f1` so note-white surfaces and
    colored stickies pop; crayon blue deepened.
  - **Portfolio (Mono + coral)**: warm stone `#e8e6e1` giving the glass panels
    real presence; coral deepened to `#b02c20`; status + Sully tokens re-tuned.
  - **Sully stage**: soft sage `#eaf2ec` base, deep emerald accent.
  
  Every combination validated computationally against WCAG: ink ≥12:1,
  muted ≥6.5:1, faint ≥4.5:1, accent/status ≥4.5:1 on paper *and* surface,
  white-on-accent buttons ≥4.5:1, rules in the 1.3–1.4:1 "visible hairline" band.
  Dark mode is untouched.
- **15:00 · `c39be4e` · feat:** redesign the blog index — featured hero, category chips, and clearer excerpts
  The blog index rendered Featured and Latest with the same heavy `PostList`, and
  that list's terminal `pb-28` padding left a ~190px gap that buried the category
  tiles below it — so browsing by topic effectively disappeared.
  
  Restructure the index around the four-axis rendering:
  
  - **Category chips** (`components/blog/category-chips.tsx`) move to the masthead
    as compact accent-dotted pills, so topic browsing is the first thing in reach.
    Replaces the buried Spotify-style tiles (`category-tiles.tsx` removed).
  - **Featured hero** (`components/blog/featured-hero.tsx`) — one spotlight post as
    a wide split card (cover image + copy), distinct from the Latest list so it no
    longer reads as a duplicate. Gracefully falls back to an accent gradient when a
    featured post has no cover. The hero post is pulled out of Latest so it doesn't
    repeat and pagination counts stay stable.
  - **Excerpts** now render as a bordered italic pull-quote in both the hero and
    every `PostList` row, so it's unmistakably a snippet from the piece.
  - `PostCard` gains `coverImageKey` (additive) so listings can show cover art.
- **11:37 · `d05ebfe` · fix:** interpret the blog editor's publish date in IST, not the server's UTC
  The editor's "Publish date" is a timezone-naive `<input type="datetime-local">`.
  Both the save path (`new Date(input)`) and the display path (`getHours()` etc.)
  read that wall-clock string in the *runtime's* zone — UTC on Vercel — so a time
  the author picked was silently shifted by the UTC offset, publishing posts 5.5h
  later than intended (and hiding them as "scheduled" until then).
  
  Anchor the wall clock to IST (Asia/Kolkata, a fixed UTC+5:30, no DST) via a new
  `lib/blog/schedule.ts` (`istInputToDate` / `dateToIstInput`), used by both
  `savePost` and the post form. The label now reads "Publish date · IST" so the
  zone is explicit. A picked time now means exactly what it says regardless of
  where the code runs.

## 2026-07-08

- **09:13 · `079a506` · fix:** point OSM-labeled back-links to /osm and polish portfolio chrome
  Navigation and cosmetic polish across the verticals:
  
  - OSM-labeled back-links now go to the `/osm` manifesto instead of the portfolio landing (`/`): the `← OSM` link in every vertical footer, the `OSM.` wordmark in the editorial site header, and the global 404's `← back to OSM`. Each vertical's own wordmark still links to its own home.
  - Theme toggle now renders inline sun/moon SVGs instead of Unicode glyphs, so the icon sits vertically centered in the button (the glyphs had uneven font metrics).
  - "View my blog" in the portfolio header gains a hover-animated arrow.
  - Added a line to the OSM manifesto explaining that each vertical's divergent styling is deliberate, not inconsistency.
  - Portfolio contact now displays the full LinkedIn handle (`in/manan-shah-0918`).

## 2026-07-07

- **18:59 · `91f8595` · refactor:** Move object storage from Google Cloud Storage to Cloudflare R2
  Swaps the object-storage backend behind `lib/storage` from GCS to Cloudflare R2
  (S3-compatible, zero egress). The public API is unchanged — `createUploadUrl`,
  `getReadUrl`, `deleteObject`, `makePublic`, `publicUrl`, `isManagedKey`,
  `downloadText`, `uploadText`, and `StorageVertical` keep their exact shapes, so
  no consumer changed and the DB (which stores keys, not URLs) needs no migration.
  
  The module is renamed `gcs.ts` → `object-store.ts` and uses the AWS S3 SDK against
  the R2 endpoint. Because R2 has no per-object ACL, the per-object public/private
  model (ADR 0009/0015) is kept with **two buckets**: a private default bucket for
  every upload, and a public bucket (bound to the `R2_PUBLIC_BASE_URL` custom domain)
  that `makePublic` copies objects into. Private objects — including Sully's prompts
  and gated dump images — never enter the public bucket. Adds a dry-runnable,
  idempotent `scripts/migrate-storage-to-r2.mjs` to copy existing objects preserving
  keys (see ADR 0016).
- **17:17 · `41ffaf5` · fix:** Fix a JSON-sentinel leak into the thinking stream and an over-eager fit_gate decline
  Two bugs found from a live trace ("Cloud Engineer at naabhik technologies"
  declined as "not a job description"):
  
  1. **Sentinel leak.** The streamed reasoning could show a fragment of the
     internal `@@@JSON@@@` marker (e.g. a literal "@@@JSON" in the visible
     text) when it arrived split across two stream chunks — the naive
     `indexOf` search only catches a *complete* marker already in the buffer.
     `model-router.ts` now holds back a lookback window equal to the marker's
     length until either the full marker resolves or the stream ends, so a
     split marker can never leak a partial prefix into what the reader sees.
  2. **Over-eager `fit_gate` decline.** `fit_gate` only ever saw the *already-
     extracted* `role`/`requirements`, never the raw pasted text — so a short,
     perfectly legitimate posting (just a title + company, no elaborated
     requirements) could read as "not a genuine role" once reduced to an empty
     requirements list, and the model sometimes hallucinated a specific wrong
     reason ("appears to be a prompt or instruction"). Meanwhile `intake`
     already computes its own `looksLikeRole` judgment (with the full raw text
     in view) but the graph silently discarded it. `looksLikeRole` is now
     threaded through `AgentState` from `intake` to `fit_gate`, and both the
     private and public fallback prompts defer to that earlier judgment and
     explicitly note that brevity alone isn't disqualifying.
- **16:55 · `26849f6` · feat:** Ask Sully — a portfolio-wide AI chat overlay, scoped to Manan
  A floating "Ask Sully" trigger on every portfolio page opens a Gemini-style
  bottom-sheet chat overlay (the live page stays visible, blurred, above it), and
  selecting any text surfaces an "Ask Sully" popup that pre-fills the same panel.
  Answers are grounded strictly in Manan's live, DB-backed portfolio corpus —
  judgment/fit questions get a confident opinion, on-screen content is explained
  from a viewport-aware page snapshot, and anything genuinely off-topic is
  declined without leaking outside facts.
  
  The feature composes existing machinery rather than duplicating it. The
  model-router, event bus, and rate-limiter were generalized (not forked) so both
  the fit agent and this chat share one implementation; a single scoped
  `streamChat` per turn (no LangGraph) keeps it cheap. A new `ask_runs` table
  provides its own rate-limit bookkeeping.
  
  Also hardens the shared agent infrastructure surfaced while building this:
  
  - Prompts now load from a private GCS object (`AGENT_PROMPTS_KEY`) with a TTL
    cache, falling back to `AGENT_PROMPTS_B64` then generic defaults — edit and
    re-upload (`npm run prompts:upload`) with no redeploy, and no 26KB env blob.
  - Model-router: per-tier circuit breaker (a dead strong model no longer
    benches its healthy fast sibling), a longer idle timeout for slower strong
    models, env-configurable per-tier lane order, and per-lane failure logging.
  - Fit-agent `plan`/`fit_gate` prompts now actually receive the seniority and
    hard-constraint signals the intake node was already extracting.

## 2026-07-06

- **15:19 · `4295f24` · fix:** Stop sending stream_options to model lanes — it silently killed Gemini
  Every Sully run was falling over from Gemini (the primary, fastest, cheapest
  lane) to NVIDIA NIM/OpenCode Zen, even though Gemini worked fine on its own.
  Root cause: `stream_options: { include_usage: true }` in every model-router
  request. Gemini's OpenAI-compat shim can't handle that field and returns a
  misleading `503 UNAVAILABLE ("high demand")` instead of a clean 400 — which
  the router correctly (but uselessly) treats as a retryable failure and fails
  over on every single call. Confirmed by direct testing: identical requests
  succeed at 200 without `stream_options` and fail at 503 with it, on both
  non-streaming and streaming calls. Token usage now always uses the existing
  character-based estimate instead of a provider-reported exact count, which
  was already the graceful fallback for lanes that don't return usage.
- **14:56 · `d209d7f` · fix:** Clean up the portfolio tab title, nav link, and Sully's accent color
  The portfolio's browser tab title is now the plain "Manan Shah · Portfolio"
  instead of a per-page template. The header's "OSM ↗" nav link is now "View
  my blog", linking to `/blog` instead of `/osm` — clearer for a first-time
  visitor. The "a (slightly biased) second opinion" line above Sully now uses
  Sully's own green identity token instead of the portfolio's default coral.
- **14:56 · `d209d7f` · fix:** Cap Sully's total model-call time so it degrades instead of timing out
  `/api/fit` hit Vercel's hard 60s `maxDuration` kill in production — each of
  the graph's 9 nodes could independently spend up to ~30s failing over across
  model lanes (three lanes x a 10s idle-timeout), and the cumulative total
  across nodes could exceed the route's budget. `model-router.ts` now takes a
  run-wide `deadlineAt` (45s by default, `AGENT_RUN_DEADLINE_MS`): once it
  passes, `streamChat` stops trying further lanes and aborts in-flight
  requests, so every remaining node degrades near-instantly instead of the
  whole route dying with an ungraceful connection drop. Also lowered the lane
  circuit breaker's failure threshold from 2 to 1, so a bad lane stops being
  retried across nodes sooner.
- **14:29 · `85a27ca` · docs:** Rewrite the boilerplate README and fix Sully doc/code drift
  `README.md` was still the default `create-next-app` template. It now
  describes the actual project and points to `agent-kit/` for contribution
  conventions. `agent-kit/agent.md` claimed `synthesize`/`compose` were
  "fatal if they fail," but both nodes always degrade gracefully in code
  (a deliberate hardening) — the doc now matches. A graph-diagram comment also
  said the bounded re-gather loop allows up to 2 extra passes; the code only
  ever allows 1.
- **14:29 · `85a27ca` · fix:** Close storage and validation gaps in the portfolio admin CMS
  The résumé field was documented and typed as a GCS object key but was
  actually entered as a raw URL, since the upload endpoint only allowed image
  MIME types — the one place in the portfolio that broke the "store a key,
  never a URL" storage convention. Résumés now upload as a real PDF through the
  same presigned-upload flow as images.
  
  Also: a hackathon's "related project" was a free-text field with no
  validation, so a typo or a later project rename/delete silently produced a
  dead link — it's now a `<select>` of real projects, validated server-side
  too. `saveProfile` gained the same required-field check its sibling actions
  already had. Every admin save/delete action now handles a DB failure the
  same way (an inline error instead of crashing past the form into Next's
  default error page), and the upload widgets now delete a replaced or
  removed-before-save file instead of leaving it orphaned in the bucket.
- **14:29 · `85a27ca` · fix:** Add portfolio loading/error/404 states, real alt text, indexes
  The portfolio route group had no `loading.tsx`, `error.tsx`, or scoped
  `not-found.tsx`, so a slow fetch showed nothing and a failure or 404 fell
  through to the site's unbranded root pages. All three now render inside the
  portfolio's own theme and chrome.
  
  Also: project/hackathon cover and gallery images had `alt=""` despite being
  real content, not decoration — they now carry descriptive alt text. A
  particle-canvas color fallback is now sourced from a semantic token instead
  of a single hardcoded hex. `experiences` and `capabilities` gained the same
  `sortOrder`/`startedAt` indexes `projects` and `hackathons` already had.
- **14:29 · `85a27ca` · fix:** Fix the Sully graph's critique→compose overlap and add its real icon
  In the live agent graph, `critique` and `compose` sat exactly one node-width
  apart, leaving zero room for the connector between them (every other
  transition has 6–18 units of gap). `compose` is now spaced consistently with
  the rest of the flow. The Sully avatar also went from a placeholder "S"
  badge to the real mark (`public/sully.svg`), recolored to the theme's
  emerald identity via a CSS mask.
- **14:29 · `85a27ca` · fix:** Harden Sully's rate limiting, stream handling, and IP privacy
  The public `/api/fit` route's abuse guard only recorded a run when the stream
  finished, so concurrent or rapid-fire requests could all read the same
  pre-increment count and blow past both the per-IP and global daily caps.
  `checkAndReserve` now checks the caps and inserts the run row in one
  transaction, closing the race, and `finishRun` updates that same row instead
  of writing a second one.
  
  Also fixes: an enqueue-after-close bug in the stream handler if logging the
  run outcome failed after the controller closed; the rate limiter's claimed
  "fails open on any DB error" behavior, which previously only held for a
  narrow set of pre-migration errors; and a hardcoded IP-hashing salt fallback
  (a known constant in this public repo) that silently degraded the
  never-store-a-raw-IP guarantee — it now falls back to a random per-boot salt
  with a startup warning.
- **14:29 · `85a27ca` · refactor:** Dedupe admin form boilerplate and decouple the shared form-state type
  The delete-confirmation form and a `dateVal` date formatter were copy-pasted
  across all four portfolio admin forms; both now live once in
  `components/portfolio/admin/fields.tsx` as `DeleteButton` and `dateVal`.
  `AdminForm`'s shared `{error}` state type also imported from the blog
  vertical's action module even though the portfolio vertical defined an
  identical type of its own — both now source it from a new
  `components/admin/form-state.ts`, so the shared form shell isn't coupled to
  any one vertical.

## 2026-06-22

- **10:21 · `480a3f3` · feat:** Wire intake's seniority + hard constraints through to the gate and plan
  intake already extracts `seniority` and `constraints` (location / work-auth /
  clearance / required degree); they were computed then dropped. Now they're stored
  in state and provided to the fit_gate and plan prompts as `{{seniority}}` /
  `{{constraints}}`, so the gate can treat a seniority gap or hard constraint as a
  named "plausible" stretch (not a decline) and plan can ensure a dimension speaks
  to it. Public fallback prompts use the new fields; tuned prompts opt in by adding
  the placeholders.
- **09:39 · `66f9bd8` · fix:** Make prompts the single source of truth for agent output shape
  The prompts now each declare their own `Return: {…}` spec, but the code was also
  appending its own (sometimes conflicting) JSON shape via `withJsonTail`. Removed
  the duplication so the prompt owns the shape:
  
  - `withJsonTail` appends only the reason-then-JSON protocol (points at the prompt's
    own Return spec); the hardcoded per-node shapes are gone.
  - `compose` now returns the paragraph as plain text (matching the prompt's "output
    nothing else"); the displayed evidence is the gather-curated set (deduped, capped)
    rather than a separate `citedHrefs` round-trip.
  - `web_corpus` reads the prompt's `note` field for the company-alignment line.
  - Public fallback prompts carry `Return:` specs too, so the OSS build still works.
  
  Verified live: all six JSON nodes parse, compose is clean plain text, evidence is
  grounded.
- **08:40 · `fd6f743` · fix:** Fix the Gemini + OpenCode Zen model ids (verified each lane with a direct call)
  Tested every model lane with a direct API call and corrected two stale defaults:
  
  - **Gemini** → `gemini-2.5-flash-lite` (both tiers). `gemini-2.0-flash` now 429s
    (deprecated/unavailable, not a quota issue — `2.5-flash-lite` works on the same
    key), and `gemini-2.5-flash` returns empty under a token budget (thinking mode).
    `2.5-flash-lite` is available, fast, non-thinking, and returns clean output.
  - **OpenCode Zen** → `deepseek-v4-flash-free`. The rotating free roster dropped
    `glm-5-free` (401 "not supported"); non-`-free` models 401 "No payment method".
    `deepseek-v4-flash-free` verified 200.
  
  NVIDIA NIM (8B + 70B) and Tavily verified working unchanged.
- **08:25 · `2d1c24b` · ops:** Scrub the old (pre-env) agent prompts from git history
  Rewrote history to drop `lib/agent/prompts.ts` and `lib/agent/nodes.ts` from all
  prior commits (they carried the tuned prompt text before ADR 0015 moved prompts
  to `AGENT_PROMPTS_B64`), then re-added their current env-loader versions. The
  prompts are no longer recoverable from the public history.

## 2026-06-21

- **23:02 · `abdf4a0` · feat:** Portfolio polish — glass section panels, clickable cards, tag hovers, redesigned contact, résumé in hero
  Landing-page craft pass:
  
  - **Liquid-glass sections:** each content section is now a translucent, blurred
    panel that floats over the particle field — legible and visually separated
    without going opaque (new `.section-glass`).
  - **Whole-row clickable cards:** the Selected-work, Hackathons, and Experience
    rows are now single click targets that lift + glass on hover (`.lift-card`),
    not just a linked title.
  - **Tag hovers:** stack/skill/capability chips fill with the accent glass on
    hover (`.tag-chip`).
  - **Contact, redesigned:** labelled, hoverable contact methods plus a short
    "What is OSM?" blurb linking to the manifesto (no more bare link list).
  - **Résumé in the hero:** a proper résumé button below the intro (with an "Ask
    Sully about a role" secondary), moved out of the contact link list.
  
  All scoped to `.vertical-portfolio`; reduced-motion disables the lifts. Both
  themes.
- **22:52 · `c7d00f0` · feat:** Sully panel polish + private env-loaded prompts + model/token telemetry
  - **Private prompts (ADR 0015):** the agent's prompts move out of the repo.
    `lib/agent/prompts.ts` is now a loader that reads `AGENT_PROMPTS_B64` (base64 of
    the gitignored `agent.prompts.json`); the repo ships only generic fallbacks so
    the OSS build still runs. `npm run prompts:encode` regenerates the env value.
  - **Smarter verdict:** the prompts now credit related/implied technologies as
    real evidence (Next.js ⇒ React; shipping JS/TS services ⇒ Node.js; FastAPI ⇒
    Python) instead of penalizing for an exact keyword's absence.
  - **Model + tokens shown:** the router reports usage via a sink; the run emits a
    final `usage` event and the panel shows `model · tokens · model calls`.
  - **Panel layout:** the live view is now vertically stacked — the graph on top
    (much larger, centered) with the thinking stream below a divider, instead of a
    cramped side-by-side split. Evidence is labelled explicitly ("Evidence — cited
    from his actual work") and rendered as bordered, hoverable chips.
- **22:36 · `979e4c2` · fix:** Harden Sully from a live acceptance pass — reliable, fast, and honest end-to-end
  Ran the real agent against a genuine JD, a deliberate non-fit (sales), and a
  prompt injection, and fixed what the run surfaced:
  
  - **compose** now writes the actual recruiter-facing case (it previously emitted
    meta-commentary about its own draft) and never leaks a `citedHrefs` list into
    the paragraph.
  - **Grounding/selection**: gather nodes dedupe repeated picks; the oversized
    corpus body text is trimmed so selection is fast and reliable (work-history
    evidence was being dropped).
  - **Reliability**: an idle (stall) timeout that re-arms per byte, a per-lane
    circuit breaker so a stalling free tier is skipped instead of costing every
    node its timeout, failover on any HTTP error, and graceful degradation in
    every node (a model hiccup can no longer kill a run — it always produces a
    result). Strong tier defaults to non-thinking `gemini-2.0-flash` (its visible
    output can't be starved by hidden reasoning tokens), and selection/classification
    nodes use the fast model so failover stays inside the route's 60s budget.
  - **Fit gate** now declines non-postings / prompt-injection / gibberish as
    `not_a_fit` (the injected text is analyzed as data, never obeyed).
  - **Loop** is bounded to one extra re-gather and is skipped once the run has used
    most of its time budget; the critique only loops on a genuinely unsupported key
    requirement, so strong cases finish without needless passes.
  
  Verified live: real JD → grounded "strong" with an honestly-named stretch; sales
  role → graceful decline via the short-circuit; injection → declined.
- **19:58 · `3b59132` · feat:** The live Sully graph — animated node-graph + streamed thinking (Phase 2, PR2)
  The centerpiece visualization. Replaces the thin PR1 graph with the full §10
  experience inside the neon-dark Sully stage:
  
  - `agent-graph.tsx` — rounded-rect nodes with arrowheaded hairline edges that draw
    on in the accent as each is taken; node states driven purely by the event
    stream (running = breathing pulse + dot, done = settle to hairline + check,
    skipped = dashed/dimmed, error = negative). The parallel band lights together
    and finishes independently; the critique loop draws its dashed re-gather edge
    back with a "↻ pass 2" counter; the decline short-circuit dims the middle and
    jumps gate → compose. Horizontal on desktop, vertical on mobile.
  - `thinking-stream.tsx` — the live reasoning panel: the running node's streamed
    text shows in full, completed nodes collapse to a one-line summary you can
    re-expand. Auto-scrolls to the active node but yields when the reader scrolls
    up. ARIA-live (polite).
  - `sully-panel.tsx` — the running view becomes two regions (graph ~40% / thinking
    ~60%, stacked on mobile); reasoning deltas are throttled to ~one flush per
    animation frame so streaming is smooth; a "run another" affordance appears with
    the result.
  - Reduced-motion drops the pulses and edge-draws for clean instant state changes;
    the labeled example replay now showcases the parallel band.
  
  No new dependencies; no Phase 1 design regressions.
- **16:55 · `e71bc02` · feat:** Make Sully a real streaming LangGraph.js fit agent (Phase 2, PR1)
  Replaces the stubbed agent behind Sully with a real multi-step LangGraph.js graph
  that streams its genuine execution. `runFitAssessment` now calls a new streaming
  route (`app/api/fit`) that runs the graph server-side and emits real `AgentEvent`s
  as NDJSON; `FitResult` and the generator signature are unchanged.
  
  - `lib/agent/` — typed `StateGraph` (intake → fit_gate → plan → parallel
    work_history ∥ projects ∥ web_corpus → synthesize → critique → compose) with a
    biased-yes, injection-safe fit gate, a decline short-circuit, and a bounded
    re-gather loop. Reasoning streams from inside each node via a run-scoped event
    bus — the trace is never faked.
  - Model router over OpenAI-compatible lanes (Gemini Flash → NVIDIA NIM →
    OpenCode Zen) with per-node tiers and 429/5xx failover; keys are server-only.
  - Evidence is grounded in the DB-backed portfolio corpus — every citation
    resolves to a real permalink. Tavily company research degrades to corpus-only
    if unavailable or rate-limited.
  - `agent_runs` + `agent_cache` tables (migration 0009) give per-IP + global daily
    caps, telemetry, and Tavily caching on the shared DB — no new infra. IPs are
    stored only as a salted hash. Over the cap, the UI shows a clearly-labeled
    example replay.
  
  PR1 ships the real agent behind a deliberately thin graph UI; the full live-graph
  visualization lands in PR2. See ADR 0014 and `agent-kit/agent.md`.

## 2026-06-19

- **13:43 · `1cb2468` · feat:** Portfolio /experience gallery, OG image, and landing links
  Completes the portfolio: a dedicated /experience timeline where each role expands
  into the same accessible modal + permalink pattern (/experience/<id>), an
  on-brand generated Open Graph image (name + tagline on the dark base), and
  landing links into the full timeline. Timeline roles are now clickable.
- **13:27 · `1a5b874` · feat:** Portfolio galleries — /work + /hackathons with expand modals + permalinks
  Two DB-driven gallery pages with distinct layouts (projects = interactive card
  grid; hackathons = a stacked wall of wins), each item expanding into an
  accessible Radix modal via Next intercepting routes — the URL becomes
  /work/<slug> (shareable, SEO-indexed, full page on direct visit), back closes it.
  Detail renders cover + image gallery + markdown body + stack + links. Landing's
  work/proof sections now link into the galleries.
- **11:51 · `e40b234` · feat:** Portfolio hero — photo, signal-field particles, scramble text, agent console (stub)
  The portfolio's signature hero: name + human line, a framed GCS photo with
  floating telemetry chips, a cursor/scroll-reactive particle field (retokenized,
  reduced-motion-safe, perf-capped), scramble/decrypt machine text, and the
  AgentConsole — a self-contained fit-assessment instrument that auto-plays a baked
  example trace + verdict + evidence behind the Phase-2 runFitAssessment seam (no
  model yet). next/image wired for GCS photos.
- **10:03 · `d2756ee` · feat:** Portfolio shell + DB-driven landing (replaces coming-soon)
  The portfolio takes over / as its own vertical: aviation-instrument theme
  (.vertical-portfolio, both light + dark), Bricolage Grotesque / Geist / Geist
  Mono fonts, and its own header/footer chrome. The landing reads entirely from the
  DB — now, selected work, proof, an experience timeline, capabilities, contact —
  with reusable SectionHeading/Tag primitives. The hero is a skeleton; the photo +
  particles + agent console land next. The OSM home stays at /osm.
- **08:05 · `79b2eb3` · feat:** Portfolio admin — multi-image galleries + experience logo
  Project and hackathon admin forms gain a multi-image detail gallery
  (MultiImageUpload → imageKeys), and experiences gain a logo upload. New gallery
  images are published to GCS; images removed on edit (and all on delete) are
  cleaned up. (Thought Dump remains single-image.)
- **07:52 · `d7d2a52` · feat:** Portfolio admin CMS — owner-gated CRUD for all content
  An owner-gated admin at /admin to manage every portfolio entity in-browser:
  profile (singleton), projects, experience, hackathons, capabilities — create,
  edit, delete, with inline error handling, slug collision checks, and image
  uploads (photo + covers) straight to GCS under a new `portfolio/` prefix.
  Reuses the blog admin primitives (AdminForm, ImageUpload, ConfirmSubmit,
  requireOwner). Now you can manage all content without the seed script.
- **07:31 · `53fadfe` · feat:** Portfolio data foundation — schema, store, and seed (DB-backed)
  The portfolio's data layer (OSM's third content collection): five DB tables
  (profile · projects · experiences · hackathons · capabilities, migration 0008),
  a read store in lib/portfolio/queries.ts (public, safeDb-wrapped, cached), and
  an idempotent seed script (npm run seed:portfolio) preloaded with Manan's real
  data. Images (photo/résumé/covers) stay on GCS, referenced by key. Admin CMS +
  pages follow in later PRs.

## 2026-06-18

- **11:23 · `05ae4c1` · fix:** Fix orphaned sticky-note tape in the masonry wall
  The note "tape" was a ::before pseudo-element, which Chrome mis-paints/orphans
  inside CSS multi-column layouts (a stray tape appeared in a column gap). It's now
  a real child element bound to each card, so the tape only ever sits on its note.
- **11:19 · `b67df31` · fix:** Dump composer auto-grows with content, then scrolls at a max height
  The single-line composer scrolled instead of expanding when you added lines. It
  now auto-grows with its content up to a max height (~240px) and scrolls beyond
  that, and shrinks back to one line after posting.
- **11:11 · `9edad20` · feat:** Thought Dump composer starts as a single line
  The composer textarea now defaults to one row (still resizable / auto-grows as
  you type) instead of three, so an empty composer is compact.
- **11:02 · `21886cb` · feat:** Retire landing to "coming soon"; /osm index + changelog link; pointer cursors
  - Landing page (/) retired to a tasteful "portfolio on its way" coming-soon —
    with a Meanwhile index so visitors still reach the live blog/dump/changelog
    (the eventual plan: / becomes the portfolio).
  - /osm swaps its colophon for the editorial Index (Blog, Changelog, Thought
    Dump — excludes Home and /osm itself).
  - Ethos strip drops "DRY or don't" and "Light & dark, always"; keeps Systems +
    Open, and the third is now a "View the changelog →" link.
  - Global: restore cursor:pointer on buttons/[role=button]/summary (Tailwind v4
    preflight had dropped it).
- **10:16 · `e1c8344` · feat:** Thought Dump phase 2 — edit notes, reveal motion, themed 404, OG card
  - Owner can edit a thought (text, image, visibility) via /dump/<id>/edit, with
    replaced images cleaned up from storage. "Edit" added to the note's owner
    controls; the composer is reused for create + edit.
  - Notes fade in with a staggered, tilt-preserving animation (reduced-motion safe).
  - Themed not-found for the dump vertical and a generic (content-free) OG card for
    gated permalinks.
- **08:45 · `c9eb3ba` · fix:** Dump composer image reset, whole-note links, sign-in returns to origin
  - The image preview/key now clears after posting a thought (ImageUpload listens
    for the form's reset event; form.reset() only clears native fields).
  - The whole sticky note links to its permalink, not just the date.
  - Signing in returns you to where you came from: the sign-in page honors a safe
    internal `?next=` (open-redirect-guarded), and the header sign-in button passes
    the current page as the callback.
- **08:38 · `a39bd3f` · chore:** Track .env.example so contributors get the env template
  `.env.example` was caught by the `.env*` gitignore rule and never committed, so
  the public repo shipped no env template. Add a `!.env.example` negation and
  commit the placeholder-only template (documents every required var incl. the
  base64 GCP_SERVICE_ACCOUNT option). Real `.env*` files stay ignored.
- **08:32 · `1b73fa1` · fix:** Accept base64-encoded GCP_SERVICE_ACCOUNT (robust across Vercel/.env)
  The GCS service-account env var now accepts EITHER raw JSON or that JSON
  base64-encoded. Base64 avoids the newline/quoting pitfalls of a multi-line
  private_key in env UIs (Vercel) and .env files, which were causing
  "GCP_SERVICE_ACCOUNT must be valid service-account JSON" on deploy. Raw JSON
  still works, so existing setups are unaffected.
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
