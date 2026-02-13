"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Category } from "@/types";
import { useBeef } from "@/hooks/useBeef";
import { useVote } from "@/hooks/useVote";
import { useReact } from "@/hooks/useReact";
import { useChallenge } from "@/hooks/useChallenge";
import { useSwipe } from "@/hooks/useSwipe";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { Navbar } from "@/components/layout/Navbar";
import { FilterChips } from "@/components/ui/FilterChips";
import { ArgumentCard } from "@/components/argument/ArgumentCard";
import { PlatformBadge } from "@/components/argument/PlatformBadge";
import { HeatRating } from "@/components/argument/HeatRating";
import { TopicDrift } from "@/components/argument/TopicDrift";
import { NextBeefButton } from "@/components/ui/NextBeefButton";
import { ShareButton } from "@/components/ui/ShareButton";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { BeefOfTheDay } from "@/components/ui/BeefOfTheDay";
import { Confetti } from "@/components/ui/Confetti";
import { formatBeefNumber } from "@/lib/utils";
import { CATEGORY_MAP, getVerdict } from "@/lib/constants";
import { useBeefOfTheDay } from "@/hooks/useBeefOfTheDay";
import { useSoundContext } from "@/contexts/SoundContext";
import { calcVotePercents } from "@/lib/utils";

const SEEN_STORAGE_KEY = "threadbeef_seen";
const MAX_SEEN = 50;

export default function Home() {
  const [category, setCategory] = useState<Category | "all">("all");
  const [seenBeefNumbers, setSeenBeefNumbers] = useState<number[]>([]);
  const [mounted, setMounted] = useState(false);

  const { argument, isLoading, fetchRandom } = useBeef();
  const vote = useVote(argument?.beefNumber ?? 0);
  const reactionHook = useReact(
    argument?.beefNumber ?? 0,
    argument?.reactions
  );
  const challengeHook = useChallenge();
  const botd = useBeefOfTheDay();
  const sound = useSoundContext();
  const prevResultsRef = useRef(vote.results);

  // Play gavel when results appear
  useEffect(() => {
    if (vote.results && !prevResultsRef.current) {
      sound.gavel();
      // Check for unanimous beatdown
      const [pA, pB] = calcVotePercents(vote.results.votesA, vote.results.votesB);
      const verdict = getVerdict(pA, pB);
      if (verdict.label === "UNANIMOUS BEATDOWN") {
        sound.crowd();
      }
    }
    prevResultsRef.current = vote.results;
  }, [vote.results, sound]);

  // Confetti trigger
  const showConfetti = (() => {
    if (!vote.results) return false;
    const [pA, pB] = calcVotePercents(vote.results.votesA, vote.results.votesB);
    const verdict = getVerdict(pA, pB);
    return verdict.minPercent >= 85;
  })();

  // Load seen list from localStorage on mount
  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(SEEN_STORAGE_KEY);
      if (stored) setSeenBeefNumbers(JSON.parse(stored));
    } catch {}
  }, []);

  // Fetch first random argument on mount
  useEffect(() => {
    if (mounted) {
      fetchRandom(category === "all" ? undefined : category, seenBeefNumbers);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  const handleNextBeef = useCallback(() => {
    if (isLoading) return;

    sound.sizzle();
    vote.reset();
    reactionHook.reset();

    const newSeen = argument
      ? [...seenBeefNumbers, argument.beefNumber].slice(-MAX_SEEN)
      : seenBeefNumbers;

    setSeenBeefNumbers(newSeen);
    try {
      localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(newSeen));
    } catch {}

    fetchRandom(category === "all" ? undefined : category, newSeen);
  }, [isLoading, argument, seenBeefNumbers, category, fetchRandom, vote, reactionHook, sound]);

  const handleCategoryChange = useCallback(
    (newCategory: Category | "all") => {
      setCategory(newCategory);
      vote.reset();
      reactionHook.reset();
      fetchRandom(
        newCategory === "all" ? undefined : newCategory,
        seenBeefNumbers
      );
    },
    [fetchRandom, seenBeefNumbers, vote, reactionHook]
  );

  const swipeHandlers = useSwipe(handleNextBeef);

  const handleShare = useCallback(async () => {
    if (!argument) return;
    const url = `${window.location.origin}/beef/${argument.beefNumber}`;
    try {
      await navigator.clipboard.writeText(url);
      fetch(`/api/beef/${argument.beefNumber}/share`, { method: "POST" }).catch(() => {});
    } catch {}
  }, [argument]);

  useKeyboardShortcuts({
    onNext: handleNextBeef,
    onVoteA: () => vote.castVote("a"),
    onVoteB: () => vote.castVote("b"),
    onShare: handleShare,
  });

  const categoryDef = argument
    ? CATEGORY_MAP.get(argument.category)
    : null;

  return (
    <main {...swipeHandlers}>
      <Navbar />

      <div className="max-w-[720px] mx-auto px-5 pt-10 pb-32 sm:pb-24">
        {/* Beef of the Day banner */}
        {botd.argument && (
          <BeefOfTheDay
            argument={botd.argument}
            date={botd.date}
            countdown={botd.countdown}
          />
        )}

        {/* Filter chips */}
        <FilterChips
          activeCategory={category}
          onSelect={handleCategoryChange}
        />

        <AnimatePresence mode="wait">
          {argument && (
            <motion.div
              key={argument.beefNumber}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
            >
              {/* Argument metadata bar */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <PlatformBadge
                  platform={argument.platform}
                  source={argument.platformSource}
                />
                {categoryDef && (
                  <span className="text-xs font-bold text-yellow uppercase tracking-wider">
                    {categoryDef.emoji} {categoryDef.label}
                  </span>
                )}
                <HeatRating rating={argument.heatRating} />
                <span className="text-xs font-mono text-text-muted ml-auto">
                  {formatBeefNumber(argument.beefNumber)}
                </span>
              </div>

              {/* Main card with loading overlay */}
              <div className="relative">
                <LoadingOverlay visible={isLoading} />
                <ArgumentCard
                  argument={argument}
                  hasVoted={vote.hasVoted}
                  votedFor={vote.votedFor}
                  results={vote.results}
                  onVote={vote.castVote}
                  isVoteLoading={vote.isLoading}
                  reactions={reactionHook.reactions}
                  userReactions={reactionHook.userReactions}
                  onReact={reactionHook.react}
                />
              </div>

              {/* Confetti */}
              <Confetti trigger={showConfetti} />

              {/* Topic drift */}
              {argument.topicDrift && (
                <TopicDrift drift={argument.topicDrift} />
              )}

              {/* Action bar */}
              <div className="flex items-center justify-center gap-4 mt-8">
                <ShareButton beefNumber={argument.beefNumber} title={argument.title} />
                <NextBeefButton
                  onClick={handleNextBeef}
                  isLoading={isLoading}
                />
                {vote.hasVoted && vote.votedFor && (
                  <button
                    onClick={() =>
                      challengeHook.createChallenge(argument.beefNumber, vote.votedFor!)
                    }
                    disabled={challengeHook.isCreating}
                    className="text-xs text-accent hover:text-accent/80 transition-colors px-3 py-2 font-medium"
                  >
                    {challengeHook.isCreating ? "Creating..." : "Challenge a Friend"}
                  </button>
                )}
                <button className="text-xs text-text-muted hover:text-text transition-colors px-3 py-2">
                  Report
                </button>
              </div>

              {/* Challenge share URL */}
              {challengeHook.shareUrl && (
                <div className="flex items-center justify-center gap-2 mt-3">
                  <input
                    readOnly
                    value={challengeHook.shareUrl}
                    className="text-xs bg-surface border border-border rounded px-3 py-1.5 text-text-muted w-[300px] max-w-full"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(challengeHook.shareUrl!);
                    }}
                    className="text-xs text-accent hover:text-accent/80 px-2 py-1.5"
                  >
                    Copy
                  </button>
                </div>
              )}

              {/* Keyboard hint */}
              <p className="text-center text-xs text-text-muted mt-6 font-mono">
                Press{" "}
                <kbd className="px-1.5 py-0.5 bg-surface-2 border border-border rounded text-[10px]">
                  Space
                </kbd>{" "}
                for next &middot;{" "}
                <kbd className="px-1.5 py-0.5 bg-surface-2 border border-border rounded text-[10px]">
                  1
                </kbd>{" "}
                vote left &middot;{" "}
                <kbd className="px-1.5 py-0.5 bg-surface-2 border border-border rounded text-[10px]">
                  2
                </kbd>{" "}
                vote right &middot;{" "}
                <kbd className="px-1.5 py-0.5 bg-surface-2 border border-border rounded text-[10px]">
                  S
                </kbd>{" "}
                share
              </p>

              {/* Stats bar */}
              <div className="flex justify-center gap-12 mt-10 text-center">
                <div>
                  <p className="font-mono font-bold text-text text-lg">
                    {argument.viewCount.toLocaleString()}
                  </p>
                  <p className="text-xs text-text-muted">Views</p>
                </div>
                <div>
                  <p className="font-mono font-bold text-text text-lg">
                    {argument.totalVotes.toLocaleString()}
                  </p>
                  <p className="text-xs text-text-muted">Votes Cast</p>
                </div>
                <div>
                  <p className="font-mono font-bold text-text text-lg">
                    {argument.shareCount.toLocaleString()}
                  </p>
                  <p className="text-xs text-text-muted">Shares</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading state (no argument yet) */}
        {!argument && isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-[3px] border-border border-t-accent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!argument && !isLoading && (
          <div className="text-center py-20">
            <p className="text-text-muted text-lg mb-4">No beef found</p>
            <NextBeefButton
              onClick={() => {
                setSeenBeefNumbers([]);
                localStorage.removeItem(SEEN_STORAGE_KEY);
                fetchRandom();
              }}
              isLoading={false}
            />
          </div>
        )}
      </div>
    </main>
  );
}
