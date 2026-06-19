---
type: feat
summary: Portfolio admin CMS — owner-gated CRUD for all content
---

An owner-gated admin at /admin to manage every portfolio entity in-browser:
profile (singleton), projects, experience, hackathons, capabilities — create,
edit, delete, with inline error handling, slug collision checks, and image
uploads (photo + covers) straight to GCS under a new `portfolio/` prefix.
Reuses the blog admin primitives (AdminForm, ImageUpload, ConfirmSubmit,
requireOwner). Now you can manage all content without the seed script.
