/**
 * Interactive admin CLI for reviewing pending arguments.
 * Run via: npx tsx pipeline/review.ts
 */

import "dotenv/config";
import { eq, desc, sql } from "drizzle-orm";
import { db } from "../src/lib/db";
import { arguments_ } from "../src/lib/db/schema";
import { CATEGORIES, HEAT_DESCRIPTIONS } from "../src/lib/constants";
import { input, select } from "@inquirer/prompts";
import type { Argument } from "../src/types";
import { serializeArgument } from "../src/lib/db/serialize";

// ANSI color helpers
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  userA: "\x1b[36m", // cyan
  userB: "\x1b[33m", // yellow
};

function displayArgument(arg: Argument) {
  console.log("\n" + "═".repeat(60));
  console.log(
    `${c.bold}Beef #${arg.beefNumber}${c.reset} — ${c.cyan}${arg.platform}${c.reset} (${arg.platformSource})`
  );
  console.log("═".repeat(60));

  // Category and heat
  const cat = CATEGORIES.find((cat) => cat.slug === arg.category);
  console.log(
    `${c.yellow}Category:${c.reset} ${cat?.emoji || ""} ${cat?.label || arg.category}`
  );
  console.log(
    `${c.yellow}Heat:${c.reset} ${"🌶️".repeat(arg.heatRating)} (${HEAT_DESCRIPTIONS[arg.heatRating] || ""})`
  );
  console.log(
    `${c.yellow}Entertainment:${c.reset} ${arg.entertainmentScore || "N/A"}/10`
  );

  // Title and context
  console.log(`\n${c.bold}${arg.title}${c.reset}`);
  if (arg.contextBlurb) {
    console.log(`${c.dim}${arg.contextBlurb}${c.reset}`);
  }
  if (arg.topicDrift) {
    console.log(`${c.magenta}${arg.topicDrift}${c.reset}`);
  }

  // Messages
  console.log("\n" + "─".repeat(60));
  for (const msg of arg.messages) {
    const color = msg.author === "a" ? c.userA : c.userB;
    const name =
      msg.author === "a" ? arg.userADisplayName : arg.userBDisplayName;
    console.log(
      `${color}${c.bold}${name}:${c.reset} ${msg.body}`
    );
    if (msg.quoted_text) {
      console.log(`  ${c.dim}> ${msg.quoted_text}${c.reset}`);
    }
  }
  console.log("─".repeat(60));

  // Zingers
  if (arg.userAZinger) {
    console.log(
      `${c.userA}${arg.userADisplayName}'s zinger:${c.reset} "${arg.userAZinger}"`
    );
  }
  if (arg.userBZinger) {
    console.log(
      `${c.userB}${arg.userBDisplayName}'s zinger:${c.reset} "${arg.userBZinger}"`
    );
  }
}

async function fetchPending() {
  const rows = await db
    .select()
    .from(arguments_)
    .where(eq(arguments_.status, "pending_review"))
    .orderBy(desc(arguments_.createdAt))
    .limit(50);

  return rows.map(serializeArgument);
}

async function approveArgument(id: string) {
  await db
    .update(arguments_)
    .set({ status: "approved" })
    .where(eq(arguments_.id, id));
}

async function rejectArgument(id: string) {
  await db
    .update(arguments_)
    .set({ status: "rejected" })
    .where(eq(arguments_.id, id));
}

async function editArgument(arg: Argument) {
  const newTitle = await input({
    message: "Title:",
    default: arg.title,
  });

  const catChoices = CATEGORIES.map((cat) => ({
    name: `${cat.emoji} ${cat.label}`,
    value: cat.slug,
  }));

  const newCategory = await select({
    message: "Category:",
    choices: catChoices,
    default: arg.category,
  });

  const newHeat = await input({
    message: "Heat rating (1-5):",
    default: String(arg.heatRating),
    validate: (v: string) => {
      const n = parseInt(v);
      return n >= 1 && n <= 5 ? true : "Must be 1-5";
    },
  });

  const newNameA = await input({
    message: "User A display name:",
    default: arg.userADisplayName,
  });

  const newNameB = await input({
    message: "User B display name:",
    default: arg.userBDisplayName,
  });

  await db
    .update(arguments_)
    .set({
      title: newTitle,
      category: newCategory as any,
      heatRating: parseInt(newHeat),
      userADisplayName: newNameA,
      userBDisplayName: newNameB,
    })
    .where(eq(arguments_.id, arg.id));

  console.log(`${c.green}Updated!${c.reset}`);
}

async function showStats() {
  const statusCounts = await db
    .select({
      status: arguments_.status,
      count: sql<number>`count(*)`.as("count"),
    })
    .from(arguments_)
    .groupBy(arguments_.status);

  const categoryCounts = await db
    .select({
      category: arguments_.category,
      count: sql<number>`count(*)`.as("count"),
    })
    .from(arguments_)
    .where(eq(arguments_.status, "approved"))
    .groupBy(arguments_.category)
    .orderBy(desc(sql`count(*)`));

  console.log("\n" + "═".repeat(40));
  console.log(`${c.bold}Pipeline Stats${c.reset}`);
  console.log("═".repeat(40));

  for (const row of statusCounts) {
    const color =
      row.status === "approved"
        ? c.green
        : row.status === "rejected"
          ? c.red
          : c.yellow;
    console.log(`  ${color}${row.status}:${c.reset} ${row.count}`);
  }

  if (categoryCounts.length > 0) {
    console.log(`\n${c.bold}Approved by category:${c.reset}`);
    for (const row of categoryCounts) {
      const cat = CATEGORIES.find((cat) => cat.slug === row.category);
      console.log(`  ${cat?.emoji || ""} ${cat?.label || row.category}: ${row.count}`);
    }
  }
}

async function main() {
  // Check for stats command
  if (process.argv.includes("--stats")) {
    await showStats();
    process.exit(0);
  }

  console.log(`\n${c.bold}${c.cyan}ThreadBeef Review CLI${c.reset}`);
  console.log(`${c.dim}Fetching pending arguments...${c.reset}\n`);

  const pending = await fetchPending();

  if (pending.length === 0) {
    console.log(`${c.yellow}No pending arguments to review.${c.reset}`);
    process.exit(0);
  }

  console.log(`${c.bold}${pending.length} arguments pending review${c.reset}`);

  for (const arg of pending) {
    displayArgument(arg);

    const action = await select({
      message: "Action:",
      choices: [
        { name: "[a] Approve", value: "approve" },
        { name: "[r] Reject", value: "reject" },
        { name: "[e] Edit", value: "edit" },
        { name: "[s] Skip", value: "skip" },
        { name: "[q] Quit", value: "quit" },
      ],
    });

    switch (action) {
      case "approve":
        await approveArgument(arg.id);
        console.log(`${c.green}✓ Approved beef #${arg.beefNumber}${c.reset}`);
        break;
      case "reject": {
        const reason = await input({
          message: "Rejection reason (optional):",
          default: "",
        });
        await rejectArgument(arg.id);
        console.log(
          `${c.red}✗ Rejected beef #${arg.beefNumber}${reason ? `: ${reason}` : ""}${c.reset}`
        );
        break;
      }
      case "edit":
        await editArgument(arg);
        // After editing, ask again
        const postEdit = await select({
          message: "Now what?",
          choices: [
            { name: "[a] Approve", value: "approve" },
            { name: "[r] Reject", value: "reject" },
            { name: "[s] Skip", value: "skip" },
          ],
        });
        if (postEdit === "approve") {
          await approveArgument(arg.id);
          console.log(`${c.green}✓ Approved beef #${arg.beefNumber}${c.reset}`);
        } else if (postEdit === "reject") {
          await rejectArgument(arg.id);
          console.log(`${c.red}✗ Rejected beef #${arg.beefNumber}${c.reset}`);
        }
        break;
      case "skip":
        console.log(`${c.dim}Skipped${c.reset}`);
        break;
      case "quit":
        console.log(`\n${c.dim}Done.${c.reset}`);
        process.exit(0);
    }
  }

  console.log(`\n${c.green}${c.bold}Review complete!${c.reset}`);
  await showStats();
}

main().catch(console.error);
