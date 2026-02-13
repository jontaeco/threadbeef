"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";

type SubmitState = "idle" | "submitting" | "success" | "error";

export default function SubmitPage() {
  const [url, setUrl] = useState("");
  const [rawText, setRawText] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const canSubmit = (url.trim() || rawText.trim()) && state !== "submitting";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setState("submitting");
    setErrorMessage("");

    try {
      const body: Record<string, string> = {};
      if (url.trim()) body.url = url.trim();
      if (rawText.trim()) body.rawText = rawText.trim();

      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setState("success");
        setUrl("");
        setRawText("");
      } else if (res.status === 429) {
        setState("error");
        setErrorMessage("Too many submissions. Please try again later.");
      } else {
        const data = await res.json();
        setState("error");
        setErrorMessage(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setState("error");
      setErrorMessage("Network error. Please try again.");
    }
  };

  return (
    <main>
      <Navbar />
      <div className="max-w-[600px] mx-auto px-5 pt-10 pb-32 sm:pb-24">
        <h1 className="font-display font-bold text-2xl text-text mb-2">
          Submit a Beef
        </h1>
        <p className="text-text-muted text-sm mb-8">
          Found an epic internet argument? Submit it for the world to judge.
        </p>

        {state === "success" ? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-card p-6 text-center">
            <p className="text-green-400 font-display font-bold text-lg">
              Thanks! Your beef has been submitted for review. 🥩
            </p>
            <p className="text-text-muted text-sm mt-2">
              We&apos;ll review it and add it to the collection if it makes the cut.
            </p>
            <button
              onClick={() => setState("idle")}
              className="mt-4 text-sm text-accent hover:text-accent/80 transition-colors"
            >
              Submit another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* URL input */}
            <label className="block text-xs text-text-muted mb-2 font-medium">
              Link to the argument
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste a Reddit, HN, or Twitter URL..."
              className="w-full bg-bg border border-border rounded-card px-4 py-3 text-sm text-text placeholder:text-text-muted/50 focus:outline-none focus:border-accent transition-colors"
            />

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-text-muted">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Raw text textarea */}
            <label className="block text-xs text-text-muted mb-2 font-medium">
              Paste the argument text
            </label>
            <textarea
              rows={6}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste the argument text..."
              className="w-full bg-bg border border-border rounded-card px-4 py-3 text-sm text-text placeholder:text-text-muted/50 focus:outline-none focus:border-accent transition-colors resize-none"
            />

            {/* Moderation notice */}
            <p className="text-xs text-text-muted mt-3">
              Submissions are reviewed before going live. We anonymize all
              usernames.
            </p>

            {/* Error */}
            {state === "error" && errorMessage && (
              <p className="text-xs text-red-400 mt-3">{errorMessage}</p>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="mt-6 w-full py-3 bg-accent text-bg font-bold text-sm rounded-card hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {state === "submitting" ? (
                <>
                  <div className="w-4 h-4 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Beef"
              )}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
