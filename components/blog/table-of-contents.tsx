export interface TocHeading {
  id: string;
  text: string;
  depth: number;
}

const linkCls =
  "block font-mono text-xs text-muted transition-colors hover:text-accent focus-visible:text-accent";

/** Group h3s under their preceding h2 so the list reflects real hierarchy. */
function nest(items: TocHeading[]): { item: TocHeading; children: TocHeading[] }[] {
  const tree: { item: TocHeading; children: TocHeading[] }[] = [];
  for (const it of items) {
    if (it.depth <= 2 || tree.length === 0) tree.push({ item: it, children: [] });
    else tree[tree.length - 1].children.push(it);
  }
  return tree;
}

/**
 * Accessible table of contents: a labelled landmark with a properly nested list
 * (not padding-faked depth). `label` renders a heading inside the nav; omit it
 * when a surrounding <summary> already names the region.
 */
export function TableOfContents({
  items,
  label,
  className,
}: {
  items: TocHeading[];
  label?: string;
  className?: string;
}) {
  if (items.length === 0) return null;
  const tree = nest(items);
  return (
    <nav aria-label="Table of contents" className={className}>
      {label && (
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-faint">
          {label}
        </p>
      )}
      <ol className={`${label ? "mt-3" : ""} space-y-2`}>
        {tree.map(({ item, children }) => (
          <li key={item.id}>
            <a href={`#${item.id}`} className={linkCls}>
              {item.text}
            </a>
            {children.length > 0 && (
              <ol className="mt-2 space-y-2 border-l border-rule pl-3">
                {children.map((c) => (
                  <li key={c.id}>
                    <a href={`#${c.id}`} className={linkCls}>
                      {c.text}
                    </a>
                  </li>
                ))}
              </ol>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
