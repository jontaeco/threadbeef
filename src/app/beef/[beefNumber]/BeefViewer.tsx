"use client";

import { useEffect, useRef } from "react";
import type { Argument } from "@/types";
import { useVote } from "@/hooks/useVote";
import { useReact } from "@/hooks/useReact";
import { useChallenge } from "@/hooks/useChallenge";
import { Navbar } from "@/components/layout/Navbar";
import { ArgumentCard } from "@/components/argument/ArgumentCard";
import { PlatformBadge } from "@/components/argument/PlatformBadge";
import { HeatRating } from "@/components/argument/HeatRating";
import { TopicDrift } from "@/components/argument/TopicDrift";
import { ShareButton } from "@/components/ui/ShareButton";
import { Confetti } from "@/components/ui/Confetti";
import { formatBeefNumber, calcVotePercents } from "@/lib/utils";
import { CATEGORY_MAP, getVerdict } from "@/lib/constants";
import { useSoundContext } from "@/contexts/SoundContext";

interface BeefViewerProps {
  argument: Argument;
}

export function BeefViewer({ argument }: BeefViewerProps) {
  const vote = useVote(argument.beefNumber);
  const reactionHook = useReact(argument.beefNumber, argument.reactions);
  const challengeHook = useChallenge();
  const categoryDef = CATEGORY_MAP.get(argument.category);
  const sound = useSoundContext();
  const prevResultsRef = useRef(vote.results);

  // Play gavel when results appear
  useEffect(() => {
    if (vote.results && !prevResultsRef.current) {
      sound.gavel();
      const [pA, pB] = calcVotePercents(vote.results.votesA, vote.results.votesB);
      const verdict = getVerdict(pA, pB);
      if (verdict.label === "UNANIMOUS BEATDOWN") {
        sound.crowd();
      }
    }
    prevResultsRef.current = vote.results;
  }, [vote.results, sound]);

  // Confetti trigger
  const showConfetti = (() => {
    if (!vote.results) return false;
    const [pA, pB] = calcVotePercents(vote.results.votesA, vote.results.votesB);
    const verdict = getVerdict(pA, pB);
    return verdict.minPercent >= 85;
  })();

  return (
    <main>
      <Navbar />

      <div className="max-w-[720px] mx-auto px-5 pt-10 pb-32 sm:pb-24">
        {/* Argument metadata bar */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <PlatformBadge
            platform={argument.platform}
            source={argument.platformSource}
          />
          {categoryDef && (
            <span className="text-xs font-bold text-yellow uppercase tracking-wider">
              {categoryDef.emoji} {categoryDef.label}
            </span>
          )}
          <HeatRating rating={argument.heatRating} />
          <span className="text-xs font-mono text-text-muted ml-auto">
            {formatBeefNumber(argument.beefNumber)}
          </span>
        </div>

        {/* Main card */}
        <ArgumentCard
          argument={argument}
          hasVoted={vote.hasVoted}
          votedFor={vote.votedFor}
          results={vote.results}
          onVote={vote.castVote}
          isVoteLoading={vote.isLoading}
          reactions={reactionHook.reactions}
          userReactions={reactionHook.userReactions}
          onReact={reactionHook.react}
        />

        {/* Confetti */}
        <Confetti trigger={showConfetti} />

        {/* Topic drift */}
        {argument.topicDrift && (
          <TopicDrift drift={argument.topicDrift} />
        )}

        {/* Action bar */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <ShareButton beefNumber={argument.beefNumber} title={argument.title} />
          {vote.hasVoted && vote.votedFor && (
            <button
              onClick={() =>
                challengeHook.createChallenge(argument.beefNumber, vote.votedFor!)
              }
              disabled={challengeHook.isCreating}
              className="text-xs text-accent hover:text-accent/80 transition-colors px-3 py-2 font-medium"
            >
              {challengeHook.isCreating ? "Creating..." : "Challenge a Friend"}
            </button>
          )}
          <button className="text-xs text-text-muted hover:text-text transition-colors px-3 py-2">
            Report
          </button>
        </div>

        {/* Challenge share URL */}
        {challengeHook.shareUrl && (
          <div className="flex items-center justify-center gap-2 mt-3">
            <input
              readOnly
              value={challengeHook.shareUrl}
              className="text-xs bg-surface border border-border rounded px-3 py-1.5 text-text-muted w-[300px] max-w-full"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(challengeHook.shareUrl!);
              }}
              className="text-xs text-accent hover:text-accent/80 px-2 py-1.5"
            >
              Copy
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
