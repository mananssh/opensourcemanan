/**
 * ~200 wpm reading estimate, min 1. Pure — safe to import anywhere. Strips MDX
 * syntax (code fences, JSX tags, markdown punctuation, link/image targets)
 * before counting so a code-heavy post isn't over-estimated.
 */
export function readingMinutes(source: string): number {
  const text = source
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*_~`|]/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
