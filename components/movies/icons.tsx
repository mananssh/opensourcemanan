/**
 * SVG icons for Reel. Per the ui-ux-pro-max checklist, structural icons are
 * vector (theming + crisp scaling), never emoji. currentColor so they inherit
 * token colors.
 */
export function HeartIcon({
  filled,
  className = "h-4 w-4",
}: {
  filled: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 2}
    >
      <path d="M12 21s-7.5-4.9-10-9.6C.5 8.4 2 5 5.3 5c2 0 3.3 1.1 4.7 2.8C11.4 6.1 12.7 5 14.7 5 18 5 19.5 8.4 22 11.4 19.5 16.1 12 21 12 21z" />
    </svg>
  );
}
