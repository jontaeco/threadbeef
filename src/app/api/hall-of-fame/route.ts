import { NextRequest, NextResponse } from "next/server";
import { eq, sql, desc, asc, and, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { arguments_ } from "@/lib/db/schema";
import { serializeArgument } from "@/lib/db/serialize";
import { hallOfFameQuerySchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const parsed = hallOfFameQuerySchema.safeParse({
    sort: searchParams.get("sort") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
    offset: searchParams.get("offset") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { sort, limit, offset } = parsed.data;

  let rows: (typeof arguments_.$inferSelect)[];
  let total: number;

  switch (sort) {
    case "most_voted": {
      const countResult = await db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(arguments_)
        .where(eq(arguments_.status, "approved"));
      total = countResult[0].count;

      rows = await db
        .select()
        .from(arguments_)
        .where(eq(arguments_.status, "approved"))
        .orderBy(desc(arguments_.totalVotes))
        .limit(limit)
        .offset(offset);
      break;
    }

    case "biggest_beatdown": {
      // Winning side > 85% of votes, min 50 total votes
      const beatdownRows = await db
        .select()
        .from(arguments_)
        .where(
          and(
            eq(arguments_.status, "approved"),
            gte(arguments_.totalVotes, 50),
            sql`GREATEST(${arguments_.votesA}, ${arguments_.votesB})::float / ${arguments_.totalVotes} > 0.85`
          )
        )
        .orderBy(
          sql`GREATEST(${arguments_.votesA}, ${arguments_.votesB})::float / ${arguments_.totalVotes} DESC`
        );

      total = beatdownRows.length;
      rows = beatdownRows.slice(offset, offset + limit);
      break;
    }

    case "most_controversial": {
      // Closest to 50/50, min 50 votes
      const controversialRows = await db
        .select()
        .from(arguments_)
        .where(
          and(
            eq(arguments_.status, "approved"),
            gte(arguments_.totalVotes, 50)
          )
        )
        .orderBy(
          asc(sql`ABS(${arguments_.votesA} - ${arguments_.votesB})`)
        );

      total = controversialRows.length;
      rows = controversialRows.slice(offset, offset + limit);
      break;
    }

    case "most_reacted": {
      const reactedRows = await db
        .select()
        .from(arguments_)
        .where(eq(arguments_.status, "approved"))
        .orderBy(
          desc(
            sql`(${arguments_.reactions}->>'dead')::int + (${arguments_.reactions}->>'both_wrong')::int + (${arguments_.reactions}->>'actually')::int + (${arguments_.reactions}->>'peak_internet')::int + (${arguments_.reactions}->>'spicier')::int + (${arguments_.reactions}->>'hof_material')::int`
          )
        );

      total = reactedRows.length;
      rows = reactedRows.slice(offset, offset + limit);
      break;
    }

    case "staff_picks": {
      // Proxy: entertainment_score >= 9.0
      const staffRows = await db
        .select()
        .from(arguments_)
        .where(
          and(
            eq(arguments_.status, "approved"),
            gte(arguments_.entertainmentScore, 9.0)
          )
        )
        .orderBy(desc(arguments_.entertainmentScore));

      total = staffRows.length;
      rows = staffRows.slice(offset, offset + limit);
      break;
    }

    case "rising": {
      // Created in last 7 days
      const risingRows = await db
        .select()
        .from(arguments_)
        .where(
          and(
            eq(arguments_.status, "approved"),
            sql`${arguments_.createdAt} > NOW() - INTERVAL '7 days'`
          )
        )
        .orderBy(desc(arguments_.totalVotes));

      total = risingRows.length;
      rows = risingRows.slice(offset, offset + limit);
      break;
    }

    default:
      return NextResponse.json({ error: "Invalid sort" }, { status: 400 });
  }

  return NextResponse.json({
    arguments: rows.map(serializeArgument),
    total,
  });
}
