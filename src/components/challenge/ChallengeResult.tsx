"use client";

import { motion } from "framer-motion";
import type { VoteSide } from "@/types";

interface ChallengeResultProps {
  challengerVote: VoteSide;
  challengeeVote: VoteSide;
  agreed: boolean;
  userAName: string;
  userBName: string;
}

export function ChallengeResult({
  challengerVote,
  challengeeVote,
  agreed,
  userAName,
  userBName,
}: ChallengeResultProps) {
  const getName = (vote: VoteSide) =>
    vote === "a" ? userAName : userBName;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="text-center py-8"
    >
      {agreed ? (
        <>
          <p className="text-4xl mb-4">✅</p>
          <h2 className="text-2xl font-display font-bold text-green-400">
            You AGREED
          </h2>
          <p className="text-text-muted mt-2">
            You both picked <span className="text-text font-semibold">{getName(challengerVote)}</span>
          </p>
        </>
      ) : (
        <>
          <p className="text-4xl mb-4">🥩💥</p>
          <h2 className="text-2xl font-display font-bold text-accent">
            You are BEEFING
          </h2>
          <p className="text-text-muted mt-2">
            They picked <span className="text-text font-semibold">{getName(challengerVote)}</span>
            {" — "}you picked <span className="text-text font-semibold">{getName(challengeeVote)}</span>
          </p>
        </>
      )}
    </motion.div>
  );
}
