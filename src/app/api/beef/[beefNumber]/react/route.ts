import { NextRequest, NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { arguments_, reactions } from "@/lib/db/schema";
import { reactSchema } from "@/lib/validations";
import type { ReactionCounts } from "@/types";

/**
 * POST /api/beef/:beefNumber/react
 *
 * Body: { type: ReactionType, fingerprint: string }
 *
 * Adds a reaction. Deduplicates by fingerprint + reaction type per argument.
 * Returns updated reaction counts.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { beefNumber: string } }
) {
  const beefNumber = parseInt(params.beefNumber, 10);
  if (isNaN(beefNumber)) {
    return NextResponse.json({ error: "Invalid beef number" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = reactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { type, fingerprint } = parsed.data;

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

  // Try insert reaction (unique constraint on argument_id + fingerprint + reaction_type)
  try {
    await db.insert(reactions).values({
      argumentId: argument.id,
      fingerprint,
      reactionType: type,
    });
  } catch (err: any) {
    if (err?.code === "23505" || err?.message?.includes("unique")) {
      return NextResponse.json(
        { error: "Already reacted with this type" },
        { status: 409 }
      );
    }
    throw err;
  }

  // Read current reactions, increment the type, update
  const currentReactions = argument.reactions as ReactionCounts;
  const updatedReactions: ReactionCounts = {
    ...currentReactions,
    [type]: (currentReactions[type] || 0) + 1,
  };

  await db
    .update(arguments_)
    .set({ reactions: updatedReactions })
    .where(eq(arguments_.id, argument.id));

  return NextResponse.json({
    success: true,
    reactions: updatedReactions,
  });
}
