/**
 * Quiet editorial footer — the one place the person behind OSM is named.
 */
export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-rule">
      <div className="container-editorial flex flex-col gap-1 py-10 sm:flex-row sm:items-center sm:justify-between">
        <span className="font-display text-base text-ink">
          OSM<span className="text-accent">.</span>
        </span>
        <span className="label-caps text-faint">
          Built &amp; maintained by Manan Shah
        </span>
      </div>
    </footer>
  );
}
