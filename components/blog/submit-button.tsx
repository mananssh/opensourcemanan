"use client";

import { useFormStatus } from "react-dom";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Submit button that reflects the parent form's pending state: disabled while
 * submitting (prevents double-submit / multi-click) and shows a loading label.
 * Forwards extra button attributes (e.g. aria-pressed, aria-label).
 */
export function SubmitButton({
  children,
  pendingLabel,
  className,
  ...rest
}: {
  children: ReactNode;
  pendingLabel?: ReactNode;
  className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "disabled">) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`${className ?? ""} ${pending ? "cursor-wait opacity-60" : ""}`}
      {...rest}
    >
      {pending && pendingLabel !== undefined ? pendingLabel : children}
    </button>
  );
}
