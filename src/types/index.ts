// ── Core Domain Types ──────────────────────────────────────────────

export type Platform =
  | "reddit"
  | "twitter"
  | "hackernews"
  | "youtube"
  | "stackoverflow"
  | "forum"
  | "user_submitted";

// Categories are free-form — LLM assigns whatever fits best
export type Category = string;

export type ReactionType =
  | "dead"
  | "both_wrong"
  | "actually"
  | "peak_internet"
  | "spicier"
  | "hof_material";

export type VoteSide = "a" | "b";

export type ArgumentStatus =
  | "pending_review"
  | "approved"
  | "rejected"
  | "reported"
  | "archived";

export type ChallengeStatus = "pending" | "completed";

export type AuthProvider = "google" | "github" | "apple" | "email";

// ── Data Models ────────────────────────────────────────────────────

export interface Message {
  author: "a" | "b";
  body: string;
  timestamp: string;
  score: number | null;
  quoted_text: string | null;
}

export interface ReactionCounts {
  dead: number;
  both_wrong: number;
  actually: number;
  peak_internet: number;
  spicier: number;
  hof_material: number;
}

export interface Argument {
  id: string;
  beefNumber: number;
  platform: Platform;
  platformSource: string;
  title: string;
  contextBlurb: string | null;
  topicDrift: string | null;
  category: Category;
  heatRating: number;
  userADisplayName: string;
  userBDisplayName: string;
  userAZinger: string | null;
  userBZinger: string | null;
  messages: Message[];
  entertainmentScore: number | null;
  status: ArgumentStatus;
  totalVotes: number;
  votesA: number;
  votesB: number;
  reactions: ReactionCounts;
  viewCount: number;
  shareCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Vote {
  id: string;
  argumentId: string;
  userId: string | null;
  fingerprint: string;
  votedFor: VoteSide;
  createdAt: string;
}

export interface Reaction {
  id: string;
  argumentId: string;
  reactionType: ReactionType;
  fingerprint: string;
  userId: string | null;
  createdAt: string;
}

export interface Challenge {
  id: string;
  challengeCode: string;
  argumentId: string;
  challengerUserId: string | null;
  challengerFingerprint: string;
  challengerVote: VoteSide;
  challengeeVote: VoteSide | null;
  status: ChallengeStatus;
  createdAt: string;
  completedAt: string | null;
}

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  authProvider: AuthProvider;
  title: string | null;
  totalVotesCast: number;
  currentStreak: number;
  longestStreak: number;
  lastVoteDate: string | null;
  stats: UserStats | null;
  createdAt: string;
}

export interface UserStats {
  categoryPreferences: Record<string, number>;
  alignmentScore: number;
  underdogPercentage: number;
  crowdAgreement: number;
}

export interface BeefOfTheDay {
  id: string;
  argumentId: string;
  date: string;
  finalVotesA: number | null;
  finalVotesB: number | null;
  finalVerdict: string | null;
  createdAt: string;
}

// ── API Request/Response Types ─────────────────────────────────────

/** GET /api/beef/random?category=all&exclude=id1,id2 */
export interface RandomBeefResponse {
  argument: Argument;
}

/** GET /api/beef/:beefNumber */
export interface BeefResponse {
  argument: Argument;
}

/** POST /api/beef/:beefNumber/vote */
export interface VoteRequest {
  side: VoteSide;
  fingerprint: string;
}

export interface VoteResponse {
  success: boolean;
  results: VoteResults;
}

export interface VoteResults {
  totalVotes: number;
  votesA: number;
  votesB: number;
  percentA: number;
  percentB: number;
  verdict: string;
}

/** POST /api/beef/:beefNumber/react */
export interface ReactRequest {
  type: ReactionType;
  fingerprint: string;
}

export interface ReactResponse {
  success: boolean;
  reactions: ReactionCounts;
}

/** GET /api/beef/today */
export interface BeefOfTheDayResponse {
  argument: Argument;
  date: string;
  countdown: number; // seconds until next BOTD
}

/** POST /api/challenge/create */
export interface CreateChallengeRequest {
  beefNumber: number;
  vote: VoteSide;
  fingerprint: string;
}

export interface CreateChallengeResponse {
  challengeCode: string;
  shareUrl: string;
}

/** GET /api/challenge/:code */
export interface ChallengeResponse {
  argument: Argument;
  status: ChallengeStatus;
}

/** POST /api/challenge/:code/respond */
export interface RespondChallengeRequest {
  vote: VoteSide;
  fingerprint: string;
}

export interface RespondChallengeResponse {
  challengerVote: VoteSide;
  challengeeVote: VoteSide;
  agreed: boolean;
}

/** GET /api/hall-of-fame?sort=...&limit=...&offset=... */
export type HallOfFameSort =
  | "most_voted"
  | "biggest_beatdown"
  | "most_controversial"
  | "most_reacted"
  | "staff_picks"
  | "rising";

export interface HallOfFameResponse {
  arguments: Argument[];
  total: number;
}

/** GET /api/categories */
export interface CategoriesResponse {
  categories: Array<{
    slug: Category;
    label: string;
    emoji: string;
    tagline: string;
    count: number;
  }>;
}

/** POST /api/submit */
export interface SubmitRequest {
  url?: string;
  rawText?: string;
}

export interface SubmitResponse {
  success: boolean;
  submissionId: string;
}

// ── Verdict thresholds (for reference) ─────────────────────────────

export interface VerdictDefinition {
  label: string;
  minPercent: number;
  maxPercent: number;
}
