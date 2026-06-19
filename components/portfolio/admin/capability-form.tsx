import { saveCapability, deleteCapability } from "@/app/admin/actions";
import { AdminForm } from "@/components/admin/admin-form";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { Field, inputCls } from "@/components/portfolio/admin/fields";
import type { Capability } from "@/db/schema";

export function CapabilityForm({ capability }: { capability?: Capability }) {
  return (
    <>
      <AdminForm
        action={saveCapability}
        className="max-w-xl space-y-6 rounded-xl border border-rule bg-surface p-6 sm:p-8"
      >
        {capability && <input type="hidden" name="id" value={capability.id} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Group name" htmlFor="groupName">
            <input id="groupName" name="groupName" required defaultValue={capability?.groupName} className={inputCls} />
          </Field>
          <Field label="Sort order" htmlFor="sortOrder">
            <input id="sortOrder" name="sortOrder" type="number" defaultValue={capability?.sortOrder ?? 0} className={inputCls} />
          </Field>
        </div>
        <Field label="Items (comma-separated)" htmlFor="items">
          <input id="items" name="items" defaultValue={capability?.items.join(", ")} className={inputCls} />
        </Field>
      </AdminForm>

      {capability && (
        <form action={deleteCapability} className="mt-4 max-w-xl">
          <input type="hidden" name="id" value={capability.id} />
          <ConfirmSubmit
            className="font-mono text-sm text-muted transition-colors hover:text-accent"
            message="Delete this group?"
            pendingLabel="Deleting…"
          >
            Delete group
          </ConfirmSubmit>
        </form>
      )}
    </>
  );
}
