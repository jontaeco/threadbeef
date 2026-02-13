import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { arguments_, challenges } from "@/lib/db/schema";
import { createChallengeSchema } from "@/lib/validations";
import { generateChallengeCode } from "@/lib/utils";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createChallengeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { beefNumber, vote, fingerprint } = parsed.data;

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

  // Retry on unique violation (up to 3 attempts)
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = generateChallengeCode();
    try {
      await db.insert(challenges).values({
        challengeCode: code,
        argumentId: argument.id,
        challengerFingerprint: fingerprint,
        challengerVote: vote,
      });

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      return NextResponse.json(
        {
          challengeCode: code,
          shareUrl: `${baseUrl}/challenge/${code}`,
        },
        { status: 201 }
      );
    } catch (err: any) {
      if (err?.code === "23505" || err?.message?.includes("unique")) {
        continue;
      }
      throw err;
    }
  }

  return NextResponse.json(
    { error: "Failed to generate unique challenge code" },
    { status: 500 }
  );
}
