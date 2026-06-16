/**
 * Config-driven site navigation. A feature becomes reachable (header + home
 * index) by adding an entry here — nothing is hardcoded per link. See
 * agent-kit/conventions.md (config-driven surface).
 */
export interface NavItem {
  label: string;
  href: string;
  /** One-line description, shown in the home-page section index. */
  description?: string;
}

export const siteNav: NavItem[] = [
  { label: "Home", href: "/" },
  {
    label: "About",
    href: "/osm",
    description: "What this whole thing is.",
  },
  {
    label: "Blog",
    href: "/blog",
    description: "Deep dives into current obsessions.",
  },
  {
    label: "Changelog",
    href: "/changelog",
    description: "Everything that has shipped, newest first.",
  },
];
