import type { ReactNode } from "react";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";

/** Shared admin form styling + a small labelled-field wrapper. */
export const labelCls =
  "mb-1.5 block font-mono text-[0.7rem] uppercase tracking-[0.15em] text-faint";
export const inputCls =
  "w-full rounded-md border border-rule bg-paper px-3 py-2 font-body text-ink transition-colors focus:border-accent";

/** `Date` → `yyyy-mm-dd` for a native date input's `defaultValue`. */
export function dateVal(d?: Date | null): string {
  return d ? new Date(d).toISOString().slice(0, 10) : "";
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className={labelCls} htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 font-mono text-[0.65rem] text-faint">{hint}</p>}
    </div>
  );
}

/** The "delete this row" form + confirm button shared by every admin form. */
export function DeleteButton({
  action,
  id,
  message,
  label,
  className = "mt-4 max-w-2xl",
}: {
  action: (fd: FormData) => Promise<void>;
  id: string;
  message: string;
  label: ReactNode;
  className?: string;
}) {
  return (
    <form action={action} className={className}>
      <input type="hidden" name="id" value={id} />
      <ConfirmSubmit
        className="font-mono text-sm text-muted transition-colors hover:text-accent"
        message={message}
        pendingLabel="Deleting…"
      >
        {label}
      </ConfirmSubmit>
    </form>
  );
}
