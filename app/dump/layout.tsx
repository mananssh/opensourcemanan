import type { Metadata } from "next";
import { Caveat } from "next/font/google";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButton } from "@/components/auth-button";
import { VerticalFooter } from "@/components/vertical-footer";

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Thought Dump", template: "%s · Thought Dump" },
  description: "A wall of half-formed thoughts on sticky notes.",
};

export default function DumpLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div
      className={`vertical-dump ${caveat.variable} flex min-h-dvh flex-col bg-paper font-body text-ink`}
    >
      <a href="#content" className="skip-link">
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-rule bg-paper/80 backdrop-blur">
        <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href="/dump"
            className="font-display text-3xl font-bold tracking-tight text-ink"
          >
            Thought Dump<span className="text-accent">.</span>
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

      <VerticalFooter tagline="Half-formed thoughts." />
    </div>
  );
}
