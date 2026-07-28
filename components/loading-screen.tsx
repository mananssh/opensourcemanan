/**
 * Shared route-loading fallback. Rendered by each vertical's `loading.tsx`, so
 * it sits inside that vertical's layout and inherits its theme tokens (the ring
 * is `--accent`, the label `--faint`) — one component, themed everywhere. The
 * spin is motion-safe only (reduced-motion falls back to the pulsing label).
 */
export function LoadingScreen({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-6">
      <span className="relative inline-flex h-10 w-10" aria-hidden>
        <span className="absolute inset-0 rounded-full border-2 border-rule" />
        <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent motion-safe:animate-spin" />
      </span>
      <span className="animate-pulse font-mono text-[0.7rem] uppercase tracking-[0.24em] text-faint">
        {label}…
      </span>
    </div>
  );
}
