import { NextRequest, NextResponse } from "next/server";
import { eq, and, sql, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { arguments_ } from "@/lib/db/schema";
import { serializeArgument } from "@/lib/db/serialize";
import { CATEGORY_MAP } from "@/lib/constants";
import type { Category } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  // Validate slug
  if (!CATEGORY_MAP.has(slug as Category)) {
    return NextResponse.json({ error: "Unknown category" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 1),
    100
  );
  const offset = Math.max(
    parseInt(searchParams.get("offset") ?? "0", 10) || 0,
    0
  );

  const countResult = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(arguments_)
    .where(
      and(
        eq(arguments_.category, slug as Category),
        eq(arguments_.status, "approved")
      )
    );

  const total = countResult[0].count;

  const rows = await db
    .select()
    .from(arguments_)
    .where(
      and(
        eq(arguments_.category, slug as Category),
        eq(arguments_.status, "approved")
      )
    )
    .orderBy(desc(arguments_.totalVotes))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({
    arguments: rows.map(serializeArgument),
    total,
  });
}
