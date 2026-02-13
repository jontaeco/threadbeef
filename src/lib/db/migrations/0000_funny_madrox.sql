DO $$ BEGIN
 CREATE TYPE "public"."argument_status" AS ENUM('pending_review', 'approved', 'rejected', 'reported', 'archived');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."auth_provider" AS ENUM('google', 'github', 'apple', 'email');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."category" AS ENUM('petty', 'tech', 'food_takes', 'unhinged', 'relationship', 'gaming', 'sports', 'politics', 'aita', 'pedantic', 'movies_tv', 'music', 'philosophy', 'money');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."challenge_status" AS ENUM('pending', 'completed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."platform" AS ENUM('reddit', 'twitter', 'hackernews', 'youtube', 'stackoverflow', 'forum', 'user_submitted');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."reaction_type" AS ENUM('dead', 'both_wrong', 'actually', 'peak_internet', 'spicier', 'hof_material');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."submission_status" AS ENUM('pending', 'processing', 'approved', 'rejected');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."vote_side" AS ENUM('a', 'b');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "arguments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"beef_number" serial NOT NULL,
	"platform" "platform" NOT NULL,
	"platform_source" text NOT NULL,
	"original_url" text,
	"title" text NOT NULL,
	"context_blurb" text,
	"topic_drift" text,
	"category" "category" NOT NULL,
	"heat_rating" integer DEFAULT 1 NOT NULL,
	"user_a_display_name" text NOT NULL,
	"user_b_display_name" text NOT NULL,
	"user_a_zinger" text,
	"user_b_zinger" text,
	"messages" json NOT NULL,
	"entertainment_score" real,
	"status" "argument_status" DEFAULT 'pending_review' NOT NULL,
	"total_votes" integer DEFAULT 0 NOT NULL,
	"votes_a" integer DEFAULT 0 NOT NULL,
	"votes_b" integer DEFAULT 0 NOT NULL,
	"reactions" json DEFAULT '{"dead":0,"both_wrong":0,"actually":0,"peak_internet":0,"spicier":0,"hof_material":0}'::json NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"share_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "arguments_beef_number_unique" UNIQUE("beef_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "beef_of_the_day" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"argument_id" uuid NOT NULL,
	"date" date NOT NULL,
	"final_votes_a" integer,
	"final_votes_b" integer,
	"final_verdict" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "beef_of_the_day_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"challenge_code" text NOT NULL,
	"argument_id" uuid NOT NULL,
	"challenger_user_id" uuid,
	"challenger_fingerprint" text NOT NULL,
	"challenger_vote" "vote_side" NOT NULL,
	"challengee_vote" "vote_side",
	"status" "challenge_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	CONSTRAINT "challenges_challenge_code_unique" UNIQUE("challenge_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"argument_id" uuid NOT NULL,
	"reaction_type" "reaction_type" NOT NULL,
	"fingerprint" text NOT NULL,
	"user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submitted_by" uuid,
	"url" text,
	"raw_text" text,
	"status" "submission_status" DEFAULT 'pending' NOT NULL,
	"reviewer_notes" text,
	"argument_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"auth_provider" "auth_provider" NOT NULL,
	"title" text,
	"total_votes_cast" integer DEFAULT 0 NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"last_vote_date" date,
	"stats" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"argument_id" uuid NOT NULL,
	"user_id" uuid,
	"fingerprint" text NOT NULL,
	"voted_for" "vote_side" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "beef_of_the_day" ADD CONSTRAINT "beef_of_the_day_argument_id_arguments_id_fk" FOREIGN KEY ("argument_id") REFERENCES "public"."arguments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "challenges" ADD CONSTRAINT "challenges_argument_id_arguments_id_fk" FOREIGN KEY ("argument_id") REFERENCES "public"."arguments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "challenges" ADD CONSTRAINT "challenges_challenger_user_id_users_id_fk" FOREIGN KEY ("challenger_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reactions" ADD CONSTRAINT "reactions_argument_id_arguments_id_fk" FOREIGN KEY ("argument_id") REFERENCES "public"."arguments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reactions" ADD CONSTRAINT "reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "submissions" ADD CONSTRAINT "submissions_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "submissions" ADD CONSTRAINT "submissions_argument_id_arguments_id_fk" FOREIGN KEY ("argument_id") REFERENCES "public"."arguments"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "votes" ADD CONSTRAINT "votes_argument_id_arguments_id_fk" FOREIGN KEY ("argument_id") REFERENCES "public"."arguments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "votes" ADD CONSTRAINT "votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "arguments_status_idx" ON "arguments" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "arguments_category_idx" ON "arguments" ("category");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "arguments_beef_number_idx" ON "arguments" ("beef_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "arguments_entertainment_idx" ON "arguments" ("entertainment_score");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "arguments_total_votes_idx" ON "arguments" ("total_votes");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "arguments_created_at_idx" ON "arguments" ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "botd_date_idx" ON "beef_of_the_day" ("date");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "challenges_code_idx" ON "challenges" ("challenge_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reactions_argument_idx" ON "reactions" ("argument_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "reactions_dedup_idx" ON "reactions" ("argument_id","fingerprint","reaction_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "submissions_status_idx" ON "submissions" ("status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "votes_argument_idx" ON "votes" ("argument_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "votes_dedup_idx" ON "votes" ("argument_id","fingerprint");