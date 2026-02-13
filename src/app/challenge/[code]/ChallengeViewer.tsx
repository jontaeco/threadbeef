"use client";

import { useState } from "react";
import type { Argument, ChallengeStatus, VoteSide } from "@/types";
import { useChallenge } from "@/hooks/useChallenge";
import { ChallengeCard } from "@/components/challenge/ChallengeCard";
import { ChallengeResult } from "@/components/challenge/ChallengeResult";

interface ChallengeViewerProps {
  argument: Argument;
  challengeStatus: ChallengeStatus;
  code: string;
}

export function ChallengeViewer({
  argument,
  challengeStatus: initialStatus,
  code,
}: ChallengeViewerProps) {
  const challenge = useChallenge();
  const [hasResponded, setHasResponded] = useState(false);

  const handleVote = async (side: VoteSide) => {
    await challenge.respondToChallenge(code, side);
    setHasResponded(true);
  };

  if (initialStatus === "completed" && !hasResponded) {
    return (
      <div className="max-w-[720px] mx-auto px-5 pt-10 pb-32 sm:pb-24 text-center">
        <p className="text-4xl mb-4">🥩</p>
        <h2 className="text-xl font-display font-bold text-text">
          This challenge has already been answered
        </h2>
        <p className="text-text-muted mt-2">
          The beef has been settled. Try browsing for more!
        </p>
      </div>
    );
  }

  if (hasResponded && challenge.result) {
    return (
      <div className="max-w-[720px] mx-auto px-5 pt-10 pb-32 sm:pb-24">
        <ChallengeResult
          challengerVote={challenge.result.challengerVote}
          challengeeVote={challenge.result.challengeeVote}
          agreed={challenge.result.agreed}
          userAName={argument.userADisplayName}
          userBName={argument.userBDisplayName}
        />
      </div>
    );
  }

  return (
    <div className="max-w-[720px] mx-auto px-5 pt-10 pb-32 sm:pb-24">
      <ChallengeCard
        argument={argument}
        onVote={handleVote}
        isVoteLoading={challenge.isLoading}
      />
    </div>
  );
}
