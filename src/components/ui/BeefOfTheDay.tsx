"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Argument } from "@/types";
import { CATEGORY_MAP } from "@/lib/constants";

interface BeefOfTheDayProps {
  argument: Argument;
  date: string | null;
  countdown: number;
}

function formatCountdown(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, "0")}:${m
    .toString()
    .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function BeefOfTheDay({ argument, countdown }: BeefOfTheDayProps) {
  const categoryDef = CATEGORY_MAP.get(argument.category);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8 p-5 rounded-thread border border-accent/30 bg-accent/5"
    >
      <div className="flex items-start justify-between gap-4 max-sm:flex-col">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-accent uppercase tracking-widest mb-2">
            🥩 Beef of the Day
          </p>
          <Link
            href={`/beef/${argument.beefNumber}`}
            className="block group"
          >
            <h3 className="font-display font-bold text-text text-base group-hover:text-accent transition-colors truncate">
              {argument.title}
            </h3>
          </Link>
          {categoryDef && (
            <span className="inline-block mt-2 text-xs font-bold text-yellow uppercase tracking-wider">
              {categoryDef.emoji} {categoryDef.label}
            </span>
          )}
        </div>

        <div className="text-right max-sm:text-left">
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">
            Next beef in
          </p>
          <p className="font-mono font-bold text-text text-lg tabular-nums">
            {formatCountdown(countdown)}
          </p>
          <Link
            href={`/beef/${argument.beefNumber}`}
            className="inline-block mt-2 text-xs text-accent hover:underline"
          >
            View &rarr;
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
