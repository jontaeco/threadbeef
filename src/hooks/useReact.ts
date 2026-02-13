"use client";

import { useState, useCallback, useEffect } from "react";
import type { ReactionCounts, ReactionType } from "@/types";
import { generateFingerprint } from "@/lib/fingerprint";

interface UseReactReturn {
  reactions: ReactionCounts;
  userReactions: Set<ReactionType>;
  isLoading: boolean;
  react: (type: ReactionType) => Promise<void>;
  reset: () => void;
}

const DEFAULT_REACTIONS: ReactionCounts = {
  dead: 0,
  both_wrong: 0,
  actually: 0,
  peak_internet: 0,
  spicier: 0,
  hof_material: 0,
};

export function useReact(
  beefNumber: number,
  initialReactions?: ReactionCounts
): UseReactReturn {
  const [reactions, setReactions] = useState<ReactionCounts>(
    initialReactions ?? DEFAULT_REACTIONS
  );
  const [userReactions, setUserReactions] = useState<Set<ReactionType>>(
    new Set()
  );
  const [isLoading, setIsLoading] = useState(false);

  const reset = useCallback(() => {
    setUserReactions(new Set());
  }, []);

  // Auto-reset when beefNumber changes, and sync initial reactions
  useEffect(() => {
    reset();
    if (initialReactions) {
      setReactions(initialReactions);
    } else {
      setReactions(DEFAULT_REACTIONS);
    }
  }, [beefNumber, reset, initialReactions]);

  const react = useCallback(
    async (type: ReactionType) => {
      if (isLoading || !beefNumber || userReactions.has(type)) return;

      setIsLoading(true);

      // Optimistic update
      setReactions((prev) => ({
        ...prev,
        [type]: prev[type] + 1,
      }));
      setUserReactions((prev) => new Set(prev).add(type));

      try {
        const fingerprint = await generateFingerprint();
        const res = await fetch(`/api/beef/${beefNumber}/react`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, fingerprint }),
        });

        if (res.ok) {
          const data = await res.json();
          setReactions(data.reactions);
        } else if (res.status === 409) {
          // Already reacted — keep the UI state (user already reacted before)
        } else {
          // Rollback on other errors
          setReactions((prev) => ({
            ...prev,
            [type]: Math.max(0, prev[type] - 1),
          }));
          setUserReactions((prev) => {
            const next = new Set(prev);
            next.delete(type);
            return next;
          });
        }
      } catch {
        // Rollback on failure
        setReactions((prev) => ({
          ...prev,
          [type]: Math.max(0, prev[type] - 1),
        }));
        setUserReactions((prev) => {
          const next = new Set(prev);
          next.delete(type);
          return next;
        });
      } finally {
        setIsLoading(false);
      }
    },
    [beefNumber, isLoading, userReactions]
  );

  return { reactions, userReactions, isLoading, react, reset };
}
