"use client";

import { useState } from "react";

const inputCls =
  "w-full rounded-md border border-rule bg-paper px-3 py-2 font-body text-ink outline-none transition-colors focus:border-accent";

type Option = { id: string; name: string };

/** Category <select> with an inline "add new category" (no leaving the form). */
export function CategorySelect({
  name,
  categories,
  defaultValue,
}: {
  name: string;
  categories: Option[];
  defaultValue?: string | null;
}) {
  const [options, setOptions] = useState<Option[]>(categories);
  const [selected, setSelected] = useState(defaultValue ?? "");
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function create() {
    const n = newName.trim();
    if (!n) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/blog/categories", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: n }),
      });
      if (!res.ok) throw new Error("Could not create category.");
      const cat = (await res.json()) as Option;
      setOptions((prev) =>
        prev.some((o) => o.id === cat.id) ? prev : [...prev, cat],
      );
      setSelected(cat.id);
      setNewName("");
      setAdding(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <select
        id={name}
        name={name}
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className={inputCls}
      >
        <option value="">— none —</option>
        {options.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      {adding ? (
        <div className="mt-2 flex items-center gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New category name"
            className={inputCls}
          />
          <button
            type="button"
            onClick={create}
            disabled={busy}
            className="shrink-0 rounded-full bg-accent px-4 py-2 font-mono text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "…" : "Add"}
          </button>
          <button
            type="button"
            onClick={() => {
              setAdding(false);
              setNewName("");
              setError("");
            }}
            className="shrink-0 font-mono text-xs text-muted hover:text-accent"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-1.5 font-mono text-[0.7rem] uppercase tracking-[0.1em] text-accent hover:underline"
        >
          + New category
        </button>
      )}
      {error && <p className="mt-1 font-mono text-xs text-accent">{error}</p>}
    </div>
  );
}
