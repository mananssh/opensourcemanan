import type { Metadata } from "next";
import { Anton, Outfit, Red_Hat_Mono } from "next/font/google";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButton } from "@/components/auth-button";
import { VerticalFooter } from "@/components/vertical-footer";

const anton = Anton({
  variable: "--font-anton",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const redHatMono = Red_Hat_Mono({
  variable: "--font-red-hat-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Reel", template: "%s · Reel" },
  description:
    "Last showing — a log of everything you watch. Films, TV, ratings, your lot.",
};

export default function MoviesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div
      className={`vertical-movies ${anton.variable} ${outfit.variable} ${redHatMono.variable} flex min-h-dvh flex-col bg-paper font-body text-ink`}
    >
      <a href="#content" className="skip-link">
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-rule bg-paper/90 backdrop-blur-sm">
        <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-3">
          <Link
            href="/movies"
            className="reel-wordmark font-display text-2xl text-ink transition-colors hover:text-accent"
            aria-label="Reel home"
          >
            Reel
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden font-mono text-[0.58rem] uppercase tracking-[0.22em] text-faint sm:inline">
              Last showing
            </span>
            <ThemeToggle />
            <AuthButton />
          </div>
        </nav>
      </header>

      <main id="content" tabIndex={-1} className="relative z-10 flex-1 outline-none">
        {children}
      </main>

      <div className="relative z-10">
        <VerticalFooter tagline="Reel · uses the TMDB API but is not endorsed or certified by TMDB." />
      </div>
    </div>
  );
}
