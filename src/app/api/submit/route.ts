import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { submissions } from "@/lib/db/schema";
import { submitSchema } from "@/lib/validations";
import { submitRateLimit } from "@/lib/redis";

export async function POST(request: NextRequest) {
  // Rate limit by IP
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "anonymous";

  const { success } = await submitRateLimit.limit(ip);
  if (!success) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { url, rawText } = parsed.data;

  const rows = await db
    .insert(submissions)
    .values({
      url: url ?? null,
      rawText: rawText ?? null,
      status: "pending",
    })
    .returning({ id: submissions.id });

  return NextResponse.json(
    { success: true, submissionId: rows[0].id },
    { status: 201 }
  );
}
