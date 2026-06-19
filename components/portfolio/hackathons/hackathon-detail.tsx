import Image from "next/image";
import Link from "next/link";
import { publicUrl } from "@/lib/storage/gcs";
import { Tag, AwardTag } from "@/components/portfolio/ui/tag";
import { Prose } from "@/components/portfolio/ui/prose";
import type { Hackathon } from "@/db/schema";

function year(d: Date | null): string {
  return d ? String(new Date(d).getUTCFullYear()) : "";
}

export function HackathonDetail({ hackathon }: { hackathon: Hackathon }) {
  const cover = hackathon.coverImageKey ? publicUrl(hackathon.coverImageKey) : null;
  const gallery = hackathon.imageKeys.map(publicUrl);

  return (
    <article>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
          {hackathon.event}
        </h1>
        {hackathon.happenedAt && (
          <span className="font-mono text-xs text-faint">{year(hackathon.happenedAt)}</span>
        )}
      </div>
      {hackathon.result && (
        <div className="mt-3">
          <AwardTag>{hackathon.result}</AwardTag>
        </div>
      )}
      {hackathon.blurb && (
        <p className="mt-4 font-body text-lg leading-relaxed text-ink">
          {hackathon.blurb}
        </p>
      )}

      {cover && (
        <div className="relative mt-6 aspect-video overflow-hidden rounded-xl border border-rule">
          <Image src={cover} alt="" fill sizes="(max-width: 720px) 92vw, 660px" className="object-cover" />
        </div>
      )}

      {hackathon.body && (
        <div className="mt-6">
          <Prose>{hackathon.body}</Prose>
        </div>
      )}

      {gallery.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3">
          {gallery.map((src) => (
            <div key={src} className="relative aspect-[4/3] overflow-hidden rounded-lg border border-rule">
              <Image src={src} alt="" fill sizes="(max-width: 720px) 45vw, 320px" className="object-cover" />
            </div>
          ))}
        </div>
      )}

      {hackathon.stack.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {hackathon.stack.map((s) => (
            <Tag key={s}>{s}</Tag>
          ))}
        </div>
      )}

      {hackathon.projectSlug && (
        <div className="mt-6">
          <Link
            href={`/work/${hackathon.projectSlug}`}
            className="font-mono text-sm text-accent underline underline-offset-4"
          >
            see the project →
          </Link>
        </div>
      )}
    </article>
  );
}
