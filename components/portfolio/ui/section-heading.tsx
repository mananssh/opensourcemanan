/** Reusable section rhythm: mono eyebrow + display title + optional subtitle. */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-8">
      <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-faint">
        {eyebrow}
      </p>
      <h2 className="mt-2 font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 max-w-prose font-body text-muted">{subtitle}</p>
      )}
    </div>
  );
}
