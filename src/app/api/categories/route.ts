import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { arguments_ } from "@/lib/db/schema";
import { getCategoryDisplay } from "@/lib/constants";

export async function GET() {
  // Count approved arguments per category — dynamic, not limited to a fixed list
  const counts = await db
    .select({
      category: arguments_.category,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(arguments_)
    .where(eq(arguments_.status, "approved"))
    .groupBy(arguments_.category);

  const categories = counts
    .filter((c) => c.count > 0)
    .map((c) => {
      const display = getCategoryDisplay(c.category);
      return {
        slug: c.category,
        label: display.label,
        emoji: display.emoji,
        tagline: display.tagline,
        count: c.count,
      };
    })
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({ categories });
}
