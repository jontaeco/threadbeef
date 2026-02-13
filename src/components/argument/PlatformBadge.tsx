"use client";

import type { Platform } from "@/types";
import { PLATFORM_COLORS } from "@/lib/constants";

interface PlatformBadgeProps {
  platform: Platform;
  source: string;
}

export function PlatformBadge({ platform, source }: PlatformBadgeProps) {
  const color = PLATFORM_COLORS[platform] ?? PLATFORM_COLORS.forum;

  return (
    <span className="inline-flex items-center gap-2 bg-surface-2 border border-border px-3.5 py-1.5 rounded-pill text-xs font-medium text-text-muted">
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      {source}
    </span>
  );
}
