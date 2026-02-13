"use client";

import { motion } from "framer-motion";
import type { ReactionCounts, ReactionType } from "@/types";
import { REACTIONS } from "@/lib/constants";
import { formatCount } from "@/lib/utils";

interface ReactionBarProps {
  reactions: ReactionCounts;
  userReactions: Set<ReactionType>;
  onReact: (type: ReactionType) => void;
  disabled?: boolean;
}

export function ReactionBar({
  reactions,
  userReactions,
  onReact,
  disabled,
}: ReactionBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {REACTIONS.map((r) => {
        const isActive = userReactions.has(r.type);
        const count = reactions[r.type] || 0;

        return (
          <motion.button
            key={r.type}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onReact(r.type)}
            disabled={disabled || isActive}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-xs font-medium
              border transition-colors
              ${
                isActive
                  ? "border-accent/50 bg-accent/10 text-text"
                  : "border-border bg-surface-2 text-text-muted hover:border-text-muted hover:text-text"
              }
              disabled:cursor-default
            `}
            title={r.label}
          >
            <span className="text-sm">{r.emoji}</span>
            {count > 0 && (
              <span className="font-mono text-[10px]">
                {formatCount(count)}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
