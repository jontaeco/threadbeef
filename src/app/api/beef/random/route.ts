import { NextRequest, NextResponse } from "next/server";
import { eq, and, notInArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { arguments_ } from "@/lib/db/schema";
import { serializeArgument } from "@/lib/db/serialize";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const excludeParam = searchParams.get("exclude");
  const excludeNumbers = excludeParam
    ? excludeParam.split(",").map(Number).filter((n) => !isNaN(n))
    : [];

  // Build conditions
  const conditions = [eq(arguments_.status, "approved")];

  if (category && category !== "all") {
    conditions.push(eq(arguments_.category, category as any));
  }

  if (excludeNumbers.length > 0) {
    conditions.push(notInArray(arguments_.beefNumber, excludeNumbers));
  }

  const rows = await db
    .select()
    .from(arguments_)
    .where(and(...conditions))
    .orderBy(sql`RANDOM()`)
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json({ error: "No beef found" }, { status: 404 });
  }

  // Increment view count
  await db
    .update(arguments_)
    .set({ viewCount: sql`${arguments_.viewCount} + 1` })
    .where(eq(arguments_.id, rows[0].id));

  return NextResponse.json({ argument: serializeArgument(rows[0]) });
}
