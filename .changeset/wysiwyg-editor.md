---
type: feat
summary: WYSIWYG MDX post editor (with image upload) + inline category creation
---

The post body is now a full WYSIWYG MDX editor (@mdxeditor/editor): toolbar,
formatting, links, tables, code blocks, a source-mode toggle for raw MDX, and a
generic editor for custom components like <Callout>. Inserting an image uploads
it straight to GCS (presigned PUT + made public) and drops it in at the cursor.
The category field gains an inline "+ New category" that creates one without
leaving the editor. New owner-gated routes: /api/storage/make-public and
/api/blog/categories.
