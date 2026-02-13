import type { Argument } from "@/types";
import type { arguments_ } from "./schema";
import type { InferSelectModel } from "drizzle-orm";

type ArgumentRow = InferSelectModel<typeof arguments_>;

/**
 * Maps a snake_case DB row to the camelCase API response shape.
 * Strips `originalUrl` (never exposed publicly).
 */
export function serializeArgument(row: ArgumentRow): Argument {
  return {
    id: row.id,
    beefNumber: row.beefNumber,
    platform: row.platform,
    platformSource: row.platformSource,
    title: row.title,
    contextBlurb: row.contextBlurb,
    topicDrift: row.topicDrift,
    category: row.category,
    heatRating: row.heatRating,
    userADisplayName: row.userADisplayName,
    userBDisplayName: row.userBDisplayName,
    userAZinger: row.userAZinger,
    userBZinger: row.userBZinger,
    messages: row.messages,
    entertainmentScore: row.entertainmentScore,
    status: row.status,
    totalVotes: row.totalVotes,
    votesA: row.votesA,
    votesB: row.votesB,
    reactions: row.reactions,
    viewCount: row.viewCount,
    shareCount: row.shareCount,
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : String(row.createdAt),
    updatedAt:
      row.updatedAt instanceof Date
        ? row.updatedAt.toISOString()
        : String(row.updatedAt),
  };
}
