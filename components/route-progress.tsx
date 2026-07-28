"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Site-wide navigation feedback. App Router gives no global router events, so:
 * a capture-phase click listener starts an indeterminate top bar (+ a `progress`
 * cursor) the instant an internal link is clicked, and a pathname/searchParams
 * effect clears it once the new route commits. Back/forward (popstate) also
 * starts it. Same-URL and new-tab/modified clicks are ignored. Purely visual —
 * no dependency, no per-Link wiring. Must render inside <Suspense> (uses
 * useSearchParams). Styling lives in globals.css (`.route-progress`).
 */
export function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);
  const first = useRef(true);
  const safety = useRef<number | null>(null);

  // Start on internal navigations.
  useEffect(() => {
    function begin() {
      setActive(true);
      document.documentElement.classList.add("nav-pending");
      if (safety.current) window.clearTimeout(safety.current);
      // Fail-safe: never leave the bar stuck if a nav is canceled.
      safety.current = window.setTimeout(() => {
        setActive(false);
        document.documentElement.classList.remove("nav-pending");
      }, 10000);
    }

    function onClick(e: MouseEvent) {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      )
        return;
      const anchor = (e.target as HTMLElement | null)?.closest?.("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (
        !href ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download") ||
        anchor.getAttribute("rel")?.includes("external")
      )
        return;
      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      // Same page (hash-only or identical) → no route change to wait on.
      if (url.pathname === window.location.pathname && url.search === window.location.search)
        return;
      begin();
    }

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", begin);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", begin);
    };
  }, []);

  // Clear once the route actually changes (skip the initial render).
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setActive(false);
    document.documentElement.classList.remove("nav-pending");
    if (safety.current) window.clearTimeout(safety.current);
  }, [pathname, searchParams]);

  return <div aria-hidden className="route-progress" data-active={active} />;
}
