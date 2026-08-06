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
