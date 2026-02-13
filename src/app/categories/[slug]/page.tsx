import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq, and, sql, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { arguments_ } from "@/lib/db/schema";
import { serializeArgument } from "@/lib/db/serialize";
import { CATEGORIES, CATEGORY_MAP } from "@/lib/constants";
import { Navbar } from "@/components/layout/Navbar";
import { CategoryFeed } from "@/components/category/CategoryFeed";
import type { Category } from "@/types";

interface CategoryPageProps {
  params: { slug: string };
}

export async function generateStaticParams() {
  return CATEGORIES.map((cat) => ({ slug: cat.slug }));
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const categoryDef = CATEGORY_MAP.get(params.slug as Category);
  if (!categoryDef) return {};

  return {
    title: `${categoryDef.emoji} ${categoryDef.label} — ThreadBeef 🥩`,
    description: categoryDef.tagline,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const categoryDef = CATEGORY_MAP.get(params.slug as Category);
  if (!categoryDef) notFound();

  const countResult = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(arguments_)
    .where(
      and(
        eq(arguments_.category, params.slug as Category),
        eq(arguments_.status, "approved")
      )
    );

  const total = countResult[0].count;

  const rows = await db
    .select()
    .from(arguments_)
    .where(
      and(
        eq(arguments_.category, params.slug as Category),
        eq(arguments_.status, "approved")
      )
    )
    .orderBy(desc(arguments_.totalVotes))
    .limit(20);

  const initialArguments = rows.map(serializeArgument);

  return (
    <main>
      <Navbar />
      <div className="max-w-[720px] mx-auto px-5 pt-8 pb-32 sm:pb-24">
        <div className="mb-8">
          <span className="text-4xl block mb-3">{categoryDef.emoji}</span>
          <h1 className="font-display font-bold text-2xl text-text">
            {categoryDef.label}
          </h1>
          <p className="text-text-muted text-sm mt-1">{categoryDef.tagline}</p>
          <p className="text-text-muted text-xs font-mono mt-2">
            {total} {total === 1 ? "beef" : "beefs"}
          </p>
        </div>

        <CategoryFeed
          initialArguments={initialArguments}
          slug={params.slug}
          total={total}
        />
      </div>
    </main>
  );
}
