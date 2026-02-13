"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { Argument, HallOfFameSort } from "@/types";
import { LeaderboardCard } from "@/components/hall-of-fame/LeaderboardCard";

const TABS: { key: HallOfFameSort; label: string }[] = [
  { key: "most_voted", label: "Most Voted" },
  { key: "biggest_beatdown", label: "Biggest Beatdowns" },
  { key: "most_controversial", label: "Most Controversial" },
  { key: "most_reacted", label: "Most Reacted" },
  { key: "staff_picks", label: "Staff Picks" },
  { key: "rising", label: "Rising" },
];

export function HallOfFameClient() {
  const [activeTab, setActiveTab] = useState<HallOfFameSort>("most_voted");
  const [arguments_, setArguments] = useState<Argument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/hall-of-fame?sort=${activeTab}&limit=20`)
      .then((res) => res.json())
      .then((data) => {
        setArguments(data.arguments ?? []);
      })
      .catch(() => {
        setArguments([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [activeTab]);

  return (
    <div className="max-w-[720px] mx-auto px-5 pt-8 pb-32 sm:pb-24">
      {/* Tab bar */}
      <div className="flex flex-wrap gap-2 mb-8">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-pill text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-accent text-bg"
                : "bg-surface border border-border text-text-muted hover:text-text hover:border-text-muted"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-[3px] border-border border-t-accent rounded-full animate-spin" />
        </div>
      )}

      {/* Results */}
      {!isLoading && arguments_.length === 0 && (
        <div className="text-center py-20">
          <p className="text-text-muted text-lg">No beef found for this category</p>
        </div>
      )}

      {!isLoading && arguments_.length > 0 && (
        <div className="flex flex-col gap-3">
          {arguments_.map((arg, i) => (
            <motion.div
              key={arg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.3 }}
            >
              <LeaderboardCard argument={arg} rank={i + 1} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
