"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Argument, VoteSide, VoteResults as VoteResultsType, ReactionCounts, ReactionType } from "@/types";
import { MessageBubble } from "./MessageBubble";
import { VotePanel } from "./VotePanel";
import { VoteResults } from "./VoteResults";
import { ReactionBar } from "@/components/ui/ReactionBar";

interface ArgumentCardProps {
  argument: Argument;
  hasVoted: boolean;
  votedFor: VoteSide | null;
  results: VoteResultsType | null;
  onVote: (side: VoteSide) => void;
  isVoteLoading: boolean;
  reactions?: ReactionCounts;
  userReactions?: Set<ReactionType>;
  onReact?: (type: ReactionType) => void;
}

export function ArgumentCard({
  argument,
  hasVoted,
  results,
  onVote,
  isVoteLoading,
  reactions,
  userReactions,
  onReact,
}: ArgumentCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="bg-surface border border-border rounded-thread overflow-hidden"
    >
      {/* Thread header */}
      <div className="bg-surface-2 border-b border-border px-6 py-5">
        <h2 className="font-display font-bold text-[1.05rem] text-text">
          {argument.title}
        </h2>
        {argument.contextBlurb && (
          <p className="text-[0.8rem] text-text-muted mt-1.5">
            {argument.contextBlurb}
          </p>
        )}
      </div>

      {/* Messages */}
      <div className="py-2">
        {argument.messages.map((msg, i) => (
          <MessageBubble
            key={i}
            message={msg}
            userAName={argument.userADisplayName}
            userBName={argument.userBDisplayName}
            index={i}
          />
        ))}
      </div>

      {/* Vote panel / Results with AnimatePresence */}
      <AnimatePresence mode="wait">
        {!hasVoted ? (
          <motion.div
            key="vote-panel"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <VotePanel
              userAName={argument.userADisplayName}
              userBName={argument.userBDisplayName}
              onVote={onVote}
              disabled={isVoteLoading}
            />
          </motion.div>
        ) : results ? (
          <motion.div
            key="vote-results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <VoteResults
              results={results}
              userAName={argument.userADisplayName}
              userBName={argument.userBDisplayName}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Reaction bar — shown after voting */}
      {hasVoted && results && reactions && userReactions && onReact && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.4 }}
          className="px-6 pb-5"
        >
          <ReactionBar
            reactions={reactions}
            userReactions={userReactions}
            onReact={onReact}
          />
        </motion.div>
      )}
    </motion.div>
  );
}
