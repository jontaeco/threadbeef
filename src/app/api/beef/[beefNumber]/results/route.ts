import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { arguments_ } from "@/lib/db/schema";
import { calcVotePercents } from "@/lib/utils";
import { getVerdict } from "@/lib/constants";

export async function GET(
  _request: NextRequest,
  { params }: { params: { beefNumber: string } }
) {
  const beefNumber = parseInt(params.beefNumber, 10);
  if (isNaN(beefNumber)) {
    return NextResponse.json({ error: "Invalid beef number" }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(arguments_)
    .where(
      and(
        eq(arguments_.beefNumber, beefNumber),
        eq(arguments_.status, "approved")
      )
    )
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json({ error: "Beef not found" }, { status: 404 });
  }

  const { totalVotes, votesA, votesB } = rows[0];
  const [percentA, percentB] = calcVotePercents(votesA, votesB);
  const verdict = getVerdict(percentA, percentB);

  return NextResponse.json({
    results: {
      totalVotes,
      votesA,
      votesB,
      percentA,
      percentB,
      verdict: verdict.label,
    },
  });
}
