"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";

/**
 * Accessible expand modal for gallery items. Rendered by an intercepting route,
 * so it's open on mount; closing returns to the gallery (router.back). Portaled
 * to body to clear the sticky header — `scopeClass` re-applies the portfolio
 * theme + fonts inside the portal.
 */
export function DetailModal({
  scopeClass,
  children,
}: {
  scopeClass: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <Dialog.Root defaultOpen onOpenChange={(open) => !open && router.back()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/55 backdrop-blur-sm data-[state=closed]:opacity-0 data-[state=open]:opacity-100 transition-opacity" />
        <Dialog.Content
          className={`${scopeClass} fixed left-1/2 top-1/2 z-[61] max-h-[88vh] w-[min(92vw,720px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-rule bg-surface p-6 text-ink shadow-2xl focus:outline-none sm:p-8 data-[state=closed]:opacity-0 data-[state=open]:opacity-100`}
        >
          <Dialog.Title className="sr-only">Details</Dialog.Title>
          <Dialog.Close
            aria-label="Close"
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-rule text-muted transition-colors hover:border-accent hover:text-accent"
          >
            ×
          </Dialog.Close>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
