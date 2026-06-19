"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Tag, AwardTag } from "@/components/portfolio/ui/tag";
import type { Project } from "@/db/schema";

// coverUrl is resolved server-side (publicUrl pulls the GCS SDK — not client-safe).
export type ProjectCard = Project & { coverUrl: string | null };

/** Interactive card grid — entrance stagger + hover lift (framer-motion). */
export function ProjectGrid({ projects }: { projects: ProjectCard[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {projects.map((p, i) => {
        const cover = p.coverUrl;
        return (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: Math.min(i, 6) * 0.05 }}
            whileHover={{ y: -4 }}
          >
            <Link
              href={`/work/${p.slug}`}
              scroll={false}
              className="group block h-full overflow-hidden rounded-xl border border-rule bg-surface transition-colors hover:border-accent"
            >
              {cover && (
                <div className="relative aspect-video overflow-hidden border-b border-rule">
                  <Image
                    src={cover}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 92vw, 460px"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </div>
              )}
              <div className="p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <h3 className="font-display text-xl font-medium text-ink transition-colors group-hover:text-accent">
                    {p.name}
                  </h3>
                  {p.year && <span className="font-mono text-xs text-faint">{p.year}</span>}
                </div>
                {p.blurb && (
                  <p className="mt-2 font-body text-sm leading-relaxed text-muted">
                    {p.blurb}
                  </p>
                )}
                {p.award && (
                  <div className="mt-3">
                    <AwardTag>{p.award}</AwardTag>
                  </div>
                )}
                {p.stack.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.stack.slice(0, 5).map((s) => (
                      <Tag key={s}>{s}</Tag>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
