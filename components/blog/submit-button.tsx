"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

/**
 * Submit button that reflects the parent form's pending state: disabled while
 * submitting (prevents double-submit / multi-click) and shows a loading label.
 */
export function SubmitButton({
  children,
  pendingLabel,
  className,
}: {
  children: ReactNode;
  pendingLabel?: ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`${className ?? ""} ${pending ? "cursor-wait opacity-60" : ""}`}
    >
      {pending && pendingLabel !== undefined ? pendingLabel : children}
    </button>
  );
}
