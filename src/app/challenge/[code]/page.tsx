import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { arguments_, challenges } from "@/lib/db/schema";
import { serializeArgument } from "@/lib/db/serialize";
import { Navbar } from "@/components/layout/Navbar";
import { ChallengeViewer } from "./ChallengeViewer";

interface ChallengePageProps {
  params: { code: string };
}

export async function generateMetadata({
  params,
}: ChallengePageProps): Promise<Metadata> {
  return {
    title: "Someone wants your take on this beef! 🥩 — ThreadBeef",
    description:
      "You've been challenged to judge an internet argument. Pick a side!",
    openGraph: {
      title: "Someone wants your take on this beef! 🥩",
      description:
        "You've been challenged to judge an internet argument. Pick a side!",
      siteName: "ThreadBeef",
    },
  };
}

export default async function ChallengePage({ params }: ChallengePageProps) {
  const { code } = params;

  // Fetch challenge
  const challengeRows = await db
    .select()
    .from(challenges)
    .where(eq(challenges.challengeCode, code))
    .limit(1);

  if (challengeRows.length === 0) notFound();

  const challenge = challengeRows[0];

  // Fetch argument
  const argRows = await db
    .select()
    .from(arguments_)
    .where(eq(arguments_.id, challenge.argumentId))
    .limit(1);

  if (argRows.length === 0) notFound();

  const argument = serializeArgument(argRows[0]);

  return (
    <main>
      <Navbar />
      <ChallengeViewer
        argument={argument}
        challengeStatus={challenge.status}
        code={code}
      />
    </main>
  );
}
