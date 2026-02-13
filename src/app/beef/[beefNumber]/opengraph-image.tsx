import { ImageResponse } from "@vercel/og";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { arguments_ } from "@/lib/db/schema";
import { calcVotePercents } from "@/lib/utils";
import { getVerdict, CATEGORY_MAP, HEAT_EMOJI } from "@/lib/constants";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: { beefNumber: string };
}) {
  const beefNumber = parseInt(params.beefNumber, 10);
  if (isNaN(beefNumber)) {
    return new ImageResponse(
      <div style={{ width: 1, height: 1, background: "#0a0a0c" }} />,
      { width: 1, height: 1 }
    );
  }

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

  if (rows.length === 0) {
    return new ImageResponse(
      <div style={{ width: 1, height: 1, background: "#0a0a0c" }} />,
      { width: 1, height: 1 }
    );
  }

  const arg = rows[0];
  const categoryDef = CATEGORY_MAP.get(arg.category);
  const peppers = HEAT_EMOJI.repeat(arg.heatRating);
  const [pA, pB] = calcVotePercents(arg.votesA, arg.votesB);
  const verdict = getVerdict(pA, pB);
  const hasVotes = arg.totalVotes > 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "48px 56px",
          background: "#0a0a0c",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top row: branding + beef number */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontSize: "28px",
                fontWeight: 800,
                color: "#e8e6f0",
              }}
            >
              Thread
            </span>
            <span
              style={{
                fontSize: "28px",
                fontWeight: 800,
                color: "#ff4d4d",
              }}
            >
              Beef
            </span>
            <span style={{ fontSize: "28px" }}>🥩</span>
          </div>
          <span
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "#7a7890",
              fontFamily: "monospace",
            }}
          >
            #{String(beefNumber).padStart(5, "0")}
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginTop: "16px",
          }}
        >
          <h1
            style={{
              fontSize: "40px",
              fontWeight: 800,
              color: "#e8e6f0",
              lineHeight: 1.2,
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {arg.title}
          </h1>

          {/* Heat + category */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ fontSize: "22px" }}>{peppers}</span>
            {categoryDef && (
              <span
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#fbbf24",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {categoryDef.emoji} {categoryDef.label}
              </span>
            )}
          </div>
        </div>

        {/* Zinger quotes */}
        <div
          style={{
            display: "flex",
            gap: "24px",
            marginTop: "20px",
            flex: 1,
            alignItems: "center",
          }}
        >
          {arg.userAZinger && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                padding: "16px 20px",
                background: "rgba(255, 107, 107, 0.1)",
                borderRadius: "12px",
                borderLeft: "3px solid #ff6b6b",
              }}
            >
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#ff6b6b",
                  marginBottom: "6px",
                }}
              >
                {arg.userADisplayName}
              </span>
              <span
                style={{
                  fontSize: "16px",
                  color: "#e8e6f0",
                  lineHeight: 1.4,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                &ldquo;{arg.userAZinger}&rdquo;
              </span>
            </div>
          )}
          {arg.userBZinger && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                padding: "16px 20px",
                background: "rgba(107, 163, 255, 0.1)",
                borderRadius: "12px",
                borderLeft: "3px solid #6ba3ff",
              }}
            >
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#6ba3ff",
                  marginBottom: "6px",
                }}
              >
                {arg.userBDisplayName}
              </span>
              <span
                style={{
                  fontSize: "16px",
                  color: "#e8e6f0",
                  lineHeight: 1.4,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                &ldquo;{arg.userBZinger}&rdquo;
              </span>
            </div>
          )}
        </div>

        {/* Vote bar + verdict (only if votes exist) */}
        {hasVotes ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              marginTop: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                height: "28px",
                borderRadius: "14px",
                overflow: "hidden",
                width: "100%",
              }}
            >
              <div
                style={{
                  width: `${pA}%`,
                  background: "#ff6b6b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                {pA}%
              </div>
              <div
                style={{
                  width: `${pB}%`,
                  background: "#6ba3ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                {pB}%
              </div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span style={{ fontSize: "16px" }}>{verdict.emoji}</span>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#ff4d4d",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {verdict.label}
              </span>
              <span
                style={{
                  fontSize: "13px",
                  color: "#7a7890",
                  marginLeft: "8px",
                }}
              >
                {arg.totalVotes.toLocaleString()} votes
              </span>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "16px",
            }}
          >
            <span
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "#ff4d4d",
              }}
            >
              Cast your vote →
            </span>
          </div>
        )}

        {/* Topic drift */}
        {arg.topicDrift && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "8px",
            }}
          >
            <span
              style={{
                fontSize: "13px",
                color: "#7a7890",
                fontStyle: "italic",
              }}
            >
              {arg.topicDrift}
            </span>
          </div>
        )}
      </div>
    ),
    { ...size }
  );
}
