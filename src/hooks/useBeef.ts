"use client";

import { useState, useCallback } from "react";
import type { Argument, Category } from "@/types";

interface UseBeefReturn {
  argument: Argument | null;
  isLoading: boolean;
  error: string | null;
  fetchRandom: (category?: Category, exclude?: number[]) => Promise<void>;
  fetchByNumber: (beefNumber: number) => Promise<void>;
}

/**
 * Fetches random or specific beef arguments from the API.
 */
export function useBeef(): UseBeefReturn {
  const [argument, setArgument] = useState<Argument | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRandom = useCallback(
    async (category?: Category, exclude?: number[]) => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (category) params.set("category", category);
        if (exclude?.length)
          params.set("exclude", exclude.join(","));
        const res = await fetch(`/api/beef/random?${params}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setArgument(data.argument);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const fetchByNumber = useCallback(async (beefNumber: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/beef/${beefNumber}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setArgument(data.argument);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { argument, isLoading, error, fetchRandom, fetchByNumber };
}
