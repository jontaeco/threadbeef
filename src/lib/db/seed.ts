import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { SEED_ARGUMENTS } from "../seed-data";

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL not set. Create a .env.local file.");
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  const db = drizzle(sql, { schema });

  console.log("Seeding database...\n");

  // Delete existing data (idempotent)
  console.log("Clearing existing data...");
  await db.delete(schema.votes);
  await db.delete(schema.reactions);
  await db.delete(schema.arguments_);
  console.log("Cleared.\n");

  // Insert seed arguments
  for (const arg of SEED_ARGUMENTS) {
    const [inserted] = await db
      .insert(schema.arguments_)
      .values({
        platform: arg.platform,
        platformSource: arg.platformSource,
        originalUrl: arg.originalUrl,
        title: arg.title,
        contextBlurb: arg.contextBlurb,
        topicDrift: arg.topicDrift,
        category: arg.category,
        heatRating: arg.heatRating,
        userADisplayName: arg.userADisplayName,
        userBDisplayName: arg.userBDisplayName,
        userAZinger: arg.userAZinger,
        userBZinger: arg.userBZinger,
        messages: arg.messages,
        entertainmentScore: arg.entertainmentScore,
        status: arg.status,
        totalVotes: arg.totalVotes,
        votesA: arg.votesA,
        votesB: arg.votesB,
        reactions: arg.reactions,
        viewCount: arg.viewCount,
        shareCount: arg.shareCount,
      })
      .returning({ beefNumber: schema.arguments_.beefNumber, title: schema.arguments_.title });

    console.log(`  Inserted #${inserted.beefNumber}: ${inserted.title}`);
  }

  console.log(`\nDone! Inserted ${SEED_ARGUMENTS.length} arguments.`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
