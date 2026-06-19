import { saveHackathon, deleteHackathon } from "@/app/admin/actions";
import { AdminForm } from "@/components/admin/admin-form";
import { ImageUpload } from "@/components/image-upload";
import { MultiImageUpload } from "@/components/portfolio/admin/multi-image-upload";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { Field, inputCls } from "@/components/portfolio/admin/fields";
import { publicUrl } from "@/lib/storage/gcs";
import type { Hackathon } from "@/db/schema";

const dateVal = (d?: Date | null) =>
  d ? new Date(d).toISOString().slice(0, 10) : "";

export function HackathonForm({ hackathon }: { hackathon?: Hackathon }) {
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
          <Field label="Related project slug" htmlFor="projectSlug">
            <input id="projectSlug" name="projectSlug" defaultValue={hackathon?.projectSlug ?? ""} className={inputCls} />
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
        <form action={deleteHackathon} className="mt-4 max-w-2xl">
          <input type="hidden" name="id" value={hackathon.id} />
          <ConfirmSubmit
            className="font-mono text-sm text-muted transition-colors hover:text-accent"
            message="Delete this hackathon?"
            pendingLabel="Deleting…"
          >
            Delete hackathon
          </ConfirmSubmit>
        </form>
      )}
    </>
  );
}
