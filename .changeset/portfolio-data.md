---
type: feat
summary: Portfolio data foundation — schema, store, and seed (DB-backed)
---

The portfolio's data layer (OSM's third content collection): five DB tables
(profile · projects · experiences · hackathons · capabilities, migration 0008),
a read store in lib/portfolio/queries.ts (public, safeDb-wrapped, cached), and
an idempotent seed script (npm run seed:portfolio) preloaded with Manan's real
data. Images (photo/résumé/covers) stay on GCS, referenced by key. Admin CMS +
pages follow in later PRs.
