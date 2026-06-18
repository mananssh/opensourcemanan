---
type: chore
summary: Track .env.example so contributors get the env template
---

`.env.example` was caught by the `.env*` gitignore rule and never committed, so
the public repo shipped no env template. Add a `!.env.example` negation and
commit the placeholder-only template (documents every required var incl. the
base64 GCP_SERVICE_ACCOUNT option). Real `.env*` files stay ignored.
