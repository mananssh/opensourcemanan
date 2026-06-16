import type { Metadata } from "next";
import { Archivo, Hanken_Grotesk } from "next/font/google";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
});

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Blog", template: "%s · OSM Blog" },
  description:
    "Long-form essays and deep dives on engineering, design, and the things I build.",
};

export default function BlogLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div
      className={`vertical-blog ${archivo.variable} ${hanken.variable} flex min-h-full flex-col bg-paper font-body text-ink`}
    >
      <header className="sticky top-0 z-40 border-b border-rule bg-paper/80 backdrop-blur">
        <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href="/blog"
            className="font-display text-lg font-extrabold uppercase tracking-tight text-ink"
          >
            <span className="text-accent">/</span>blog
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted transition-colors hover:text-accent"
            >
              ← osm
            </Link>
            <ThemeToggle />
          </div>
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-rule">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-10 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-faint">
          <span>OSM — Blog</span>
          <Link href="/" className="transition-colors hover:text-accent">
            ← back to osm
          </Link>
        </div>
      </footer>
    </div>
  );
}
