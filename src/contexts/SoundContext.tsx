"use client";

import { createContext, useContext } from "react";
import { useSound } from "@/hooks/useSound";

type SoundContextValue = ReturnType<typeof useSound>;

const SoundContext = createContext<SoundContextValue | null>(null);

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const sound = useSound();

  return (
    <SoundContext.Provider value={sound}>{children}</SoundContext.Provider>
  );
}

export function useSoundContext(): SoundContextValue {
  const ctx = useContext(SoundContext);
  if (!ctx) {
    // Return a no-op fallback so components work outside provider (e.g. SSR)
    return {
      enabled: false,
      toggle: () => {},
      sizzle: () => {},
      gavel: () => {},
      crowd: () => {},
    };
  }
  return ctx;
}
