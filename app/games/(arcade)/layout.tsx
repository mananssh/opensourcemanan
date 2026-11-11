import type { Metadata } from "next";
import { Big_Shoulders, Sora, Share_Tech_Mono } from "next/font/google";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButton } from "@/components/auth-button";
import { VerticalFooter } from "@/components/vertical-footer";

const bigShoulders = Big_Shoulders({
  variable: "--font-big-shoulders",
  subsets: ["latin"],
  display: "swap",
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
});

const shareTech = Share_Tech_Mono({
  variable: "--font-share-tech",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "ARCD", template: "%s · ARCD" },
  description:
    "ARCD — arcade cabinets after hours. Playable experiments: single-player, multiplayer, and whatever lands next.",
};

export default function GamesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div
      className={`vertical-games ${bigShoulders.variable} ${sora.variable} ${shareTech.variable} flex min-h-dvh flex-col bg-paper font-body text-ink`}
    >
      <a href="#content" className="skip-link">
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-rule bg-paper/90 backdrop-blur-sm">
        <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3">
          <Link
            href="/games"
            className="arcd-wordmark font-display text-2xl font-bold text-ink transition-colors hover:text-accent"
            aria-label="ARCD home"
          >
            ARCD
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden font-mono text-[0.65rem] uppercase tracking-[0.2em] text-faint sm:inline">
              After hours
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
        <VerticalFooter tagline="ARCD · cabinets after hours." />
      </div>
    </div>
  );
}
