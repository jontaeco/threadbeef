"use client";

import { useState, useCallback } from "react";
import { playSizzle, playGavel, playCrowd } from "@/lib/sounds";

/**
 * Manages sound toggle state and provides play functions.
 * Sound is OFF by default (per spec).
 */
export function useSound() {
  const [enabled, setEnabled] = useState(false);

  const toggle = useCallback(() => {
    setEnabled((prev) => !prev);
  }, []);

  const sizzle = useCallback(() => {
    if (enabled) playSizzle();
  }, [enabled]);

  const gavel = useCallback(() => {
    if (enabled) playGavel();
  }, [enabled]);

  const crowd = useCallback(() => {
    if (enabled) playCrowd();
  }, [enabled]);

  return { enabled, toggle, sizzle, gavel, crowd };
}
