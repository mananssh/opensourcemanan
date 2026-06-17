"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

/** Submit button that confirms before submitting (for destructive actions) and
 *  shows a pending state while the action runs. */
export function ConfirmSubmit({
  children,
  message,
  pendingLabel,
  className,
}: {
  children: ReactNode;
  message: string;
  pendingLabel?: ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
      className={`${className ?? ""} ${pending ? "cursor-wait opacity-60" : ""}`}
    >
      {pending && pendingLabel !== undefined ? pendingLabel : children}
    </button>
  );
}
