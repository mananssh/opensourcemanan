import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { listBookmarkedPosts } from "@/lib/blog/queries";
import { PostList } from "@/components/blog/post-list";

export const metadata: Metadata = {
  title: "Saved",
  robots: { index: false, follow: false },
};

export default async function BookmarksPage() {
  await requireAuth();
  const posts = await listBookmarkedPosts();

  return (
    <div className="mx-auto w-full max-w-5xl px-6 pb-28 pt-20 sm:pt-28">
      <header className="pb-12">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-faint">
          Your library
        </p>
        <h1 className="mt-4 font-display text-6xl font-extrabold uppercase leading-[0.85] tracking-[-0.03em] text-ink sm:text-8xl">
          Saved<span className="text-accent">.</span>
        </h1>
      </header>
      {posts.length > 0 ? (
        <PostList posts={posts} />
      ) : (
        <p className="font-body text-lg text-muted">
          Nothing saved yet. Hit “Save” on any post to keep it here.
        </p>
      )}
    </div>
  );
}
