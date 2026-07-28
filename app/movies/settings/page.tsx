import type { Metadata } from "next";
import Link from "next/link";
import { requireViewer } from "@/lib/movies/identity";
import { toPublicWatcher } from "@/lib/movies/queries";
import { ProfileForm } from "@/components/movies/profile-form";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const viewer = await requireViewer();

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-14">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
          Settings<span className="text-accent">.</span>
        </h1>
        <Link
          href="/movies"
          className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted transition-colors hover:text-accent"
        >
          ← Back
        </Link>
      </div>
      <ProfileForm watcher={toPublicWatcher(viewer)} />
    </div>
  );
}
