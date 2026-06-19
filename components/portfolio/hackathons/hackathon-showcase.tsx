"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Tag, AwardTag } from "@/components/portfolio/ui/tag";
import type { Hackathon } from "@/db/schema";

// coverUrl resolved server-side (publicUrl pulls the GCS SDK — not client-safe).
export type HackathonCard = Hackathon & { coverUrl: string | null };

/** A bold stacked "wall of wins" — deliberately different from the project grid. */
export function HackathonShowcase({ hackathons }: { hackathons: HackathonCard[] }) {
  return (
    <div className="space-y-4">
      {hackathons.map((h, i) => {
        const cover = h.coverUrl;
        return (
          <motion.div
            key={h.id}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: Math.min(i, 6) * 0.05 }}
          >
            <Link
              href={`/hackathons/${h.slug}`}
              scroll={false}
              className="group flex items-center gap-5 rounded-xl border border-rule bg-surface p-5 transition-colors hover:border-accent"
            >
              <div className="min-w-0 flex-1">
                <AwardTag>{h.result}</AwardTag>
                <h3 className="mt-2 font-display text-2xl font-medium text-ink transition-colors group-hover:text-accent">
                  {h.event}
                </h3>
                {h.blurb && (
                  <p className="mt-1 truncate font-body text-muted">{h.blurb}</p>
                )}
                {h.stack.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {h.stack.slice(0, 4).map((s) => (
                      <Tag key={s}>{s}</Tag>
                    ))}
                  </div>
                )}
              </div>
              {cover && (
                <div className="relative hidden aspect-[4/3] w-40 shrink-0 overflow-hidden rounded-lg border border-rule sm:block">
                  <Image
                    src={cover}
                    alt=""
                    fill
                    sizes="160px"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                  />
                </div>
              )}
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
