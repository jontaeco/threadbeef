"use client";

import Link from "next/link";
import { SoundToggle } from "@/components/ui/SoundToggle";
import { useSoundContext } from "@/contexts/SoundContext";

export function Navbar() {
  const sound = useSoundContext();

  return (
    <nav className="sticky top-0 z-[100] flex justify-between items-center px-6 py-3 bg-bg/85 backdrop-blur-[20px] border-b border-border max-sm:px-4">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-1">
        <span className="font-display font-[800] text-2xl max-sm:text-xl">
          Thread
          <span className="text-accent">Beef</span>
        </span>
        <span className="text-xl animate-sizzle inline-block">🥩</span>
      </Link>

      {/* Nav links */}
      <div className="flex items-center gap-5 max-sm:gap-3">
        <Link
          href="/"
          className="text-sm text-accent font-medium max-sm:hidden"
        >
          Random
        </Link>
        <Link
          href="/hall-of-fame"
          className="text-sm text-text-muted hover:text-text transition-colors max-sm:hidden"
        >
          Hall of Fame
        </Link>
        <Link
          href="/categories"
          className="text-sm text-text-muted hover:text-text transition-colors max-sm:hidden"
        >
          Categories
        </Link>
        <Link
          href="/submit"
          className="text-sm text-text-muted hover:text-text transition-colors max-sm:hidden"
        >
          Submit
        </Link>

        <SoundToggle enabled={sound.enabled} onToggle={sound.toggle} />

        {/* Sign in pill (non-functional Phase 1) */}
        <button className="px-4 py-1.5 rounded-pill text-xs font-medium border border-border text-text-muted hover:border-text-muted hover:text-text transition-colors">
          Sign in
        </button>
      </div>
    </nav>
  );
}
