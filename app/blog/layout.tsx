import type { Metadata } from "next";
import { Archivo, Hanken_Grotesk } from "next/font/google";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButton } from "@/components/auth-button";
import { VerticalFooter } from "@/components/vertical-footer";

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
    "Deep dives into whatever I'm currently obsessed with — no single topic, just things worth thinking hard about.",
  alternates: {
    types: {
      "application/rss+xml": [{ url: "/blog/feed.xml", title: "OSM Blog" }],
      "application/feed+json": [{ url: "/blog/feed.json", title: "OSM Blog" }],
    },
  },
};

export default function BlogLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div
      className={`vertical-blog ${archivo.variable} ${hanken.variable} flex min-h-full flex-col bg-paper font-body text-ink`}
    >
      <a href="#content" className="skip-link">
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-rule bg-paper/80 backdrop-blur">
        <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href="/blog"
            className="font-display text-lg font-extrabold uppercase tracking-tight text-ink"
          >
            <span className="text-accent">/</span>blog
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

      <VerticalFooter tagline="Rabbit holes — a blog." />
    </div>
  );
}
