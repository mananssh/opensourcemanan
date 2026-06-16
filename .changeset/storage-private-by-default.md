---
type: fix
summary: Make the shared bucket private with per-object access (safe by default)
---

Revise the storage primitive so the GCS bucket is no longer blanket-public —
which would have exposed every vertical's files and gated content's images.
The bucket is now private; objects are private by default and read via
short-lived signed URLs (getReadUrl) only for authorized viewers. An object is
world-readable only via an explicit makePublic(key) (public post covers, OG
images → stable CDN publicUrl). Keeps one bucket safe for every vertical.
Updated ADR 0009 and agent-kit/storage.md (bucket stays private, fine-grained
ACLs, no allUsers).
