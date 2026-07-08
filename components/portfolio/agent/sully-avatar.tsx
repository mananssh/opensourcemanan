/**
 * Sully's mark, recolored via a CSS mask — /public/sully.svg stays the single
 * source of truth (its own fill is irrelevant; only the shape's alpha is
 * used), so it never fights ADR 0005's "no hardcoded hex" rule the way baking
 * a colored asset per theme would. Shared by the inline fit-agent panel
 * (Sully's own emerald identity) and the floating Ask Sully trigger (the
 * portfolio's coral accent, since that surface intentionally matches the
 * site's normal theme rather than carrying a separate brand).
 */
export function SullyAvatar({
  className = "h-11 w-11",
  colorClass = "bg-sully-accent",
}: {
  className?: string;
  colorClass?: string;
}) {
  return (
    <span
      aria-hidden
      className={`block ${colorClass} ${className}`}
      style={{
        WebkitMaskImage: "url(/sully.svg)",
        maskImage: "url(/sully.svg)",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}
