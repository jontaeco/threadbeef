"use client";

import { useEffect } from "react";

interface ShortcutActions {
  onNext: () => void;
  onVoteA: () => void;
  onVoteB: () => void;
  onShare?: () => void;
}

/**
 * Keyboard shortcuts: Space = next beef, 1 = vote A, 2 = vote B, S = share
 */
export function useKeyboardShortcuts(actions: ShortcutActions) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.code) {
        case "Space":
          e.preventDefault();
          actions.onNext();
          break;
        case "Digit1":
        case "Numpad1":
          actions.onVoteA();
          break;
        case "Digit2":
        case "Numpad2":
          actions.onVoteB();
          break;
        case "KeyS":
          actions.onShare?.();
          break;
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [actions]);
}
