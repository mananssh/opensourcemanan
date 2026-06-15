# Definition of Done

A change is done when **all** of these are true. CI enforces the hard gates; the rest are your responsibility before opening a PR.

## Hard gates (CI fails without them)

- [ ] `npx tsc --noEmit` — no type errors.
- [ ] `npm run lint` — ESLint clean.
- [ ] `npm run build` — `next build` succeeds.
- [ ] **gitleaks** — no secrets detected.
- [ ] **Changeset present** — a `.changeset/*.md` accompanies any application-code change.

## Author responsibilities (not auto-enforced)

- [ ] **oss-safety passed** — ran `/oss-check`; nothing private is going public (see [oss-safety.md](./oss-safety.md)).
- [ ] **devil's-advocate considered** — reviewed the critique; risks addressed or consciously accepted.
- [ ] **Built as a system, not static content** — if it's content that grows, it's on the content-system primitive, not a hardcoded page (see [conventions.md](./conventions.md)).
- [ ] **Four-axis discipline** — Access / Data / Telemetry / Rendering chosen declaratively; no reimplemented plumbing.
- [ ] **Light + dark both done** — any UI works and was checked in both themes; colors come from semantic tokens defined for both modes (ADR 0005). No single-mode features.
- [ ] **Design review done (for UI work)** — ran `/design-review`; committed to a deliberate aesthetic with distinctive type, not default/AI-slop (ADR 0006).
- [ ] **Docs updated** — relevant `docs/` or `agent-kit/` reflects the change; an ADR added for any architectural decision.
- [ ] **Conventional commit** + branch-from-latest-`origin/main` + PR (see [commit-and-pr.md](./commit-and-pr.md)).
