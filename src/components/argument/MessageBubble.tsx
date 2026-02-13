"use client";

import { motion } from "framer-motion";
import type { Message } from "@/types";

interface MessageBubbleProps {
  message: Message;
  userAName: string;
  userBName: string;
  index: number;
}

export function MessageBubble({
  message,
  userAName,
  userBName,
  index,
}: MessageBubbleProps) {
  const isA = message.author === "a";
  const displayName = isA ? userAName : userBName;
  const initial = displayName.charAt(0).toUpperCase();

  const scoreColor =
    message.score !== null
      ? message.score >= 0
        ? "text-green bg-green/10"
        : "text-accent bg-accent/10"
      : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="px-6 py-4 border-b border-border/50 last:border-b-0"
    >
      {/* Header row */}
      <div className="flex items-center gap-2.5 mb-2">
        {/* Avatar */}
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
            isA
              ? "bg-user-a/15 text-user-a"
              : "bg-user-b/15 text-user-b"
          }`}
        >
          {initial}
        </div>

        {/* Username */}
        <span
          className={`text-sm font-semibold ${
            isA ? "text-user-a" : "text-user-b"
          }`}
        >
          {displayName}
        </span>

        {/* Timestamp */}
        <span className="text-xs text-text-muted">
          {formatTimestamp(message.timestamp)}
        </span>

        {/* Score badge */}
        {message.score !== null && (
          <span
            className={`ml-auto text-xs font-mono px-2 py-0.5 rounded-pill ${scoreColor}`}
          >
            {message.score >= 0 ? "+" : ""}
            {message.score.toLocaleString()}
          </span>
        )}
      </div>

      {/* Quote block */}
      {message.quoted_text && (
        <div className="pl-[38px] max-sm:pl-0 max-sm:mt-1.5 mb-2">
          <blockquote className="border-l-[3px] border-border py-2 px-3.5 text-text-muted text-[0.85rem] bg-white/[0.02] rounded-r-lg">
            {message.quoted_text}
          </blockquote>
        </div>
      )}

      {/* Body */}
      <p className="text-[0.92rem] leading-[1.65] text-text/[0.88] pl-[38px] max-sm:pl-0 max-sm:mt-1.5">
        {message.body}
      </p>
    </motion.div>
  );
}

function formatTimestamp(ts: string): string {
  try {
    const date = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 1) return "today";
    if (diffDays === 1) return "1d ago";
    if (diffDays < 30) return `${diffDays}d ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    return `${Math.floor(diffDays / 365)}y ago`;
  } catch {
    return "";
  }
}
