/**
 * The blog editor's "publish date" is an <input type="datetime-local">, which is
 * timezone-naive: the browser yields a bare "YYYY-MM-DDTHH:mm" wall-clock string
 * with no zone, and rendering a stored Date back must reproduce the same wall
 * clock. Left to `new Date(input)` / `getHours()`, that string is interpreted in
 * the *runtime's* zone — UTC on Vercel — so a time the author picked was silently
 * shifted by the UTC offset (a post picked for "14:00" published 5.5h late).
 *
 * We anchor the wall clock to IST (Asia/Kolkata), the sole author's timezone, so
 * a picked time means exactly what it says regardless of where the code runs.
 * IST is a fixed UTC+5:30 with no DST, so a constant offset is exact — no Intl or
 * DST handling required, and the parse/format round-trip is lossless.
 */
export const IST_OFFSET_MINUTES = 330; // UTC+5:30, no DST

/** Parse a datetime-local value ("YYYY-MM-DDTHH:mm") as IST → the UTC instant. */
export function istInputToDate(input: string): Date | null {
  const m = input.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  const [, y, mo, d, h, min] = m;
  const utcMs =
    Date.UTC(+y, +mo - 1, +d, +h, +min) - IST_OFFSET_MINUTES * 60_000;
  return new Date(utcMs);
}

/** Render a UTC Date as its IST wall-clock datetime-local value ("YYYY-MM-DDTHH:mm"). */
export function dateToIstInput(d?: Date | null): string {
  if (!d) return "";
  const ist = new Date(d.getTime() + IST_OFFSET_MINUTES * 60_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${ist.getUTCFullYear()}-${pad(ist.getUTCMonth() + 1)}-${pad(
    ist.getUTCDate(),
  )}T${pad(ist.getUTCHours())}:${pad(ist.getUTCMinutes())}`;
}
