"use client";

import { useState, useCallback } from "react";
import type { Argument } from "@/types";
import { LeaderboardCard } from "@/components/hall-of-fame/LeaderboardCard";

interface CategoryFeedProps {
  initialArguments: Argument[];
  slug: string;
  total: number;
}

export function CategoryFeed({
  initialArguments,
  slug,
  total,
}: CategoryFeedProps) {
  const [arguments_, setArguments] = useState<Argument[]>(initialArguments);
  const [isLoading, setIsLoading] = useState(false);

  const loadMore = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/categories/${slug}?offset=${arguments_.length}&limit=20`
      );
      if (res.ok) {
        const data = await res.json();
        setArguments((prev) => [...prev, ...data.arguments]);
      }
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  }, [slug, arguments_.length]);

  const allLoaded = arguments_.length >= total;

  return (
    <div>
      <div className="flex flex-col gap-3">
        {arguments_.map((arg, i) => (
          <LeaderboardCard key={arg.id} argument={arg} rank={i + 1} />
        ))}
      </div>

      {arguments_.length === 0 && (
        <div className="text-center py-20">
          <p className="text-text-muted text-lg">
            No beef in this category yet
          </p>
        </div>
      )}

      {!allLoaded && (
        <div className="flex justify-center mt-8">
          <button
            onClick={loadMore}
            disabled={isLoading}
            className="px-6 py-2.5 bg-surface border border-border rounded-card text-sm text-text hover:border-text-muted transition-colors disabled:opacity-50"
          >
            {isLoading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
