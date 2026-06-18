CREATE TYPE "public"."thought_visibility" AS ENUM('public', 'private');--> statement-breakpoint
CREATE TABLE "thoughts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"image_key" text,
	"visibility" "thought_visibility" DEFAULT 'private' NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "thoughts_visibility_created_idx" ON "thoughts" USING btree ("visibility","created_at");