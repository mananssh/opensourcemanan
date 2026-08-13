"use client";

import { VAULT_CATEGORIES } from "@/lib/vault/categories";
import type { VaultCategory } from "@/db/schema";

/**
 * Multi-select category chips. When `other` is selected, a text field appears
 * so the owner can name the custom drawer. At least one chip stays selected.
 */
export function CategoryMultiSelect({
  value,
  onChange,
  otherLabel,
  onOtherLabelChange,
  idPrefix = "cat",
}: {
  value: readonly string[];
  onChange: (next: VaultCategory[]) => void;
  otherLabel: string;
  onOtherLabelChange: (next: string) => void;
  idPrefix?: string;
}) {
  const selected = new Set(value);
  const otherOn = selected.has("other");

  function toggle(cat: VaultCategory) {
    const next = new Set(selected);
    if (next.has(cat)) {
      if (next.size <= 1) return;
      next.delete(cat);
      if (cat === "other") onOtherLabelChange("");
    } else {
      next.add(cat);
    }
    onChange(VAULT_CATEGORIES.map((c) => c.value).filter((v) => next.has(v)));
  }

  return (
    <div className="mt-1.5 space-y-2">
      <div role="group" aria-label="Categories" className="flex flex-wrap gap-1.5">
        {VAULT_CATEGORIES.map((c) => {
          const active = selected.has(c.value);
          return (
            <button
              key={c.value}
              id={`${idPrefix}-${c.value}`}
              type="button"
              aria-pressed={active}
              title={c.hint}
              onClick={() => toggle(c.value)}
              className={`border px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.1em] transition-colors focus-visible:ring-2 focus-visible:ring-accent ${
                active
                  ? "border-accent bg-accent text-accent-ink"
                  : "border-rule text-muted hover:border-accent/60 hover:text-ink"
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {otherOn ? (
        <label className="block">
          <span className="sr-only">Custom other category</span>
          <input
            id={`${idPrefix}-other-label`}
            value={otherLabel}
            onChange={(e) => onOtherLabelChange(e.target.value)}
            maxLength={48}
            placeholder="Type the category…"
            className="w-full border border-rule bg-paper px-3 py-2 text-sm text-ink outline-none placeholder:text-faint focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent"
          />
        </label>
      ) : null}
    </div>
  );
}
