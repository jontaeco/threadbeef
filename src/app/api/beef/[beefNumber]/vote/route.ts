import { NextRequest, NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { arguments_, votes } from "@/lib/db/schema";
import { voteSchema } from "@/lib/validations";
import { calcVotePercents } from "@/lib/utils";
import { getVerdict } from "@/lib/constants";

export async function POST(
  request: NextRequest,
  { params }: { params: { beefNumber: string } }
) {
  const beefNumber = parseInt(params.beefNumber, 10);
  if (isNaN(beefNumber)) {
    return NextResponse.json({ error: "Invalid beef number" }, { status: 400 });
  }

  // Validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = voteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { side, fingerprint } = parsed.data;

  // Find argument
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

  const argument = rows[0];

  // Try insert vote (unique constraint on argument_id + fingerprint)
  try {
    await db.insert(votes).values({
      argumentId: argument.id,
      fingerprint,
      votedFor: side,
    });
  } catch (err: any) {
    // Postgres unique violation
    if (err?.code === "23505" || err?.message?.includes("unique")) {
      return NextResponse.json(
        { error: "Already voted on this beef" },
        { status: 409 }
      );
    }
    throw err;
  }

  // Update argument vote counts
  const updateSet =
    side === "a"
      ? {
          totalVotes: sql`${arguments_.totalVotes} + 1`,
          votesA: sql`${arguments_.votesA} + 1`,
        }
      : {
          totalVotes: sql`${arguments_.totalVotes} + 1`,
          votesB: sql`${arguments_.votesB} + 1`,
        };

  const updated = await db
    .update(arguments_)
    .set(updateSet)
    .where(eq(arguments_.id, argument.id))
    .returning({
      totalVotes: arguments_.totalVotes,
      votesA: arguments_.votesA,
      votesB: arguments_.votesB,
    });

  const { totalVotes, votesA, votesB } = updated[0];
  const [percentA, percentB] = calcVotePercents(votesA, votesB);
  const verdict = getVerdict(percentA, percentB);

  return NextResponse.json({
    success: true,
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
