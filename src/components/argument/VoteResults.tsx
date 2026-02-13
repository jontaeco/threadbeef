"use client";

import { useState, useEffect } from "react";
import type { VoteResults as VoteResultsType } from "@/types";
import { VerdictLabel } from "@/components/ui/VerdictLabel";
import { getVerdict } from "@/lib/constants";
import { formatCount } from "@/lib/utils";

interface VoteResultsProps {
  results: VoteResultsType;
  userAName: string;
  userBName: string;
}

export function VoteResults({
  results,
  userAName,
  userBName,
}: VoteResultsProps) {
  const [filled, setFilled] = useState(false);
  const verdict = getVerdict(results.percentA, results.percentB);

  useEffect(() => {
    const timer = setTimeout(() => setFilled(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const winner =
    results.percentA > results.percentB ? userAName : userBName;

  return (
    <div className="bg-surface-2 border-t border-border px-6 py-4 flex flex-col gap-3">
      {/* Results bar */}
      <div className="flex rounded-pill overflow-hidden h-10 bg-bg">
        <div
          className="results-bar-fill flex items-center justify-center text-xs font-bold text-white min-w-[60px]"
          style={{
            width: filled ? `${results.percentA}%` : "0%",
            background: "linear-gradient(135deg, #ff6b6b, #ff4d4d)",
          }}
        >
          {results.percentA}%
        </div>
        <div
          className="results-bar-fill flex items-center justify-center text-xs font-bold text-white min-w-[60px]"
          style={{
            width: filled ? `${results.percentB}%` : "0%",
            background: "linear-gradient(135deg, #4d9fff, #6ba3ff)",
          }}
        >
          {results.percentB}%
        </div>
      </div>

      {/* Vote count */}
      <p className="text-center text-xs text-text-muted">
        {formatCount(results.totalVotes)} votes — {winner} is winning
      </p>

      {/* Verdict label */}
      <VerdictLabel label={verdict.label} emoji={verdict.emoji} />
    </div>
  );
}
