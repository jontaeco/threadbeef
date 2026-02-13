import type { Metadata } from "next";
import Link from "next/link";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { arguments_ } from "@/lib/db/schema";
import { CATEGORIES } from "@/lib/constants";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "Categories — ThreadBeef 🥩",
  description:
    "Browse internet arguments by category: Petty, Tech, Food Takes, Unhinged, and more.",
};

export default async function CategoriesPage() {
  // Query category counts directly (server component)
  const counts = await db
    .select({
      category: arguments_.category,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(arguments_)
    .where(eq(arguments_.status, "approved"))
    .groupBy(arguments_.category);

  const countMap = new Map(counts.map((c) => [c.category, c.count]));

  return (
    <main>
      <Navbar />
      <div className="max-w-[900px] mx-auto px-5 pt-8 pb-32 sm:pb-24">
        <h1 className="font-display font-bold text-2xl text-text mb-2">
          Categories
        </h1>
        <p className="text-text-muted text-sm mb-8">
          Browse beef by topic. Pick your poison.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => {
            const count = countMap.get(cat.slug) ?? 0;
            return (
              <Link key={cat.slug} href={`/categories/${cat.slug}`}>
                <div className="bg-surface border border-border rounded-card p-5 hover:border-accent/50 hover:bg-accent/5 transition-all group h-full">
                  <span className="text-3xl block mb-3">{cat.emoji}</span>
                  <h2 className="font-display font-bold text-sm text-text group-hover:text-accent transition-colors">
                    {cat.label}
                  </h2>
                  <p className="text-[11px] text-text-muted mt-1 line-clamp-2">
                    {cat.tagline}
                  </p>
                  <p className="text-[11px] text-text-muted mt-2 font-mono">
                    {count} {count === 1 ? "beef" : "beefs"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
