"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { CATEGORIES, type Category } from "@/lib/airtable";

export default function CategoryFilter({
  activeCats,
}: {
  activeCats: Category[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const allActive = activeCats.length === CATEGORIES.length;

  const updateCats = useCallback(
    (cats: Category[]) => {
      const params = new URLSearchParams(searchParams.toString());
      if (cats.length === CATEGORIES.length) {
        params.delete("cats");
      } else {
        params.set("cats", cats.join(","));
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const toggle = (cat: Category) => {
    const next = activeCats.includes(cat)
      ? activeCats.filter((c) => c !== cat)
      : [...activeCats, cat];
    updateCats(next.length === 0 ? CATEGORIES.map((c) => c.value) : next);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      {CATEGORIES.map(({ value, label }) => {
        const active = activeCats.includes(value);
        return (
          <button
            key={value}
            onClick={() => toggle(value)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              active
                ? "bg-neutral-100 text-neutral-950 border-neutral-100"
                : "bg-transparent text-neutral-500 border-neutral-700 hover:border-neutral-500"
            }`}
          >
            {label}
          </button>
        );
      })}
      {!allActive && (
        <button
          onClick={() => updateCats(CATEGORIES.map((c) => c.value))}
          className="px-3 py-1 rounded-full text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          Reset
        </button>
      )}
    </div>
  );
}
