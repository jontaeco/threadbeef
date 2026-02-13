"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ShareButtonProps {
  beefNumber: number;
  title: string;
}

export function ShareButton({ beefNumber, title }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/beef/${beefNumber}`;

  const trackShare = useCallback(() => {
    fetch(`/api/beef/${beefNumber}/share`, { method: "POST" }).catch(() => {});
  }, [beefNumber]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      trackShare();
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, [shareUrl, trackShare]);

  const handleTwitter = useCallback(() => {
    const text = encodeURIComponent(`${title} 🥩`);
    const url = encodeURIComponent(shareUrl);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      "_blank",
      "noopener,noreferrer"
    );
    trackShare();
  }, [title, shareUrl, trackShare]);

  const handleNativeShare = useCallback(async () => {
    try {
      await navigator.share({
        title: `${title} — ThreadBeef`,
        url: shareUrl,
      });
      trackShare();
    } catch {}
  }, [title, shareUrl, trackShare]);

  const handleDownloadImage = useCallback(async () => {
    try {
      const res = await fetch(`/beef/${beefNumber}/opengraph-image`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `threadbeef-${beefNumber}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      trackShare();
    } catch {}
  }, [beefNumber, trackShare]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  const hasNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs text-text-muted hover:text-text transition-colors px-3 py-2"
      >
        Share
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-surface border border-border rounded-card p-2 min-w-[180px] z-50"
          >
            <button
              onClick={handleCopyLink}
              className="w-full text-left px-3 py-2 text-xs text-text hover:bg-surface-2 rounded transition-colors"
            >
              {copied ? "Copied!" : "Copy Link"}
            </button>
            <button
              onClick={handleTwitter}
              className="w-full text-left px-3 py-2 text-xs text-text hover:bg-surface-2 rounded transition-colors"
            >
              Share on Twitter
            </button>
            {hasNativeShare && (
              <button
                onClick={handleNativeShare}
                className="w-full text-left px-3 py-2 text-xs text-text hover:bg-surface-2 rounded transition-colors"
              >
                Share...
              </button>
            )}
            <button
              onClick={handleDownloadImage}
              className="w-full text-left px-3 py-2 text-xs text-text hover:bg-surface-2 rounded transition-colors"
            >
              Download Image
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
