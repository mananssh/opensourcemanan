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
      className={`vertical-geetdle ${poppins.variable} ${inter.variable} ${jetbrainsMono.variable} flex min-h-screen flex-col`}
    >
      <header className="sticky top-0 z-40 border-b border-rule bg-paper/80 backdrop-blur-xl supports-[backdrop-filter]:bg-paper/70">
        <div className="container mx-auto flex h-16 items-center justify-between px-5">
          <Link
            href="/games/geetdle"
            className="geetdle-wordmark text-xl tracking-tight text-ink transition-opacity hover:opacity-70"
            style={{ fontFamily: "var(--display-family)" }}
          >
            GEETDLE
          </Link>

          <div className="flex items-center gap-5">
            <Link
              href="/games/geetdle/archive"
              className="text-sm text-muted transition-colors hover:text-ink"
            >
              Archive
            </Link>
            <Link
              href="/games"
              className="hidden text-sm text-muted transition-colors hover:text-ink sm:inline"
            >
              All Games
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* z-20 keeps the guess autocomplete (inside main) painting above the
          footer, which is a later same-z sibling. */}
      <main className="relative z-20 flex-1">{children}</main>

      <footer className="relative z-10 mt-auto border-t border-rule">
        <div
          className="container mx-auto flex flex-col items-center gap-1 px-5 py-8 text-center text-xs text-faint"
          style={{ fontFamily: "var(--mono-family)" }}
        >
          <p className="tracking-wide">
            A DAILY PUZZLE BY{" "}
            <Link
              href="/"
              className="text-muted transition-colors hover:text-ink"
            >
              OSM
            </Link>
          </p>
          <p className="tracking-wide">
            SONGS FROM MRASACKER BOLLYWOOD DATASET
          </p>
        </div>
      </footer>
    </div>
  );
}
