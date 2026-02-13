"use client";

import type { VoteSide } from "@/types";

interface VotePanelProps {
  userAName: string;
  userBName: string;
  onVote: (side: VoteSide) => void;
  disabled?: boolean;
}

export function VotePanel({
  userAName,
  userBName,
  onVote,
  disabled,
}: VotePanelProps) {
  return (
    <div className="flex bg-surface-2 border-t border-border">
      <button
        onClick={() => onVote("a")}
        disabled={disabled}
        className="flex-1 py-4 px-4 text-center text-sm font-medium text-text-muted transition-colors border-r border-border group relative overflow-hidden hover:text-user-a disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="relative z-10">🏆 {userAName} won this</span>
        <span className="absolute bottom-0 left-0 w-full h-[3px] bg-user-a transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
      </button>
      <button
        onClick={() => onVote("b")}
        disabled={disabled}
        className="flex-1 py-4 px-4 text-center text-sm font-medium text-text-muted transition-colors group relative overflow-hidden hover:text-user-b disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="relative z-10">🏆 {userBName} won this</span>
        <span className="absolute bottom-0 left-0 w-full h-[3px] bg-user-b transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
      </button>
    </div>
  );
}
