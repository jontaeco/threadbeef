import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { arguments_, challenges } from "@/lib/db/schema";
import { serializeArgument } from "@/lib/db/serialize";

export async function GET(
  _request: NextRequest,
  { params }: { params: { code: string } }
) {
  const { code } = params;

  // Look up challenge by code
  const challengeRows = await db
    .select()
    .from(challenges)
    .where(eq(challenges.challengeCode, code))
    .limit(1);

  if (challengeRows.length === 0) {
    return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
  }

  const challenge = challengeRows[0];

  // Get argument
  const argRows = await db
    .select()
    .from(arguments_)
    .where(eq(arguments_.id, challenge.argumentId))
    .limit(1);

  if (argRows.length === 0) {
    return NextResponse.json({ error: "Argument not found" }, { status: 404 });
  }

  const argument = serializeArgument(argRows[0]);

  // Do NOT include challengerVote
  return NextResponse.json({
    argument,
    status: challenge.status,
  });
}
