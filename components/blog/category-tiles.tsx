import Link from "next/link";
import { publicUrl } from "@/lib/storage/gcs";
import type { Category } from "@/db/schema";

/**
 * Spotify-style genre tiles: a saturated color block with the category name and
 * an assigned cover image tucked into the corner, rotated. Reads like a real
 * section, not a tag. Image is optional — color + title alone still reads as a
 * tile. (Image is assigned per category in the admin.)
 */
export function CategoryTiles({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`/blog/category/${c.slug}`}
          className="group relative aspect-[1.6/1] overflow-hidden rounded-xl p-4 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md"
          style={{ backgroundColor: c.accentColor }}
        >
          <span className="relative z-10 line-clamp-2 font-display text-lg font-extrabold uppercase leading-[0.95] tracking-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)] sm:text-xl">
            {c.name}
          </span>
          {c.coverImageKey && (
            // Decorative corner art, Spotify-style; alt empty by design.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={publicUrl(c.coverImageKey)}
              alt=""
              aria-hidden
              className="pointer-events-none absolute -bottom-3 -right-5 h-20 w-28 rotate-[18deg] rounded-md object-cover shadow-xl transition-transform duration-200 group-hover:rotate-[14deg] sm:h-24 sm:w-36"
            />
          )}
        </Link>
      ))}
    </div>
  );
}
