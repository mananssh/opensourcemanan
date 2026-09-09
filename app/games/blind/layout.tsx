import type { Metadata } from "next";
import { Archivo_Black, Outfit, IBM_Plex_Mono } from "next/font/google";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

const archivoBlack = Archivo_Black({
  variable: "--font-archivo-black",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit-blind",
  subsets: ["latin"],
  display: "swap",
});

const ibmPlex = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Blind",
  description:
    "Same room. One of you has the wrong word. Pass-and-play Undercover for ARCD.",
};

export default function BlindLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div
      className={`vertical-blind ${archivoBlack.variable} ${outfit.variable} ${ibmPlex.variable} relative flex min-h-dvh flex-col bg-paper font-body text-ink`}
    >
      <a href="#content" className="skip-link">
        Skip to content
      </a>
      <header className="relative z-40 border-b border-rule bg-paper/90 backdrop-blur-sm">
        <nav className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 py-3 sm:px-6">
          <Link
            href="/games/blind"
            className="blind-wordmark font-display text-xl text-ink transition-colors hover:text-accent"
            aria-label="Blind home"
          >
            Blind
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/games"
              className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-faint transition-colors hover:text-accent"
            >
              ARCD
            </Link>
            <ThemeToggle />
          </div>
        </nav>
      </header>
      <main id="content" tabIndex={-1} className="relative z-10 flex-1 outline-none">
        {children}
      </main>
    </div>
  );
}
