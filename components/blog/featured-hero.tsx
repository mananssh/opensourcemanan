import Link from "next/link";
import { publicUrl } from "@/lib/storage/object-store";
import type { PostCard } from "@/lib/blog/queries";

function fmtDate(d: Date | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * The single spotlight post on the blog index — a wide split card (cover image
 * beside the copy) that deliberately does NOT reuse the PostList row, so Featured
 * reads as its own thing rather than a duplicate of Latest. The excerpt is shown
 * as a bordered pull-quote so it's unmistakably a snippet from the piece. Falls
 * back to an accent gradient when a featured post has no cover image.
 */
export function FeaturedHero({ post }: { post: PostCard }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group grid overflow-hidden rounded-2xl border border-rule bg-surface transition-colors hover:border-accent sm:grid-cols-2"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden sm:aspect-auto sm:h-full sm:min-h-[19rem]">
        {post.coverImageKey ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={publicUrl(post.coverImageKey)}
            alt=""
            aria-hidden
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-accent/25 via-surface to-surface" />
        )}
      </div>

      <div className="flex flex-col justify-center gap-4 p-6 sm:p-10">
        <h2 className="font-display text-3xl font-extrabold leading-[1.05] tracking-tight text-ink transition-colors group-hover:text-accent sm:text-4xl">
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="line-clamp-4 border-l-2 border-accent/60 pl-4 font-body text-base italic leading-relaxed text-muted">
            {post.excerpt}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.7rem] uppercase tracking-[0.15em] text-faint">
          {post.category && <span className="text-accent">{post.category.name}</span>}
          {post.publishedAt && <span>{fmtDate(post.publishedAt)}</span>}
          <span>{post.readingMinutes} min</span>
        </div>
      </div>
    </Link>
  );
}
