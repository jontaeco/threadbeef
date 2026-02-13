import { z } from "zod";

export const voteSchema = z.object({
  side: z.enum(["a", "b"]),
  fingerprint: z.string().min(1),
});

export const reactSchema = z.object({
  type: z.enum(["dead", "both_wrong", "actually", "peak_internet", "spicier", "hof_material"]),
  fingerprint: z.string().min(1),
});

export const createChallengeSchema = z.object({
  beefNumber: z.number().int().positive(),
  vote: z.enum(["a", "b"]),
  fingerprint: z.string().min(1),
});

export const respondChallengeSchema = z.object({
  vote: z.enum(["a", "b"]),
  fingerprint: z.string().min(1),
});

export const submitSchema = z.object({
  url: z.string().url().optional(),
  rawText: z.string().min(10).max(10000).optional(),
}).refine(
  (data) => data.url || data.rawText,
  { message: "Either url or rawText must be provided" }
);

export const hallOfFameQuerySchema = z.object({
  sort: z.enum(["most_voted", "biggest_beatdown", "most_controversial",
                 "most_reacted", "staff_picks", "rising"]).default("most_voted"),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const shareSchema = z.object({
  fingerprint: z.string().min(1),
});
