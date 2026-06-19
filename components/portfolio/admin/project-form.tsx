import { saveProject, deleteProject } from "@/app/admin/actions";
import { AdminForm } from "@/components/admin/admin-form";
import { ImageUpload } from "@/components/image-upload";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { Field, inputCls } from "@/components/portfolio/admin/fields";
import { publicUrl } from "@/lib/storage/gcs";
import type { Project } from "@/db/schema";

export function ProjectForm({ project }: { project?: Project }) {
  const links = (project?.links ?? []).map((l) => `${l.label} | ${l.url}`).join("\n");
  return (
    <>
      <AdminForm
        action={saveProject}
        className="max-w-2xl space-y-6 rounded-xl border border-rule bg-surface p-6 sm:p-8"
      >
        {project && <input type="hidden" name="id" value={project.id} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="name">
            <input id="name" name="name" required defaultValue={project?.name} className={inputCls} />
          </Field>
          <Field label="Slug" htmlFor="slug" hint="auto from name if blank">
            <input id="slug" name="slug" defaultValue={project?.slug} className={inputCls} />
          </Field>
        </div>
        <Field label="Blurb (one sentence)" htmlFor="blurb">
          <textarea id="blurb" name="blurb" rows={2} defaultValue={project?.blurb} className={inputCls} />
        </Field>
        <Field label="Body (full detail, markdown)" htmlFor="body">
          <textarea id="body" name="body" rows={6} defaultValue={project?.body} className={inputCls} />
        </Field>
        <Field label="Stack (comma-separated)" htmlFor="stack">
          <input id="stack" name="stack" defaultValue={project?.stack.join(", ")} className={inputCls} />
        </Field>
        <Field label="Links" hint="One per line — “label | https://…”">
          <textarea name="links" rows={3} defaultValue={links} className={inputCls} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Award" htmlFor="award">
            <input id="award" name="award" defaultValue={project?.award ?? ""} className={inputCls} />
          </Field>
          <Field label="Year" htmlFor="year">
            <input id="year" name="year" defaultValue={project?.year ?? ""} className={inputCls} />
          </Field>
          <Field label="Sort order" htmlFor="sortOrder">
            <input id="sortOrder" name="sortOrder" type="number" defaultValue={project?.sortOrder ?? 0} className={inputCls} />
          </Field>
        </div>
        <label className="flex items-center gap-2 font-mono text-sm text-ink">
          <input type="checkbox" name="featured" defaultChecked={project?.featured} className="size-4 accent-[var(--accent)]" />
          Featured on the landing
        </label>
        <Field label="Cover image">
          <ImageUpload
            name="coverImageKey"
            vertical="portfolio"
            initialKey={project?.coverImageKey}
            initialUrl={project?.coverImageKey ? publicUrl(project.coverImageKey) : null}
          />
        </Field>
      </AdminForm>

      {project && (
        <form action={deleteProject} className="mt-4 max-w-2xl">
          <input type="hidden" name="id" value={project.id} />
          <ConfirmSubmit
            className="font-mono text-sm text-muted transition-colors hover:text-accent"
            message="Delete this project?"
            pendingLabel="Deleting…"
          >
            Delete project
          </ConfirmSubmit>
        </form>
      )}
    </>
  );
}
