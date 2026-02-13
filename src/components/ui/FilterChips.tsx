"use client";

import type { Category } from "@/types";
import { CATEGORIES } from "@/lib/constants";

interface FilterChipsProps {
  activeCategory: Category | "all";
  onSelect: (category: Category | "all") => void;
}

export function FilterChips({ activeCategory, onSelect }: FilterChipsProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center mb-8">
      <button
        onClick={() => onSelect("all")}
        className={`px-4 py-[7px] rounded-pill text-[0.8rem] font-medium border transition-colors ${
          activeCategory === "all"
            ? "bg-accent border-accent text-white"
            : "bg-transparent border-border text-text-muted hover:border-text-muted hover:text-text"
        }`}
      >
        All
      </button>
      {CATEGORIES.map((cat) => (
        <button
          key={cat.slug}
          onClick={() => onSelect(cat.slug)}
          className={`px-4 py-[7px] rounded-pill text-[0.8rem] font-medium border transition-colors ${
            activeCategory === cat.slug
              ? "bg-accent border-accent text-white"
              : "bg-transparent border-border text-text-muted hover:border-text-muted hover:text-text"
          }`}
        >
          {cat.emoji} {cat.label}
        </button>
      ))}
    </div>
  );
}
