import Link from "next/link";
import {
  deleteThought,
  toggleThoughtVisibility,
  togglePinned,
} from "@/app/dump/actions";
import { SubmitButton } from "@/components/blog/submit-button";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { stickyStyle } from "@/components/dump/sticky-palette";
import type { ThoughtCard } from "@/lib/dump/queries";

function fmt(d: Date): string {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const ctrlCls =
  "font-mono text-[0.6rem] uppercase tracking-[0.1em] opacity-70 transition-opacity hover:opacity-100";

/**
 * A single sticky note. The whole card links to its permalink (`linked`);
 * owner controls render as separate siblings so they stay clickable (no
 * interactive elements nested inside the card link).
 */
export function StickyNote({
  thought,
  isOwner,
  linked = true,
}: {
  thought: ThoughtCard;
  isOwner: boolean;
  linked?: boolean;
}) {
  const s = stickyStyle(thought.id);

  const content = (
    <>
      {thought.imageUrl && (
        // Private signed URL; alt empty (decorative — body carries meaning).
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thought.imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="mb-3 w-full rounded-sm border border-black/10"
        />
      )}
      {thought.body && (
        <p className="whitespace-pre-wrap font-body text-2xl leading-snug">
          {thought.body}
        </p>
      )}
      <div className="mt-4 flex items-center justify-between">
        <span className="font-mono text-[0.65rem] tracking-wide opacity-70">
          {fmt(thought.createdAt)}
        </span>
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.12em] opacity-70">
          {thought.visibility === "private" ? "🔒 private" : "public"}
        </span>
      </div>
    </>
  );

  return (
    <article
      className="sticky-note relative mb-5 break-inside-avoid p-5"
      style={{
        backgroundColor: s.bg,
        color: s.ink,
        transform: `rotate(${s.rotate}deg)`,
      }}
    >
      {linked ? (
        <Link
          href={`/dump/${thought.id}`}
          aria-label={`Open thought from ${fmt(thought.createdAt)}`}
          className="block"
        >
          {content}
        </Link>
      ) : (
        content
      )}

      {isOwner && (
        <div className="mt-3 flex items-center gap-3 border-t border-black/10 pt-2">
          <form action={togglePinned}>
            <input type="hidden" name="id" value={thought.id} />
            <SubmitButton className={ctrlCls} pendingLabel="…">
              {thought.pinned ? "Unpin" : "Pin"}
            </SubmitButton>
          </form>
          <form action={toggleThoughtVisibility}>
            <input type="hidden" name="id" value={thought.id} />
            <SubmitButton className={ctrlCls} pendingLabel="…">
              {thought.visibility === "private" ? "Make public" : "Make private"}
            </SubmitButton>
          </form>
          <form action={deleteThought} className="ml-auto">
            <input type="hidden" name="id" value={thought.id} />
            <ConfirmSubmit
              className={ctrlCls}
              message="Delete this thought?"
              pendingLabel="…"
            >
              Delete
            </ConfirmSubmit>
          </form>
        </div>
      )}
    </article>
  );
}
