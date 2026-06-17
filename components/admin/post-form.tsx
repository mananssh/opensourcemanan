import { savePost, deletePost } from "@/app/blog/admin/actions";
import { ImageUpload } from "@/components/image-upload";
import { MdxEditor } from "@/components/admin/mdx-editor";
import { CategorySelect } from "@/components/admin/category-select";
import { AdminForm } from "@/components/admin/admin-form";
import { SubmitButton } from "@/components/blog/submit-button";
import { publicUrl } from "@/lib/storage/gcs";
import type { Post, Category } from "@/db/schema";

const labelCls =
  "mb-1.5 block font-mono text-[0.7rem] uppercase tracking-[0.15em] text-faint";
const inputCls =
  "w-full rounded-md border border-rule bg-paper px-3 py-2 font-body text-ink transition-colors focus:border-accent";

const VISIBILITY = ["public", "authed", "allowlist", "owner"] as const;

export function PostForm({
  post,
  categories,
  tagNames,
}: {
  post?: Post;
  categories: Category[];
  tagNames?: string;
}) {
  return (
    <>
      <AdminForm
        action={savePost}
        className="w-full space-y-6 rounded-xl border border-rule bg-surface p-6 sm:p-8"
      >
      {post && <input type="hidden" name="id" value={post.id} />}

      <div>
        <label className={labelCls} htmlFor="title">Title</label>
        <input id="title" name="title" required defaultValue={post?.title} className={inputCls} />
      </div>

      <div>
        <label className={labelCls} htmlFor="slug">Slug</label>
        <input id="slug" name="slug" defaultValue={post?.slug} placeholder="auto from title" className={inputCls} />
      </div>

      <div>
        <label className={labelCls} htmlFor="excerpt">Excerpt</label>
        <textarea id="excerpt" name="excerpt" rows={2} defaultValue={post?.excerpt ?? ""} className={inputCls} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls} htmlFor="categoryId">Category</label>
          <CategorySelect
            name="categoryId"
            categories={categories.map((c) => ({ id: c.id, name: c.name }))}
            defaultValue={post?.categoryId}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={post?.status ?? "draft"} className={inputCls}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls} htmlFor="visibility">Visibility</label>
          <select id="visibility" name="visibility" defaultValue={post?.visibility ?? "public"} className={inputCls}>
            {VISIBILITY.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="allowedEmails">Allowed emails (for allowlist)</label>
          <input id="allowedEmails" name="allowedEmails" defaultValue={post?.allowedEmails.join(", ")} placeholder="a@x.com, b@y.com" className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls} htmlFor="tags">Tags (comma-separated)</label>
        <input id="tags" name="tags" defaultValue={tagNames} placeholder="react, design, notes" className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Cover image</label>
        <ImageUpload
          name="coverImageKey"
          initialKey={post?.coverImageKey}
          initialUrl={post?.coverImageKey ? publicUrl(post.coverImageKey) : null}
        />
      </div>

      <div>
        <label className={labelCls}>Body (MDX)</label>
        <MdxEditor name="bodyMdx" defaultValue={post?.bodyMdx ?? ""} postId={post?.id} />
      </div>

      <details className="rounded-md border border-rule p-3">
        <summary className="cursor-pointer font-mono text-[0.7rem] uppercase tracking-[0.15em] text-faint">SEO (optional)</summary>
        <div className="mt-4 space-y-4">
          <div>
            <label className={labelCls} htmlFor="metaTitle">Meta title</label>
            <input id="metaTitle" name="metaTitle" defaultValue={post?.metaTitle ?? ""} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="metaDescription">Meta description</label>
            <textarea id="metaDescription" name="metaDescription" rows={2} defaultValue={post?.metaDescription ?? ""} className={inputCls} />
          </div>
        </div>
      </details>
      </AdminForm>

      {post && (
        <form action={deletePost} className="mt-4">
          <input type="hidden" name="id" value={post.id} />
          <SubmitButton
            className="font-mono text-sm text-muted transition-colors hover:text-accent"
            pendingLabel="Deleting…"
          >
            Delete post
          </SubmitButton>
        </form>
      )}
    </>
  );
}
