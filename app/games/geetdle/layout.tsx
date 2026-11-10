import type { Metadata } from "next";
import { Poppins, Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

const poppins = Poppins({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter-geetdle",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Geetdle — Daily Bollywood Song Guessing Game",
  description:
    "Daily Bollywood song guessing game. Identify the song from category clues.",
  openGraph: {
    title: "Geetdle",
    description: "Daily Bollywood song guessing game",
    type: "website",
  },
};

export default function GeetdleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`vertical-geetdle ${poppins.variable} ${inter.variable} ${jetbrainsMono.variable} min-h-screen`}
    >
      <header className="sticky top-0 z-40 border-b border-rule bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/80">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link
            href="/games/geetdle"
            className="geetdle-wordmark font-display text-2xl text-ink transition-colors hover:text-accent"
            style={{ fontFamily: "var(--display-family)" }}
          >
            GEETDLE
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/games"
              className="text-sm text-muted transition-colors hover:text-ink"
            >
              ← All Games
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="relative z-10">{children}</main>

      <footer className="relative z-10 border-t border-rule bg-surface py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-sm text-muted">
          <p>
            A daily puzzle game by{" "}
            <Link href="/" className="text-accent hover:underline">
              OSM
            </Link>
          </p>
          <p className="mt-2">
            Songs from MrAsacker Bollywood Dataset • New puzzle daily at
            midnight
          </p>
        </div>
      </footer>
    </div>
  );
}
