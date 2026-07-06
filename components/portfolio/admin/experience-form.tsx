import { saveExperience, deleteExperience } from "@/app/admin/actions";
import { AdminForm } from "@/components/admin/admin-form";
import { ImageUpload } from "@/components/image-upload";
import { DeleteButton, Field, dateVal, inputCls } from "@/components/portfolio/admin/fields";
import { publicUrl } from "@/lib/storage/gcs";
import type { Experience } from "@/db/schema";

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
        <Field label="Logo">
          <ImageUpload
            name="logoKey"
            vertical="portfolio"
            initialKey={experience?.logoKey}
            initialUrl={experience?.logoKey ? publicUrl(experience.logoKey) : null}
          />
        </Field>
      </AdminForm>

      {experience && (
        <DeleteButton
          action={deleteExperience}
          id={experience.id}
          message="Delete this experience?"
          label="Delete experience"
        />
      )}
    </>
  );
}
