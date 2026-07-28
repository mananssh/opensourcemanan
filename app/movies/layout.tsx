import type { Metadata } from "next";
import { Oswald, Public_Sans, Space_Mono } from "next/font/google";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButton } from "@/components/auth-button";
import { VerticalFooter } from "@/components/vertical-footer";

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  display: "swap",
});
const publicSans = Public_Sans({
  variable: "--font-public-sans",
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
      className={`vertical-movies ${oswald.variable} ${publicSans.variable} ${spaceMono.variable} flex min-h-dvh flex-col bg-paper font-body text-ink`}
    >
      <a href="#content" className="skip-link">
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-rule bg-paper/85 backdrop-blur">
        <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href="/movies"
            className="group inline-flex items-center gap-2 font-display text-2xl font-bold uppercase tracking-[0.08em] text-ink"
          >
            <span aria-hidden className="text-accent transition-transform group-hover:rotate-12">
              ◈
            </span>
            Reel
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
