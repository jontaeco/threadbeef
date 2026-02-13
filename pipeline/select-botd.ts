/**
 * Select today's Beef of the Day.
 * Run via: npx tsx pipeline/select-botd.ts
 */

import "dotenv/config";
import { eq, and, desc, sql, notInArray } from "drizzle-orm";
import { db } from "../src/lib/db";
import { arguments_, beefOfTheDay } from "../src/lib/db/schema";
import { calcVotePercents } from "../src/lib/utils";
import { getVerdict } from "../src/lib/constants";

async function main() {
  // Get today's date in ET
  const now = new Date();
  const etFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const todayET = etFormatter.format(now);

  console.log(`[BOTD] Checking for ${todayET}...`);

  // Check if today already has a BOTD
  const existing = await db
    .select()
    .from(beefOfTheDay)
    .where(eq(beefOfTheDay.date, todayET))
    .limit(1);

  if (existing.length > 0) {
    console.log(`[BOTD] Already selected for today. Skipping.`);
    return;
  }

  // Find argument IDs used as BOTD in the last 30 days
  const recentBotds = await db
    .select({ argumentId: beefOfTheDay.argumentId })
    .from(beefOfTheDay)
    .where(sql`${beefOfTheDay.date} > current_date - interval '30 days'`);

  const excludeIds = recentBotds.map((r) => r.argumentId);

  // Find best candidate: approved, not recently used, highest entertainment score
  let query = db
    .select()
    .from(arguments_)
    .where(eq(arguments_.status, "approved"));

  if (excludeIds.length > 0) {
    query = db
      .select()
      .from(arguments_)
      .where(
        and(
          eq(arguments_.status, "approved"),
          notInArray(arguments_.id, excludeIds)
        )
      );
  }

  const candidates = await query
    .orderBy(desc(arguments_.entertainmentScore))
    .limit(1);

  if (candidates.length === 0) {
    console.log(`[BOTD] No eligible arguments found.`);
    return;
  }

  const selected = candidates[0];

  // Insert BOTD
  await db.insert(beefOfTheDay).values({
    argumentId: selected.id,
    date: todayET,
  });

  console.log(
    `[BOTD] Selected beef #${selected.beefNumber}: "${selected.title}"`
  );

  // Finalize yesterday's BOTD (snapshot final votes + verdict)
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayET = etFormatter.format(yesterday);

  const yesterdayBotd = await db
    .select()
    .from(beefOfTheDay)
    .where(
      and(
        eq(beefOfTheDay.date, yesterdayET),
        sql`${beefOfTheDay.finalVerdict} IS NULL`
      )
    )
    .limit(1);

  if (yesterdayBotd.length > 0) {
    const arg = await db
      .select()
      .from(arguments_)
      .where(eq(arguments_.id, yesterdayBotd[0].argumentId))
      .limit(1);

    if (arg.length > 0) {
      const [pA, pB] = calcVotePercents(arg[0].votesA, arg[0].votesB);
      const verdict = getVerdict(pA, pB);

      await db
        .update(beefOfTheDay)
        .set({
          finalVotesA: arg[0].votesA,
          finalVotesB: arg[0].votesB,
          finalVerdict: verdict.label,
        })
        .where(eq(beefOfTheDay.id, yesterdayBotd[0].id));

      console.log(
        `[BOTD] Finalized yesterday's BOTD: ${verdict.label} (${pA}% / ${pB}%)`
      );
    }
  }

  console.log("[BOTD] Done.");
}

main().catch(console.error);
