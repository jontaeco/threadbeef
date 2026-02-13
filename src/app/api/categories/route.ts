import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { arguments_ } from "@/lib/db/schema";
import { CATEGORIES } from "@/lib/constants";

export async function GET() {
  // Count approved arguments per category
  const counts = await db
    .select({
      category: arguments_.category,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(arguments_)
    .where(eq(arguments_.status, "approved"))
    .groupBy(arguments_.category);

  const countMap = new Map(counts.map((c) => [c.category, c.count]));

  const categories = CATEGORIES.map((cat) => ({
    slug: cat.slug,
    label: cat.label,
    emoji: cat.emoji,
    tagline: cat.tagline,
    count: countMap.get(cat.slug) ?? 0,
  }));

  return NextResponse.json({ categories });
}
