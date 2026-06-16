CREATE TYPE "public"."post_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "public"."visibility" AS ENUM('public', 'authed', 'allowlist', 'owner');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"visibility" "visibility" DEFAULT 'public' NOT NULL,
	"allowed_emails" text[] DEFAULT '{}' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text,
	"body_mdx" text DEFAULT '' NOT NULL,
	"cover_image_key" text,
	"category_id" uuid,
	"visibility" "visibility" DEFAULT 'public' NOT NULL,
	"allowed_emails" text[] DEFAULT '{}' NOT NULL,
	"status" "post_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"reading_minutes" integer DEFAULT 1 NOT NULL,
	"meta_title" text,
	"meta_description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;