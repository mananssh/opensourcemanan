import { saveProfile } from "@/app/admin/actions";
import { AdminForm } from "@/components/admin/admin-form";
import { ImageUpload } from "@/components/image-upload";
import { Field, inputCls } from "@/components/portfolio/admin/fields";
import { publicUrl } from "@/lib/storage/gcs";
import type { Profile } from "@/db/schema";

export function ProfileForm({ profile }: { profile: Profile | null }) {
  const langs = (profile?.languages ?? [])
    .map((l) => (l.level ? `${l.name}: ${l.level}` : l.name))
    .join("\n");
  return (
    <AdminForm
      action={saveProfile}
      className="max-w-2xl space-y-6 rounded-xl border border-rule bg-surface p-6 sm:p-8"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="name">
          <input id="name" name="name" required defaultValue={profile?.name} className={inputCls} />
        </Field>
        <Field label="Tagline" htmlFor="tagline">
          <input id="tagline" name="tagline" defaultValue={profile?.tagline} className={inputCls} />
        </Field>
      </div>
      <Field label="Intro" htmlFor="intro">
        <textarea id="intro" name="intro" rows={2} defaultValue={profile?.intro} className={inputCls} />
      </Field>
      <Field label="Now (what you're building)" htmlFor="now">
        <textarea id="now" name="now" rows={2} defaultValue={profile?.now} className={inputCls} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email" htmlFor="email">
          <input id="email" name="email" type="email" defaultValue={profile?.email} className={inputCls} />
        </Field>
        <Field label="Location" htmlFor="location">
          <input id="location" name="location" defaultValue={profile?.location} className={inputCls} />
        </Field>
        <Field label="LinkedIn URL" htmlFor="linkedin">
          <input id="linkedin" name="linkedin" defaultValue={profile?.linkedin} className={inputCls} />
        </Field>
        <Field label="GitHub URL" htmlFor="github">
          <input id="github" name="github" defaultValue={profile?.github ?? ""} className={inputCls} />
        </Field>
      </div>
      <Field label="Spoken languages" hint="One per line — “Name: level”">
        <textarea name="languages" rows={5} defaultValue={langs} className={inputCls} />
      </Field>
      <Field label="Résumé URL" hint="A public link (e.g. a GCS PDF URL)">
        <input name="resumeKey" defaultValue={profile?.resumeKey ?? ""} className={inputCls} />
      </Field>
      <Field label="Photo">
        <ImageUpload
          name="photoKey"
          vertical="portfolio"
          initialKey={profile?.photoKey}
          initialUrl={profile?.photoKey ? publicUrl(profile.photoKey) : null}
        />
      </Field>
    </AdminForm>
  );
}
