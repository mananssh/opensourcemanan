import { saveExperience, deleteExperience } from "@/app/admin/actions";
import { AdminForm } from "@/components/admin/admin-form";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { Field, inputCls } from "@/components/portfolio/admin/fields";
import type { Experience } from "@/db/schema";

const dateVal = (d?: Date | null) =>
  d ? new Date(d).toISOString().slice(0, 10) : "";

export function ExperienceForm({ experience }: { experience?: Experience }) {
  return (
    <>
      <AdminForm
        action={saveExperience}
        className="max-w-2xl space-y-6 rounded-xl border border-rule bg-surface p-6 sm:p-8"
      >
        {experience && <input type="hidden" name="id" value={experience.id} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Org" htmlFor="org">
            <input id="org" name="org" required defaultValue={experience?.org} className={inputCls} />
          </Field>
          <Field label="Role" htmlFor="role">
            <input id="role" name="role" required defaultValue={experience?.role} className={inputCls} />
          </Field>
          <Field label="Started" htmlFor="startedAt">
            <input id="startedAt" name="startedAt" type="date" defaultValue={dateVal(experience?.startedAt)} className={inputCls} />
          </Field>
          <Field label="Ended" htmlFor="endedAt" hint="blank = present">
            <input id="endedAt" name="endedAt" type="date" defaultValue={dateVal(experience?.endedAt)} className={inputCls} />
          </Field>
          <Field label="Location" htmlFor="location">
            <input id="location" name="location" defaultValue={experience?.location ?? ""} className={inputCls} />
          </Field>
          <Field label="Sort order" htmlFor="sortOrder">
            <input id="sortOrder" name="sortOrder" type="number" defaultValue={experience?.sortOrder ?? 0} className={inputCls} />
          </Field>
        </div>
        <Field label="Blurb" htmlFor="blurb">
          <textarea id="blurb" name="blurb" rows={2} defaultValue={experience?.blurb} className={inputCls} />
        </Field>
        <Field label="Body (full detail)" htmlFor="body">
          <textarea id="body" name="body" rows={4} defaultValue={experience?.body} className={inputCls} />
        </Field>
      </AdminForm>

      {experience && (
        <form action={deleteExperience} className="mt-4 max-w-2xl">
          <input type="hidden" name="id" value={experience.id} />
          <ConfirmSubmit
            className="font-mono text-sm text-muted transition-colors hover:text-accent"
            message="Delete this experience?"
            pendingLabel="Deleting…"
          >
            Delete experience
          </ConfirmSubmit>
        </form>
      )}
    </>
  );
}
