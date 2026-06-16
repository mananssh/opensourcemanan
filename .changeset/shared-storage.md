---
type: feat
summary: Add the shared GCS storage primitive (presigned uploads, key-in-DB)
---

Third shared resource alongside DB and auth: one Google Cloud Storage bucket
(opensourcemanan) for the whole site. lib/storage/gcs.ts exposes
createUploadUrl (presigned v4 PUT), publicUrl, and deleteObject; keys are
namespaced per vertical (blog/…, projects/…) and the DB stores the key, not the
blob. An owner-gated POST /api/storage/upload-url issues upload URLs so the
browser uploads straight to GCS. Objects are public-read (CDN-cacheable). Lazy
singleton client — build-safe without creds. Docs: agent-kit/storage.md,
ADR 0009; requires GCP_SERVICE_ACCOUNT (+ optional GCS_BUCKET).
