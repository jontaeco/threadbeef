"use client";

import { useState, useEffect, useCallback } from "react";
import type { Argument } from "@/types";

interface UseBeefOfTheDayReturn {
  argument: Argument | null;
  date: string | null;
  countdown: number;
  isLoading: boolean;
}

export function useBeefOfTheDay(): UseBeefOfTheDayReturn {
  const [argument, setArgument] = useState<Argument | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBotd = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/beef/today");
      if (res.ok) {
        const data = await res.json();
        setArgument(data.argument);
        setDate(data.date);
        setCountdown(data.countdown);
      } else {
        // No BOTD for today — that's fine
        setArgument(null);
        setDate(null);
        setCountdown(0);
      }
    } catch {
      setArgument(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchBotd();
  }, [fetchBotd]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Auto-refresh when countdown hits 0
          fetchBotd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [countdown, fetchBotd]);

  return { argument, date, countdown, isLoading };
}
