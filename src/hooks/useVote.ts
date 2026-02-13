"use client";

import { useState, useCallback, useEffect } from "react";
import type { VoteSide, VoteResults } from "@/types";
import { generateFingerprint } from "@/lib/fingerprint";

interface UseVoteReturn {
  hasVoted: boolean;
  votedFor: VoteSide | null;
  results: VoteResults | null;
  isLoading: boolean;
  castVote: (side: VoteSide) => Promise<void>;
  reset: () => void;
}

export function useVote(beefNumber: number): UseVoteReturn {
  const [hasVoted, setHasVoted] = useState(false);
  const [votedFor, setVotedFor] = useState<VoteSide | null>(null);
  const [results, setResults] = useState<VoteResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const reset = useCallback(() => {
    setHasVoted(false);
    setVotedFor(null);
    setResults(null);
  }, []);

  // Auto-reset when beefNumber changes
  useEffect(() => {
    reset();
  }, [beefNumber, reset]);

  const castVote = useCallback(
    async (side: VoteSide) => {
      if (hasVoted || isLoading || !beefNumber) return;

      setIsLoading(true);
      // Optimistic: show the user voted immediately
      setVotedFor(side);
      setHasVoted(true);

      try {
        const fingerprint = await generateFingerprint();
        const res = await fetch(`/api/beef/${beefNumber}/vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ side, fingerprint }),
        });

        if (res.ok) {
          const data = await res.json();
          setResults(data.results);
        } else if (res.status === 409) {
          // Already voted — fetch results instead
          const resultsRes = await fetch(`/api/beef/${beefNumber}/results`);
          if (resultsRes.ok) {
            const data = await resultsRes.json();
            setResults(data.results);
          }
        }
      } catch {
        // Revert on failure
        setVotedFor(null);
        setHasVoted(false);
      } finally {
        setIsLoading(false);
      }
    },
    [beefNumber, hasVoted, isLoading]
  );

  return { hasVoted, votedFor, results, isLoading, castVote, reset };
}
