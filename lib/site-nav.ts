/**
 * Config-driven site navigation. A feature becomes reachable by adding an
 * entry here — the header renders from this list, nothing is hardcoded per
 * link. See agent-kit/conventions.md (config-driven surface).
 */
export interface NavItem {
  label: string;
  href: string;
}

export const siteNav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Changelog", href: "/changelog" },
];
