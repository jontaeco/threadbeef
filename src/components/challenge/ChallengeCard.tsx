"use client";

import { motion } from "framer-motion";
import type { Argument, VoteSide } from "@/types";
import { ArgumentCard } from "@/components/argument/ArgumentCard";

interface ChallengeCardProps {
  argument: Argument;
  onVote: (side: VoteSide) => void;
  isVoteLoading?: boolean;
}

export function ChallengeCard({
  argument,
  onVote,
  isVoteLoading = false,
}: ChallengeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Challenge banner */}
      <div className="bg-accent/10 border border-accent/30 rounded-card p-5 mb-6 text-center">
        <p className="text-lg font-display font-bold text-text">
          🥩 Someone challenged you to judge this beef!
        </p>
        <p className="text-sm text-text-muted mt-1">
          Read the argument below and pick your side.
        </p>
      </div>

      {/* Argument card for voting */}
      <ArgumentCard
        argument={argument}
        hasVoted={false}
        votedFor={null}
        results={null}
        onVote={onVote}
        isVoteLoading={isVoteLoading}
      />
    </motion.div>
  );
}
