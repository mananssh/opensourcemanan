import { saveCategory, deleteCategory } from "@/app/blog/admin/actions";
import { ImageUpload } from "@/components/image-upload";
import { publicUrl } from "@/lib/storage/gcs";
import type { Category } from "@/db/schema";

const labelCls =
  "mb-1.5 block font-mono text-[0.7rem] uppercase tracking-[0.15em] text-faint";
const inputCls =
  "w-full rounded-md border border-rule bg-paper px-3 py-2 font-body text-ink outline-none transition-colors focus:border-accent";

const VISIBILITY = ["public", "authed", "allowlist", "owner"] as const;

export function CategoryForm({ category }: { category?: Category }) {
  return (
    <form
      action={saveCategory}
      className="max-w-xl space-y-6 rounded-xl border border-rule bg-surface p-6 sm:p-8"
    >
      {category && <input type="hidden" name="id" value={category.id} />}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls} htmlFor="name">Name</label>
          <input id="name" name="name" required defaultValue={category?.name} className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="slug">Slug</label>
          <input id="slug" name="slug" defaultValue={category?.slug} placeholder="auto from name" className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls} htmlFor="description">Description</label>
        <textarea id="description" name="description" rows={3} defaultValue={category?.description ?? ""} className={inputCls} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls} htmlFor="accentColor">Accent color</label>
          <input id="accentColor" name="accentColor" type="color" defaultValue={category?.accentColor ?? "#1d4ed8"} className="h-10 w-full cursor-pointer rounded-md border border-rule bg-paper" />
        </div>
        <div>
          <label className={labelCls} htmlFor="sortOrder">Sort order</label>
          <input id="sortOrder" name="sortOrder" type="number" defaultValue={category?.sortOrder ?? 0} className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls} htmlFor="visibility">Visibility</label>
          <select id="visibility" name="visibility" defaultValue={category?.visibility ?? "public"} className={inputCls}>
            {VISIBILITY.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="allowedEmails">Allowed emails (for allowlist)</label>
          <input id="allowedEmails" name="allowedEmails" defaultValue={category?.allowedEmails.join(", ")} placeholder="a@x.com, b@y.com" className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Tile image</label>
        <ImageUpload
          name="coverImageKey"
          initialKey={category?.coverImageKey}
          initialUrl={category?.coverImageKey ? publicUrl(category.coverImageKey) : null}
        />
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" className="rounded-full bg-accent px-5 py-2 font-mono text-sm text-white transition-opacity hover:opacity-90">
          Save
        </button>
        {category && (
          <button type="submit" formAction={deleteCategory} className="rounded-full border border-rule px-5 py-2 font-mono text-sm text-muted transition-colors hover:border-accent hover:text-accent">
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
