import type { Category, ReactionType } from "@/types";

// ── Categories ─────────────────────────────────────────────────────
// Categories are free-form (LLM-assigned). This map provides display
// metadata for known categories. Unknown categories get auto-generated
// labels and a default emoji.

export interface CategoryDefinition {
  slug: Category;
  emoji: string;
  label: string;
  tagline: string;
}

/** Display metadata for known categories */
const KNOWN_CATEGORIES: CategoryDefinition[] = [
  {
    slug: "petty",
    emoji: "🔥",
    label: "Petty",
    tagline: "Arguments that should never have happened, and yet here we are.",
  },
  {
    slug: "tech",
    emoji: "💻",
    label: "Tech",
    tagline: "Tabs vs spaces was just the beginning.",
  },
  {
    slug: "food_takes",
    emoji: "🍕",
    label: "Food Takes",
    tagline:
      "Wars fought over seasoning, sauce, and whether a hot dog is a sandwich.",
  },
  {
    slug: "unhinged",
    emoji: "💀",
    label: "Unhinged",
    tagline: "Someone called the cops over this. Metaphorically.",
  },
  {
    slug: "relationship",
    emoji: "❤️",
    label: "Relationship",
    tagline: "Love is a battlefield. This is the battlefield.",
  },
  {
    slug: "gaming",
    emoji: "🎮",
    label: "Gaming",
    tagline: "Console wars, difficulty debates, and main character discourse.",
  },
  {
    slug: "sports",
    emoji: "🏈",
    label: "Sports",
    tagline: "Hot takes so bad they'd get you booed out of the stadium.",
  },
  {
    slug: "politics",
    emoji: "🏛️",
    label: "Politics",
    tagline: "Left, right, and completely unhinged.",
  },
  {
    slug: "aita",
    emoji: "⚖️",
    label: "AITA",
    tagline: "The internet's favorite moral courtroom.",
  },
  {
    slug: "pedantic",
    emoji: "🤓",
    label: "Pedantic",
    tagline: 'Actually, you\'ll find that...',
  },
  {
    slug: "movies_tv",
    emoji: "🎬",
    label: "Movies/TV",
    tagline: "Plot holes, hot takes, and fandom fury.",
  },
  {
    slug: "music",
    emoji: "🎵",
    label: "Music",
    tagline: "Genre wars and guilty pleasures.",
  },
  {
    slug: "philosophy",
    emoji: "🧠",
    label: "Philosophy",
    tagline: "Is a hotdog a sandwich? Is cereal a soup? Is this even real?",
  },
  {
    slug: "money",
    emoji: "💰",
    label: "Money",
    tagline: "Tipping debates, rent splits, and financial hot takes.",
  },
  {
    slug: "religion",
    emoji: "🙏",
    label: "Religion",
    tagline: "Holy wars, but make them comment sections.",
  },
  {
    slug: "science",
    emoji: "🔬",
    label: "Science",
    tagline: "Peer review, but angrier.",
  },
  {
    slug: "cars",
    emoji: "🚗",
    label: "Cars",
    tagline: "Horsepower arguments and road rage in text form.",
  },
  {
    slug: "fitness",
    emoji: "💪",
    label: "Fitness",
    tagline: "Broscience vs actual science.",
  },
  {
    slug: "anime",
    emoji: "⚔️",
    label: "Anime",
    tagline: "Power scaling debates and waifu wars.",
  },
];

const KNOWN_CATEGORY_MAP = new Map(KNOWN_CATEGORIES.map((c) => [c.slug, c]));

/** Get display info for any category — known or unknown */
export function getCategoryDisplay(slug: string): CategoryDefinition {
  const known = KNOWN_CATEGORY_MAP.get(slug);
  if (known) return known;

  // Auto-generate display for unknown categories
  const label = slug
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    slug,
    emoji: "💬",
    label,
    tagline: `Internet arguments about ${label.toLowerCase()}.`,
  };
}

/** @deprecated Use getCategoryDisplay() for individual lookups */
export const CATEGORIES = KNOWN_CATEGORIES;
export const CATEGORY_MAP = KNOWN_CATEGORY_MAP;

// ── Verdict Thresholds ─────────────────────────────────────────────

export interface VerdictThreshold {
  label: string;
  emoji: string;
  /** Minimum winning percentage (inclusive) */
  minPercent: number;
}

/** Ordered from most lopsided to closest. First match wins. */
export const VERDICT_THRESHOLDS: VerdictThreshold[] = [
  { label: "UNANIMOUS BEATDOWN", emoji: "💀", minPercent: 95 },
  { label: "FLAWLESS VICTORY", emoji: "🏆", minPercent: 85 },
  { label: "CLEAR WINNER", emoji: "✅", minPercent: 70 },
  { label: "SPLIT DECISION", emoji: "⚖️", minPercent: 55 },
  { label: "CONTROVERSIAL BEEF", emoji: "🔥", minPercent: 0 },
];

export function getVerdict(percentA: number, percentB: number): VerdictThreshold {
  const winningPercent = Math.max(percentA, percentB);
  return (
    VERDICT_THRESHOLDS.find((v) => winningPercent >= v.minPercent) ??
    VERDICT_THRESHOLDS[VERDICT_THRESHOLDS.length - 1]
  );
}

// ── Reactions ──────────────────────────────────────────────────────

export interface ReactionDefinition {
  type: ReactionType;
  emoji: string;
  label: string;
}

export const REACTIONS: ReactionDefinition[] = [
  { type: "dead", emoji: "💀", label: "I'm Dead" },
  { type: "both_wrong", emoji: "🤡", label: "Both Wrong" },
  { type: "actually", emoji: "📐", label: "Actually..." },
  { type: "peak_internet", emoji: "🍿", label: "Peak Internet" },
  { type: "spicier", emoji: "🌶️", label: "Spicier Than Rated" },
  { type: "hof_material", emoji: "🏆", label: "Hall of Fame Material" },
];

// ── Heat Rating ────────────────────────────────────────────────────

export const HEAT_DESCRIPTIONS: Record<number, string> = {
  1: "Polite disagreement",
  2: "Firm pushback",
  3: "Getting personal",
  4: "Heated — someone is MAD",
  5: "Nuclear — someone said something unhinged",
};

export const HEAT_EMOJI = "🌶️";

// ── User Titles ────────────────────────────────────────────────────

export interface TitleMilestone {
  votes: number;
  title: string;
}

export const TITLE_MILESTONES: TitleMilestone[] = [
  { votes: 10, title: "Beef Taster" },
  { votes: 50, title: "Beef Connoisseur" },
  { votes: 200, title: "Certified Beef Inspector 🥩" },
  { votes: 500, title: "Chief Justice of the Internet" },
  { votes: 1000, title: "Professional Hater" },
];

export function getTitleForVotes(count: number): string | null {
  for (let i = TITLE_MILESTONES.length - 1; i >= 0; i--) {
    if (count >= TITLE_MILESTONES[i].votes) {
      return TITLE_MILESTONES[i].title;
    }
  }
  return null;
}

// ── Streak Milestones ──────────────────────────────────────────────

export const STREAK_MILESTONES = [7, 30, 100] as const;

// ── Platform Colors (for badges) ───────────────────────────────────

export const PLATFORM_COLORS: Record<string, string> = {
  reddit: "#ff4500",
  twitter: "#1da1f2",
  hackernews: "#ff6600",
  youtube: "#ff0000",
  stackoverflow: "#f48024",
  forum: "#7a7890",
  user_submitted: "#ff4d4d",
};
