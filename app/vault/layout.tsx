import type { Metadata } from "next";
import { Cinzel, Figtree, Azeret_Mono } from "next/font/google";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButton } from "@/components/auth-button";
import { VerticalFooter } from "@/components/vertical-footer";
import { requireVaultOwner } from "@/lib/vault/access";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  display: "swap",
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  display: "swap",
});

const azeret = Azeret_Mono({
  variable: "--font-azeret",
  subsets: ["latin"],
  display: "swap",
});

// Never indexed, never in siteNav — a private vertical shouldn't be discoverable.
export const metadata: Metadata = {
  title: { default: "Vault", template: "%s · Vault" },
  description: "A private, encrypted document store.",
  robots: { index: false, follow: false },
};

export default async function VaultLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Gate the ENTIRE vertical here: a non-owner gets the root 404 (rendered by the
  // parent segment's not-found boundary) with no vault chrome — the vault never
  // confirms it exists. Every child page, action, and API route re-checks too.
  await requireVaultOwner();

  return (
    <div
      className={`vertical-vault ${cinzel.variable} ${figtree.variable} ${azeret.variable} flex min-h-dvh flex-col bg-paper font-body text-ink`}
    >
      <a href="#content" className="skip-link">
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-rule bg-paper/90 backdrop-blur-sm">
        <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-3">
          <Link
            href="/vault"
            className="vault-wordmark font-display text-xl font-semibold text-ink transition-colors hover:text-accent"
            aria-label="Vault home"
          >
            Vault
          </Link>
          <div className="flex items-center gap-4">
            <span
              className="hidden items-center gap-2 font-mono text-[0.58rem] uppercase tracking-[0.22em] text-faint sm:inline-flex"
              aria-label="Documents are encrypted at rest"
            >
              <span
                aria-hidden
                className="inline-block h-1.5 w-1.5 bg-accent-2 motion-safe:animate-pulse"
              />
              Sealed · AES-256
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
        <VerticalFooter tagline="Vault · sealed under blacklight. Only you can open it." />
      </div>
    </div>
  );
}
