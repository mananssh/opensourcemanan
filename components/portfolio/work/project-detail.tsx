import Image from "next/image";
import { publicUrl } from "@/lib/storage/gcs";
import { Tag, AwardTag } from "@/components/portfolio/ui/tag";
import { Prose } from "@/components/portfolio/ui/prose";
import type { Project } from "@/db/schema";

export function ProjectDetail({ project }: { project: Project }) {
  const cover = project.coverImageKey ? publicUrl(project.coverImageKey) : null;
  const gallery = project.imageKeys.map(publicUrl);

  return (
    <article>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
          {project.name}
        </h1>
        {project.year && (
          <span className="font-mono text-xs text-faint">{project.year}</span>
        )}
      </div>
      {project.award && (
        <div className="mt-3">
          <AwardTag>{project.award}</AwardTag>
        </div>
      )}
      {project.blurb && (
        <p className="mt-4 font-body text-lg leading-relaxed text-ink">
          {project.blurb}
        </p>
      )}

      {cover && (
        <div className="relative mt-6 aspect-video overflow-hidden rounded-xl border border-rule">
          <Image src={cover} alt="" fill sizes="(max-width: 720px) 92vw, 660px" className="object-cover" />
        </div>
      )}

      {project.body && (
        <div className="mt-6">
          <Prose>{project.body}</Prose>
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

      {project.stack.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {project.stack.map((s) => (
            <Tag key={s}>{s}</Tag>
          ))}
        </div>
      )}

      {project.links.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
          {project.links.map((l) => (
            <a
              key={l.url}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm text-accent underline underline-offset-4"
            >
              {l.label} ↗
            </a>
          ))}
        </div>
      )}
    </article>
  );
}
