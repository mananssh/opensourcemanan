import Link from "next/link";

export default function PortfolioNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="label-caps text-faint">404</p>
      <h1 className="font-display text-5xl font-light tracking-tight text-ink">
        This page wandered off<span className="text-accent">.</span>
      </h1>
      <Link href="/" className="label-caps text-accent transition-opacity hover:opacity-70">
        ← back home
      </Link>
    </div>
  );
}
