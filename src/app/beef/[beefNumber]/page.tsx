import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { arguments_ } from "@/lib/db/schema";
import { serializeArgument } from "@/lib/db/serialize";
import { calcVotePercents } from "@/lib/utils";
import { getVerdict, CATEGORY_MAP } from "@/lib/constants";
import { BeefViewer } from "./BeefViewer";

interface BeefPageProps {
  params: { beefNumber: string };
}

export async function generateMetadata({
  params,
}: BeefPageProps): Promise<Metadata> {
  const beefNumber = parseInt(params.beefNumber, 10);
  if (isNaN(beefNumber)) return {};

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

  if (rows.length === 0) return {};

  const arg = rows[0];
  const title = `${arg.title} — ThreadBeef #${String(beefNumber).padStart(5, "0")}`;
  const description =
    arg.contextBlurb ?? `${arg.userADisplayName} vs ${arg.userBDisplayName} — vote on who won this argument!`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      siteName: "ThreadBeef",
      images: [
        {
          url: `/beef/${beefNumber}/opengraph-image`,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function BeefPage({ params }: BeefPageProps) {
  const beefNumber = parseInt(params.beefNumber, 10);
  if (isNaN(beefNumber)) notFound();

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

  if (rows.length === 0) notFound();

  const argument = serializeArgument(rows[0]);
  const categoryDef = CATEGORY_MAP.get(argument.category);
  const [pA, pB] = calcVotePercents(argument.votesA, argument.votesB);
  const verdict = getVerdict(pA, pB);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    headline: argument.title,
    description: argument.contextBlurb ?? undefined,
    author: [
      { "@type": "Person", name: argument.userADisplayName },
      { "@type": "Person", name: argument.userBDisplayName },
    ],
    datePublished: argument.createdAt,
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/VoteAction",
        userInteractionCount: argument.totalVotes,
      },
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/ShareAction",
        userInteractionCount: argument.shareCount,
      },
    ],
    about: categoryDef?.label,
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/beef/${beefNumber}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BeefViewer argument={argument} />
    </>
  );
}
