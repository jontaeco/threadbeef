"use client";

import { useState, useCallback } from "react";
import type { VoteSide, Argument, ChallengeStatus } from "@/types";
import { generateFingerprint } from "@/lib/fingerprint";

interface ChallengeResult {
  challengerVote: VoteSide;
  challengeeVote: VoteSide;
  agreed: boolean;
}

interface UseChallengeReturn {
  isCreating: boolean;
  challengeCode: string | null;
  shareUrl: string | null;
  challengeArgument: Argument | null;
  challengeStatus: ChallengeStatus | null;
  isLoading: boolean;
  result: ChallengeResult | null;
  createChallenge: (beefNumber: number, vote: VoteSide) => Promise<void>;
  fetchChallenge: (code: string) => Promise<void>;
  respondToChallenge: (code: string, vote: VoteSide) => Promise<void>;
}

export function useChallenge(): UseChallengeReturn {
  const [isCreating, setIsCreating] = useState(false);
  const [challengeCode, setChallengeCode] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [challengeArgument, setChallengeArgument] = useState<Argument | null>(null);
  const [challengeStatus, setChallengeStatus] = useState<ChallengeStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ChallengeResult | null>(null);

  const createChallenge = useCallback(
    async (beefNumber: number, vote: VoteSide) => {
      if (isCreating) return;
      setIsCreating(true);

      try {
        const fingerprint = await generateFingerprint();
        const res = await fetch("/api/challenge/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ beefNumber, vote, fingerprint }),
        });

        if (res.ok) {
          const data = await res.json();
          setChallengeCode(data.challengeCode);
          setShareUrl(data.shareUrl);
        }
      } catch {
        // Silent fail
      } finally {
        setIsCreating(false);
      }
    },
    [isCreating]
  );

  const fetchChallenge = useCallback(async (code: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/challenge/${code}`);
      if (res.ok) {
        const data = await res.json();
        setChallengeArgument(data.argument);
        setChallengeStatus(data.status);
      }
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  const respondToChallenge = useCallback(
    async (code: string, vote: VoteSide) => {
      setIsLoading(true);
      try {
        const fingerprint = await generateFingerprint();
        const res = await fetch(`/api/challenge/${code}/respond`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vote, fingerprint }),
        });

        if (res.ok) {
          const data = await res.json();
          setResult(data);
          setChallengeStatus("completed");
        }
      } catch {
        // Silent fail
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    isCreating,
    challengeCode,
    shareUrl,
    challengeArgument,
    challengeStatus,
    isLoading,
    result,
    createChallenge,
    fetchChallenge,
    respondToChallenge,
  };
}
