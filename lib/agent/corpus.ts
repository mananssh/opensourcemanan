import "server-only";
import {
  getProfile,
  listProjects,
  listExperiences,
  listHackathons,
  listCapabilities,
} from "@/lib/portfolio/queries";

/**
 * The corpus is Manan's real, DB-backed portfolio (NOT a static profile.ts). We
 * shape it into candidate evidence items, each carrying a permalink that is
 * guaranteed to resolve on the site. Gather nodes select items by `id`; compose
 * may only cite from what was selected — so a hallucinated citation is
 * impossible by construction.
 */

export interface CorpusItem {
  id: string; // stable handle the model selects by
  label: string; // short display label for the evidence chip
  href: string; // a real permalink / landing anchor
  text: string; // the material the model reads
}

export interface Corpus {
  profileSummary: string;
  work: CorpusItem[];
  projects: CorpusItem[];
  corpus: CorpusItem[]; // capabilities / languages — the "remaining corpus"
}

function clean(s: string | null | undefined): string {
  return (s ?? "").replace(/\s+/g, " ").trim();
}

export async function loadCorpus(): Promise<Corpus> {
  const [profile, projects, experiences, hackathons, capabilities] = await Promise.all([
    getProfile(),
    listProjects(),
    listExperiences(),
    listHackathons(),
    listCapabilities(),
  ]);

  const profileSummary = profile
    ? [
        `${profile.name} — ${profile.tagline}.`,
        clean(profile.intro),
        profile.now ? `Now: ${clean(profile.now)}` : "",
        profile.location ? `Based in ${profile.location}.` : "",
      ]
        .filter(Boolean)
        .join(" ")
    : "No profile on file.";

  const work: CorpusItem[] = experiences.map((e) => ({
    id: `work:${e.id}`,
    label: `${e.role} @ ${e.org}`,
    href: `/experience/${e.id}`,
    text: clean(`${e.role} at ${e.org}. ${e.blurb} ${e.body}`),
  }));

  // Projects + hackathons are both "things built / won" — one gather band node.
  const projectItems: CorpusItem[] = projects.map((p) => ({
    id: `project:${p.id}`,
    label: p.name,
    href: `/work/${p.slug}`,
    text: clean(`${p.name}. ${p.blurb} ${p.body} Stack: ${p.stack.join(", ")}. ${p.award ?? ""}`),
  }));
  const hackItems: CorpusItem[] = hackathons.map((h) => ({
    id: `hack:${h.id}`,
    label: `${h.event} — ${h.result}`,
    href: `/hackathons/${h.slug}`,
    text: clean(`${h.event} (${h.result}). ${h.blurb} ${h.body} Stack: ${h.stack.join(", ")}`),
  }));

  const corpus: CorpusItem[] = capabilities.map((c) => ({
    id: `cap:${c.id}`,
    label: c.groupName,
    href: "#capabilities",
    text: clean(`${c.groupName}: ${c.items.join(", ")}`),
  }));
  if (profile && profile.languages.length) {
    corpus.push({
      id: "languages",
      label: "Languages",
      href: "#capabilities",
      text: `Spoken languages: ${profile.languages.map((l) => `${l.name} (${l.level})`).join(", ")}`,
    });
  }

  return { profileSummary, work, projects: [...projectItems, ...hackItems], corpus };
}

/** Render a slice as an id-tagged list the model can select from. */
export function renderItems(items: CorpusItem[]): string {
  if (!items.length) return "(none on file)";
  return items.map((it) => `- [${it.id}] ${it.label}: ${it.text}`).join("\n");
}

/** Map selected ids back to a label/href lookup. */
export function indexById(items: CorpusItem[]): Map<string, CorpusItem> {
  return new Map(items.map((it) => [it.id, it]));
}
