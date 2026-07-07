import type { PageContext } from "./ask-types";

const MAX_TEXT_CHARS = 3000;

/**
 * A bounded snapshot of what's currently on screen, for "explain what's on
 * the screen". Only text whose element actually intersects the viewport is
 * captured — a visitor scrolled to the projects section should get the
 * projects explained, not the hero at the top of the page. Falls back to the
 * top of the page if nothing measures as visible (e.g. mid-navigation). The
 * portfolio layout's `<main id="content">` is the only thing read, so this
 * only ever sees the site's own public content.
 */
export function capturePageContext(): PageContext {
  const content = document.getElementById("content");
  const raw = content ? visibleText(content) || (content.textContent ?? "") : "";
  const text = raw.replace(/\s+/g, " ").trim().slice(0, MAX_TEXT_CHARS);
  return { title: document.title, path: window.location.pathname, text };
}

/** Text nodes whose parent element intersects the viewport, in document order. */
function visibleText(root: Element): string {
  const viewportHeight = window.innerHeight;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.textContent?.trim() || !node.parentElement) return NodeFilter.FILTER_REJECT;
      const rect = node.parentElement.getBoundingClientRect();
      const onScreen = rect.bottom > 0 && rect.top < viewportHeight && rect.width > 0 && rect.height > 0;
      return onScreen ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });
  const parts: string[] = [];
  let total = 0;
  while (walker.nextNode() && total < MAX_TEXT_CHARS) {
    const t = walker.currentNode.textContent ?? "";
    parts.push(t);
    total += t.length;
  }
  return parts.join(" ");
}
