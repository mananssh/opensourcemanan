import type { ReactNode } from "react";

/** Shared admin form styling + a small labelled-field wrapper. */
export const labelCls =
  "mb-1.5 block font-mono text-[0.7rem] uppercase tracking-[0.15em] text-faint";
export const inputCls =
  "w-full rounded-md border border-rule bg-paper px-3 py-2 font-body text-ink transition-colors focus:border-accent";

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
