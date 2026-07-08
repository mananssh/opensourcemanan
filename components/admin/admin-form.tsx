"use client";

import { useActionState, useEffect, useRef } from "react";
import { SubmitButton } from "@/components/blog/submit-button";
import type { FormState } from "@/components/admin/form-state";

/**
 * Client shell for the admin save forms. Wraps the server action in
 * useActionState so validation/DB errors (e.g. a duplicate slug) surface inline
 * instead of crashing the action, and warns before navigating away with unsaved
 * edits. The fields themselves are server-rendered and passed as children.
 */
export function AdminForm({
  action,
  className,
  children,
  submitLabel = "Save",
  pendingLabel = "Saving…",
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  className?: string;
  children: React.ReactNode;
  submitLabel?: string;
  pendingLabel?: string;
}) {
  const [state, formAction] = useActionState(action, {});
  const dirty = useRef(false);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  return (
    <form
      action={formAction}
      onChange={() => {
        dirty.current = true;
      }}
      onSubmit={() => {
        dirty.current = false;
      }}
      className={className}
    >
      {children}
      {state.error && (
        <p
          role="alert"
          className="rounded-md border border-[#d9a3a0] bg-[#fbeceb] px-3 py-2 font-mono text-sm text-[#b3261e] dark:border-[#5a2b2b] dark:bg-[#2a1414] dark:text-[#f0a9a4]"
        >
          {state.error}
        </p>
      )}
      <SubmitButton
        className="rounded-full bg-accent px-5 py-2 font-mono text-sm text-white transition-opacity hover:opacity-90"
        pendingLabel={pendingLabel}
      >
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
