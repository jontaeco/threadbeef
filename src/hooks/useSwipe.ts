"use client";

import { useRef, useCallback } from "react";

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

/**
 * Detects upward swipe gestures for "Next Beef" navigation.
 * Threshold: 80px vertical swipe.
 */
export function useSwipe(onSwipeUp: () => void): SwipeHandlers {
  const startY = useRef<number>(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const deltaY = startY.current - e.changedTouches[0].clientY;
      if (deltaY > 80) {
        onSwipeUp();
      }
    },
    [onSwipeUp]
  );

  return { onTouchStart, onTouchEnd };
}
