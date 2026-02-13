import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { beefOfTheDay, arguments_ } from "@/lib/db/schema";
import { serializeArgument } from "@/lib/db/serialize";

/**
 * GET /api/beef/today
 *
 * Returns today's Beef of the Day with live vote counts
 * and countdown to next BOTD.
 */
export async function GET() {
  // Get today's date in ET timezone
  const now = new Date();
  const etFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const todayET = etFormatter.format(now); // YYYY-MM-DD format

  // Look up today's BOTD
  const rows = await db
    .select()
    .from(beefOfTheDay)
    .where(eq(beefOfTheDay.date, todayET))
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "No Beef of the Day for today" },
      { status: 404 }
    );
  }

  const botd = rows[0];

  // Fetch the full argument
  const argRows = await db
    .select()
    .from(arguments_)
    .where(eq(arguments_.id, botd.argumentId))
    .limit(1);

  if (argRows.length === 0) {
    return NextResponse.json(
      { error: "BOTD argument not found" },
      { status: 404 }
    );
  }

  // Calculate countdown to midnight ET
  const etDate = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  );
  const midnightET = new Date(etDate);
  midnightET.setHours(24, 0, 0, 0);
  const countdown = Math.max(
    0,
    Math.floor((midnightET.getTime() - etDate.getTime()) / 1000)
  );

  return NextResponse.json({
    argument: serializeArgument(argRows[0]),
    date: botd.date,
    countdown,
  });
}
