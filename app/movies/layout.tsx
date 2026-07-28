import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans, Space_Mono } from "next/font/google";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButton } from "@/components/auth-button";
import { VerticalFooter } from "@/components/vertical-footer";

const bebas = Bebas_Neue({
  variable: "--font-bebas",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});
const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Reel", template: "%s · Reel" },
  description: "A retro logbook for everything you watch. Track films & TV, rate them, share the reel.",
};

export default function MoviesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div
      className={`vertical-movies ${bebas.variable} ${dmSans.variable} ${spaceMono.variable} flex min-h-dvh flex-col bg-paper font-body text-ink`}
    >
      <a href="#content" className="skip-link">
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-rule bg-paper/85 backdrop-blur">
        <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href="/movies"
            className="group inline-flex items-center gap-2.5 text-ink"
            aria-label="Reel home"
          >
            <span
              aria-hidden
              className="inline-flex h-2.5 w-2.5 rounded-full bg-accent transition-shadow group-hover:shadow-[0_0_10px_var(--accent)]"
            />
            <span className="vhs-title font-display text-3xl leading-none tracking-[0.14em]">
              REEL
            </span>
            <span className="hidden font-mono text-[0.58rem] uppercase tracking-[0.24em] text-faint sm:inline">
              ●REC · SP
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <AuthButton />
          </div>
        </nav>
      </header>

      <main id="content" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>

      <VerticalFooter tagline="Reel · this product uses the TMDB API but is not endorsed or certified by TMDB." />
    </div>
  );
}
