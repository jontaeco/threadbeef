import {
  pgTable,
  uuid,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  date,
  real,
  json,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ── Enums ──────────────────────────────────────────────────────────

export const platformEnum = pgEnum("platform", [
  "reddit",
  "twitter",
  "hackernews",
  "youtube",
  "stackoverflow",
  "forum",
  "user_submitted",
]);

export const categoryEnum = pgEnum("category", [
  "petty",
  "tech",
  "food_takes",
  "unhinged",
  "relationship",
  "gaming",
  "sports",
  "politics",
  "aita",
  "pedantic",
  "movies_tv",
  "music",
  "philosophy",
  "money",
]);

export const argumentStatusEnum = pgEnum("argument_status", [
  "pending_review",
  "approved",
  "rejected",
  "reported",
  "archived",
]);

export const reactionTypeEnum = pgEnum("reaction_type", [
  "dead",
  "both_wrong",
  "actually",
  "peak_internet",
  "spicier",
  "hof_material",
]);

export const challengeStatusEnum = pgEnum("challenge_status", [
  "pending",
  "completed",
]);

export const authProviderEnum = pgEnum("auth_provider", [
  "google",
  "github",
  "apple",
  "email",
]);

export const voteSideEnum = pgEnum("vote_side", ["a", "b"]);

export const submissionStatusEnum = pgEnum("submission_status", [
  "pending",
  "processing",
  "approved",
  "rejected",
]);

// ── Message JSON type ──────────────────────────────────────────────
// Each message in the messages JSON column:
// { author: "a" | "b", body: string, timestamp: string, score: number | null, quoted_text: string | null }

// ── Tables ─────────────────────────────────────────────────────────

export const arguments_ = pgTable(
  "arguments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    beefNumber: serial("beef_number").notNull().unique(),
    platform: platformEnum("platform").notNull(),
    platformSource: text("platform_source").notNull(), // e.g. "r/cooking", "@user", "HN"
    originalUrl: text("original_url"), // internal reference, never exposed publicly
    title: text("title").notNull(), // context/topic line
    contextBlurb: text("context_blurb"), // LLM-generated 1-sentence summary
    topicDrift: text("topic_drift"), // "Started about X → Ended about Y"
    category: categoryEnum("category").notNull(),
    heatRating: integer("heat_rating").notNull().default(1), // 1-5
    userADisplayName: text("user_a_display_name").notNull(),
    userBDisplayName: text("user_b_display_name").notNull(),
    userAZinger: text("user_a_zinger"), // best line from user A (share card)
    userBZinger: text("user_b_zinger"), // best line from user B (share card)
    messages: json("messages")
      .$type<
        Array<{
          author: "a" | "b";
          body: string;
          timestamp: string;
          score: number | null;
          quoted_text: string | null;
        }>
      >()
      .notNull(),
    entertainmentScore: real("entertainment_score"), // LLM score 1-10
    status: argumentStatusEnum("status").notNull().default("pending_review"),
    totalVotes: integer("total_votes").notNull().default(0),
    votesA: integer("votes_a").notNull().default(0),
    votesB: integer("votes_b").notNull().default(0),
    reactions: json("reactions")
      .$type<{
        dead: number;
        both_wrong: number;
        actually: number;
        peak_internet: number;
        spicier: number;
        hof_material: number;
      }>()
      .notNull()
      .default({
        dead: 0,
        both_wrong: 0,
        actually: 0,
        peak_internet: 0,
        spicier: 0,
        hof_material: 0,
      }),
    viewCount: integer("view_count").notNull().default(0),
    shareCount: integer("share_count").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    statusIdx: index("arguments_status_idx").on(table.status),
    categoryIdx: index("arguments_category_idx").on(table.category),
    beefNumberIdx: uniqueIndex("arguments_beef_number_idx").on(
      table.beefNumber
    ),
    entertainmentIdx: index("arguments_entertainment_idx").on(
      table.entertainmentScore
    ),
    totalVotesIdx: index("arguments_total_votes_idx").on(table.totalVotes),
    createdAtIdx: index("arguments_created_at_idx").on(table.createdAt),
  })
);

export const votes = pgTable(
  "votes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    argumentId: uuid("argument_id")
      .notNull()
      .references(() => arguments_.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    fingerprint: text("fingerprint").notNull(), // hashed, for anonymous dedup
    votedFor: voteSideEnum("voted_for").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    argumentIdx: index("votes_argument_idx").on(table.argumentId),
    dedupIdx: uniqueIndex("votes_dedup_idx").on(
      table.argumentId,
      table.fingerprint
    ),
  })
);

export const reactions = pgTable(
  "reactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    argumentId: uuid("argument_id")
      .notNull()
      .references(() => arguments_.id, { onDelete: "cascade" }),
    reactionType: reactionTypeEnum("reaction_type").notNull(),
    fingerprint: text("fingerprint").notNull(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    argumentIdx: index("reactions_argument_idx").on(table.argumentId),
    dedupIdx: uniqueIndex("reactions_dedup_idx").on(
      table.argumentId,
      table.fingerprint,
      table.reactionType
    ),
  })
);

export const submissions = pgTable(
  "submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    submittedBy: uuid("submitted_by").references(() => users.id, {
      onDelete: "set null",
    }),
    url: text("url"),
    rawText: text("raw_text"),
    status: submissionStatusEnum("status").notNull().default("pending"),
    reviewerNotes: text("reviewer_notes"),
    argumentId: uuid("argument_id").references(() => arguments_.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    statusIdx: index("submissions_status_idx").on(table.status),
  })
);

export const challenges = pgTable(
  "challenges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    challengeCode: text("challenge_code").notNull().unique(), // short code e.g. "xK9mQ"
    argumentId: uuid("argument_id")
      .notNull()
      .references(() => arguments_.id, { onDelete: "cascade" }),
    challengerUserId: uuid("challenger_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    challengerFingerprint: text("challenger_fingerprint").notNull(),
    challengerVote: voteSideEnum("challenger_vote").notNull(),
    challengeeVote: voteSideEnum("challengee_vote"),
    status: challengeStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    completedAt: timestamp("completed_at"),
  },
  (table) => ({
    codeIdx: uniqueIndex("challenges_code_idx").on(table.challengeCode),
  })
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    displayName: text("display_name"),
    authProvider: authProviderEnum("auth_provider").notNull(),
    title: text("title"), // earned rank e.g. "Certified Beef Inspector"
    totalVotesCast: integer("total_votes_cast").notNull().default(0),
    currentStreak: integer("current_streak").notNull().default(0),
    longestStreak: integer("longest_streak").notNull().default(0),
    lastVoteDate: date("last_vote_date"),
    stats: json("stats").$type<{
      categoryPreferences: Record<string, number>;
      alignmentScore: number;
      underdogPercentage: number;
      crowdAgreement: number;
    }>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
  })
);

export const beefOfTheDay = pgTable(
  "beef_of_the_day",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    argumentId: uuid("argument_id")
      .notNull()
      .references(() => arguments_.id, { onDelete: "cascade" }),
    date: date("date").notNull().unique(),
    finalVotesA: integer("final_votes_a"),
    finalVotesB: integer("final_votes_b"),
    finalVerdict: text("final_verdict"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    dateIdx: uniqueIndex("botd_date_idx").on(table.date),
  })
);
