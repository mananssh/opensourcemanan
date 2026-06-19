import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Particles } from "@/components/portfolio/hero/particles";

const display = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});
const body = Geist({ variable: "--font-geist", subsets: ["latin"], display: "swap" });
const mono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Manan Shah", template: "%s · Manan Shah" },
  description:
    "Manan Shah — software / AI-native engineer who ships. Forward-deployed, full-stack, ML/CV, and AI infrastructure.",
};

export default function PortfolioLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div
      className={`vertical-portfolio ${display.variable} ${body.variable} ${mono.variable} flex min-h-dvh flex-col bg-paper font-body text-ink`}
    >
      <a href="#content" className="skip-link">
        Skip to content
      </a>
      {/* Full-page signal field — fixed so it persists behind everything as you scroll. */}
      <Particles className="pointer-events-none fixed inset-0 z-0 h-full w-full" />
      <header className="sticky top-0 z-40 border-b border-rule bg-paper/80 backdrop-blur">
        <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-display text-lg font-semibold tracking-tight text-ink">
            mananssh<span className="text-accent">.</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/osm"
              className="font-mono text-[0.7rem] uppercase tracking-[0.15em] text-muted transition-colors hover:text-accent"
            >
              OSM ↗
            </Link>
            <ThemeToggle />
          </div>
        </nav>
      </header>

      <main id="content" tabIndex={-1} className="relative z-10 flex-1 outline-none">
        {children}
      </main>

      <footer className="relative z-10 border-t border-rule">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-1 px-6 py-10 font-mono text-[0.7rem] tracking-[0.12em] text-faint sm:flex-row sm:items-center sm:justify-between">
          <span>manan shah — built in the open</span>
          {/* TODO (Phase 2): an MCP endpoint flex for agents — reserved, not built. */}
          <span>mostly blr, maybe bom · usually building · occasionally airborne</span>
        </div>
      </footer>
    </div>
  );
}
