import type { VaultCategory } from "@/db/schema";

/**
 * Category labels for the vault UI. Client-safe: this is a plain data table with
 * only a TYPE-only import from the schema (erased at build), so importing it into
 * a client component never pulls the DB/Drizzle into the bundle. The `satisfies`
 * check keeps these values in lockstep with the `vault_category` enum.
 */
export const VAULT_CATEGORIES = [
  { value: "identity", label: "Identity", hint: "Aadhaar, passport, PAN, DL" },
  { value: "financial", label: "Financial", hint: "Bank, tax, investments" },
  { value: "medical", label: "Medical", hint: "Reports, prescriptions, insurance" },
  { value: "legal", label: "Legal", hint: "Contracts, agreements, deeds" },
  { value: "education", label: "Education", hint: "Degrees, transcripts, certs" },
  { value: "work", label: "Work", hint: "Offers, payslips, references" },
  { value: "travel", label: "Travel", hint: "Visas, tickets, bookings" },
  { value: "other", label: "Other", hint: "Everything else" },
] as const satisfies ReadonlyArray<{
  value: VaultCategory;
  label: string;
  hint: string;
}>;

const LABELS = new Map(VAULT_CATEGORIES.map((c) => [c.value, c.label]));
const ORDER = new Map(VAULT_CATEGORIES.map((c, i) => [c.value, i]));

/** Human label for a category value (falls back to the raw value). */
export function categoryLabel(value: string): string {
  return LABELS.get(value as VaultCategory) ?? value;
}

/** Narrow an arbitrary string to a valid category, defaulting to "other". */
export function normalizeCategory(value: unknown): VaultCategory {
  return typeof value === "string" && LABELS.has(value as VaultCategory)
    ? (value as VaultCategory)
    : "other";
}

/**
 * Normalize a list of category values. Dedupes, drops unknowns, keeps stable
 * VAULT_CATEGORIES order. Empty / invalid input → `["other"]` so every document
 * always has at least one drawer.
 */
export function normalizeCategories(value: unknown): VaultCategory[] {
  const raw: unknown[] = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[,|]/).map((s) => s.trim()).filter(Boolean)
      : [];
  const seen = new Set<VaultCategory>();
  for (const item of raw) {
    if (typeof item !== "string") continue;
    if (LABELS.has(item as VaultCategory)) {
      seen.add(item as VaultCategory);
    }
  }
  if (seen.size === 0) return ["other"];
  return [...seen].sort(
    (a, b) => (ORDER.get(a) ?? 99) - (ORDER.get(b) ?? 99),
  );
}

const MAX_OTHER_LEN = 48;

/**
 * Custom label for the `other` category. Returns null when `other` isn't
 * selected or the text is empty. Trimmed + length-capped.
 */
export function normalizeCategoryOther(
  categories: readonly VaultCategory[],
  value: unknown,
): string | null {
  if (!categories.includes("other")) return null;
  if (typeof value !== "string") return null;
  const label = value.trim().slice(0, MAX_OTHER_LEN);
  return label || null;
}

/** Display label for a category on a card, using the custom Other text when set. */
export function categoryDisplayLabel(
  value: VaultCategory,
  categoryOther: string | null | undefined,
): string {
  if (value === "other" && categoryOther?.trim()) return categoryOther.trim();
  return categoryLabel(value);
}
