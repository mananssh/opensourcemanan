import Image from "next/image";
import { publicUrl } from "@/lib/storage/object-store";
import { Prose } from "@/components/portfolio/ui/prose";
import type { Experience } from "@/db/schema";

function mon(d: Date | null): string | null {
  return d
    ? new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : null;
}
function range(start: Date | null, end: Date | null): string {
  const s = mon(start);
  if (!s) return "";
  return `${s} – ${end ? mon(end) : "present"}`;
}

export function ExperienceDetail({ experience }: { experience: Experience }) {
  const logo = experience.logoKey ? publicUrl(experience.logoKey) : null;
  return (
    <article>
      <div className="flex items-center gap-4">
        {logo && (
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-rule">
            <Image src={logo} alt="" fill sizes="56px" className="object-cover" />
          </div>
        )}
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
            {experience.role}
          </h1>
          <p className="mt-1 font-mono text-xs text-faint">
            {experience.org} · {range(experience.startedAt, experience.endedAt)}
            {experience.location ? ` · ${experience.location}` : ""}
          </p>
        </div>
      </div>
      {experience.blurb && (
        <p className="mt-4 font-body text-lg leading-relaxed text-ink">
          {experience.blurb}
        </p>
      )}
      {experience.body && (
        <div className="mt-6">
          <Prose>{experience.body}</Prose>
        </div>
      )}
    </article>
  );
}
