"use client";

import Link from "next/link";
import type { Argument, ReactionType } from "@/types";
import { calcVotePercents, formatCount } from "@/lib/utils";
import { getVerdict, CATEGORY_MAP, REACTIONS } from "@/lib/constants";

interface LeaderboardCardProps {
  argument: Argument;
  rank: number;
}

export function LeaderboardCard({ argument, rank }: LeaderboardCardProps) {
  const [pA, pB] = calcVotePercents(argument.votesA, argument.votesB);
  const verdict = getVerdict(pA, pB);
  const categoryDef = CATEGORY_MAP.get(argument.category);

  // Top 3 reactions by count
  const reactionEntries = Object.entries(argument.reactions) as [
    ReactionType,
    number,
  ][];
  const topReactions = reactionEntries
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <Link href={`/beef/${argument.beefNumber}`}>
      <div className="flex items-start gap-4 p-4 bg-surface border border-border rounded-card hover:border-accent/50 transition-colors group">
        {/* Rank */}
        <span className="text-2xl font-display font-bold text-accent min-w-[40px] text-right">
          {rank}
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-text text-sm truncate group-hover:text-accent transition-colors">
            {argument.title}
          </h3>

          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {categoryDef && (
              <span className="text-[10px] font-bold text-yellow uppercase tracking-wider">
                {categoryDef.emoji} {categoryDef.label}
              </span>
            )}
            <span className="text-[10px] text-text-muted">
              {"🌶️".repeat(argument.heatRating)}
            </span>
          </div>

          {/* Vote stats */}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-text-muted">
            <span>{formatCount(argument.totalVotes)} votes</span>
            <span>
              <span className="text-[#ff6b6b]">{pA}%</span>
              {" / "}
              <span className="text-[#6ba3ff]">{pB}%</span>
            </span>
            <span>
              {verdict.emoji} {verdict.label}
            </span>
          </div>

          {/* Top reactions */}
          {topReactions.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              {topReactions.map(([type, count]) => {
                const def = REACTIONS.find((r) => r.type === type);
                if (!def) return null;
                return (
                  <span
                    key={type}
                    className="text-[11px] text-text-muted"
                  >
                    {def.emoji} {count}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
