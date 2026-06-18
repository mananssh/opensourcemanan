---
type: fix
summary: Accept base64-encoded GCP_SERVICE_ACCOUNT (robust across Vercel/.env)
---

The GCS service-account env var now accepts EITHER raw JSON or that JSON
base64-encoded. Base64 avoids the newline/quoting pitfalls of a multi-line
private_key in env UIs (Vercel) and .env files, which were causing
"GCP_SERVICE_ACCOUNT must be valid service-account JSON" on deploy. Raw JSON
still works, so existing setups are unaffected.
