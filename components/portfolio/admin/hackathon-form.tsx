import { saveHackathon, deleteHackathon } from "@/app/admin/actions";
import { AdminForm } from "@/components/admin/admin-form";
import { ImageUpload } from "@/components/image-upload";
import { MultiImageUpload } from "@/components/portfolio/admin/multi-image-upload";
import { DeleteButton, Field, dateVal, inputCls } from "@/components/portfolio/admin/fields";
import { publicUrl } from "@/lib/storage/object-store";
import type { Hackathon } from "@/db/schema";

export function HackathonForm({
  hackathon,
  projects,
}: {
  hackathon?: Hackathon;
  projects: { slug: string; name: string }[];
}) {
  return (
    <>
      <AdminForm
        action={saveHackathon}
        className="max-w-2xl space-y-6 rounded-xl border border-rule bg-surface p-6 sm:p-8"
      >
        {hackathon && <input type="hidden" name="id" value={hackathon.id} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Event" htmlFor="event">
            <input id="event" name="event" required defaultValue={hackathon?.event} className={inputCls} />
          </Field>
          <Field label="Slug" htmlFor="slug" hint="auto from event if blank">
            <input id="slug" name="slug" defaultValue={hackathon?.slug} className={inputCls} />
          </Field>
          <Field label="Result" htmlFor="result">
            <input id="result" name="result" defaultValue={hackathon?.result} placeholder="Winner / 1st runner-up…" className={inputCls} />
          </Field>
          <Field label="Date" htmlFor="happenedAt">
            <input id="happenedAt" name="happenedAt" type="date" defaultValue={dateVal(hackathon?.happenedAt)} className={inputCls} />
          </Field>
          <Field label="Related project" htmlFor="projectSlug">
            <select id="projectSlug" name="projectSlug" defaultValue={hackathon?.projectSlug ?? ""} className={inputCls}>
              <option value="">(none)</option>
              {projects.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Sort order" htmlFor="sortOrder">
            <input id="sortOrder" name="sortOrder" type="number" defaultValue={hackathon?.sortOrder ?? 0} className={inputCls} />
          </Field>
        </div>
        <Field label="Blurb" htmlFor="blurb">
          <textarea id="blurb" name="blurb" rows={2} defaultValue={hackathon?.blurb} className={inputCls} />
        </Field>
        <Field label="Body (full detail)" htmlFor="body">
          <textarea id="body" name="body" rows={4} defaultValue={hackathon?.body} className={inputCls} />
        </Field>
        <Field label="Stack (comma-separated)" htmlFor="stack">
          <input id="stack" name="stack" defaultValue={hackathon?.stack.join(", ")} className={inputCls} />
        </Field>
        <Field label="Cover image">
          <ImageUpload
            name="coverImageKey"
            vertical="portfolio"
            initialKey={hackathon?.coverImageKey}
            initialUrl={hackathon?.coverImageKey ? publicUrl(hackathon.coverImageKey) : null}
          />
        </Field>
        <Field label="Detail gallery (multiple)">
          <MultiImageUpload
            name="imageKeys"
            vertical="portfolio"
            initial={(hackathon?.imageKeys ?? []).map((k) => ({ key: k, url: publicUrl(k) }))}
          />
        </Field>
      </AdminForm>

      {hackathon && (
        <DeleteButton
          action={deleteHackathon}
          id={hackathon.id}
          message="Delete this hackathon?"
          label="Delete hackathon"
        />
      )}
    </>
  );
}
