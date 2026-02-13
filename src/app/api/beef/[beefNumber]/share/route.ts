import { NextRequest, NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { arguments_ } from "@/lib/db/schema";

export async function POST(
  request: NextRequest,
  { params }: { params: { beefNumber: string } }
) {
  const beefNumber = parseInt(params.beefNumber, 10);
  if (isNaN(beefNumber)) {
    return NextResponse.json({ error: "Invalid beef number" }, { status: 400 });
  }

  const rows = await db
    .select({ id: arguments_.id })
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

  const updated = await db
    .update(arguments_)
    .set({
      shareCount: sql`${arguments_.shareCount} + 1`,
    })
    .where(eq(arguments_.id, rows[0].id))
    .returning({ shareCount: arguments_.shareCount });

  return NextResponse.json({
    success: true,
    shareCount: updated[0].shareCount,
  });
}
