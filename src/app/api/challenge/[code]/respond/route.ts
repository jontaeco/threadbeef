import { NextRequest, NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { challenges } from "@/lib/db/schema";
import { respondChallengeSchema } from "@/lib/validations";

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const { code } = params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = respondChallengeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { vote, fingerprint } = parsed.data;

  // Update challenge: set challengee vote + complete
  const updated = await db
    .update(challenges)
    .set({
      challengeeVote: vote,
      status: "completed",
      completedAt: sql`NOW()`,
    })
    .where(
      and(
        eq(challenges.challengeCode, code),
        eq(challenges.status, "pending")
      )
    )
    .returning({
      challengerVote: challenges.challengerVote,
      challengeeVote: challenges.challengeeVote,
    });

  if (updated.length === 0) {
    return NextResponse.json(
      { error: "Challenge not found or already completed" },
      { status: 409 }
    );
  }

  const { challengerVote, challengeeVote } = updated[0];

  return NextResponse.json({
    challengerVote,
    challengeeVote,
    agreed: challengerVote === challengeeVote,
  });
}
