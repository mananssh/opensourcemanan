---
type: feat
summary: Owner-gated blog admin CMS (create/edit/organize posts + categories)
---

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
