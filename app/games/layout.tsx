import type { Metadata } from "next";
import { Syne, Manrope, IBM_Plex_Mono } from "next/font/google";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButton } from "@/components/auth-button";
import { VerticalFooter } from "@/components/vertical-footer";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono-games",
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "ARCD", template: "%s · ARCD" },
  description:
    "ARCD — the arcade. Playable experiments: single-player, multiplayer, and whatever lands next.",
};

export default function GamesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div
      className={`vertical-games ${syne.variable} ${manrope.variable} ${plexMono.variable} flex min-h-dvh flex-col bg-paper font-body text-ink`}
    >
      <a href="#content" className="skip-link">
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-rule bg-paper">
        <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/games"
            className="arcd-wordmark font-display text-xl font-bold text-ink transition-colors hover:text-accent"
            aria-label="ARCD home"
          >
            ARCD
            <span className="text-accent" aria-hidden>
              .
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

      <VerticalFooter tagline="ARCD · the arcade." />
    </div>
  );
}
